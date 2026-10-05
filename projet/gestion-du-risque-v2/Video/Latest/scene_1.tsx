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
const GOLD_D = "#8C6A12";
const NAVY = "#2E4F70";
const NAVY_L = "#5E86AD";
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

// ---------- phase 1 : the year odometer ----------
const YEAR = [2, 0, 1, 6];
const LOCK = [37, 44, 51, 54]; // deux 35 / mille 41 / seize 49
const SPEED = 0.3; // digits per frame while rolling
const SETTLE = 10;
const remain = (f: number, s: number) => {
  const d = s - f;
  if (d <= 0) return 0;
  if (d >= SETTLE) return SPEED * d;
  const u = d / SETTLE;
  return SPEED * SETTLE * (2 * u * u - u * u * u);
};
const COL_W = 230;
const COL_H = 400;
const YEAR_Y = 560;
const CHIP_W = 520;
const CHIP_H = 104;
const CHIP_Y0 = 250;
const HY = 110;
const YS = 0.32;
const HX_CHIP = 783;
const HX_YEAR = 1262;
const SHRINK = 59;

// ---------- phase 2 : rule cards ----------
const CARD_X = 110;
const CARD_W = 1240;
const CARD_H = 250;
const CARD_Y = [330, 620, 910];
const CARD_S = [91, 119, 180]; // vingt-cinq / une demi-heure / plus de deux cent
const ACCENT = [GOLD, NAVY_L, GOLD];
const PERIM = 2 * (CARD_W + CARD_H);
const TIMER0 = 128;

// ---------- gauge ----------
const G_CX = 1530;
const G_W = 170;
const G_TOP = 220;
const G_BOT = 1000;
const G_ZERO = 992;
const UNIT = 70; // 25 $ per unit, 10 units to the ceiling
const Y25 = G_ZERO - UNIT;
const Y250 = G_ZERO - 10 * UNIT;
const G_L = G_CX - G_W / 2;
const G_PERIM = 2 * (G_W + (G_BOT - G_TOP));
const LBL_X = 1776;

const T_EXP = "L'EXP\u00c9RIENCE";
const T_DEP = "AU D\u00c9PART";
const T_JEU = "DE JEU";
const T_PLA = "PLAFOND :";
const LABELS = [T_DEP, T_JEU, T_PLA];
const T_X10 = "\u00d7 10";

