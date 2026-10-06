#!/usr/bin/env bash
# Replace an OVG topic's narration with the presenter's own recording and re-sync every scene.
# Usage (from the OVG root): bash scripts/utility/use_my_voice.sh <topic> <recording.(m4a|mp3|wav|...)>
# Requires scenes written with the @ovg-timings block (see scripts/utility/retime_scenes.py).
set -euo pipefail
TOPIC="$1"; REC="$2"
T="Outputs/$TOPIC"

echo "== 1/5 align the recording to the script"
python -m scripts.utility.voice_align --audio "$REC" --script "$T/Scripts/script.md" \
  --out-audio "$T/Audio/latest.mp3" --out-transcript "$T/Transcript/latest.json"

echo "== 2/5 scene timestamps from the real voice (no TTS call)"
python - "$T/manifest.json" <<'EOF'
import json, sys
p = sys.argv[1]; m = json.load(open(p))
m.setdefault("metadata", {})["skipAudioApiCall"] = True
json.dump(m, open(p, "w"), indent=2, ensure_ascii=False)
EOF
python -m scripts.cli_pipeline post --topic "$TOPIC" --step audio

echo "== 3/5 per-scene word timings"
# `cli_pipeline pre --step code` starts a fresh generation and deletes Video/Latest/scene_*.tsx:
# keep the scenes aside while it rebuilds the per-scene prompts, then put them back and retime.
KEEP="$(mktemp -d)"
cp "$T"/Video/Latest/scene_[0-9]*.tsx "$KEEP"/
python -m scripts.cli_pipeline pre --topic "$TOPIC" --step code >/dev/null
cp "$KEEP"/scene_*.tsx "$T"/Video/Latest/
rm -rf "$KEEP"
python -m scripts.utility.retime_scenes --topic "$TOPIC"

echo "== 4/5 validate every scene with the new timings"
python - "$TOPIC" <<'EOF'
import glob, json, re, subprocess, sys
topic = sys.argv[1]
comps = []
for f in sorted(glob.glob(f"Outputs/{topic}/Video/Latest/scene_[0-9]*.tsx")):
    src = open(f, encoding="utf-8").read()
    n = int(re.search(r"scene_(\d+)\.tsx", f).group(1))
    dur = int(re.search(r"const DURATION = (\d+);", src).group(1))
    comps.append((n, src, dur))
bad = []
for n, src, dur in comps:
    payload = f"Outputs/{topic}/Video/_revalidate_{n}.json"
    json.dump({"components": [{"scene_index": n, "tsx_content": src}], "total_frames": dur}, open(payload, "w"))
    out = subprocess.run([sys.executable, "-m", "scripts.tools_cli", "validate_tsx", "--payload", f"../{payload}"],
                         cwd="video-tools", capture_output=True, text=True).stdout
    ok = '"success": true' in out
    print(f"scene {n}: {'OK' if ok else 'FAILED'}")
    if not ok:
        bad.append(n); print(out[-1500:])
if bad:
    sys.exit(f"scenes failing validation: {bad}")
EOF
rm -f "$T"/Video/_revalidate_*.json

echo "== 5/5 composition"
python -m scripts.cli_pipeline post --topic "$TOPIC" --step code
echo "Done. Render with: OVG_TOPIC=$TOPIC npm run render (in studio/), or the finalize script."
