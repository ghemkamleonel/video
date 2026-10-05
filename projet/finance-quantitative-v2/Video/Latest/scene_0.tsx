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
const BG = "#121212";
const NAVY = "#2E4F70";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const Candles: React.FC<{ frame: number; seededRandom: SeededRandomFn }> = ({ frame, seededRandom }) => {
  const items = [];
  const n = 48;
  const spacing = 2200 / n;
  for (let i = 0; i < n; i++) {
    const x = ((i * spacing - frame * 3) % 2200 + 2200) % 2200 - 140;
    const mid = 540 + Math.sin(i * 0.45) * 220 + (seededRandom("c0-mid", i) - 0.5) * 140;
    const body = 40 + seededRandom("c0-body", i) * 120;
    const up = seededRandom("c0-up", i) > 0.45;
    items.push(
      <g key={i} opacity={0.16}>
        <line x1={x} y1={mid - body} x2={x} y2={mid + body} stroke="#FFFFFF" strokeWidth={3} />
        <rect x={x - 13} y={mid - body / 2} width={26} height={body} fill={up ? GOLD : NAVY} />
      </g>
    );
  }
  return <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>{items}</svg>;
};

const Coin: React.FC<{ size: number; angle: number }> = ({ size, angle }) => {
  const c = Math.cos(angle);
  const face = c >= 0;
  const sy = Math.max(0.04, Math.abs(c));
  const edge = (1 - Math.abs(c)) * 34;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <ellipse cx={100} cy={100 + edge * 0.5} rx={98} ry={98 * sy} fill="#8C6A12" />
        <g transform={`translate(100 100) scale(1 ${sy}) translate(-100 -100)`}>
          <circle cx={100} cy={100} r={98} fill={face ? GOLD : "#D9AE2E"} />
          <circle cx={100} cy={100} r={84} fill="none" stroke="#8C6A12" strokeWidth={5} />
          {face ? (
            <polyline points="48,132 70,118 86,124 104,96 120,104 150,62" fill="none" stroke="#5A430A" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
          ) : (
            <g stroke="#5A430A" strokeWidth={7} fill="none">
              <circle cx={100} cy={100} r={44} />
              <line x1={100} y1={56} x2={100} y2={144} />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

const Scene0: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Hero coin: visible at frame 0, overshoot and settle, spinning from frame 0
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 160, mass: 0.7 } });
  const heroScale = interpolate(pop, [0, 1], [0.78, 1]);
  const push = interpolate(frame, [92, 128], [1, 1.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const angle = frame * 0.32;
  const coinSize = 640;

  const gridPulse = 0.07 + 0.04 * Math.sin(frame * 0.15);

  const y1988 = prog(frame, 8, 8);
  const y2018 = prog(frame, 59, 8);
  const line = prog(frame, 62, 24);

  const counterIn = prog(frame, 92, 10);
  const counterVal = Math.round(interpolate(frame, [98, 147], [0, 66], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const locked = frame >= 147;
  const lockPop = spring({ frame: frame - 147, fps, config: { damping: 200 }, durationInFrames: 10 });
  const caption = prog(frame, 188, 10);

  const particles = [];
  for (let i = 0; i < 46; i++) {
    const birth = 90 + i * 2.6;
    const age = frame - birth;
    if (age < 0 || age > 34) continue;
    const dir = seededRandom("p0-dir", i) * Math.PI * 2;
    const speed = 9 + seededRandom("p0-sp", i) * 9;
    const r = 300 + age * speed;
    const px = 960 + Math.cos(dir) * r;
    const py = 560 + Math.sin(dir) * r * 0.75;
    const o = interpolate(age, [0, 6, 34], [0, 1, 0]);
    const s = 10 + seededRandom("p0-s", i) * 14;
    particles.push(<div key={i} style={{ position: "absolute", left: px - s / 2, top: py - s / 2, width: s, height: s, background: GOLD, opacity: o, transform: `rotate(${age * 12}deg)` }} />);
  }

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, #1F2A36 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 17 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120} y1={0} x2={i * 120} y2={1080} stroke="#FFFFFF" strokeOpacity={gridPulse} strokeWidth={2} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120} x2={1920} y2={i * 120} stroke="#FFFFFF" strokeOpacity={gridPulse} strokeWidth={2} />
        ))}
      </svg>
      <Candles frame={frame} seededRandom={seededRandom} />

      {particles}

      {/* Timeline under the coin */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={330} y1={900} x2={330 + 1260 * line} y2={900} stroke={GOLD} strokeWidth={6} opacity={0.9} />
      </svg>

      <Box x={960} y={575} w={coinSize} h={coinSize} style={{ transform: `scale(${heroScale * push})` }}>
        <div id="coin-hero-0-a7k2" style={{ filter: "drop-shadow(0 0 60px rgba(242,201,76,0.45))" }}>
          <Coin size={coinSize} angle={angle} />
        </div>
      </Box>

      <Box x={330} y={575} w={360} h={170} style={{ opacity: y1988, transform: `translateX(${(1 - y1988) * -80}px)` }}>
        <Text id="year-1988-0-b3x9" text="1988" width={360} height={170} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
      </Box>
      <Box x={1590} y={575} w={360} h={170} style={{ opacity: y2018, transform: `translateX(${(1 - y2018) * 80}px)` }}>
        <Text id="year-2018-0-q1m4" text="2018" width={360} height={170} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
      </Box>

      <Box x={960} y={130} w={1100} h={200} style={{ opacity: counterIn, transform: `scale(${locked ? 1 + 0.08 * (1 - lockPop) : 0.9 + 0.1 * counterIn})` }}>
        <div style={{ background: locked ? GOLD : "rgba(0,0,0,0.6)", padding: "0 30px" }}>
          <Text
            id="counter-0-z8p1"
            text={locked ? "+66 % / AN" : `+${counterVal} %`}
            width={1040}
            height={190}
            textStyles={{ fontFamily: JOST, fontWeight: 900, color: locked ? "#000000" : GOLD }}
          />
        </div>
      </Box>

      <Box x={960} y={985} w={700} h={110} style={{ opacity: caption, transform: `translateY(${(1 - caption) * 50}px)` }}>
        <div style={{ background: "#FFFFFF", padding: "0 24px" }}>
          <Text id="caption-frais-0-r5t6" text="avant frais" width={520} height={100} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#000000" }} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene0;
