"""Align a user's own voice recording to its known script (offline, no ASR model).

Synthesizes the script with the offline TTS (known per-word timings), then aligns that
reference to the recording with DTW over MFCC features and maps every word boundary onto
the recording's timeline. Output: an OVG word transcript ([{"word","start_ms","end_ms"}]).

Usage:
  python -m scripts.utility.voice_align --audio my_voice.m4a --script script.md \
      --out-audio Outputs/T/Audio/latest.mp3 --out-transcript Outputs/T/Transcript/latest.json
"""
import argparse
import json
import re
import os
import subprocess
import tempfile

import librosa
import numpy as np

from scripts.utility import offline_tts

SR = 16000
HOP = 160  # 10 ms


def _load(path: str) -> np.ndarray:
    # Decode any container (WhatsApp .mp4/.opus, .m4a, ...) through ffmpeg, with a light clean-up:
    # remove rumble, normalise loudness so both voices sit at a comparable level.
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "a.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                        "-af", "highpass=f=70,loudnorm=I=-20:TP=-2:LRA=11", wav], check=True)
        y, _ = librosa.load(wav, sr=SR, mono=True)
    return y


def _features(y: np.ndarray) -> np.ndarray:
    mfcc = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=512)[1:]
    # Log-energy (scaled 0..1 per recording) so that pauses line up with pauses across voices.
    rms = librosa.feature.rms(y=y, frame_length=512, hop_length=HOP)
    loud = np.log(rms + 1e-5)
    lo, hi = np.percentile(loud, 5), np.percentile(loud, 95)
    loud = np.clip((loud - lo) / (hi - lo + 1e-8), 0, 1)
    n = min(mfcc.shape[1], loud.shape[1])
    mfcc, loud = mfcc[:, :n], loud[:, :n]
    feats = np.vstack([mfcc, librosa.feature.delta(mfcc)])
    feats = (feats - feats.mean(axis=1, keepdims=True)) / (feats.std(axis=1, keepdims=True) + 1e-8)
    # Silent frames carry no reliable spectral shape: damp them and let the energy dims decide.
    feats = feats * (0.25 + 0.75 * loud)
    return np.vstack([feats, np.repeat((loud - 0.5) * 6.0, 4, axis=0)])


def align(user_audio: str, script_text: str) -> list:
    with tempfile.TemporaryDirectory() as tmp:
        ref_mp3 = os.path.join(tmp, "ref.mp3")
        ref_json = os.path.join(tmp, "ref.json")
        ok, err, *_ = offline_tts.generate_audio(script_text, ref_mp3, ref_json)
        if not ok:
            raise RuntimeError(err)
        ref_words = json.load(open(ref_json, encoding="utf-8"))
        ref = _load(ref_mp3)
    usr = _load(user_audio)

    fr, fu = _features(ref), _features(usr)
    _, wp = librosa.sequence.dtw(X=fr, Y=fu, metric="cosine")
    wp = wp[::-1]
    ref_frames, usr_frames = wp[:, 0].astype(float), wp[:, 1].astype(float)
    # For each reference frame keep the median matching user frame (monotonic mapping).
    uniq = np.unique(ref_frames)
    mapped = np.array([np.median(usr_frames[ref_frames == r]) for r in uniq])
    mapped = np.maximum.accumulate(mapped)

    def to_user_ms(ms: float) -> int:
        f = ms / 1000 * SR / HOP
        return int(np.interp(f, uniq, mapped) * HOP / SR * 1000)

    words, last_end = [], 0
    for w in ref_words:
        s, e = to_user_ms(w["start_ms"]), to_user_ms(w["end_ms"])
        s = max(s, last_end + 1)
        e = max(e, s + 1)
        words.append({"word": w["word"], "start_ms": s, "end_ms": e})
        last_end = e
    sil = _silences(usr)
    words = snap_to_pauses(words, sil)
    return refine_by_rate(words, usr, sil)


def _silences(y: np.ndarray, min_ms: int = 250) -> list:
    """Pause intervals (ms) in the recording, from frame energy."""
    rms = librosa.feature.rms(y=y, frame_length=512, hop_length=HOP)[0]
    loud = 20 * np.log10(rms + 1e-6)
    thr = max(np.percentile(loud, 20), np.percentile(loud, 95) - 35)
    quiet = loud < thr
    out, start = [], None
    for i, q in enumerate(np.append(quiet, False)):
        if q and start is None:
            start = i
        elif not q and start is not None:
            if (i - start) * 10 >= min_ms:
                out.append((start * 10, i * 10))
            start = None
    return out


