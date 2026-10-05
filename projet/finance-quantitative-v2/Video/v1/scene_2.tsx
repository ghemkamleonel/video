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
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const ORBIT = ["0,5075", "σ", "Σ", "1988", "66 %", "μ", "√n", "Δ", "P(x)", "2018", "π", "e^x"];
const NAME = "MEDALLION";

const Scene2: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const land = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 28 });
  const medalScale = interpolate(land, [0, 1], [0.25, 1]);
  const medalSpin = (1 - land) * 540;

  const letters = Math.floor(interpolate(frame, [31, 50], [0, NAME.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const glint = interpolate(frame, [36, 70], [-300, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const pull = prog(frame, 96, 16);
  const groupScale = 1 - 0.2 * pull;
  const groupY = -95 * pull;
  const plaque = prog(frame, 103, 12);

  const D = 560;

  const orbit = ORBIT.map((t, i) => {
    const ring = i % 2 === 0 ? 420 : 500;
    const a = (i / ORBIT.length) * Math.PI * 2 + frame * (i % 2 === 0 ? 0.012 : -0.009);
    const x = 960 + Math.cos(a) * ring * 1.35;
    const y = 540 + Math.sin(a) * ring * 0.9;
    return (
      <Box key={i} x={x} y={y} w={200} h={70} style={{ opacity: 0.45 }}>
        <Text id={`orbit-2-${i}`} text={t} width={200} height={70} textStyles={{ fontFamily: MONO, fontWeight: 500, color: i % 3 === 0 ? GOLD : "#FFFFFF" }} />
      </Box>
    );
  });

  const lattice = [];
  for (let i = -6; i <= 6; i++) {
    lattice.push(<line key={`a${i}`} x1={-1400} y1={i * 180} x2={1400} y2={i * 180} stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={2} />);
    lattice.push(<line key={`b${i}`} x1={i * 180} y1={-1400} x2={i * 180} y2={1400} stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={2} />);
  }

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1B3550 0%, #0B1622 70%)", overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`translate(960 540) rotate(${frame * 0.15 + 20})`}>{lattice}</g>
      </svg>
      {orbit}

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `translateY(${groupY}px) scale(${groupScale})` }}>
        {/* Ribbon */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: land }}>
          <polygon points="800,0 900,0 960,250 900,250" fill={NAVY} />
          <polygon points="1120,0 1020,0 960,250 1020,250" fill={GOLD} />
        </svg>
        <Box x={960} y={540} w={D} h={D} style={{ transform: `scale(${medalScale}) rotateY(${medalSpin}deg)` }}>
          <svg id="medal-2-h7j3" width={D} height={D} viewBox="0 0 200 200" style={{ overflow: "visible", filter: "drop-shadow(0 0 40px rgba(242,201,76,0.35))" }}>
            <defs>
              <radialGradient id="bronze2" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#E7B46A" />
                <stop offset="60%" stopColor="#B07A3A" />
                <stop offset="100%" stopColor="#6E4519" />
              </radialGradient>
              <clipPath id="medalclip2"><circle cx={100} cy={100} r={98} /></clipPath>
              <path id="rim2" d="M 100 100 m -74 0 a 74 74 0 1 1 148 0 a 74 74 0 1 1 -148 0" />
            </defs>
            <circle cx={100} cy={100} r={98} fill="url(#bronze2)" stroke="#5A3810" strokeWidth={3} />
            <circle cx={100} cy={100} r={62} fill="none" stroke="#5A3810" strokeWidth={3} />
            <polyline points="62,122 78,110 90,114 104,90 118,98 140,70" fill="none" stroke="#4A2C0A" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
            <text fontFamily={JOST} fontWeight={900} fontSize={22} fill="#4A2C0A" letterSpacing={6}>
              <textPath href="#rim2" startOffset="2%">{NAME.slice(0, letters)}</textPath>
            </text>
            <g clipPath="url(#medalclip2)">
              <rect x={glint * 0.4} y={-40} width={30} height={280} fill="#FFFFFF" opacity={0.35} transform="rotate(25 100 100)" />
            </g>
          </svg>
        </Box>
        <Box x={960} y={540 + D / 2 + 30} w={900} h={120} style={{ opacity: prog(frame, 31, 8) * (1 - plaque) }}>
          <Text id="name-medallion-2-d3f5" text="MEDALLION" width={900} height={120} textStyles={{ fontFamily: JOST, fontWeight: 900, color: GOLD }} />
        </Box>
      </div>

      <Box x={960} y={960} w={1500} h={150} style={{ opacity: plaque, transform: `translateY(${(1 - plaque) * 60}px)` }}>
        <div id="plaque-2-w2e8" style={{ background: "#FFFFFF", padding: "0 40px", display: "flex" }}>
          <Text id="plaque-text-2-g4k6" text={"JIM SIMONS -- MATHÉMATICIEN"} width={1400} height={140} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene2;
