"""Build a French SRT from an OVG word transcript: python make_srt.py transcript.json out.srt"""
import json
import sys

NUM = [
    ("mille neuf cent quatre-vingt-dix-huit", "1998"), ("mille neuf cent cinquante-six", "1956"),
    ("mille neuf cent quatre-vingt-huit", "1988"), ("deux mille dix-huit", "2018"), ("deux mille seize", "2016"),
    ("deux cent cinquante dollars", "250 $"), ("vingt-cinq dollars", "25 $"), ("quatre virgule six milliards de dollars", "4,6 milliards de dollars"),
    ("Soixante et un joueurs", "61 joueurs"), ("soixante et un joueurs", "61 joueurs"), ("quatorze banques", "14 banques"),
    ("vingt et un pour cent", "21 %"), ("vingt pour cent", "20 %"), ("quarante pour cent", "40 %"), ("quatre pour cent", "4 %"),
    ("soixante-six pour cent", "66 %"), ("cinquante virgule soixante-quinze pour cent", "50,75 %"), ("deux virgule sept pour cent", "2,7 %"),
    ("soixante chances sur cent", "60 chances sur 100"), ("moins quarante", "moins 40"),
    ("six fois sur mille", "6 fois sur 1 000"), ("six fois sur dix", "6 fois sur 10"), ("six chances sur dix", "6 chances sur 10"),
    ("dix lancers", "10 lancers"), ("dix mille", "10 000"), ("cent cinquante euros", "150 €"), ("quinze mille euros", "15 000 €"),
    ("mille euros", "1 000 €"), ("un euro", "1 €"), ("une chance sur quinze", "une chance sur 15"),
]


def ts(ms: int) -> str:
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def wrap(t: str) -> str:
    if len(t) <= 42:
        return t
    words, half, acc = t.split(), len(t) / 2, 0
    for k, w in enumerate(words):
        acc += len(w) + 1
        if acc >= half:
            return " ".join(words[: k + 1]) + "\n" + " ".join(words[k + 1:])
    return t


def main() -> None:
    words = json.load(open(sys.argv[1], encoding="utf-8"))
    cues, cur = [], []
    for t in words:
        w = t["word"]
        if w in ".,;:!?":
            if cur:
                sep = " " if w in ":;!?" else ""
                cur[-1] = (cur[-1][0] + sep + w, cur[-1][1], t["end_ms"])
            if cur and (w in ".!?" or (w in ",:" and len(cur) >= 5)):
                cues.append(cur)
                cur = []
            continue
        cur.append((w, t["start_ms"], t["end_ms"]))
        if len(cur) >= 14:
            cues.append(cur)
            cur = []
    if cur:
        cues.append(cur)
    merged = []
    for c in cues:
        if merged and len(c) <= 2:
            merged[-1] = merged[-1] + c
        else:
            merged.append(c)
    out = []
    for i, c in enumerate(merged):
        text = " ".join(x[0] for x in c)
        for a, b in NUM:
            text = text.replace(a, b)
        end = c[-1][2] + 150
        if i + 1 < len(merged):
            end = min(end, merged[i + 1][0][1] - 20)
        out.append(f"{i + 1}\n{ts(c[0][1])} --> {ts(end)}\n{wrap(text)}\n")
    open(sys.argv[2], "w", encoding="utf-8").write("\n".join(out))
    print(f"{len(merged)} cues -> {sys.argv[2]}")


if __name__ == "__main__":
    main()
