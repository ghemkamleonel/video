"""Render still frames of ONE OVG scene in isolation.

Usage:
  python preview_scene.py --topic gestion-du-risque-v2 --scene 3 --frames 0,40,120 [--out DIR]

Builds a one-scene Remotion composition next to the scene file, bundles it with
the studio's webpack config, renders the requested LOCAL frames as PNGs, and
prints the PNG paths plus a contact sheet path (all frames side by side).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

OVG = Path("/home/user/outscal/video-generator")
STUDIO = OVG / "studio"
BROWSER = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
SCRATCH = Path("/tmp/claude-0/-home-user-video/de7a49b6-cedd-5670-aff8-07e9151b6394/scratchpad")

sys.path.insert(0, str(OVG))


def scene_duration(topic: str, idx: int) -> int:
    manifest = json.loads((OVG / "Outputs" / topic / "manifest.json").read_text())
    path = OVG / manifest["Direction"]["path"]
    scene = json.loads(path.read_text())["scenes"][idx]
    return scene["sceneEndFrame"] - scene["sceneStartFrame"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", required=True)
    ap.add_argument("--scene", type=int, required=True)
    ap.add_argument("--frames", required=True, help="comma-separated LOCAL frame numbers")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    from scripts.claude_cli.content_video.post_process import generate_remotion_composition

    latest = OVG / "Outputs" / args.topic / "Video" / "Latest"
    dur = scene_duration(args.topic, args.scene)
    comp = generate_remotion_composition([{"index": args.scene, "duration_frames": dur}])
    comp_file = latest / f"_preview_{args.scene}.tsx"
    comp_file.write_text(comp, encoding="utf-8")
    entry = latest / f"_preview_entry_{args.scene}.tsx"
    entry.write_text(
        "import React from 'react';\n"
        "import {registerRoot, Composition} from 'remotion';\n"
        f"import {{MyComposition}} from './_preview_{args.scene}';\n"
        "const Root: React.FC = () => (\n"
        f"  <Composition id=\"Preview\" component={{MyComposition as any}} durationInFrames={{{dur}}} fps={{30}} width={{1920}} height={{1080}} defaultProps={{{{audioUrl: ''}}}} />\n"
        ");\n"
        "registerRoot(Root);\n",
        encoding="utf-8",
    )

    out = Path(args.out) if args.out else SCRATCH / "previews" / args.topic / f"scene_{args.scene}"
    out.mkdir(parents=True, exist_ok=True)
    bundle = out / "bundle"
    if bundle.exists():
        shutil.rmtree(bundle)
    env = dict(os.environ, OVG_TOPIC=args.topic)
    r = subprocess.run(
        ["npx", "remotion", "bundle", str(entry), f"--out-dir={bundle}", "--log=error"],
        cwd=STUDIO, env=env, capture_output=True, text=True,
    )
    if r.returncode != 0:
        print("BUNDLE FAILED\n" + r.stdout[-3000:] + r.stderr[-3000:])
        sys.exit(1)

    frames = [int(f) for f in args.frames.split(",") if f.strip()]
    pngs = []
    for f in frames:
        f = max(0, min(dur - 1, f))
        png = out / f"frame_{f:04d}.png"
        r = subprocess.run(
            ["npx", "remotion", "still", str(bundle), "Preview", str(png), f"--frame={f}",
             f"--browser-executable={BROWSER}", "--log=error"],
            cwd=STUDIO, env=env, capture_output=True, text=True,
        )
        errs = [l for l in (r.stdout + r.stderr).splitlines() if l.strip() and "mapbox" not in l and not l.startswith("    at")]
        if r.returncode != 0 or not png.exists():
            print(f"STILL FAILED frame {f}\n" + "\n".join(errs[-30:]))
            sys.exit(1)
        if errs:
            print(f"[frame {f} console]\n" + "\n".join(errs[-10:]))
        pngs.append(png)

    # contact sheet (2 columns, 960x540 tiles, frame number burned in)
    sheet = out / "sheet.png"
    inputs, filt = [], ""
    for i, p in enumerate(pngs):
        inputs += ["-i", str(p)]
        filt += f"[{i}:v]scale=960:540,drawtext=text='f{frames[i]}':x=10:y=10:fontsize=36:fontcolor=red:box=1:boxcolor=white[v{i}];"
    n = len(pngs)
    if n == 1:
        filt += "[v0]copy"
    else:
        layout = "|".join(f"{(i % 2) * 960}_{(i // 2) * 540}" for i in range(n))
        filt += "".join(f"[v{i}]" for i in range(n)) + f"xstack=inputs={n}:layout={layout}:fill=black"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", filt, str(sheet)], check=True)
    shutil.rmtree(bundle, ignore_errors=True)
    comp_file.unlink(missing_ok=True)
    entry.unlink(missing_ok=True)
    print("SCENE_DURATION", dur)
    for p in pngs:
        print("PNG", p)
    print("SHEET", sheet)


if __name__ == "__main__":
    main()
