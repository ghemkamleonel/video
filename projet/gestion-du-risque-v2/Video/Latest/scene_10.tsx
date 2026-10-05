import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill, Easing } from "remotion";
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
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
const bump = (f: number, s: number, up: number, down: number) =>
  interpolate(f, [s, s + up, s + up + down], [0, 1, 0], CLAMP);

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// ---------- chart geometry ----------
const CX0 = 340;
const STEP = 162.5; // 8 intervals -> CX1 = 1640
const CX1 = CX0 + 8 * STEP;
const YB = 880; // value 0
const UNIT = 120; // px per billion
const YT = YB - 5 * UNIT; // value 5 -> 280
const X = (t: number) => CX0 + t * STEP;
const Y = (v: number) => YB - v * UNIT;

const MONTHS = ["JAN", "F\u00c9V", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AO\u00dbT", "SEPT"];
const ANCHORS = [4.7, 4.62, 4.68, 4.52, 4.28, 3.92, 3.7, 2.3, 0.1];
const SUB = 6;
const START_V = ANCHORS[0];

// camera pivot (the cliff, high enough to keep the top bracket clear of the title)
const PIVOT_X = 1400;
const PIVOT_Y = 320;

// bracket JUIN -> SEPT
const BR_X0 = X(5);
const BR_X1 = X(8);
const BR_Y = 250;

// left-side stack: tag above the counter
const TAG_CX = 800;
const TAG_CY = 548;
const TAG_W = 700;
const TAG_H = 176;
const CNT_CY = 762;

const T_TAG1 = "AO\u00dbT 1998 :";
const T_TAG2 = "LA RUSSIE NE PAIE PLUS";

const buildPoints = (rnd: SeededRandomFn) => {
  const pts: { t: number; v: number }[] = [];
  for (let m = 0; m < 8; m++) {
    const a = ANCHORS[m];
    const b = ANCHORS[m + 1];
    for (let s = 0; s < SUB; s++) {
      const u = s / SUB;
      const shape = m === 6 ? Math.pow(u, 1.7) : u; // August: a cliff, slow edge then a sheer drop
      const amp = m >= 6 ? 0.16 : 0.09;
      const noise = (rnd("l10-n", m * SUB + s) - 0.5) * amp * Math.sin(Math.PI * u);
      pts.push({ t: m + u, v: a + (b - a) * shape + noise });
    }
  }
  pts.push({ t: 8, v: ANCHORS[8] });
  return pts;
};

const valueAt = (pts: { t: number; v: number }[], t: number) => {
  if (t <= 0) return pts[0].v;
  if (t >= 8) return pts[pts.length - 1].v;
  const k = Math.floor(t * SUB);
  const p0 = pts[k];
  const p1 = pts[k + 1];
  const u = (t - p0.t) / (p1.t - p0.t);
  return p0.v + (p1.v - p0.v) * u;
};

const pathTo = (pts: { t: number; v: number }[], t0: number, t1: number) => {
  const out: string[] = [];
  out.push(`M ${X(t0).toFixed(1)} ${Y(valueAt(pts, t0)).toFixed(1)}`);
  for (const p of pts) {
    if (p.t > t0 && p.t < t1) out.push(`L ${X(p.t).toFixed(1)} ${Y(p.v).toFixed(1)}`);
  }
  out.push(`L ${X(t1).toFixed(1)} ${Y(valueAt(pts, t1)).toFixed(1)}`);
  return out.join(" ");
};

const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");

const Scene10: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const breathe = 0.5 + 0.5 * Math.sin(frame * 0.05);

  // ---------- intro: title, axes ----------
  const titleIn = prog(frame, -8, 18);
  const yearFlash = bump(frame, 38, 3, 14);
  const axes = prog(frame, -6, 22);
  const gridIn = prog(frame, 2, 24);

  // ---------- the line ----------
  const pts = buildPoints(seededRandom);
  const sag = interpolate(frame, [0, 60], [0.12, 6], { ...CLAMP, easing: Easing.bezier(0.3, 0, 0.45, 1) });
  const fall = interpolate(frame, [66, 100], [0, 2], { ...CLAMP, easing: Easing.bezier(0.4, 0, 0.75, 0.9) });
  const tipT = Math.min(8, sag + fall);
  const tipV = valueAt(pts, tipT);
  const linePath = pathTo(pts, 0, tipT);
  const areaPath = `${linePath} L ${X(tipT).toFixed(1)} ${YB} L ${X(0)} ${YB} Z`;
  const landed = bump(frame, 100, 2, 14);

  // ---------- counter (il a perdu 4,6 milliards) ----------
  const cntIn = prog(frame, 62, 10);
  const loss = Math.max(0, START_V - tipV);
  const lossTxt = frame >= 100 ? "-4,6" : "-" + fmt1(loss);
  const cntBar = Math.min(1, loss / 4.6);

  // ---------- bracket (moins de quatre mois) ----------
  const brDraw = prog(frame, 132, 14);
  const brTicks = prog(frame, 140, 8);
  const brLbl = prog(frame, 144, 9);
  const guides = prog(frame, 144, 12) * (1 - prog(frame, 190, 14));

  // ---------- coup de grace: camera push + glitch ----------
  const push = 1 + 0.06 * prog(frame, 168, 30) + 0.025 * interpolate(frame, [198, 300], [0, 1], CLAMP);
  const glitch = frame >= 182 && frame <= 190 ? 1 - (frame - 182) / 8 : 0;
  const shakeX = glitch * 9 * Math.sin(frame * 2.7);
  const shakeY = glitch * 5 * Math.cos(frame * 3.1);

  // ---------- en aout: red segment, desaturation, tag ----------
  const redDraw = interpolate(frame, [201, 210], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const redGlow = prog(frame, 203, 10) * (0.75 + 0.25 * Math.sin(frame * 0.18));
  const augLbl = prog(frame, 205, 8);
  const desat = interpolate(frame, [205, 214, 246, 272], [0, 1, 1, 0], CLAMP);
  const tagIn = prog(frame, 207, 12);
  const conn = prog(frame, 213, 12);
  const russiaFlash = bump(frame, 223, 3, 12);

  const segMidT = 6.55;
  const segMidX = X(segMidT);
  const segMidY = Y(valueAt(pts, segMidT));
  const tagRight = TAG_CX + TAG_W / 2;

  const chartFilter = `grayscale(${desat}) brightness(${1 - 0.3 * desat})`;

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {/* ===== Breathing background ===== */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, filter: chartFilter }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(ellipse at 62% 46%, rgba(46,79,112,${0.32 + 0.12 * breathe}) 0%, rgba(18,18,18,0) ${48 + 10 * breathe}%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, #000000 100%)` }} />
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 18 }).map((_, i) => {
            const x = ((i * 120 - frame * 0.7) % 2160 + 2160) % 2160 - 120;
            return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={1080} stroke="#FFFFFF" strokeOpacity={0.035 + 0.035 * breathe} strokeWidth={2} />;
          })}
          {Array.from({ length: 11 }).map((_, j) => {
            const y = ((j * 120 + frame * 0.45) % 1320) - 120;
            return <line key={`h${j}`} x1={0} y1={y} x2={1920} y2={y} stroke="#FFFFFF" strokeOpacity={0.035 + 0.035 * breathe} strokeWidth={2} />;
          })}
          {Array.from({ length: 18 }).map((_, i) => {
            const size = 18 + seededRandom("px10-z", i) * 26;
            const speed = 0.7 + seededRandom("px10-s", i) * 1.4;
            const x = 40 + seededRandom("px10-x", i) * 1820;
            const y = ((seededRandom("px10-y", i) * 1240 + frame * speed) % 1240) - 100;
            const op = 0.05 + 0.08 * seededRandom("px10-o", i);
            const col = i % 3 === 0 ? GOLD : i % 3 === 1 ? NAVY : "#FFFFFF";
            return <rect key={`p${i}`} x={x} y={y} width={size} height={size} fill={col} opacity={op * 1.6} />;
          })}
        </svg>
      </div>

      {/* ===== Title ===== */}
      <div style={{ position: "absolute", left: 0, top: 38, width: 1920, height: 100, display: "flex", justifyContent: "center", alignItems: "center", gap: 26, opacity: 0.35 + 0.65 * titleIn, transform: `translateY(${-24 * (1 - titleIn)}px)` }}>
        <div style={{ width: 1000, height: 100, display: "flex" }}>
          <Text id="title-capital-10-q1w2" text={"CAPITAL DE LTCM \u2013"} width={1000} height={100} align="right" textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.01em" }} />
        </div>
        <div style={{ width: 300, height: 100, display: "flex", transform: `scale(${1 + 0.12 * yearFlash})`, transformOrigin: "20% 50%" }}>
          <Text id="title-year-10-e3r4" text="1998" width={300} height={100} align="left" typing={{ startFrame: 10, endFrame: 38, showCursor: false }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: GOLD, textShadow: `0 0 ${30 * yearFlash}px rgba(242,201,76,0.9)` }} />
        </div>
      </div>

      {/* ===== Camera (chart world) ===== */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${shakeX}px, ${shakeY}px) scale(${push})`, transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px` }}>
        {/* ---- chart layer (drains to grey on 'en aout') ---- */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, filter: chartFilter }}>
          <svg id="chart-ltcm-10-t5y6" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="area-grad-10" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {/* horizontal grid */}
            {[1, 2, 3, 4, 5].map((v) => (
              <line key={v} x1={CX0} y1={Y(v)} x2={CX0 + (CX1 - CX0) * gridIn} y2={Y(v)} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
            ))}
            {/* month ticks */}
            {MONTHS.map((_, i) => (
              <line key={i} x1={X(i)} y1={YB} x2={X(i)} y2={YB + 14 * axes} stroke="#FFFFFF" strokeWidth={3} />
            ))}
            {/* guides for the 4-month span */}
            <line x1={BR_X0} y1={BR_Y + 26} x2={BR_X0} y2={YB} stroke="#FFFFFF" strokeOpacity={0.35 * guides} strokeWidth={2} />
            <line x1={BR_X1} y1={BR_Y + 26} x2={BR_X1} y2={YB} stroke="#FFFFFF" strokeOpacity={0.35 * guides} strokeWidth={2} />
            {/* area + line */}
            <path d={areaPath} fill="url(#area-grad-10)" />
            {glitch > 0 && (
              <g>
                <path d={linePath} fill="none" stroke="#FF2A55" strokeWidth={7} strokeOpacity={0.7 * glitch} transform="translate(12 0)" strokeLinejoin="round" />
                <path d={linePath} fill="none" stroke="#2AE8FF" strokeWidth={7} strokeOpacity={0.7 * glitch} transform="translate(-12 0)" strokeLinejoin="round" />
              </g>
            )}
            <path d={linePath} fill="none" stroke={GOLD} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
            {/* axes */}
            <line x1={CX0} y1={YB} x2={CX0} y2={YB - (YB - YT + 20) * axes} stroke="#FFFFFF" strokeWidth={4} />
            <line x1={CX0} y1={YB} x2={CX0 + (CX1 - CX0 + 40) * axes} y2={YB} stroke="#FFFFFF" strokeWidth={4} />
            {/* tip */}
            <circle cx={X(tipT)} cy={Y(tipV)} r={26 + 8 * Math.sin(frame * 0.25) + 26 * landed} fill={GOLD} opacity={0.18 + 0.3 * landed} />
            <circle cx={X(tipT)} cy={Y(tipV)} r={13} fill={GOLD} />
            {/* bracket JUIN -> SEPT */}
            <g opacity={brDraw > 0 ? 1 : 0}>
              <line x1={(BR_X0 + BR_X1) / 2 - ((BR_X1 - BR_X0) / 2) * brDraw} y1={BR_Y} x2={(BR_X0 + BR_X1) / 2 + ((BR_X1 - BR_X0) / 2) * brDraw} y2={BR_Y} stroke="#FFFFFF" strokeWidth={4} />
              <line x1={BR_X0} y1={BR_Y - 2} x2={BR_X0} y2={BR_Y + 26 * brTicks} stroke="#FFFFFF" strokeWidth={4} />
              <line x1={BR_X1} y1={BR_Y - 2} x2={BR_X1} y2={BR_Y + 26 * brTicks} stroke="#FFFFFF" strokeWidth={4} />
            </g>
          </svg>

          {/* y axis numbers */}
          {[0, 1, 2, 3, 4, 5].map((v, i) => (
            <Box key={v} x={CX0 - 95} y={Y(v)} w={150} h={60} style={{ opacity: prog(frame, 2 + i * 2, 12) }}>
              <Text id={`ytick-${v}-10-u7i8`} text={String(v)} width={150} height={60} align="right" textStyles={{ fontFamily: MONO, fontWeight: 500, color: "#FFFFFF" }} />
            </Box>
          ))}
          <Box x={CX0 + 200} y={YT - 62} w={440} h={60} style={{ opacity: prog(frame, 6, 12) }}>
            <Text id="yunit-10-o9p0" text="EN MILLIARDS DE $" width={440} height={60} align="left" textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#8A8A8A", letterSpacing: "0.02em" }} />
          </Box>

          {/* month labels: light up as the line reaches them */}
          {MONTHS.map((m, i) => (
            <Box key={m} x={X(i)} y={YB + 52} w={160} h={70} style={{ opacity: (0.4 + 0.6 * interpolate(tipT, [i - 0.4, i], [0, 1], CLAMP)) * prog(frame, i * 1.5, 10) * (i === 7 ? 1 - augLbl : 1) }}>
              <Text id={`month-${i}-10-a1s2`} text={m} width={160} height={70} sizeGroup={{ texts: MONTHS }} textStyles={{ fontFamily: JOST, fontWeight: 700, color: "#FFFFFF" }} />
            </Box>
          ))}

          {/* bracket label */}
          <Box x={(BR_X0 + BR_X1) / 2} y={BR_Y - 50} w={320} h={76} style={{ opacity: brLbl, transform: `translateY(${18 * (1 - brLbl)}px)` }}>
            <div style={{ background: "#FFFFFF", display: "flex", padding: "0 18px" }}>
              <Text id="bracket-lbl-10-d3f4" text="< 4 MOIS" width={280} height={76} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
            </div>
          </Box>
        </div>

        {/* ---- red layer (keeps its colour) ---- */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {redDraw > 0 && (
            <g style={{ filter: `drop-shadow(0 0 ${8 + 18 * redGlow}px rgba(229,83,75,0.95))` }}>
              <path d={pathTo(pts, 6, 6 + redDraw)} fill="none" stroke={RED} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )}
          {/* connector tag -> August segment */}
          <line x1={tagRight} y1={TAG_CY} x2={tagRight + (segMidX - tagRight) * conn} y2={TAG_CY + (segMidY - TAG_CY) * conn} stroke={RED} strokeWidth={4} opacity={conn > 0 ? 1 : 0} />
          <circle cx={segMidX} cy={segMidY} r={14 * prog(frame, 222, 6)} fill="#FFFFFF" />
        </svg>

        {/* AOUT month label turns into a red chip */}
        <Box x={X(7)} y={YB + 52} w={170} h={70} style={{ opacity: augLbl, transform: `scale(${0.8 + 0.2 * augLbl})` }}>
          <div style={{ background: RED, display: "flex" }}>
            <Text id="month-aout-red-10-g5h6" text={"AO\u00dbT"} width={160} height={70} sizeGroup={{ texts: MONTHS }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
          </div>
        </Box>

        {/* tag: AOUT 1998 : LA RUSSIE NE PAIE PLUS */}
        <Box x={TAG_CX} y={TAG_CY} w={TAG_W} h={TAG_H} style={{ opacity: tagIn, transform: `translateX(${-70 * (1 - tagIn)}px)` }}>
          <div id="tag-russie-10-j7k8" style={{ width: TAG_W, height: TAG_H, background: RED, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${40 * russiaFlash}px rgba(229,83,75,0.9)` }}>
            <Text id="tag-line1-10-l9z1" text={T_TAG1} width={640} height={78} sizeGroup={{ texts: [T_TAG1, T_TAG2] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
            <Text id="tag-line2-10-x2c3" text={T_TAG2} width={640} height={78} sizeGroup={{ texts: [T_TAG1, T_TAG2] }} typing={{ startFrame: 221, endFrame: 248, showCursor: false }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
          </div>
        </Box>

        {/* counter -4,6 MILLIARDS $ */}
        <div style={{ position: "absolute", left: 0, top: CNT_CY - 100, width: 1600, height: 200, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, opacity: cntIn, transform: `scale(${(0.86 + 0.14 * cntIn) * (1 + 0.07 * landed)})`, transformOrigin: `${TAG_CX}px 100px` }}>
          <div style={{ width: 390, height: 190, display: "flex", position: "relative" }}>
            <Text id="counter-val-10-v4b5" text={lossTxt} width={390} height={190} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: RED, textShadow: `0 0 ${36 * landed}px rgba(229,83,75,0.9)` }} />
          </div>
          <div style={{ width: 520, height: 190, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Text id="counter-unit-10-n6m7" text="MILLIARDS $" width={520} height={100} align="left" textStyles={{ fontFamily: JOST, fontWeight: 900, color: RED }} />
            <div style={{ width: 500 * cntBar, height: 10, background: RED, marginLeft: 8 }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene10;
