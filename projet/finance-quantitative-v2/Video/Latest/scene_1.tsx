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

const BG_EQUATIONS = ["E[X] = Σ p x", "σ = √n", "P(A|B)", "∫ f(x) dx", "μ + 2σ", "N(0,1)", "Δt", "log(1+r)"];
const TICKER = "AAPL +1.2   IBM -0.4   XOM +0.8   GE -1.1   KO +0.3   GM -0.7   ";

const Scene1: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PHASE 1: phone + ticker, drain to grey on 'traders' (44) then exit
  const phoneIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  const ring = frame < 40 ? Math.sin(frame * 1.6) * 6 : 0;
  const grey = prog(frame, 40, 14);
  const exit = prog(frame, 56, 18);
  const p1Opacity = 1 - exit;

  // PHASE 2: chalkboard swings in on 'mathematiciens' (79)
  const boardIn = prog(frame, 70, 20);
  const boardRot = (1 - boardIn) * 70;
  const eq1 = prog(frame, 82, 14);
  const eq2 = prog(frame, 90, 14);
  const curve = prog(frame, 94, 18);

  // PHASE 3: compress into scoreboard on 'trompaient' (111)
  const morph = prog(frame, 108, 12);
  const boardScaleY = 1 - morph * 0.35;
  const n = Math.round(interpolate(frame, [118, 160], [0, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const wins = Math.round(n * 0.507);
  const losses = n - wins;

  const bgEq = BG_EQUATIONS.map((t, i) => {
    const x = 120 + seededRandom("b1-x", i) * 1680;
    const y = ((seededRandom("b1-y", i) * 1300 - frame * 1.4) % 1300 + 1300) % 1300 - 110;
    return (
      <Box key={i} x={x} y={y} w={340} h={80} style={{ opacity: 0.12 }}>
        <Text id={`bg-eq-1-${i}`} text={t} width={340} height={80} textStyles={{ fontFamily: MONO, color: "#FFFFFF" }} />
      </Box>
    );
  });

  const bellPath = Array.from({ length: 61 }).map((_, i) => {
    const x = -3 + (i / 60) * 6;
    const y = Math.exp(-x * x / 2);
    return `${i === 0 ? "M" : "L"} ${1080 + i * 7} ${520 - y * 200}`;
  }).join(" ");

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {bgEq}

      {/* PHASE 1 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: p1Opacity, transform: `translateX(${-exit * 900}px)`, filter: `grayscale(${grey})` }}>
        <Box x={960} y={470} w={620} h={520} style={{ transform: `scale(${0.7 + 0.3 * phoneIn}) rotate(${ring}deg)` }}>
          <svg id="phone-1-k3d8" width={620} height={520} viewBox="0 0 620 520">
            <path d="M 110 200 Q 310 90 510 200 L 560 470 L 60 470 Z" fill="#B23A2E" stroke="#000000" strokeWidth={8} />
            <rect x={70} y={60} width={480} height={110} rx={55} fill="#7E241C" stroke="#000000" strokeWidth={8} />
            <circle cx={310} cy={330} r={95} fill="#E5E5E5" stroke="#000000" strokeWidth={8} />
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return <circle key={i} cx={310 + Math.cos(a) * 62} cy={330 + Math.sin(a) * 62} r={14} fill="#121212" />;
            })}
          </svg>
        </Box>
        <div style={{ position: "absolute", left: 0, top: 820, width: 1920, height: 130, background: GOLD, display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div style={{ display: "flex", transform: `translateX(${-frame * 14}px)` }}>
            {[0, 1, 2].map((k) => (
              <Text key={k} id={`ticker-1-${k}`} text={TICKER} width={1500} height={110} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000" }} />
            ))}
          </div>
        </div>
        <Box x={960} y={120} w={1100} h={140}>
          <Text id="title-traders-1-p2v7" text="PAS DES TRADERS" width={1100} height={140} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
        </Box>
      </div>

      {/* PHASE 2 + 3 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, perspective: 1600, opacity: boardIn }}>
        <Box x={960} y={540} w={1500} h={820} style={{ transform: `translateX(${(1 - boardIn) * 700}px) rotateY(${-boardRot}deg) scaleY(${boardScaleY})` }}>
          <div id="board-1-c9w2" style={{ width: 1500, height: 820, background: "#1C2B24", border: "16px solid #443832", position: "relative", boxSizing: "border-box" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 1468, height: 788, opacity: 1 - morph }}>
              <Box x={734} y={110} w={1300} h={150}>
                <Text id="title-math-1-m4n1" text={"MATHÉMATICIENS"} width={1300} height={150} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
              </Box>
              <Box x={380} y={360} w={640} h={110}>
                <Text id="eq1-1-r8s3" text="P(gain) = 0,5075" width={640} height={110} typing={{ startFrame: 82, endFrame: 96, showCursor: false }} textStyles={{ fontFamily: MONO, color: "#FFFFFF" }} />
              </Box>
              <Box x={380} y={540} w={640} h={110} style={{ opacity: eq2 > 0 ? 1 : 0 }}>
                <Text id="eq2-1-t5u6" text={"Σ gains = n × 0,015"} width={640} height={110} typing={{ startFrame: 90, endFrame: 106, showCursor: false }} textStyles={{ fontFamily: MONO, color: "#FFFFFF" }} />
              </Box>
              <svg width={1468} height={788} style={{ position: "absolute", left: 0, top: 0 }}>
                <path d={bellPath} fill="none" stroke={GOLD} strokeWidth={8} strokeDasharray={1200} strokeDashoffset={1200 * (1 - curve)} />
                <line x1={1080} y1={530} x2={1500} y2={530} stroke="#FFFFFF" strokeWidth={4} opacity={eq1} />
              </svg>
            </div>
          </div>
        </Box>

        {/* Scoreboard */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, display: "flex", alignItems: "center", justifyContent: "center", gap: 80, opacity: morph }}>
          {[{ label: "GAGNÉ", val: wins, color: GOLD }, { label: "PERDU", val: losses, color: "#FFFFFF" }].map((col, i) => (
            <div key={i} style={{ width: 600, height: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ background: col.color, width: 600, display: "flex", justifyContent: "center" }}>
                <Text id={`score-label-1-${i}`} text={col.label} width={560} height={120} sizeGroup={{ texts: ["GAGNÉ", "PERDU"] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
              </div>
              <Text id={`score-val-1-${i}`} text={String(col.val)} width={560} height={230} sizeGroup={{ texts: ["000"] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: col.color }} />
              <div style={{ width: 560, height: 60, background: "#2A2A2A", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: 60, width: (col.val / 520) * 560, background: i === 0 ? GOLD : NAVY }} />
              </div>
            </div>
          ))}
        </div>
        <Box x={960} y={950} w={1200} h={110} style={{ opacity: prog(frame, 135, 10) }}>
          <Text id="caption-half-1-y6z2" text="presque une fois sur deux" width={1200} height={110} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#FFFFFF" }} />
        </Box>
      </div>
    </AbsoluteFill>
  );
};

export default Scene1;