const Scene1: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.5) % 120;
  const gy = (frame * 0.3) % 120;
  const breathe = 0.15 + 0.06 * Math.sin(frame * 0.06);

  // ---------- phase 1 ----------
  const intro = prog(frame, 0, 14);
  const punch = bump(frame, 54, 3, 12);
  const sh = prog(frame, SHRINK, 14);
  const sBig = (1.3 - 0.3 * intro) * (1 + 0.04 * interpolate(frame, [0, 54], [0, 1], CLAMP)) * (1 + 0.07 * punch);
  const yScale = sBig + (YS - sBig) * sh;
  const yDx = (HX_YEAR - 960) * sh;
  const yDy = (HY - YEAR_Y) * sh;
  const yOp = 0.45 + 0.55 * intro;
  const chipIn = prog(frame, 8, 10);
  const chipX = 960 + (HX_CHIP - 960) * sh;
  const chipY = CHIP_Y0 + (HY - CHIP_Y0) * sh - (1 - chipIn) * 40;
  const shock = prog(frame, 54, 20);
  const shockOp = (1 - shock) * (frame >= 54 ? 0.7 : 0);
  const lines = prog(frame, 54, 12);
  const linesOp = bump(frame, 54, 2, 9);
  const headGlow = sh * (0.35 + 0.25 * Math.sin(frame * 0.1));

  const columns = YEAR.map((t, i) => {
    const r = remain(frame, LOCK[i]);
    const vel = remain(frame - 1, LOCK[i]) - r;
    const pos = t + 40 - r;
    const base = Math.floor(pos);
    const frac = pos - base;
    const a = ((base % 10) + 10) % 10;
    const b = (a + 1) % 10;
    const locked = frame >= LOCK[i];
    const flash = bump(frame, LOCK[i], 2, 14);
    const blur = Math.min(4, vel * 8);
    const style: React.CSSProperties = {
      fontFamily: MONO,
      fontWeight: 700,
      color: locked ? GOLD : "#FFFFFF",
      textShadow: locked ? `0 0 ${Math.round(10 + 50 * flash + 40 * headGlow)}px rgba(242,201,76,${0.35 + 0.5 * flash})` : "none",
    };
    return (
      <div
        key={i}
        id={`year-col-1-c${i}`}
        style={{
          position: "absolute",
          left: i * COL_W,
          top: 0,
          width: COL_W,
          height: COL_H,
          overflow: "hidden",
          WebkitMaskImage: locked ? "none" : "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 16%, #000 84%, rgba(0,0,0,0) 100%)",
          filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : "none",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: -frac * COL_H, width: COL_W, height: COL_H }}>
          <Text id={`year-d-1-a${i}`} text={`${a}`} width={COL_W} height={COL_H} textStyles={style} />
        </div>
        {frac > 0.001 ? (
          <div style={{ position: "absolute", left: 0, top: (1 - frac) * COL_H, width: COL_W, height: COL_H }}>
            <Text id={`year-d-1-b${i}`} text={`${b}`} width={COL_W} height={COL_H} textStyles={style} />
          </div>
        ) : null}
      </div>
    );
  });

  // ---------- slots + cards ----------
  const slot = [0, 1, 2].map((i) => prog(frame, 64 + i * 5, 16));
  const act = CARD_S.map((s) => prog(frame, s, 12));
  const hl = CARD_S.map((s, i) => prog(frame, s, 8) * (i < 2 ? 1 - 0.75 * prog(frame, CARD_S[i + 1], 10) : 1));

  // card 1 : chips
  const chips = Array.from({ length: 6 }).map((_, k) => prog(frame, 91 + k * 2.2, 9));
  const v25 = prog(frame, 92, 9);
  const l25 = prog(frame, 100, 9);
  // card 2 : timer
  const watchIn = prog(frame, 119, 10);
  const vTim = prog(frame, 124, 9);
  const lJeu = prog(frame, 139, 9);
  const tt = Math.max(0, frame - TIMER0);
  const secs = 1800 - Math.floor(tt / 30);
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;
  const timerTxt = `${mm < 10 ? "0" : ""}${mm}:${ss < 10 ? "0" : ""}${ss}`;
  const tick = frame >= TIMER0 + 30 ? bump(tt % 30, 0, 1, 7) : 0;
  const stepN = Math.floor(tt / 5);
  const handAng = frame < TIMER0 ? 0 : 30 * (stepN + Math.min(1, (tt - stepN * 5) / 2));
  // card 3 : ceiling
  const ceilIcon = prog(frame, 182, 10);
  const lPla = prog(frame, 184, 9);
  const v250 = prog(frame, 197, 9);
  const barP = [0, 1, 2].map((k) => prog(frame, 184 + k * 4, 14));
  const hit = bump(frame, 194, 2, 14);

  // ---------- gauge ----------
  const tube = prog(frame, 66, 22);
  const plinth = prog(frame, 66, 14);
  const fill = prog(frame, 91, 18);
  const fillH = UNIT * fill;
  const fillGlow = 0.35 * fill + bump(frame, 104, 3, 16) + 0.12 * Math.sin(frame * 0.12) * fill;
  const g25 = prog(frame, 101, 9);
  const scanP = interpolate(frame, [156, 190], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
  const scanOp = bump(frame, 156, 8, 26);
  const ceil = prog(frame, 192, 12);
  const ceilGlow = ceil * (0.6 + 0.25 * Math.sin(frame * 0.15)) + 1.2 * bump(frame, 196, 3, 16);
  const g250 = prog(frame, 199, 9);
  const brk = prog(frame, 205, 13);
  const x10 = prog(frame, 214, 10);

  const cardText = (id: string, txt: string, left: number, w: number, p: number, color: string, mono: boolean) => (
    <div style={{ position: "absolute", left, top: mono ? (CARD_H - 150) / 2 : (CARD_H - 120) / 2 + 10, width: w, height: mono ? 150 : 120, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
      {mono ? (
        <Text id={id} text={txt} width={w} height={150} maxSize={104} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color }} />
      ) : (
        <Text id={id} text={txt} width={w} height={120} align="left" sizeGroup={{ texts: LABELS }} textStyles={{ fontFamily: JOST, fontWeight: 900, color, letterSpacing: 1 }} />
      )}
    </div>
  );

  const card = (i: number, children: React.ReactNode) => (
    <div
      key={i}
      id={`card-1-r${i}`}
      style={{
        position: "absolute",
        left: CARD_X,
        top: CARD_Y[i] - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        overflow: "hidden",
        background: `rgba(255,255,255,${0.05 * act[i]})`,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: (CARD_H * (1 - act[i])) / 2, width: 14, height: CARD_H * act[i], background: ACCENT[i] }} />
      {act[i] > 0 ? children : null}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 50% 52%, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 58%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.05} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.05} strokeWidth={2} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const s = 44 + seededRandom("sq1s", i) * 40;
          const x = 60 + seededRandom("sq1x", i) * 1800;
          const sp = 0.5 + seededRandom("sq1v", i) * 0.7;
          const y = (((seededRandom("sq1y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="none" stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={2} transform={`rotate(${frame * 0.3 * (i % 2 ? 1 : -1)} ${x + s / 2} ${y + s / 2})`} />;
        })}
      </svg>

      {/* ---------- slot outlines + highlights ---------- */}
      <svg id="slots-1-sl" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={CARD_X + 1.5} y={CARD_Y[i] - CARD_H / 2 + 1.5} width={CARD_W - 3} height={CARD_H - 3} fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={3} strokeDasharray={PERIM} strokeDashoffset={PERIM * (1 - slot[i])} />
            <rect x={CARD_X + 1.5} y={CARD_Y[i] - CARD_H / 2 + 1.5} width={CARD_W - 3} height={CARD_H - 3} fill="none" stroke={GOLD} strokeOpacity={0.9 * hl[i]} strokeWidth={3} />
          </g>
        ))}
      </svg>

      {/* ---------- card 1 : 25 $ AU DEPART ---------- */}
      {card(
        0,
        <>
          <svg id="chips-1-ch" width={240} height={220} viewBox="0 0 240 220" style={{ position: "absolute", left: 40, top: 15 }}>
            {chips.map((c, k) => {
              const y = 196 - (k + 1) * 28 - (1 - c) * 140;
              const jx = (seededRandom("chip1", k) - 0.5) * 16;
              return (
                <g key={k} opacity={c} transform={`translate(${jx} 0)`}>
                  <rect x={35} y={y} width={170} height={25} rx={12} fill={GOLD} stroke={GOLD_D} strokeWidth={3} />
                  {[62, 100, 138, 176].map((nx, j) => (
                    <rect key={j} x={nx - 7} y={y + 2} width={14} height={21} fill="#FFFFFF" opacity={0.85} />
                  ))}
                </g>
              );
            })}
          </svg>
          {cardText("val-25-1-v1", "25 $", 310, 300, v25, GOLD, true)}
          {cardText("lbl-dep-1-l1", T_DEP, 610, 500, l25, "#FFFFFF", false)}
        </>
      )}

      {/* ---------- card 2 : 30:00 DE JEU ---------- */}
      {card(
        1,
        <>
          <svg id="watch-1-wt" width={240} height={220} viewBox="0 0 240 220" style={{ position: "absolute", left: 40, top: 15, opacity: watchIn, transform: `scale(${0.7 + 0.3 * watchIn})` }}>
            <rect x={106} y={14} width={28} height={16} fill="#FFFFFF" />
            <rect x={114} y={28} width={12} height={12} fill="#FFFFFF" />
            <circle cx={120} cy={122} r={76} fill={NAVY} stroke="#FFFFFF" strokeWidth={7} />
            {Array.from({ length: 12 }).map((_, k) => {
              const an = (k * 30 * Math.PI) / 180;
              return <line key={k} x1={120 + Math.sin(an) * 56} y1={122 - Math.cos(an) * 56} x2={120 + Math.sin(an) * 66} y2={122 - Math.cos(an) * 66} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={k % 3 === 0 ? 5 : 3} />;
            })}
            <line x1={120} y1={122} x2={120 + Math.sin((handAng * Math.PI) / 180) * 58} y2={122 - Math.cos((handAng * Math.PI) / 180) * 58} stroke={GOLD} strokeWidth={7} strokeLinecap="round" />
            <circle cx={120} cy={122} r={9} fill={GOLD} />
          </svg>
          <div style={{ position: "absolute", left: 0, top: 0, width: CARD_W, height: CARD_H, transform: `scale(${1 + 0.035 * tick})`, transformOrigin: "500px 125px" }}>
            {cardText("val-timer-1-v2", timerTxt, 310, 380, vTim, "#FFFFFF", true)}
          </div>
          {cardText("lbl-jeu-1-l2", T_JEU, 672, 500, lJeu, "#FFFFFF", false)}
        </>
      )}

      {/* ---------- card 3 : PLAFOND : 250 $ ---------- */}
      {card(
        2,
        <>
          <svg id="ceiling-1-ce" width={240} height={220} viewBox="0 0 240 220" style={{ position: "absolute", left: 40, top: 15, overflow: "visible" }}>
            {[0, 1, 2].map((k) => {
              const target = [70, 118, 200][k];
              const h = Math.min(156, target * barP[k]);
              const capped = k === 2 && h >= 155.5;
              return <rect key={k} x={42 + k * 58} y={200 - h} width={40} height={h} fill={capped ? GOLD : "#FFFFFF"} opacity={k === 2 ? 1 : 0.85} />;
            })}
            <rect x={120 - 100 * ceilIcon} y={30} width={200 * ceilIcon} height={12} fill={GOLD} style={{ filter: `drop-shadow(0px 0px ${Math.round(6 + 18 * hit)}px rgba(242,201,76,0.95))` }} />
          </svg>
          {cardText("lbl-pla-1-l3", T_PLA, 310, 500, lPla, "#FFFFFF", false)}
          {cardText("val-250-1-v3", "250 $", 830, 380, v250, GOLD, true)}
        </>
      )}

      {/* ---------- gauge ---------- */}
      <svg id="gauge-1-gg" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={G_L} y={G_TOP} width={G_W} height={G_BOT - G_TOP} fill="#FFFFFF" fillOpacity={0.035 * tube} stroke="#FFFFFF" strokeWidth={3} strokeDasharray={G_PERIM} strokeDashoffset={G_PERIM * (1 - tube)} />
        {Array.from({ length: 11 }).map((_, k) => {
          const tp = prog(frame, 72 + k * 1.4, 6);
          const y = G_ZERO - k * UNIT;
          const major = k === 0 || k === 10;
          return <line key={k} x1={G_L - (major ? 30 : 20) * tp} y1={y} x2={G_L} y2={y} stroke="#FFFFFF" strokeOpacity={major ? 0.9 : 0.55} strokeWidth={3} />;
        })}
        <rect x={G_CX - 105 * plinth} y={G_BOT} width={210 * plinth} height={16} fill="#FFFFFF" fillOpacity={0.85} />
        {/* ghost x10 segments */}
        {Array.from({ length: 9 }).map((_, j) => {
          const k = j + 1;
          const gp = prog(frame, 202 + k * 1.8, 7);
          return <rect key={k} x={G_L + 10} y={G_ZERO - (k + 1) * UNIT + 4} width={G_W - 20} height={UNIT - 8} fill={GOLD} fillOpacity={0.07 * gp} stroke={GOLD} strokeOpacity={0.6 * gp} strokeWidth={2.5} />;
        })}
        {/* bracket */}
        <g stroke={GOLD} strokeWidth={3} opacity={brk > 0 ? 1 : 0}>
          <line x1={G_L + G_W + 26} y1={Y25} x2={G_L + G_W + 26} y2={Y25 - (Y25 - Y250) * brk} />
          <line x1={G_L + G_W + 4} y1={Y25} x2={G_L + G_W + 26} y2={Y25} />
          <line x1={G_L + G_W + 4} y1={Y250} x2={G_L + G_W + 26} y2={Y250} opacity={brk >= 0.98 ? 1 : 0} />
        </g>
      </svg>

      {/* gauge fill */}
      <div
        id="gauge-fill-1-gf"
        style={{
          position: "absolute",
          left: G_L + 8,
          top: G_ZERO - fillH,
          width: G_W - 16,
          height: Math.max(0, fillH),
          background: `linear-gradient(180deg, #FFE596 0%, ${GOLD} 22%, #D9A92E 100%)`,
          boxShadow: `0 0 ${Math.round(50 * fillGlow)}px ${Math.round(8 * fillGlow)}px rgba(242,201,76,${Math.min(0.85, fillGlow)})`,
        }}
      />
      {/* rising scan */}
      <div style={{ position: "absolute", left: G_L + 8, top: G_TOP + 8, width: G_W - 16, height: Y25 - G_TOP - 8, overflow: "hidden", opacity: scanOp }}>
        <div style={{ position: "absolute", left: 0, top: (Y25 - G_TOP - 8) - 140 - scanP * (Y25 - Y250 - 20), width: G_W - 16, height: 140, background: "linear-gradient(180deg, rgba(242,201,76,0) 0%, rgba(242,201,76,0.45) 70%, rgba(242,201,76,0) 100%)" }} />
      </div>
      {/* ceiling line */}
      <div
        id="gauge-ceil-1-gc"
        style={{
          position: "absolute",
          left: G_CX - 100 * ceil,
          top: Y250 - 5,
          width: 200 * ceil,
          height: 10,
          background: GOLD,
          boxShadow: `0 0 ${Math.round(34 * ceilGlow)}px ${Math.round(10 * ceilGlow)}px rgba(242,201,76,${Math.min(0.9, 0.9 * ceilGlow)})`,
        }}
      />

      {/* gauge labels */}
      <Box x={LBL_X} y={Y25} w={220} h={96} style={{ opacity: g25, transform: `translateX(${(1 - g25) * -30}px)` }}>
        <Text id="g-lbl25-1-k1" text="25 $" width={220} height={96} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
      </Box>
      <Box x={LBL_X} y={Y250} w={220} h={96} style={{ opacity: g250, transform: `translateX(${(1 - g250) * -30}px)` }}>
        <Text id="g-lbl250-1-k2" text="250 $" width={220} height={96} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
      </Box>
      <Box x={LBL_X} y={(Y25 + Y250) / 2} w={220} h={120} style={{ opacity: x10, transform: `scale(${0.6 + 0.4 * x10})` }}>
        <Text id="g-x10-1-k3" text={T_X10} width={220} height={120} align="left" textStyles={{ fontFamily: JOST, fontWeight: 900, color: GOLD, textShadow: "0 0 24px rgba(242,201,76,0.5)" }} />
      </Box>

      {/* ---------- phase 1 impact ---------- */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <rect x={960 - 520 * (1 + 0.3 * shock)} y={YEAR_Y - 240 * (1 + 0.3 * shock)} width={1040 * (1 + 0.3 * shock)} height={480 * (1 + 0.3 * shock)} fill="none" stroke={GOLD} strokeWidth={3} opacity={shockOp} />
        <line x1={960 - 500} y1={YEAR_Y} x2={960 - 500 - 360 * lines} y2={YEAR_Y} stroke="#FFFFFF" strokeWidth={3} opacity={linesOp} />
        <line x1={960 + 500} y1={YEAR_Y} x2={960 + 500 + 360 * lines} y2={YEAR_Y} stroke="#FFFFFF" strokeWidth={3} opacity={linesOp} />
      </svg>

      {/* ---------- year (big -> header) ---------- */}
      <div
        id="year-1-yr"
        style={{
          position: "absolute",
          left: 960 - (COL_W * 4) / 2,
          top: YEAR_Y - COL_H / 2,
          width: COL_W * 4,
          height: COL_H,
          opacity: yOp,
          transformOrigin: "50% 50%",
          transform: `translate(${yDx}px, ${yDy}px) scale(${yScale})`,
        }}
      >
        {columns}
      </div>

      {/* chip L'EXPERIENCE */}
      <Box x={chipX} y={chipY} w={CHIP_W} h={CHIP_H} style={{ opacity: chipIn }}>
        <div id="chip-exp-1-x1" style={{ background: "#FFFFFF", width: CHIP_W, height: CHIP_H, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text id="txt-exp-1-x2" text={T_EXP} width={CHIP_W - 20} height={CHIP_H - 8} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000", letterSpacing: 2 }} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene1;
