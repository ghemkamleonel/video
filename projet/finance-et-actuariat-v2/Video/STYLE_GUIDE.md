# Scene coding guide -- topic `finance-et-actuariat-v2`

You are acting as the OVG `code-agent` for ONE scene. The authoritative rules are in
`/home/user/outscal/video-generator/.claude/agents/code-agent.md` (read the sections
`creative-guidelines`, `critical_constraints`, `timing`, `component-format`, `text`, `seeded-random`).
This file adds the house conventions for this video so all scenes look like one film.

## Inputs
- Your scene's direction + word timings: `Outputs/finance-et-actuariat-v2/Video/Prompts/prompt_*.md`
  (one file holds all scenes, each under a `# Scene N` header; read only your section plus the artstyle block at the top).
- Word timings are LOCAL frames (frame 0 = scene start, 30 fps). Hard-sync visual beats to the words.
- Reference implementation of the house style (an approved scene of a sibling video):
  `Outputs/gestion-du-risque-v2/Video/Latest/scene_8.tsx`. Copy its header (type stubs, font loading,
  helpers) and match its look.

## Hard constraints (validator / OVG)
- Output file: `Outputs/finance-et-actuariat-v2/Video/Latest/scene_{N}.tsx`, component `Scene{N}`, `export default Scene{N}`.
- Source must be pure ASCII. Put French accents in JS strings with escapes: e = é, e grave = è,
  a grave = à, E acute = É, c cedilla = ç, o circumflex = ô, u grave = ù,
  euro = €, approx = ≈, times = ×, minus sign: use plain "-". Never put accented chars in JSX text children; use `{"..."}` expressions.
- ALL on-screen text through the `Text` prop (never raw span/div with fontSize). SVG `<text>` only for decorative engraving.
- No Math.random / Date. Use `seededRandom(seed, i)`.
- `interpolate` inputRange strictly increasing. Clamp extrapolation.
- At least one element visible and animating at frame 0. No blank frames anywhere in the scene.
- Everything inside 1920x1080 with >= 40px margin (account for scale transforms).
- Text minimum heights: titles >= 100px, labels >= 70px, small tags >= 50px. Readable on a phone.
- No humans, faces, hands, silhouettes.
- Do not use the `Arrow` prop unless an arrow is truly needed (art style forbids arrowheads); straight lines/brackets preferred.

## TIMING RULE (most important -- the narration audio WILL be replaced by the presenter's own voice)
- Your scene file ALREADY EXISTS as a stub: it contains a generated block between
  `/* @ovg-timings:begin ... */` and `/* @ovg-timings:end */` (constants `DURATION` and `WORDS`) followed by the
  helpers `norm` and `at`. Keep that block and the helpers EXACTLY as they are (byte for byte), place your imports
  above them and your scene code below them. A script will regenerate the block later with new timings.
- NEVER hard-code a word's frame number. Anchor every narration beat with `at("word")` / `at("word", n)` (n-th
  occurrence in this scene). Pass plain words without apostrophes or accents issues: tokens are split on
  apostrophes and hyphens, so "l'actuariat" -> `at("actuariat")`, "c'est" -> `at("est")`, accents are ignored
  (`at("marche")` matches "marche" with or without accent). `at` throws if the word is not in this scene.
- Use `DURATION` (this scene's length in frames) instead of any literal scene length; never use
  useVideoConfig().durationInFrames.
- Animation lengths (e.g. 12 frames for an entrance) may be literal. But the gap between two words will change
  with the real voice, so never assume it: when an interpolate inputRange mixes two anchors, guard it so it stays
  strictly increasing, e.g. `const b = Math.max(at("a") + 1, at("b"));`. Prefer `[at("x"), at("x") + 12]`.
- Every phase must still look complete and readable if the speaker talks 30 percent slower or faster.
- The narration is a verbatim, spontaneous speech transcript and contains hesitations ("de, cette, de, ce",
  "qui, qui", "trois roles, trois roles"). On-screen text must be clean (never show hesitations) and must follow
  the direction's labels; the visuals can simply hold during hesitations.

## House style (vox art style)
- Background `#121212` (or a subtle radial gradient to `#000000`), always "breathing": a faint animated grid,
  drifting digits, scrolling candles... at low opacity (0.04-0.15).
- Palette: GOLD `#F2C94C` (gains, the hero, highlights) / NAVY `#2E4F70` / PURPLE `#44344E` / BROWN `#443832` /
  WHITE `#FFFFFF` / GREY `#8A8A8A` / RED `#E5534B` (losses, ruin -- use sparingly) / chip white cards `#FFFFFF` with black text.
- Fonts: `Jost` 700/900 for titles and labels (UPPERCASE for categories), `IBMPlexMono` 500/700 for numbers and counters,
  `PlayfairDisplay` italic only for quotes. Load with `@remotion/google-fonts/<Name>` `loadFont("normal", {weights, subsets: ["latin","latin-ext"]})`.
- Motion: snappy exponential ease-out `Easing.bezier(0.16, 1, 0.3, 1)`; no bounce except the Scene 0 hero overshoot.
  Elements arrive fast and settle. Use 3D tilt / camera push (scale on a wrapper) for emphasis. Failure = drain to greyscale
  (`filter: grayscale()`), never stamps or X marks.
- Sharp corners (radius 0) on chips/bars/cards; circles are fine for coins, dots and gauges.
- Composition: centred, large, full-canvas. One idea per phase. Captions as white chips with black Jost 900 text.
- Numbers formatted French style: thin spaces as plain spaces ("15 000"), decimal comma ("4,6"), " %" with a space, "$" after the number ("25 $").

## Verify your work visually (MANDATORY)
1. Validate (from `video-tools/`):
   write `Outputs/finance-et-actuariat-v2/Video/_validate_{N}.json` = `{"components":[{"scene_index":N,"tsx_content":"<file contents>"}],"total_frames":<scene duration>,"topic":"finance-et-actuariat-v2"}`
   (build it with a short python one-liner reading the .tsx; total_frames = DURATION), then
   `cd /home/user/outscal/video-generator/video-tools && python -m scripts.tools_cli validate_tsx --payload ../Outputs/finance-et-actuariat-v2/Video/_validate_{N}.json`
   It must print `"success": true`. Fix and repeat otherwise.
2. Preview stills (from the OVG root):
   `python /tmp/claude-0/-home-user-video/de7a49b6-cedd-5670-aff8-07e9151b6394/scratchpad/tools/preview_scene.py --topic finance-et-actuariat-v2 --scene N --frames a,b,c,d`
   Choose 4-6 LOCAL frames covering frame 0-5, each phase peak, and the last frames. It prints PNG paths and a
   `SHEET` contact-sheet path. Open the sheet with the Read tool and LOOK at it.
3. Critique like a picky motion designer: overlapping elements, text cut off or overflowing its box, elements off-canvas,
   empty/dead frames, unreadable small text, wrong French, visuals that do not match the narration beat, poor centring,
   clutter. Fix and re-preview. Iterate until clean (max 4 rounds).
4. Do not touch any other scene's files. Do not run `cli_pipeline post`.
