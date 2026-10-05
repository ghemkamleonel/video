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
import os
import subprocess
import tempfile

import librosa
import numpy as np

from scripts.utility import offline_tts

SR = 16000
HOP = 160  # 10 ms


def _load(path: str) -> np.ndarray:
    y, _ = librosa.load(path, sr=SR, mono=True)
    return y


def _features(y: np.ndarray) -> np.ndarray:
    mfcc = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=512)[1:]
    feats = np.vstack([mfcc, librosa.feature.delta(mfcc)])
    feats = (feats - feats.mean(axis=1, keepdims=True)) / (feats.std(axis=1, keepdims=True) + 1e-8)
    return feats


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
    return words


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
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a.audio, "-ac", "1", "-ar", "44100",
                    "-c:a", "libmp3lame", "-b:a", "192k", a.out_audio], check=True)
    json.dump(words, open(a.out_transcript, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"aligned {len(words)} tokens -> {a.out_transcript}")


if __name__ == "__main__":
    main()
