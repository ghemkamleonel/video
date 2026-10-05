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

const PATTERN = [
  { o: 0, c: 60 }, { o: 50, c: 120 }, { o: 110, c: 190 }, { o: 180, c: 150 }, { o: 150, c: 230 }, { o: 220, c: 300 }, { o: 290, c: 360 },
];
const BEAMS = [
  [0, 0], [960, 0], [1920, 0], [1920, 540], [1920, 1080], [960, 1080], [0, 1080], [0, 540],
];

const Scene8: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PHASE 1
  const pIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  const beams = prog(frame, 52, 14);
  const fade = prog(frame, 64, 22);
  const p1Out = prog(frame, 84, 8);

  // PHASE 2
  const p2 = prog(frame, 86, 10);
  const lensX = interpolate(frame, [92, 140], [260, 1500], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const LENS_Y = 560;
  const NEW_PATTERN_X = 1380;
  const revealed = Math.max(0, Math.min(1, 1 - Math.abs(lensX - NEW_PATTERN_X) / 160)) + (lensX > NEW_PATTERN_X ? 1 : 0);
  const glow = Math.min(1, revealed);

  const chartPts = Array.from({ length: 97 }).map((_, i) => {
    const x = 40 + i * 19;
    const y = LENS_Y + Math.sin(i * 0.31) * 60 + Math.sin(i * 0.9) * 30 + (seededRandom("l8", i) - 0.5) * 50;
    return `${x},${y.toFixed(1)}`;
  }).join(" ");

  const CW = 110;
  const startX = 960 - (PATTERN.length * CW) / 2 + CW / 2;

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 80 + seededRandom("d8-x", i) * 1760;
        const y = ((seededRandom("d8-y", i) * 1200 - frame * 2) % 1200 + 1200) % 1200 - 60;
        return (
          <Box key={i} x={x} y={y} w={160} h={60} style={{ opacity: 0.1 }}>
            <Text id={`bg-num-8-${i}`} text={(seededRandom("d8-n", i) * 100).toFixed(2)} width={160} height={60} textStyles={{ fontFamily: MONO, color: "#FFFFFF" }} />
          </Box>
        );
      })}

      {/* PHASE 1 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: pIn * (1 - p1Out) }}>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {BEAMS.map(([bx, by], i) => {
            const ex = bx + (960 - bx) * beams;
            const ey = by + (540 - by) * beams;
            return <line key={i} x1={bx} y1={by} x2={ex} y2={ey} stroke={i % 2 === 0 ? GOLD : "#FFFFFF"} strokeWidth={6} opacity={0.7 * beams} />;
          })}
        </svg>
        <div id="pattern-8-q1w2" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, filter: `grayscale(${fade})`, opacity: 1 - fade * 0.85, transform: `scale(${1 + 0.05 * Math.sin(frame * 0.2) * (1 - fade)}, ${1 - 0.92 * fade})`, transformOrigin: "960px 540px" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            <rect x={startX - CW / 2 - 40} y={540 - 280} width={PATTERN.length * CW + 80} height={560} fill="none" stroke={GOLD} strokeWidth={8} />
            {PATTERN.map((c, i) => {
              const x = startX + i * CW;
              const top = 540 + 190 - Math.max(c.o, c.c);
              const h = Math.abs(c.c - c.o);
              const up = c.c > c.o;
              return (
                <g key={i}>
                  <line x1={x} y1={top - 30} x2={x} y2={top + h + 30} stroke="#FFFFFF" strokeWidth={5} />
                  <rect x={x - 32} y={top} width={64} height={Math.max(h, 12)} fill={up ? GOLD : NAVY} />
                </g>
              );
            })}
          </svg>
        </div>
        <Box x={960} y={950} w={1300} h={120} style={{ opacity: prog(frame, 29, 8) }}>
          <Text id="cap-efface-8-e3r4" text={"découverte = effacée"} width={1100} height={120} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
        </Box>
      </div>

      {/* PHASE 2 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: p2 }}>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline points={chartPts} fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={4} />
          <g opacity={glow}>
            <rect x={NEW_PATTERN_X - 70} y={LENS_Y - 130} width={140} height={260} fill="none" stroke={GOLD} strokeWidth={6} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={NEW_PATTERN_X - 50 + k * 38} y={LENS_Y + 60 - k * 45} width={24} height={60} fill={GOLD} />
            ))}
          </g>
          <g id="lens-8-t5y6" transform={`translate(${lensX} ${LENS_Y})`}>
            <circle r={170} fill="rgba(242,201,76,0.08)" stroke="#FFFFFF" strokeWidth={14} />
            <rect x={110} y={110} width={46} height={190} fill="#FFFFFF" transform="rotate(-45 133 205)" />
            <circle r={205} fill="none" stroke={GOLD} strokeWidth={6} strokeDasharray="320 968" transform={`rotate(${frame * 9})`} />
          </g>
        </svg>
        <Box x={960} y={130} w={1500} h={140}>
          <Text id="cap-search-8-u7i8" text={"LA RECHERCHE NE S'ARRÊTE JAMAIS"} width={1500} height={130} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
        </Box>
      </div>
    </AbsoluteFill>
  );
};

export default Scene8;