def snap_to_pauses(words: list, sil: list, window: int = 600) -> list:
    """Move punctuation boundaries onto real pauses close to them, then re-warp the words in between."""
    anchors = [(0, 0)]
    used = set()
    for i, w in enumerate(words):
        if w["word"] not in ".?!,:;" or i == 0 or i + 1 >= len(words):
            continue
        prev_end, next_start = words[i - 1]["end_ms"], words[i + 1]["start_ms"]
        mid = (prev_end + next_start) / 2
        best, bd = None, window
        for k, (s, e) in enumerate(sil):
            if k in used:
                continue
            d = 0 if s <= mid <= e else min(abs(mid - s), abs(mid - e))
            if d < bd:
                best, bd = k, d
        if best is None:
            continue
        s, e = sil[best]
        if s <= anchors[-1][1] or prev_end <= anchors[-1][0]:
            continue
        used.add(best)
        anchors.append((prev_end, s))
        anchors.append((next_start, e))
    src = np.array([a for a, _ in anchors], dtype=float)
    dst = np.array([b for _, b in anchors], dtype=float)
    keep = np.concatenate([[True], np.diff(src) > 0]) & np.concatenate([[True], np.diff(dst) > 0])
    src, dst = src[keep], dst[keep]
    out, last = [], 0
    for w in words:
        a = int(np.interp(w["start_ms"], src, dst, right=w["start_ms"] + dst[-1] - src[-1]))
        b = int(np.interp(w["end_ms"], src, dst, right=w["end_ms"] + dst[-1] - src[-1]))
        a = max(a, last + 1)
        b = max(b, a + 1)
        out.append({"word": w["word"], "start_ms": a, "end_ms": b})
        last = b
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", required=True)
    ap.add_argument("--script", required=True)
    ap.add_argument("--out-audio", required=True)
    ap.add_argument("--out-transcript", required=True)
    a = ap.parse_args()
    text = open(a.script, encoding="utf-8").read()
    words = align(a.audio, text)
    os.makedirs(os.path.dirname(a.out_audio) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(a.out_transcript) or ".", exist_ok=True)
    # Narration track for the video: same timeline, rumble removed, loudness normalised for playback.
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a.audio, "-ac", "1", "-ar", "44100",
                    "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-c:a", "libmp3lame", "-b:a", "192k", a.out_audio], check=True)
    json.dump(words, open(a.out_transcript, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"aligned {len(words)} tokens -> {a.out_transcript}")


def _syllables(w: str) -> int:
    return max(1, len(re.findall(r"[aeiouy\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f6\u00f9\u00fb\u00fc\u0153]+", w.lower())))


def refine_by_rate(words: list, y: np.ndarray, sil: list, reach: int = 1500) -> list:
    """Choose each sentence boundary among nearby pauses so the speaking rate (syllables per voiced second)
    stays as even as possible across sentences (Viterbi over candidate boundaries), then re-warp words."""
    rms = librosa.feature.rms(y=y, frame_length=512, hop_length=HOP)[0]
    db = 20 * np.log10(rms + 1e-6)
    voiced = db > max(np.percentile(db, 20), np.percentile(db, 95) - 35)
    cum = np.concatenate([[0], np.cumsum(voiced)])

    def voiced_s(a_ms: float, b_ms: float) -> float:
        a, b = int(max(0, a_ms) // 10), int(max(0, b_ms) // 10)
        a, b = min(a, len(voiced)), min(max(b, a), len(voiced))
        return (cum[b] - cum[a]) / 100.0

    ends = [i for i, w in enumerate(words) if w["word"] in ".?!" and 0 < i < len(words) - 1]
    if len(ends) < 2:
        return words
    seg_bounds = [-1] + ends + [len(words)]
    syl = []
    for k in range(len(seg_bounds) - 1):
        seg = words[seg_bounds[k] + 1: seg_bounds[k + 1]]
        syl.append(sum(_syllables(w["word"]) for w in seg if w["word"] not in ".,?!:;'-"))
    # candidates per boundary: (prev_end, next_start, penalty)
    cands = []
    for i in ends:
        pe, ns = words[i - 1]["end_ms"], words[i + 1]["start_ms"]
        mid = (pe + ns) / 2
        c = [(pe, ns, 0.0 if any(s <= mid <= e for s, e in sil) else 0.3)]
        for s, e in sil:
            m = (s + e) / 2
            if abs(m - mid) <= reach and not (s <= mid <= e):
                c.append((s, e, 0.15 * abs(m - mid) / 1000))
        cands.append(c)
    start0, endN = words[0]["start_ms"], words[-1]["end_ms"]
    total_syl = sum(syl)
    med = total_syl / max(voiced_s(start0, endN), 0.1)

    def seg_cost(k: int, a_ms: float, b_ms: float) -> float:
        if b_ms <= a_ms + 200:
            return 50.0
        r = syl[k] / max(voiced_s(a_ms, b_ms), 0.1)
        w = min(1.0, syl[k] / 12)  # short sentences give noisy rates
        return w * float(np.log(r / med) ** 2)

    # Viterbi: state = candidate index at boundary j
    K = len(cands)
    cost = [[seg_cost(0, start0, c[0]) + c[2] for c in cands[0]]]
    back = [[-1] * len(cands[0])]
    for j in range(1, K):
        row, brow = [], []
        for c in cands[j]:
            best, arg = 1e18, 0
            for pi, pc in enumerate(cands[j - 1]):
                v = cost[j - 1][pi] + seg_cost(j, pc[1], c[0])
                if v < best:
                    best, arg = v, pi
            row.append(best + c[2])
            brow.append(arg)
        cost.append(row)
        back.append(brow)
    last = [cost[K - 1][i] + seg_cost(K, c[1], endN) for i, c in enumerate(cands[K - 1])]
    choice = [int(np.argmin(last))]
    for j in range(K - 1, 0, -1):
        choice.append(back[j][choice[-1]])
    choice.reverse()
    anchors = [(start0, start0)]
    for j, i in enumerate(ends):
        pe, ns, _ = cands[j][choice[j]]
        src_pe, src_ns = words[i - 1]["end_ms"], words[i + 1]["start_ms"]
        if src_pe > anchors[-1][0] and pe > anchors[-1][1]:
            anchors.append((src_pe, pe))
        if src_ns > anchors[-1][0] and ns > anchors[-1][1]:
            anchors.append((src_ns, ns))
    anchors.append((endN + 1, endN + 1))
    src = np.array([a for a, _ in anchors], dtype=float)
    dst = np.array([b for _, b in anchors], dtype=float)
    out, last_end = [], 0
    for w in words:
        a = int(np.interp(w["start_ms"], src, dst))
        b = int(np.interp(w["end_ms"], src, dst))
        a = max(a, last_end + 1)
        b = max(b, a + 1)
        out.append({"word": w["word"], "start_ms": a, "end_ms": b})
        last_end = b
    return out


if __name__ == "__main__":
    main()
