"""Assemble scene_{i}.tsx = shared header + preserved @ovg-timings block/helpers + scene body, then validate."""
import json
import os
import re
import subprocess
import sys

S = os.path.dirname(os.path.abspath(__file__))
OVG = "/home/user/outscal/video-generator"
TOPIC = "finance-et-actuariat-v2"
LATEST = f"{OVG}/Outputs/{TOPIC}/Video/Latest"
BEGIN = "/* @ovg-timings:begin"

header = open(f"{S}/header.tsx", encoding="utf-8").read()
idx = [int(a) for a in sys.argv[1:]]
results = {}
for n in idx:
    cur = open(f"{LATEST}/scene_{n}.tsx", encoding="utf-8").read()
    i = cur.index(BEGIN)
    # timing block + helpers end right before the scene body marker (or at end of a stub)
    j = cur.find("// ---- scene body ----")
    timing = cur[i:j] if j >= 0 else cur[i:]
    body = open(f"{S}/body_{n}.tsx", encoding="utf-8").read()
    src = header.rstrip() + "\n\n" + timing.rstrip() + "\n\n// ---- scene body ----\n" + body.lstrip()
    open(f"{LATEST}/scene_{n}.tsx", "w", encoding="utf-8").write(src)
    dur = int(re.search(r"const DURATION = (\d+);", src).group(1))
    payload = f"{S}/_v{n}.json"
    json.dump({"components": [{"scene_index": n, "tsx_content": src}], "total_frames": dur}, open(payload, "w"))
    out = subprocess.run([sys.executable, "-m", "scripts.tools_cli", "validate_tsx", "--payload", payload],
                         cwd=f"{OVG}/video-tools", capture_output=True, text=True).stdout
    ok = '"success": true' in out
    results[n] = ok
    print(f"scene {n}: {'OK' if ok else 'FAILED'}")
    if not ok:
        try:
            r = json.loads(out.strip().splitlines()[-1])[0]
            print("  ", r.get("message", "")[:1500])
            for e in r.get("errors", [])[:8]:
                print("   -", e)
        except Exception:
            print(out[-2000:])
