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
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const POCKETS = 37;
const WX = 960;
const WY = 580;
const R = 390;

const sector = (i: number, r0: number, r1: number) => {
  const a0 = (i / POCKETS) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((i + 1) / POCKETS) * Math.PI * 2 - Math.PI / 2;
  const p = (r: number, a: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
};

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const Scene6: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wheelIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const wheelRot = frame * 2.2;

  const zeroGlow = prog(frame, 123, 10);
  const label = prog(frame, 128, 10);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.35);

  // Ball: orbits from 187, then hops between random pockets from 231
  const ballIn = prog(frame, 185, 6);
  let ballAngle = -frame * 0.16;
  let ballR = R - 28;
  if (frame >= 231) {
    const hop = Math.floor((frame - 231) / 10);
    const local = ((frame - 231) % 10) / 10;
    const pocket = Math.floor(seededRandom("ball6", hop) * POCKETS);
    const prevPocket = Math.floor(seededRandom("ball6", hop - 1) * POCKETS);
    const target = ((pocket + 0.5) / POCKETS) * Math.PI * 2 - Math.PI / 2 + (wheelRot * Math.PI) / 180;
    const from = ((prevPocket + 0.5) / POCKETS) * Math.PI * 2 - Math.PI / 2 + (wheelRot * Math.PI) / 180;
    const e = EASE(Math.min(1, local * 1.6));
    ballAngle = from + (target - from) * e;
    ballR = R - 95 + Math.sin(local * Math.PI) * 50;
  }
  const bx = WX + Math.cos(ballAngle) * ballR;
  const by = WY + Math.sin(ballAngle) * ballR;

  const spinsIn = prog(frame, 262, 8);
  const spins = Math.round(interpolate(frame, [266, 295], [0, 4800000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const chips = Math.floor(interpolate(frame, [262, 295], [2, 16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #136B4A 0%, #0B3D2E 55%, #041A13 100%)", overflow: "hidden" }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const x = ((i * 420 + frame * 4) % 2400) - 240;
        return <div key={i} style={{ position: "absolute", left: x, top: -200, width: 120, height: 1500, background: "rgba(255,255,255,0.035)", transform: "rotate(18deg)" }} />;
      })}

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <g id="wheel-6-x1c2" transform={`translate(${WX} ${WY}) scale(${0.6 + 0.4 * wheelIn})`}>
          <circle r={R + 40} fill="#443832" />
          <circle r={R + 22} fill="#2B211C" />
          <g transform={`rotate(${wheelRot})`}>
            {Array.from({ length: POCKETS }).map((_, i) => (
              <path key={i} d={sector(i, R - 120, R)} fill={i === 0 ? "#1E9E5A" : i % 2 === 1 ? "#C0392B" : "#121212"} stroke={GOLD} strokeWidth={2} />
            ))}
            <path d={sector(0, R - 120, R)} fill="none" stroke={GOLD} strokeWidth={10 * zeroGlow} opacity={zeroGlow * pulse} />
            <circle r={R - 120} fill="#5A3E2B" />
            <circle r={R - 175} fill="#443832" stroke={GOLD} strokeWidth={4} />
            {Array.from({ length: 4 }).map((_, k) => (
              <rect key={k} x={-14} y={-(R - 140)} width={28} height={(R - 140) * 2} fill={GOLD} transform={`rotate(${k * 45})`} />
            ))}
            <circle r={36} fill={GOLD} />
          </g>
        </g>
        <circle cx={bx} cy={by} r={20} fill="#FFFFFF" opacity={ballIn} />
        <line x1={WX + R + 30} y1={WY} x2={WX + R + 30 + 120 * label} y2={WY} stroke="#FFFFFF" strokeWidth={4} opacity={label} />
      </svg>

      <Box x={1640} y={WY} w={480} h={260} style={{ opacity: label, transform: `translateX(${(1 - label) * 60}px)` }}>
        <div id="edge-card-6-v3b4" style={{ background: "#FFFFFF", width: 460, height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Text id="edge-frac-6-n5m6" text="1 / 37" width={420} height={100} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000" }} />
          <Text id="edge-pct-6-q7w8" text="= 2,7 %" width={420} height={120} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#1E9E5A" }} />
        </div>
      </Box>

      <Box x={960} y={80} w={1200} h={120} style={{ opacity: prog(frame, 8, 10) * (1 - spinsIn) }}>
        <Text id="title-casino-6-e9r0" text="LE CASINO" width={900} height={120} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
      </Box>
      <Box x={960} y={80} w={1200} h={120} style={{ opacity: spinsIn }}>
        <Text id="spins-6-t1y2" text={fmt(spins) + " tours"} width={1100} height={120} textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
      </Box>

      <div style={{ position: "absolute", left: 180, top: 0, width: 220, height: 1080, opacity: spinsIn }}>
        {Array.from({ length: chips }).map((_, i) => (
          <div key={i} id={`chip-6-${i}`} style={{ position: "absolute", left: 0, top: 960 - i * 44, width: 220, height: 64, borderRadius: "50%", background: i % 2 === 0 ? GOLD : "#FFFFFF", border: "6px solid #121212", boxSizing: "border-box" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default Scene6;
