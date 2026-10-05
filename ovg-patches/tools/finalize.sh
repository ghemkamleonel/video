#!/usr/bin/env bash
# Usage: finalize.sh <topic> <output-basename>
# Renders the OVG composition, re-encodes for broad compatibility, builds French subtitles.
set -euo pipefail
TOPIC="$1"; NAME="$2"
OVG=/home/user/outscal/video-generator
S=/tmp/claude-0/-home-user-video/de7a49b6-cedd-5670-aff8-07e9151b6394/scratchpad
B=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
cd "$OVG/studio"
export OVG_TOPIC="$TOPIC"
rm -rf "$S/bundle_$TOPIC"
npx remotion bundle src/index.ts --out-dir="$S/bundle_$TOPIC" --log=error >/dev/null
npx remotion render "$S/bundle_$TOPIC" Main "$S/$NAME.raw.mp4" --browser-executable="$B" --concurrency=4 --log=error 2>&1 | grep -v "mapbox\|^    at" | tail -3 || true
ffmpeg -y -v error -i "$S/$NAME.raw.mp4" -map 0:v -map 0:a -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
  -color_range tv -preset slow -crf 20 -c:a aac -b:a 192k -ar 44100 -movflags +faststart "/home/user/video/$NAME.mp4"
python3 "$S/tools/make_srt.py" "$OVG/Outputs/$TOPIC/Transcript/latest.json" "/home/user/video/$NAME.fr.srt"
ffprobe -v error -show_entries stream=codec_name,pix_fmt:format=duration,size -of compact "/home/user/video/$NAME.mp4"
