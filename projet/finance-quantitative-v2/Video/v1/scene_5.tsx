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

const CX0 = 240;
const CX1 = 1380;
const CY0 = 230;
const CY1 = 900;
const VMIN = -2000;
const VMAX = 18000;
const STEPS = 80;
const PATHS = 24;
const xOf = (t: number) => CX0 + t * (CX1 - CX0);
const yOf = (v: number) => CY1 - ((v - VMIN) / (VMAX - VMIN)) * (CY1 - CY0);

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const Scene5: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chartIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  const draw = interpolate(frame, [4, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const counter = Math.round(draw * 1000000);
  const shown = Math.max(1, Math.floor(draw * STEPS));

  const paths = Array.from({ length: PATHS }).map((_, p) => {
    let v = 0;
    const pts: number[] = [0];
    for (let i = 1; i <= STEPS; i++) {
      const u1 = Math.max(1e-6, seededRandom(`w5-a${p}`, i));
      const u2 = seededRandom(`w5-b${p}`, i);
      const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v += 15000 / STEPS + g * 112;
      pts.push(v);
    }
    const d = pts.slice(0, shown + 1).map((val, i) => `${i === 0 ? "M" : "L"} ${xOf(i / STEPS).toFixed(1)} ${yOf(val).toFixed(1)}`).join(" ");
    return <path key={p} d={d} fill="none" stroke={p % 4 === 0 ? GOLD : "#FFFFFF"} strokeOpacity={p % 4 === 0 ? 0.9 : 0.35} strokeWidth={p % 4 === 0 ? 4 : 2.5} />;
  });

  const bar = prog(frame, 76, 18);
  const bracket = prog(frame, 179, 10);
  const zeroGlow = prog(frame, 204, 12);
  const push = interpolate(frame, [204, 240], [1, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const verdict = prog(frame, 236, 10);

  const BARX = 1560;
  const BARW = 150;
  const top15 = yOf(15000);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={0} y1={i * 100 + ((frame * 0.8) % 100)} x2={1920} y2={i * 100 + ((frame * 0.8) % 100)} stroke="#FFFFFF" strokeOpacity={0.04} strokeWidth={2} />
        ))}
      </svg>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: chartIn, transform: `scale(${push})`, transformOrigin: "960px 760px" }}>
        <svg id="chart-5-m1n2" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={CX0} y1={CY0} x2={CX0} y2={CY1} stroke="#FFFFFF" strokeWidth={3} />
          <line x1={CX0 - 10} y1={yOf(0)} x2={1800} y2={yOf(0)} stroke={zeroGlow > 0 ? "#E5534B" : "#FFFFFF"} strokeWidth={3 + 5 * zeroGlow} opacity={0.6 + 0.4 * zeroGlow} />
          {paths}
          <rect x={BARX - BARW / 2} y={yOf(0) - (yOf(0) - top15) * bar} width={BARW} height={(yOf(0) - top15) * bar} fill={GOLD} />
          <g opacity={bracket}>
            <rect x={BARX + BARW / 2 + 40} y={yOf(16000)} width={60} height={yOf(14000) - yOf(16000)} fill="#8A8A8A" />
          </g>
        </svg>
        <Box x={CX0 - 110} y={yOf(0)} w={150} h={60}>
          <Text id="zero-lbl-5-b3v4" text={"0 €"} width={150} height={60} textStyles={{ fontFamily: MONO, color: "#FFFFFF" }} />
        </Box>
        <Box x={BARX} y={top15 - 70} w={420} h={100} style={{ opacity: bar }}>
          <Text id="bar-lbl-5-c5x6" text={"+15 000 €"} width={420} height={100} textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
        </Box>
        <Box x={BARX + 40} y={yOf(15000) + 110} w={330} h={80} style={{ opacity: bracket }}>
          <div style={{ background: "#8A8A8A", display: "flex", padding: "0 10px" }}>
            <Text id="bracket-lbl-5-z7a8" text={"± 1 000 €"} width={300} height={70} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000" }} />
          </div>
        </Box>
      </div>

      <Box x={960} y={110} w={1300} h={150}>
        <Text id="counter-5-s9d0" text={fmt(counter) + " paris"} width={1300} height={150} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
      </Box>

      <Box x={810} y={990} w={1000} h={130} style={{ opacity: verdict, transform: `translateY(${(1 - verdict) * 40}px)` }}>
        <div style={{ background: "#FFFFFF", display: "flex", padding: "0 30px" }}>
          <Text id="verdict-5-f1g2" text={"PERTE ≈ 0 %"} width={760} height={120} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
        </div>
      </Box>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none", boxShadow: `inset 0 0 ${120 * zeroGlow}px rgba(229,83,75,${0.25 * zeroGlow})` }} />
    </AbsoluteFill>
  );
};

export default Scene5;
