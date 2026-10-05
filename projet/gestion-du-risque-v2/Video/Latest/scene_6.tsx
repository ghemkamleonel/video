import React from "react";
import { useCurrentFrame, interpolate, interpolateColors, AbsoluteFill, Easing } from "remotion";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

type ArrowProps = { id: string; startX: number; startY: number; endX: number; endY: number; curveX?: number; curveY?: number; progress?: number; color?: string; strokeWidth?: number; dashed?: boolean; arrowLen?: number; arrowWidth?: number; };
type TextProps = { id: string; text: string; width: number; height: number; multiline?: boolean; padding?: number; lineHeight?: number; minSize?: number; maxSize?: number; className?: string; textStyles?: React.CSSProperties; align?: "left" | "center" | "right" | "justify"; typing?: { startFrame: number; endFrame: number; showCursor?: boolean; cursorChar?: string; cursorBlinkRate?: number; }; sizeGroup?: { texts: string[]; pickFontSize?: "min" | "max"; }; };
type SeededRandomFn = (seed: string, n: number) => number;

const { fontFamily: JOST } = loadJost("normal", { weights: ["400", "700", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });

const GOLD = "#F2C94C";
const GOLD_L = "#FFE596";
const RED = "#E5534B";
const GREY = "#8A8A8A";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SINE = Easing.inOut(Easing.sin);
const CUBIC = Easing.inOut(Easing.cubic);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
const progE = (f: number, s: number, d: number, e: (t: number) => number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const bump = (f: number, s: number, up: number, down: number) =>
  interpolate(f, [s, s + up, s + up + down], [0, 1, 0], CLAMP);

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// ---------- growth model : Kelly, 60 / 40 coin ----------
const gOf = (f: number) => 0.6 * Math.log(1 + f) + 0.4 * Math.log(1 - f);
const Yv = (f: number) => Math.asinh(gOf(f) / 0.01); // smooth display compression (no numeric y ticks)

// ---------- chart geometry ----------
const X0 = 300; // 0 %
const XS = 2400; // px per unit share (60 % -> 1740)
const xOf = (f: number) => X0 + f * XS;
const Y_TOP = 1.45;
const Y_BOT = -2.83;
const PY0 = 200;
const PY1 = 840;
const KY = (PY1 - PY0) / (Y_TOP - Y_BOT);
const yOf = (f: number) => PY0 + (Y_TOP - Yv(f)) * KY;
const ZERO_Y = PY0 + Y_TOP * KY;
const AX_Y = 860;
const PLOT_TOP = 160;
const X_END = 1760;
const F0 = (() => {
  let a = 0.3;
  let b = 0.5;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (gOf(m) > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
})(); // ~0.389
const XF0 = xOf(F0);
const XPK = xOf(0.2);
const YPK = yOf(0.2);

const curveD = (a: number, b: number) => {
  if (b <= a + 0.0005) return "";
  const n = Math.max(2, Math.ceil((b - a) * 320));
  const arr: string[] = [];
  for (let i = 0; i <= n; i++) {
    const f = a + ((b - a) * i) / n;
    arr.push(`${xOf(f).toFixed(1)} ${yOf(f).toFixed(1)}`);
  }
  return "M " + arr.join(" L ");
};
const areaD = (a: number, b: number) => {
  const c = curveD(a, b);
  if (!c) return "";
  return `${c} L ${xOf(b).toFixed(1)} ${ZERO_Y.toFixed(1)} L ${xOf(a).toFixed(1)} ${ZERO_Y.toFixed(1)} Z`;
};

// gauge (bankroll bar under the marker)
const GW = 130;
const GH = 330;
const START_LVL = 0.35;

const TICKS = [0, 10, 20, 30, 40, 50, 60];
const TICK_TXT = TICKS.map((t) => `${t} %`);
const T_AX = "PART MIS\u00c9E \u00c0 CHAQUE LANCER";
const T_Y = "CROISSANCE";
const T_MAX = "MAXIMUM : 20 %";
const T_C1 = "MISER PLUS = MOINS VITE";
const T_C2 = "L'ARGENT FOND";

const Scene6: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.5) % 120;
  const gy = (frame * 0.3) % 120;
  const breathe = 0.15 + 0.06 * Math.sin(frame * 0.07);
  const redGlow = 0.22 * prog(frame, 106, 30) * (0.85 + 0.15 * Math.sin(frame * 0.2));

  // ---------- camera ----------
  const enter = prog(frame, 0, 40);
  const push = 0.96 + 0.04 * enter + 0.03 * progE(frame, 140, 36, SINE);
  const lift = (1 - enter) * 24;

  // ---------- axes ----------
  const axX = prog(frame, -4, 20);
  const axY = prog(frame, -2, 20);
  const zl = prog(frame, 3, 20);
  const titleX = prog(frame, -2, 14);
  const titleY = prog(frame, 0, 14);

  // ---------- curve drawing ----------
  const fDraw =
    0.2 * progE(frame, 0, 34, SINE) +
    (F0 - 0.2) * progE(frame, 42, 18, SINE) +
    (0.6 - F0) * progE(frame, 106, 22, CUBIC);
  const posEnd = Math.min(fDraw, F0);
  const headOp =
    interpolate(frame, [0, 32, 38], [1, 1, 0], CLAMP) +
    interpolate(frame, [40, 43, 58, 63], [0, 1, 1, 0], CLAMP) +
    interpolate(frame, [104, 107, 126, 131], [0, 1, 1, 0], CLAMP);
  const hx = xOf(fDraw);
  const hy = yOf(fDraw);
  const headR = 11 + 3 * Math.sin(frame * 0.45);
  const headCol = fDraw > F0 + 0.002 ? RED : "#FFFFFF";

  // ---------- maximum ----------
  const pk = prog(frame, 33, 10);
  const pkGlow = 0.35 + 0.65 * bump(frame, 34, 4, 22) + 0.15 * Math.sin(frame * 0.15);
  const maxChip = prog(frame, 36, 12);
  const conn = prog(frame, 42, 8);
  const dropL = prog(frame, 38, 16);
  const t20 = prog(frame, 38, 10);

  // ---------- sliding marker + bankroll bar ----------
  const fm = 0.2 + 0.15 * progE(frame, 60, 24, CUBIC) + 0.11 * progE(frame, 140, 24, CUBIC);
  const mk = prog(frame, 47, 9);
  const mx = xOf(fm);
  const my = yOf(fm);
  const inRed = interpolate(fm, [F0 - 0.004, F0 + 0.02], [0, 1], CLAMP);
  const mkCol = interpolateColors(inRed, [0, 1], ["#FFFFFF", RED]);
  const mkR = 17 + 2.5 * Math.sin(frame * 0.3);

  const GB = AX_Y - 2; // the bankroll bar stands on the axis, under the marker
  const lvlRaw = Math.min(1, START_LVL * Math.exp(52.2 * gOf(fm)));
  const fillIn = START_LVL + (1 - START_LVL) * prog(frame, 50, 11);
  const lvl = Math.min(lvlRaw, fillIn) * (1 - 0.55 * prog(frame, 160, 16));
  const melt = interpolate(lvl, [0.03, START_LVL], [1, 0], CLAMP);
  const barH = GH * lvl;
  const barTop = GB - barH;
  const hb = GW / 2 + 80 * melt;
  const ht = GW / 2 - 10 * melt;
  const wav = 6 * melt;
  let topPts = "";
  for (let i = 0; i <= 10; i++) {
    const x = mx - ht + (2 * ht * i) / 10;
    const y = barTop + wav * Math.sin(i * 1.3 + frame * 0.35);
    topPts += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const barD = `M ${(mx - hb).toFixed(1)} ${GB.toFixed(1)} Q ${(mx - GW / 2).toFixed(1)} ${(GB - barH * 0.35).toFixed(1)} ${(mx - ht).toFixed(1)} ${barTop.toFixed(1)}${topPts} Q ${(mx + GW / 2).toFixed(1)} ${(GB - barH * 0.35).toFixed(1)} ${(mx + hb).toFixed(1)} ${GB.toFixed(1)} Z`;
  const barCol = interpolateColors(melt, [0, 0.5, 1], [GOLD, "#C79A3A", "#A0A0A0"]);
  const drain = prog(frame, 164, 12);
  const dollarOp = interpolate(barH, [70, 105], [0, 1], CLAMP) * mk * (1 - drain);
  const barGlow = 1 - melt;

  // drop bracket (peak level vs marker level)
  const hl = prog(frame, 64, 10) * (1 - prog(frame, 132, 10));
  const bx = mx + 42;

  // ---------- red zone ----------
  const bl = prog(frame, 86, 14);
  const rz = prog(frame, 106, 22);
  const ring = interpolate(frame, [109, 132], [0, 1], CLAMP);
  const xDot = prog(frame, 108, 8);
  const t40 = prog(frame, 110, 10);

  // ---------- captions ----------
  const c1 = prog(frame, 67, 12) * (1 - prog(frame, 100, 10));
  const c2 = prog(frame, 157, 10);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 45% 45%, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 58%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 78% 62%, rgba(229,83,75,${redGlow}) 0%, rgba(229,83,75,0) 50%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.035} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.035} strokeWidth={2} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const s = 40 + seededRandom("sq6s", i) * 40;
          const x = 60 + seededRandom("sq6x", i) * 1800;
          const sp = 0.4 + seededRandom("sq6v", i) * 0.6;
          const y = (((seededRandom("sq6y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="none" stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={2} transform={`rotate(${frame * 0.3 * (i % 2 ? 1 : -1)} ${x + s / 2} ${y + s / 2})`} />;
        })}
      </svg>

      {/* chart world (camera) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "1240px 600px", transform: `translateY(${lift}px) scale(${push})` }}>
        <svg id="chart-6-kel" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="rz6grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0.07} />
              <stop offset="100%" stopColor={RED} stopOpacity={0.26} />
            </linearGradient>
            <linearGradient id="pos6grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0.06} />
            </linearGradient>
          </defs>

          {/* vertical gridlines */}
          {TICKS.slice(1).map((t, i) => (
            <line key={`g${i}`} x1={xOf(t / 100)} y1={AX_Y - (AX_Y - PLOT_TOP) * axY} x2={xOf(t / 100)} y2={AX_Y} stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={2} />
          ))}

          {/* red zone */}
          <rect id="redzone-6-rz" x={XF0} y={PLOT_TOP} width={Math.max(0, (xOf(0.6) - XF0) * rz)} height={AX_Y - PLOT_TOP} fill="url(#rz6grad)" />

          {/* zero line */}
          <line x1={X0} y1={ZERO_Y} x2={X0 + (X_END - X0) * zl} y2={ZERO_Y} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={3} />

          {/* areas under the curve */}
          <path d={areaD(0, posEnd)} fill="url(#pos6grad)" />
          <path d={areaD(F0, fDraw)} fill={RED} fillOpacity={0.3} />

          {/* gold drop line at 20 % */}
          <line x1={XPK} y1={YPK + 18} x2={XPK} y2={YPK + 18 + (AX_Y - YPK - 18) * dropL} stroke={GOLD} strokeOpacity={0.55} strokeWidth={3} />

          {/* axes */}
          <line x1={X0} y1={AX_Y} x2={X0 + (X_END - X0) * axX} y2={AX_Y} stroke="#FFFFFF" strokeWidth={3} />
          <line x1={X0} y1={AX_Y} x2={X0} y2={AX_Y - (AX_Y - PLOT_TOP) * axY} stroke="#FFFFFF" strokeWidth={3} />
          {TICKS.map((t, i) => (
            <line key={`t${i}`} x1={xOf(t / 100)} y1={AX_Y} x2={xOf(t / 100)} y2={AX_Y + 16 * prog(frame, -4 + i * 1.5, 10)} stroke="#FFFFFF" strokeWidth={3} />
          ))}

          {/* red boundary at ~40 % */}
          <line x1={XF0} y1={PLOT_TOP} x2={XF0} y2={PLOT_TOP + (AX_Y - PLOT_TOP) * bl} stroke={RED} strokeWidth={3} opacity={bl > 0 ? 1 : 0} />

          {/* curve */}
          <path d={curveD(0, posEnd)} fill="none" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
          <path id="curve-6-pos" d={curveD(0, posEnd)} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          <path d={curveD(F0, fDraw)} fill="none" stroke={RED} strokeOpacity={0.25} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
          <path id="curve-6-neg" d={curveD(F0, fDraw)} fill="none" stroke={RED} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />

          {/* drawing head */}
          <g opacity={Math.min(1, headOp)}>
            <circle cx={hx} cy={hy} r={headR + 14} fill={headCol} opacity={0.15} />
            <circle cx={hx} cy={hy} r={headR + 6} fill={headCol} opacity={0.3} />
            <circle cx={hx} cy={hy} r={headR} fill={headCol} />
          </g>

          {/* peak marker */}
          <g opacity={pk}>
            <circle cx={XPK} cy={YPK} r={(34 + 26 * pkGlow) * pk} fill={GOLD} opacity={0.18 * pkGlow} />
            <circle cx={XPK} cy={YPK} r={26 * pk} fill={GOLD} opacity={0.35} />
            <circle id="peak-6-dot" cx={XPK} cy={YPK} r={17 * pk} fill={GOLD} stroke="#FFFFFF" strokeWidth={3} />
          </g>
          <line x1={XPK} y1={154} x2={XPK} y2={154 + 26 * conn} stroke={GOLD} strokeWidth={3} opacity={conn > 0 ? 1 : 0} />

          {/* peak-level reference + drop bracket */}
          <g opacity={hl}>
            <line x1={XPK + 20} y1={YPK} x2={Math.max(XPK + 20, bx)} y2={YPK} stroke={GOLD} strokeWidth={3} strokeOpacity={0.8} />
            <line x1={bx} y1={YPK} x2={bx} y2={Math.max(YPK, my)} stroke="#FFFFFF" strokeWidth={3} />
            <line x1={bx - 16} y1={my} x2={bx} y2={my} stroke="#FFFFFF" strokeWidth={3} />
          </g>

          {/* guide line from marker to axis */}
          <line x1={mx} y1={my} x2={mx} y2={AX_Y} stroke={mkCol} strokeOpacity={0.4 * mk} strokeWidth={2} />

          {/* bankroll bar */}
          <g id="bankroll-6-bar" opacity={mk} style={{ filter: `grayscale(${drain})` }}>
            <path d={barD} fill={barCol} stroke={melt > 0.02 ? barCol : GOLD_L} strokeWidth={2} style={{ filter: `drop-shadow(0px 0px ${Math.round(18 * barGlow)}px rgba(242,201,76,${0.55 * barGlow}))` }} />
            <rect x={mx - GW / 2} y={GB - START_LVL * GH} width={GW} height={START_LVL * GH} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.9} />
          </g>

          {/* marker */}
          <g opacity={mk} transform={`translate(${mx} ${my}) scale(${0.4 + 0.6 * mk})`}>
            <circle cx={0} cy={0} r={mkR + 20} fill={mkCol} opacity={0.14} />
            <circle cx={0} cy={0} r={mkR + 9} fill={mkCol} opacity={0.3} />
            <circle id="marker-6-mk" cx={0} cy={0} r={mkR} fill={mkCol} stroke="#121212" strokeWidth={3} />
          </g>

          {/* crossing point */}
          <g opacity={xDot}>
            <circle cx={XF0} cy={ZERO_Y} r={16 + 60 * ring} fill="none" stroke={RED} strokeWidth={4} opacity={1 - ring} />
            <circle id="cross-6-dot" cx={XF0} cy={ZERO_Y} r={12 * xDot} fill={RED} stroke="#FFFFFF" strokeWidth={3} />
          </g>
        </svg>

        {/* tick labels */}
        {TICKS.map((t, i) => {
          const tp = prog(frame, -4 + i * 1.5, 12);
          const isG = t === 20;
          const isR = t === 40;
          const hiOp = isG ? t20 : isR ? t40 : 0;
          const hiCol = isG ? GOLD : RED;
          const sc = 1 + (isG ? 0.12 * t20 : 0) + (isR ? 0.12 * t40 : 0);
          return (
            <Box key={`tl${i}`} x={xOf(t / 100)} y={910} w={160} h={60} style={{ opacity: tp, transform: `translateY(${(1 - tp) * 18}px) scale(${sc})` }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 160, height: 60, opacity: 1 - hiOp }}>
                <Text id={`tick-6-a${i}`} text={TICK_TXT[i]} width={160} height={60} sizeGroup={{ texts: TICK_TXT }} textStyles={{ fontFamily: MONO, fontWeight: 500, color: "#BDBDBD" }} />
              </div>
              {isG || isR ? (
                <div style={{ position: "absolute", left: 0, top: 0, width: 160, height: 60, opacity: hiOp }}>
                  <Text id={`tickhi-6-b${i}`} text={TICK_TXT[i]} width={160} height={60} sizeGroup={{ texts: TICK_TXT }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: hiCol }} />
                </div>
              ) : null}
            </Box>
          );
        })}

        {/* axis titles */}
        <Box x={1030} y={990} w={1100} h={76} style={{ opacity: titleX, transform: `translateY(${(1 - titleX) * 24}px)` }}>
          <Text id="axx-6-c1" text={T_AX} width={1100} height={76} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: 2 }} />
        </Box>
        <Box x={212} y={510} w={460} h={74} style={{ opacity: titleY, transform: `translateX(${(1 - titleY) * -24}px) rotate(-90deg)` }}>
          <Text id="axy-6-d2" text={T_Y} width={460} height={74} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: 3 }} />
        </Box>

        {/* dollar engraved in the bankroll bar */}
        <Box x={mx} y={GB - 58} w={150} h={76} style={{ opacity: dollarOp }}>
          <Text id="dollar-6-k9" text="$" width={150} height={76} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#5C460C" }} />
        </Box>

        {/* MAXIMUM chip */}
        <Box x={XPK} y={112} w={480} h={84} style={{ opacity: maxChip, transform: `translateY(${(1 - maxChip) * -30}px)` }}>
          <div id="chip-max-6-e3" style={{ background: GOLD, width: 480, height: 84, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${Math.round(30 * pkGlow)}px rgba(242,201,76,${0.45 * pkGlow})` }}>
            <Text id="txt-max-6-f4" text={T_MAX} width={460} height={78} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          </div>
        </Box>

        {/* caption 1 : moins vite */}
        <Box x={1420} y={112} w={600} h={84} style={{ opacity: c1, transform: `translateX(${(1 - prog(frame, 67, 12)) * 50}px)` }}>
          <div id="chip-c1-6-g5" style={{ background: "#FFFFFF", width: 600, height: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-c1-6-h6" text={T_C1} width={580} height={78} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          </div>
        </Box>

        {/* caption 2 : fondre */}
        <Box x={(XF0 + xOf(0.6)) / 2} y={112} w={460} h={84} style={{ opacity: c2, transform: `translateY(${(1 - c2) * -30}px)` }}>
          <div id="chip-c2-6-i7" style={{ background: RED, width: 460, height: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-c2-6-j8" text={T_C2} width={440} height={78} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
          </div>
        </Box>
      </div>
    </AbsoluteFill>
  );
};

export default Scene6;
