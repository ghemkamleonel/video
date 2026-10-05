import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Easing, Img, staticFile } from "remotion";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

type ArrowProps = { id: string; startX: number; startY: number; endX: number; endY: number; curveX?: number; curveY?: number; progress?: number; color?: string; strokeWidth?: number; dashed?: boolean; arrowLen?: number; arrowWidth?: number; };
type TextProps = { id: string; text: string; width: number; height: number; multiline?: boolean; padding?: number; lineHeight?: number; minSize?: number; maxSize?: number; className?: string; textStyles?: React.CSSProperties; align?: "left" | "center" | "right" | "justify"; typing?: { startFrame: number; endFrame: number; showCursor?: boolean; cursorChar?: string; cursorBlinkRate?: number; }; sizeGroup?: { texts: string[]; pickFontSize?: "min" | "max"; }; };
type SeededRandomFn = (seed: string, n: number) => number;

const { fontFamily: JOST } = loadJost("normal", { weights: ["400", "700", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });

const GOLD = "#F2C94C";
const NAVY = "#2E4F70";
const RED = "#E5534B";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const NC = 116;
const CW = 15;
const CHX0 = 90;
const CHY = 430;
const PATTERNS = [12, 33, 55, 78, 101];
const BEAM_START = 110;
const BEAM_END = 215;
const LANE_Y = 770;
const SPAWN0 = 252;
const SPAWN_EVERY = 3;
const RED_RUN = [33, 34, 35, 36, 37];

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const Scene7: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PHASE 1: title then compress into header
  const titleIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  const toHeader = prog(frame, 90, 16);
  const titleY = interpolate(toHeader, [0, 1], [540, 70]);
  const titleScale = interpolate(toHeader, [0, 1], [1, 0.42]) * (0.8 + 0.2 * titleIn);

  // PHASE 2: candles + scanner
  const p2 = prog(frame, 96, 12);
  const beamX = interpolate(frame, [BEAM_START, BEAM_END], [CHX0, CHX0 + NC * CW], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const candleData = Array.from({ length: NC }).map((_, i) => {
    const inPattern = PATTERNS.some((p) => i >= p && i < p + 3);
    const base = Math.sin(i * 0.11) * 70 + Math.sin(i * 0.37) * 40 + (seededRandom("c7-b", i) - 0.5) * 60;
    const up = inPattern ? true : seededRandom("c7-u", i) > 0.5;
    const body = inPattern ? 46 : 18 + seededRandom("c7-h", i) * 40;
    return { x: CHX0 + i * CW + CW / 2, mid: CHY - base, up, body, inPattern };
  });
  const found = PATTERNS.filter((p) => beamX > CHX0 + (p + 3) * CW);

  // PHASE 3: tile stream + equity
  const p3 = prog(frame, 250, 10);
  const tiles: { x: number; win: boolean; i: number }[] = [];
  let equity = 0;
  const equityPts: string[] = [];
  const maxTiles = Math.floor((frame - SPAWN0) / SPAWN_EVERY);
  for (let i = 0; i <= maxTiles && i < 60; i++) {
    const spawn = SPAWN0 + i * SPAWN_EVERY;
    const age = frame - spawn;
    const win = RED_RUN.includes(i) ? false : seededRandom("t7", i) > 0.38;
    const x = 380 + age * 26;
    if (x < 1860) tiles.push({ x, win, i });
    equity += win ? 1 : -1;
    equityPts.push(`${(420 + i * 23.5).toFixed(1)},${(1010 - equity * 7).toFixed(1)}`);
  }
  const tradesPerDay = Math.round(interpolate(frame, [261, 300], [0, 12480], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const smallTag = prog(frame, 309, 8);
  const runTag = prog(frame, 355, 8);
  const blink = (k: number) => (Math.floor(frame / 4 + k * 3) % 3 === 0 ? 1 : 0.25);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {/* PHASE 2 chart */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: p2 }}>
        <svg id="candles-7-a2s3" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect x={CHX0 - 20} y={250} width={NC * CW + 40} height={360} fill="#1A1A1A" />
          {candleData.map((c, i) => (
            <g key={i} opacity={c.inPattern && found.includes(PATTERNS.find((p) => i >= p && i < p + 3) as number) ? 1 : 0.75}>
              <line x1={c.x} y1={c.mid - c.body - 16} x2={c.x} y2={c.mid + c.body / 2 + 16} stroke="#FFFFFF" strokeWidth={2} />
              <rect x={c.x - 5} y={c.mid - c.body / 2} width={10} height={c.body} fill={c.up ? GOLD : NAVY} />
            </g>
          ))}
          {found.map((p) => {
            const x0 = CHX0 + p * CW - 6;
            const ys = candleData.slice(p, p + 3).map((c) => c.mid);
            const top = Math.min(...ys) - 70;
            const bot = Math.max(...ys) + 70;
            return <rect key={p} x={x0} y={top} width={3 * CW + 12} height={bot - top} fill="none" stroke={GOLD} strokeWidth={4} />;
          })}
          {frame >= BEAM_START && frame <= BEAM_END + 6 && (
            <g>
              <rect x={beamX - 8} y={250} width={16} height={360} fill={GOLD} opacity={0.85} />
              <rect x={beamX - 40} y={250} width={80} height={360} fill={GOLD} opacity={0.15} />
              <line x1={200} y1={660} x2={beamX} y2={610} stroke={GOLD} strokeWidth={3} opacity={0.6} />
            </g>
          )}
        </svg>
        {/* Found patterns copied into a row */}
        <div style={{ position: "absolute", left: 0, top: 150, width: 1920, height: 90, display: "flex", justifyContent: "center", gap: 30 }}>
          {found.map((p, j) => (
            <div key={p} id={`pattern-copy-7-${j}`} style={{ width: 150, height: 90, border: `4px solid ${GOLD}`, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14, paddingBottom: 12, boxSizing: "border-box" }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ width: 22, height: 22 + k * 16, background: GOLD }} />
              ))}
            </div>
          ))}
        </div>
        <Box x={1480} y={660} w={700} h={80} style={{ opacity: prog(frame, 182, 10) * (1 - p3) }}>
          <Text id="tag-regularites-7-d4f5" text={"minuscules régularités"} width={700} height={80} textStyles={{ fontFamily: JOST, fontWeight: 700, color: GOLD }} />
        </Box>
        <Box x={200} y={830} w={220} h={330}>
          <Img id="img-server-7-g6h7" src={staticFile("server rack.svg")} style={{ width: 220, height: 330 }} />
        </Box>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 6 }).map((_, k) => (
            <circle key={k} cx={130} cy={700 + k * 48} r={8} fill={GOLD} opacity={blink(k)} />
          ))}
        </svg>
      </div>

      {/* PHASE 3 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: p3 }}>
        {tiles.map((t) => (
          <div key={t.i} style={{ position: "absolute", left: t.x - 26, top: LANE_Y - 26, width: 52, height: 52, background: t.win ? GOLD : RED }} />
        ))}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={420} y1={1010} x2={1840} y2={1010} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={2} />
          {equityPts.length > 1 && <polyline points={equityPts.join(" ")} fill="none" stroke={GOLD} strokeWidth={6} strokeLinejoin="round" />}
        </svg>
        <Box x={1500} y={680} w={700} h={90}>
          <Text id="trades-7-j8k9" text={fmt(tradesPerDay) + " paris / jour"} width={700} height={90} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        </Box>
        <Box x={760} y={680} w={520} h={80} style={{ opacity: smallTag * (1 - runTag) }}>
          <div style={{ background: "#FFFFFF", display: "flex", padding: "0 12px" }}>
            <Text id="tag-small-7-l1z2" text="chaque pari : petit" width={490} height={70} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#000000" }} />
          </div>
        </Box>
        <Box x={760} y={680} w={520} h={80} style={{ opacity: runTag }}>
          <div style={{ background: RED, display: "flex", padding: "0 12px" }}>
            <Text id="tag-run-7-x3c4" text={"série perdante : encaissée"} width={490} height={70} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#FFFFFF" }} />
          </div>
        </Box>
      </div>

      {/* Title / header (drawn last so it stays on top) */}
      <Box x={960} y={titleY} w={1800} h={240} style={{ transform: `scale(${titleScale})` }}>
        <Text id="title-fq-7-v5b6" text="FINANCE QUANTITATIVE" width={1800} height={240} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
      </Box>
      <Box x={960} y={700} w={1400} h={110} style={{ opacity: prog(frame, 40, 10) * (1 - toHeader) }}>
        <Text id="sub-fq-7-n7m8" text={"la logique du casino, appliquée aux marchés"} width={1400} height={110} textStyles={{ fontFamily: JOST, fontWeight: 400, color: GOLD }} />
      </Box>
    </AbsoluteFill>
  );
};

export default Scene7;
