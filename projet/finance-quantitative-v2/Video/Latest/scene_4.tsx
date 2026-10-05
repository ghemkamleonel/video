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
const RED = "#E5534B";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// Chart geometry
const CX0 = 260;
const CX1 = 1500;
const CY0 = 220;
const CY1 = 900;
const VMIN = -250;
const VMAX = 400;
const N = 10000;
const STEPS = 200;
const xOf = (n: number) => CX0 + (n / N) * (CX1 - CX0);
const yOf = (v: number) => CY1 - ((v - VMIN) / (VMAX - VMIN)) * (CY1 - CY0);

const buildWalk = (rnd: SeededRandomFn) => {
  const pts: number[] = [0];
  let v = 0;
  for (let i = 1; i <= STEPS; i++) {
    const u1 = Math.max(1e-6, rnd("w4-a", i));
    const u2 = rnd("w4-b", i);
    const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    v += 0.75 + g * 7.07;
    pts.push(v);
  }
  const fix = 150 - pts[STEPS];
  return pts.map((p, i) => p + (fix * i) / STEPS);
};

const Scene4: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // PHASE 1: one bet
  const p1In = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  const p1Out = prog(frame, 94, 12);
  const flip = frame * 0.4;
  const sy = Math.max(0.05, Math.abs(Math.cos(flip)));
  const resultIdx = Math.floor(frame / 14);
  const win = seededRandom("r4", resultIdx) > 0.5;
  const caption = prog(frame, 70, 8);

  // PHASE 2: chart
  const chartIn = prog(frame, 97, 14);
  const draw = interpolate(frame, [116, 195], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const walk = buildWalk(seededRandom);
  const shown = Math.max(1, Math.floor(draw * STEPS));
  const path = walk.slice(0, shown + 1).map((v, i) => `${i === 0 ? "M" : "L"} ${xOf((i / STEPS) * N).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
  const tip = walk[shown];
  const counter = Math.round(draw * N);
  const endLabel = prog(frame, 193, 8);

  // PHASE 3: luck band + bell
  const band = prog(frame, 201, 16);
  const bandPts: string[] = [];
  const bandLow: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const n = (i / 50) * N;
    bandPts.push(`${xOf(n).toFixed(1)},${yOf(0.015 * n + Math.sqrt(n)).toFixed(1)}`);
    bandLow.unshift(`${xOf(n).toFixed(1)},${yOf(0.015 * n - Math.sqrt(n)).toFixed(1)}`);
  }
  const bell = prog(frame, 216, 14);
  const BX = 1540;
  const bellOuter: string[] = [];
  const bellRed: string[] = [`${BX},${yOf(VMIN)}`];
  for (let v = VMIN; v <= VMAX; v += 10) {
    const d = Math.exp(-((v - 150) ** 2) / (2 * 100 * 100));
    const x = BX + d * 240 * bell;
    bellOuter.push(`${x.toFixed(1)},${yOf(v).toFixed(1)}`);
    if (v <= 0) bellRed.push(`${x.toFixed(1)},${yOf(v).toFixed(1)}`);
  }
  bellRed.push(`${BX},${yOf(0)}`);
  const riskLabel = prog(frame, 222, 10);
  const pulse = 0.6 + 0.4 * Math.sin(frame * 0.3);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const x = ((i * 90 - frame * 1.5) % 2160 + 2160) % 2160 - 120;
          return <line key={i} x1={x} y1={0} x2={x} y2={1080} stroke="#FFFFFF" strokeOpacity={0.05} strokeWidth={2} />;
        })}
      </svg>

      {/* PHASE 1 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: p1In * (1 - p1Out), transform: `scale(${1 - p1Out * 0.5})` }}>
        <Box x={960} y={470} w={480} h={480}>
          <svg id="coin-one-4-q2w3" width={480} height={480} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
            <ellipse cx={100} cy={106} rx={98} ry={98 * sy} fill="#8C6A12" />
            <g transform={`translate(100 100) scale(1 ${sy}) translate(-100 -100)`}>
              <circle cx={100} cy={100} r={98} fill={GOLD} />
              <circle cx={100} cy={100} r={82} fill="none" stroke="#8C6A12" strokeWidth={6} />
            </g>
          </svg>
        </Box>
        <Box x={960} y={470} w={300} h={160}>
          <Text id="coin-result-4-e5r6" text={win ? "+1 €" : "-1 €"} width={300} height={160} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000", opacity: sy > 0.6 ? 1 : 0 }} />
        </Box>
        <Box x={960} y={900} w={1300} h={140} style={{ opacity: caption }}>
          <div style={{ background: "#FFFFFF", padding: "0 30px", display: "flex" }}>
            <Text id="caption-invisible-4-t7y8" text="UN PARI : INVISIBLE" width={1200} height={130} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          </div>
        </Box>
      </div>

      {/* PHASE 2 + 3 */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: chartIn, transform: `scale(${1.15 - 0.15 * chartIn})` }}>
        <svg id="chart-4-u9i0" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={CX0} y1={CY0} x2={CX0} y2={CY1} stroke="#FFFFFF" strokeWidth={3} />
          <line x1={CX0} y1={CY1} x2={CX1} y2={CY1} stroke="#FFFFFF" strokeWidth={3} />
          <line x1={CX0} y1={yOf(0)} x2={BX + 250} y2={yOf(0)} stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
          <polygon points={[...bandPts, ...bandLow].join(" ")} fill={NAVY} opacity={0.55 * band} />
          <line x1={xOf(0)} y1={yOf(0)} x2={xOf(N * draw)} y2={yOf(150 * draw)} stroke={GOLD} strokeWidth={3} opacity={0.6} />
          <path d={path} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinejoin="round" />
          <circle cx={xOf(draw * N)} cy={yOf(tip)} r={12} fill={GOLD} />
          <polygon points={bellOuter.join(" ") + ` ${BX},${yOf(VMAX)} ${BX},${yOf(VMIN)}`} fill="#FFFFFF" opacity={0.18 * bell} />
          <polyline points={bellOuter.join(" ")} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={bell} />
          <polygon points={bellRed.join(" ")} fill={RED} opacity={bell * pulse} />
          <line x1={BX} y1={CY0} x2={BX} y2={CY1} stroke="#FFFFFF" strokeWidth={2} opacity={bell * 0.5} />
        </svg>
        <Box x={CX0 - 120} y={yOf(0)} w={150} h={60}>
          <Text id="zero-lbl-4-o1p2" text={"0 €"} width={150} height={60} textStyles={{ fontFamily: MONO, color: "#FFFFFF" }} />
        </Box>
        <Box x={(CX0 + CX1) / 2} y={CY1 + 60} w={500} h={70}>
          <Text id="x-lbl-4-a3s4" text="PARIS" width={500} height={70} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#FFFFFF" }} />
        </Box>
        <Box x={CX0 + 170} y={CY0 - 50} w={340} h={70}>
          <Text id="y-lbl-4-d5f6" text={"GAIN (€)"} width={340} height={70} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#FFFFFF" }} />
        </Box>
        <Box x={1300} y={130} w={700} h={140}>
          <Text id="counter-4-g7h8" text={counter.toLocaleString("fr-FR").replace(/ | /g, " ") + " paris"} width={700} height={130} textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
        </Box>
        <Box x={xOf(N) - 40} y={yOf(150) - 90} w={300} h={100} style={{ opacity: endLabel, transform: `scale(${0.6 + 0.4 * endLabel})` }}>
          <div style={{ background: GOLD, display: "flex", padding: "0 14px" }}>
            <Text id="end-lbl-4-j9k0" text={"+150 €"} width={270} height={90} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000" }} />
          </div>
        </Box>
        <Box x={1620} y={985} w={560} h={110} style={{ opacity: riskLabel }}>
          <div style={{ background: RED, display: "flex", padding: "0 14px" }}>
            <Text id="risk-lbl-4-l1z2" text="1 chance sur 15 de perdre" width={530} height={100} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
          </div>
        </Box>
      </div>
    </AbsoluteFill>
  );
};

export default Scene4;
