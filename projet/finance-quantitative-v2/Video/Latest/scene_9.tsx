import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Easing } from "remotion";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

type ArrowProps = { id: string; startX: number; startY: number; endX: number; endY: number; curveX?: number; curveY?: number; progress?: number; color?: string; strokeWidth?: number; dashed?: boolean; arrowLen?: number; arrowWidth?: number; };
type TextProps = { id: string; text: string; width: number; height: number; multiline?: boolean; padding?: number; lineHeight?: number; minSize?: number; maxSize?: number; className?: string; textStyles?: React.CSSProperties; align?: "left" | "center" | "right" | "justify"; typing?: { startFrame: number; endFrame: number; showCursor?: boolean; cursorChar?: string; cursorBlinkRate?: number; }; sizeGroup?: { texts: string[]; pickFontSize?: "min" | "max"; }; };
type SeededRandomFn = (seed: string, n: number) => number;

const { fontFamily: JOST } = loadJost("normal", { weights: ["400", "700", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });

const GOLD = "#F2C94C";
const NAVY = "#2E4F70";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const Coin: React.FC<{ size: number; angle: number; weight: number }> = ({ size, angle, weight }) => {
  const c = Math.cos(angle);
  const sy = Math.max(0.05, Math.abs(c));
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <ellipse cx={100} cy={106} rx={98} ry={98 * sy} fill="#8C6A12" />
      <g transform={`translate(100 100) scale(1 ${sy}) translate(-100 -100)`}>
        <circle cx={100} cy={100} r={98} fill={c >= 0 ? GOLD : "#D9AE2E"} />
        <circle cx={100} cy={100} r={82} fill="none" stroke="#8C6A12" strokeWidth={6} />
        <polyline points="50,130 74,114 92,120 110,92 128,100 152,66" fill="none" stroke="#5A430A" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
        {weight > 0 && <circle cx={168} cy={100} r={13} fill="#FFFFFF" opacity={weight} />}
        {weight > 0 && <circle cx={168} cy={100} r={22} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={weight * 0.6} />}
      </g>
    </svg>
  );
};

const Scene9: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PHASE 1: crystal ball
  const ballIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  const grey = prog(frame, 40, 12);
  const compress = prog(frame, 52, 12);
  const ballScale = (0.85 + 0.15 * ballIn) * (1 - 0.6 * compress);

  // PHASE 2: loaded coin
  const coinIn = prog(frame, 60, 12);
  const weight = prog(frame, 96, 10);
  const caption = prog(frame, 111, 10);

  // PHASE 3: grid of coins
  const grid = prog(frame, 130, 14);
  const flips = Math.round(interpolate(frame, [134, 225], [0, 2000000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const line = prog(frame, 136, 70);
  const finalTitle = prog(frame, 172, 10);

  const COLS = 10;
  const ROWS = 4;
  const CS = 130;
  const GW = COLS * 165;
  const GH = ROWS * 165;

  const linePts = Array.from({ length: 41 }).map((_, i) => {
    const t = i / 40;
    const v = t * 1 + (seededRandom("g9", i) - 0.5) * 0.06;
    return `${(160 + t * 1600).toFixed(1)},${(1040 - v * 150).toFixed(1)}`;
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #1D2633 0%, ${BG} 65%)`, overflow: "hidden" }}>
      {/* PHASE 1 */}
      <Box x={960} y={520} w={640} h={700} style={{ opacity: 1 - coinIn, transform: `scale(${ballScale})`, filter: `grayscale(${grey})` }}>
        <svg id="crystal-9-a1b2" width={640} height={700} viewBox="0 0 640 700">
          <defs>
            <radialGradient id="cb9" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#B9A7FF" />
              <stop offset="55%" stopColor="#44344E" />
              <stop offset="100%" stopColor="#1A1222" />
            </radialGradient>
          </defs>
          <path d="M 170 560 L 470 560 L 520 680 L 120 680 Z" fill="#443832" />
          <circle cx={320} cy={300} r={270} fill="url(#cb9)" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={6} />
          {Array.from({ length: 5 }).map((_, i) => {
            const a = frame * 0.08 + i * 1.25;
            return <ellipse key={i} cx={320 + Math.cos(a) * 90} cy={300 + Math.sin(a * 1.3) * 70} rx={120} ry={46} fill="#FFFFFF" opacity={0.12} />;
          })}
        </svg>
      </Box>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = frame * 0.06 + (i / 6) * Math.PI * 2;
        return (
          <Box key={i} x={960 + Math.cos(a) * 150} y={480 + Math.sin(a) * 120} w={110} h={130} style={{ opacity: (1 - grey) * 0.85 }}>
            <Text id={`q-9-${i}`} text="?" width={110} height={130} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
          </Box>
        );
      })}
      <Box x={960} y={960} w={1100} h={120} style={{ opacity: prog(frame, 34, 8) * (1 - coinIn) }}>
        <Text id="cap-predire-9-c3d4" text={"prédire demain ?"} width={900} height={120} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
      </Box>

      {/* PHASE 2 */}
      <Box x={960} y={480} w={620} h={620} style={{ opacity: coinIn * (1 - grid), transform: `scale(${(0.4 + 0.6 * coinIn) * (1 - 0.5 * grid)})` }}>
        <div id="coin-loaded-9-e5f6" style={{ filter: "drop-shadow(0 0 50px rgba(242,201,76,0.4))" }}>
          <Coin size={620} angle={frame * 0.12} weight={weight} />
        </div>
      </Box>
      <Box x={960} y={950} w={1300} h={120} style={{ opacity: caption * (1 - grid), transform: `translateY(${(1 - caption) * 40}px)` }}>
        <div style={{ background: "#FFFFFF", display: "flex", padding: "0 30px" }}>
          <Text id="cap-avantage-9-g7h8" text={"pas une prédiction, un avantage"} width={1200} height={110} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#000000" }} />
        </div>
      </Box>

      {/* PHASE 3 */}
      <div style={{ position: "absolute", left: 960 - GW / 2, top: 500 - GH / 2, width: GW, height: GH, display: "flex", flexWrap: "wrap", opacity: grid, transform: `scale(${1.3 - 0.3 * grid})` }}>
        {Array.from({ length: COLS * ROWS }).map((_, i) => (
          <div key={i} style={{ width: 165, height: 165, display: "flex", alignItems: "center", justifyContent: "center", opacity: finalTitle > 0 ? 1 - 0.55 * finalTitle : 1 }}>
            <Coin size={CS} angle={frame * (0.35 + seededRandom("sp9", i) * 0.3) + seededRandom("ph9", i) * 6} weight={1} />
          </div>
        ))}
      </div>
      <Box x={960} y={70} w={1000} h={110} style={{ opacity: grid }}>
        <Text id="flips-9-j9k0" text={String(flips).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " lancers"} width={1000} height={110} textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
      </Box>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: grid }}>
        <polyline points={linePts.slice(0, Math.max(2, Math.round(line * 41))).join(" ")} fill="none" stroke={GOLD} strokeWidth={8} strokeLinejoin="round" />
      </svg>
      <Box x={960} y={500} w={1700} h={260} style={{ opacity: finalTitle, transform: `scale(${1.1 - 0.1 * finalTitle})` }}>
        <div id="final-title-9-l1z2" style={{ background: "#000000", border: `6px solid ${GOLD}`, padding: "0 40px", display: "flex" }}>
          <Text id="final-text-9-x3c4" text={"RÉPÉTER, PAS PRÉDIRE"} width={1560} height={230} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene9;
