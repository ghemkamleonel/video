import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Easing } from "remotion";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

type ArrowProps = { id: string; startX: number; startY: number; endX: number; endY: number; curveX?: number; curveY?: number; progress?: number; color?: string; strokeWidth?: number; dashed?: boolean; arrowLen?: number; arrowWidth?: number; };
type TextProps = { id: string; text: string; width: number; height: number; multiline?: boolean; padding?: number; lineHeight?: number; minSize?: number; maxSize?: number; className?: string; textStyles?: React.CSSProperties; align?: "left" | "center" | "right" | "justify"; typing?: { startFrame: number; endFrame: number; showCursor?: boolean; cursorChar?: string; cursorBlinkRate?: number; }; sizeGroup?: { texts: string[]; pickFontSize?: "min" | "max"; }; };
type SeededRandomFn = (seed: string, n: number) => number;

const { fontFamily: JOST } = loadJost("normal", { weights: ["400", "700", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });
const { fontFamily: SERIF } = loadPlayfair("italic", { weights: ["700"], subsets: ["latin", "latin-ext"] });

const GOLD = "#F2C94C";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const SilverCoin: React.FC<{ size: number; angle: number }> = ({ size, angle }) => {
  const c = Math.cos(angle);
  const sy = Math.max(0.05, Math.abs(c));
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <ellipse cx={100} cy={106} rx={98} ry={98 * sy} fill="#6B6B6B" />
      <g transform={`translate(100 100) scale(1 ${sy}) translate(-100 -100)`}>
        <circle cx={100} cy={100} r={98} fill={c >= 0 ? "#E5E5E5" : "#BDBDBD"} />
        <circle cx={100} cy={100} r={82} fill="none" stroke="#8A8A8A" strokeWidth={6} />
        <circle cx={100} cy={100} r={36} fill="none" stroke="#8A8A8A" strokeWidth={8} />
      </g>
    </svg>
  );
};

const QUOTE: { w: string; f: number }[] = [
  { w: "Nous", f: 84 }, { w: "avons", f: 91 }, { w: "raison", f: 99 }, { w: "50,75 %", f: 108 }, { w: "du", f: 166 }, { w: "temps.", f: 170 },
];

const Scene3: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PHASE 1: quote card
  const cardIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const cardOut = prog(frame, 178, 12);

  // PHASE 2: number + ruler
  const p2 = prog(frame, 180, 12);
  const needle = interpolate(frame, [186, 200], [0, 50.75], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const zoom = interpolate(frame, [198, 214], [1, 7], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

  // PHASE 3: coin flips up on 'piece' (214)
  const coinUp = prog(frame, 210, 14);

  const RW = 1540;
  const RX = 960 - RW / 2;
  const RY = 700;
  const xOf = (v: number) => RX + (v / 100) * RW;
  const mid = xOf(50);

  const floating = Array.from({ length: 16 }).map((_, i) => {
    const depth = 0.4 + seededRandom("f3-d", i) * 0.6;
    const x = ((seededRandom("f3-x", i) * 2100 + frame * 2 * depth) % 2100) - 90;
    const y = 60 + seededRandom("f3-y", i) * 960;
    const s = 50 + depth * 70;
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", border: "4px solid #E5E5E5", opacity: 0.08 + depth * 0.08 }} />;
  });

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {floating}

      {/* PHASE 1 */}
      <Box x={960} y={540} w={1780} h={560} style={{ opacity: cardIn * (1 - cardOut), transform: `translateY(${(1 - cardIn) * 120}px) scale(${1 - cardOut * 0.6})` }}>
        <div id="quote-card-3-a1s2" style={{ width: 1780, height: 560, background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Text id="quote-head-3-e4r5" text="L'UN DE SES DIRIGEANTS :" width={1200} height={90} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#2E4F70" }} />
          <div style={{ display: "flex", gap: 18, alignItems: "center", height: 300 }}>
            {QUOTE.map((q, i) => {
              const o = prog(frame, q.f - 2, 5);
              const big = q.w === "50,75 %";
              return (
                <div key={i} style={{ opacity: o, transform: `translateY(${(1 - o) * 30}px)`, background: big ? GOLD : "transparent" }}>
                  <Text id={`quote-w-3-${i}`} text={q.w} width={big ? 380 : q.w.length * 44 + 10} height={big ? 150 : 115} textStyles={{ fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", color: "#000000" }} />
                </div>
              );
            })}
          </div>
        </div>
      </Box>

      {/* PHASE 2 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: p2 }}>
        <Box x={960} y={280} w={1300} h={300} style={{ opacity: 1 - coinUp, transform: `scale(${0.6 + 0.4 * p2})` }}>
          <Text id="big-number-3-u7i8" text="50,75 %" width={1300} height={300} textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
        </Box>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={`translate(${mid} ${RY}) scale(${zoom} 1) translate(${-mid} ${-RY})`}>
            <rect x={RX} y={RY - 30} width={RW} height={60} fill="#2A2A2A" />
            {Array.from({ length: 101 }).map((_, i) => {
              const major = i % 10 === 0;
              return <line key={i} x1={xOf(i)} y1={RY - (major ? 55 : 30)} x2={xOf(i)} y2={RY + (major ? 55 : 30)} stroke="#FFFFFF" strokeWidth={(major ? 4 : 2) / zoom} opacity={major ? 1 : 0.5} />;
            })}
            <rect x={mid} y={RY - 30} width={xOf(needle) - mid > 0 ? xOf(needle) - mid : 0} height={60} fill={GOLD} opacity={zoom > 1.5 ? 1 : 0.0} />
            <line x1={mid} y1={RY - 110} x2={mid} y2={RY + 110} stroke="#FFFFFF" strokeWidth={6 / zoom} />
            <line x1={xOf(needle)} y1={RY - 130} x2={xOf(needle)} y2={RY + 130} stroke={GOLD} strokeWidth={8 / zoom} />
          </g>
        </svg>
        {zoom < 1.4 &&
          [0, 50, 100].map((v) => (
            <Box key={v} x={xOf(v)} y={RY + 130} w={180} h={80}>
              <Text id={`ruler-lbl-3-${v}`} text={String(v)} width={180} height={80} textStyles={{ fontFamily: MONO, color: "#FFFFFF" }} />
            </Box>
          ))}
        <Box x={mid - 330} y={RY + 200} w={560} h={90} style={{ opacity: prog(frame, 204, 8) }}>
          <Text id="lbl-50-3-o9p0" text={"50 % : pile ou face"} width={560} height={90} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#FFFFFF" }} />
        </Box>
        <Box x={mid + 230} y={RY + 200} w={300} h={90} style={{ opacity: prog(frame, 204, 8) }}>
          <Text id="lbl-5075-3-z1x2" text="50,75 %" width={300} height={90} textStyles={{ fontFamily: JOST, fontWeight: 900, color: GOLD }} />
        </Box>
      </div>

      {/* PHASE 3 */}
      <Box x={mid} y={interpolate(coinUp, [0, 1], [1300, 330])} w={300} h={300}>
        <div id="coin-silver-3-l3k4">
          <SilverCoin size={300} angle={frame * 0.45} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene3;
