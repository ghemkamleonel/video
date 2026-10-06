"""Quality check for voice_align: do predicted pauses (punctuation) fall on real pauses in the recording?

Usage: python -m scripts.utility.align_check --audio rec.m4a --transcript Transcript/latest.json [--png out.png]
Prints agreement scores and optionally draws the waveform with the predicted sentence starts.
"""
import argparse
import json
import re
import subprocess

import numpy as np


def silences(audio: str, noise_db: float = -38, min_d: float = 0.25) -> list:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", audio, "-af", f"silencedetect=noise={noise_db}dB:d={min_d}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return [(s * 1000, e * 1000) for s, e in zip(starts, ends)]


def dist_to_sil(t: float, sil: list) -> float:
    best = 1e9
    for s, e in sil:
        if s <= t <= e:
            return 0.0
        best = min(best, abs(t - s), abs(t - e))
    return best


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", required=True)
    ap.add_argument("--transcript", required=True)
    ap.add_argument("--png", default=None)
    a = ap.parse_args()
    words = json.load(open(a.transcript, encoding="utf-8"))
    sil = silences(a.audio)

    marks = []
    for i, w in enumerate(words):
        if w["word"] in ".?!,:;" and i > 0:
            # boundary between the previous word end and the next word start
            nxt = words[i + 1]["start_ms"] if i + 1 < len(words) else w["end_ms"]
            marks.append((w["word"], (words[i - 1]["end_ms"] + nxt) / 2))
    strong = [t for p, t in marks if p in ".?!"]
    weak = [t for p, t in marks if p not in ".?!"]
    ds = [dist_to_sil(t, sil) for t in strong]
    dw = [dist_to_sil(t, sil) for t in weak]
    longs = [(s, e) for s, e in sil if e - s >= 700]
    covered = sum(1 for s, e in longs if any(s - 250 <= t <= e + 250 for _, t in marks))
    print(f"sentence ends on a real pause (<=250 ms): {sum(d <= 250 for d in ds)}/{len(ds)}  median gap {np.median(ds):.0f} ms")
    print(f"comma/colon on a pause (<=250 ms):         {sum(d <= 250 for d in dw)}/{len(dw)}  median gap {np.median(dw) if dw else 0:.0f} ms")
    print(f"long pauses (>=0.7 s) explained by punctuation: {covered}/{len(longs)}")

    if a.png:
        import librosa
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        y, sr = librosa.load(a.audio, sr=8000, mono=True)
        t = np.arange(len(y)) / sr
        rows = 4
        dur = t[-1]
        fig, axes = plt.subplots(rows, 1, figsize=(22, 3.2 * rows))
        starts = [(words[i + 1]["start_ms"] / 1000, words[i + 1]["word"]) for i, w in enumerate(words[:-1]) if w["word"] in ".?!"]
        starts = [(words[0]["start_ms"] / 1000, words[0]["word"])] + starts
        for r in range(rows):
            lo, hi = dur * r / rows, dur * (r + 1) / rows
            m = (t >= lo) & (t < hi)
            ax = axes[r]
            ax.plot(t[m], y[m], lw=0.4, color="#2E4F70")
            for s, e in sil:
                if e / 1000 >= lo and s / 1000 <= hi:
                    ax.axvspan(max(lo, s / 1000), min(hi, e / 1000), color="#cccccc", alpha=0.6)
            for st, wd in starts:
                if lo <= st < hi:
                    ax.axvline(st, color="#E5534B", lw=1.5)
                    ax.text(st, 0.9 * np.abs(y).max(), wd, color="#E5534B", fontsize=11, rotation=0)
            ax.set_xlim(lo, hi)
            ax.set_yticks([])
        plt.tight_layout()
        plt.savefig(a.png, dpi=70)
        print("PNG", a.png)


if __name__ == "__main__":
    main()
