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
const RED = "#E5534B";
const GREY = "#8A8A8A";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
const bump = (f: number, s: number, up: number, down: number) =>
  interpolate(f, [s, s + up, s + up + down], [0, 1, 0], CLAMP);

const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  const ch = (i: number) => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, "0");
  return `#${ch(0)}${ch(1)}${ch(2)}`;
};

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// ---------- geometry ----------
const CW = 580; // column width
const CL = 960 - CW / 2; // 670
const CR = 960 + CW / 2; // 1250
const TOP = 230; // starting height (outline top)
const BASE = 990; // ground
const H = BASE - TOP; // 760
const MID = TOP + H / 2; // 610
const RBX = CR + 40; // right bracket (the drop)
const LBX = CL - 40; // left bracket (the climb)
const TICK = 22;
const OUT_LEN = 2 * H + CW;

// ---------- texts ----------
const T_M50 = "-50 %";
const T_P100 = "+100 %";
const T_DEP = "D\u00c9PART";
const EQ1 = "0 \u00d7 2 = 0";
const EQ2 = "0 \u00d7 10 = 0";

const BANDS = "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 34px, rgba(122,90,12,0.30) 34px, rgba(122,90,12,0.30) 38px)";

const Scene3: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- master timeline ----------
  const riseIn = prog(frame, -10, 26); // column already rising at frame 0
  const drawOut = prog(frame, -8, 26); // outline drawing on
  const dropP = prog(frame, 30, 7); // "perd la moitie"
  const copyP = prog(frame, 82, 14); // "doubler"
  const lossP = prog(frame, 139, 10); // "perte totale"
  const grey = interpolate(frame, [165, 205], [0, 1], CLAMP); // drains to grey ("jamais")
  const phase2 = prog(frame, 128, 14);

  const level = frame < 96 ? riseIn * (1 - 0.5 * dropP) : 1 - lossP;
  const goldTop = BASE - level * H;
  const copyOn = frame >= 82 && frame < 96;
  const copyTop = MID - (MID - TOP) * copyP;
  const copyOp = interpolate(frame, [82, 85], [0, 1], CLAMP);
  const landFlash = bump(frame, 95, 2, 12);

  const voidOp = frame < 96
    ? interpolate(frame, [29, 33, 70], [0, 0.55, 0.13], CLAMP)
    : interpolate(frame, [138, 142, 162], [0, 0.5, 0], CLAMP);

  // camera
  const push = 1 + 0.02 * prog(frame, 0, 120) + 0.05 * prog(frame, 130, 70);

  // background
  const breathe = 0.09 + 0.04 * Math.sin(frame * 0.07);
  const rulerOff = (frame * 0.45) % 240;

  // outline glow pulses : "depart" and "totale"
  const oGlow = bump(frame, 111, 4, 16) + bump(frame, 150, 4, 18);
  const outColor = mix("#FFFFFF", GREY, grey);

  // counter
  let val = 100;
  if (frame < 86) val = Math.round(100 - 50 * dropP);
  else if (frame < 139) val = Math.round(50 + 50 * prog(frame, 86, 10));
  else val = Math.round(100 * (1 - prog(frame, 139, 8)));
  const redT = interpolate(frame, [30, 33, 64], [0, 1, 0], CLAMP);
  const goldT = interpolate(frame, [88, 92, 126], [0, 1, 0], CLAMP);
  let cColor = mix("#FFFFFF", RED, redT);
  if (frame >= 86 && frame < 139) cColor = mix("#FFFFFF", GOLD, goldT);
  if (frame >= 139) cColor = mix(mix("#FFFFFF", RED, prog(frame, 139, 4)), GREY, grey);
  const cPop = 1 + 0.12 * bump(frame, 30, 3, 12) + 0.12 * bump(frame, 94, 3, 12) + 0.12 * bump(frame, 140, 3, 12);
  const cIn = prog(frame, -4, 10);

  // phase 1 labels + brackets
  const out1 = 1 - prog(frame, 124, 10);
  const brR = prog(frame, 31, 10);
  const brL = prog(frame, 84, 12);
  const m50 = prog(frame, 33, 10);
  const p100 = prog(frame, 88, 10);
  const p100Glow = 0.5 + 0.5 * bump(frame, 92, 4, 20);
  const dep = prog(frame, 110, 10);

  // phase 2 equations
  const e1 = prog(frame, 160, 10);
  const e2 = prog(frame, 178, 10);
  const eqColor = mix("#FFFFFF", "#D6D6D6", grey);

  // sheen sweeps over the gold (relative to column left edge)
  const sheenA = interpolate(frame, [-12, 34], [-260, CW + 120], CLAMP);
  const sheenB = interpolate(frame, [94, 126], [-260, CW + 120], CLAMP);

  const goldLayer = (id: string, top: number, height: number, bandTop: number, style?: React.CSSProperties) => (
    <div id={id} style={{ position: "absolute", left: CL, top, width: CW, height: Math.max(0, height), overflow: "hidden", background: GOLD, ...style }}>
      <div style={{ position: "absolute", left: 0, top: bandTop, width: CW, height: H, background: BANDS }} />
      <div style={{ position: "absolute", left: sheenA, top: -40, width: 150, height: H + 80, transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)" }} />
      <div style={{ position: "absolute", left: sheenB, top: -40, width: 150, height: H + 80, transform: "skewX(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: 4, background: "#FFE596" }} />
    </div>
  );

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, #1B1A17 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing glow: gold while there is money, cold grey after the loss */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - lossP, background: `radial-gradient(circle at 50% 56%, rgba(242,201,76,${breathe}) 0%, rgba(242,201,76,0) 50%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: lossP, background: `radial-gradient(circle at 50% 56%, rgba(138,138,138,${breathe * 0.9}) 0%, rgba(138,138,138,0) 50%)` }} />

      {/* faint horizontal ruler lines, drifting */}
      <svg id="ruler-3-bg" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const y = i * 48 + rulerOff - 240;
          const major = i % 5 === 0;
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={1920} y2={y} stroke="#FFFFFF" strokeOpacity={major ? 0.075 : 0.035} strokeWidth={2} />
              <line x1={48} y1={y} x2={48 + (major ? 44 : 20)} y2={y} stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={2} />
              <line x1={1872 - (major ? 44 : 20)} y1={y} x2={1872} y2={y} stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={2} />
            </g>
          );
        })}
        <line x1={48} y1={0} x2={48} y2={1080} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
        <line x1={1872} y1={0} x2={1872} y2={1080} stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
      </svg>

      {/* money counter (outside the camera push) */}
      <Box x={960} y={118} w={460} h={124} style={{ opacity: cIn, transform: `scale(${cPop})` }}>
        <Text id="counter-3-k2m9" text={`${val} $`} width={460} height={124} textStyles={{ fontFamily: MONO, fontWeight: 700, color: cColor }} />
      </Box>

      {/* world with camera push */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `960px ${MID}px`, transform: `scale(${push})` }}>
        {/* ground */}
        <Box x={960} y={BASE + 2} w={900 * prog(frame, -12, 22)} h={4} style={{ background: outColor, opacity: 0.8 }} />

        {/* empty space left by the loss */}
        <div id="void-3-r7q" style={{ position: "absolute", left: CL, top: TOP, width: CW, height: Math.max(0, goldTop - TOP), background: `rgba(229,83,75,${voidOp})` }} />

        {/* the money column */}
        {level > 0.001 ? goldLayer("column-3-gold", goldTop, level * H, TOP - goldTop) : null}

        {/* seam between the two halves once rebuilt */}
        {frame >= 96 && goldTop < MID - 2 ? (
          <div style={{ position: "absolute", left: CL, top: MID - 2, width: CW, height: 5, background: "rgba(92,68,8,0.9)" }} />
        ) : null}

        {/* the copy block that doubles what remains */}
        {copyOn
          ? goldLayer("copy-3-dbl", copyTop, H / 2, 0, {
              opacity: copyOp,
              border: "4px solid #FFFFFF",
              boxSizing: "border-box",
              boxShadow: `0 0 60px 10px rgba(242,201,76,${0.6 * copyOp})`,
            })
          : null}

        {/* landing flash */}
        <div style={{ position: "absolute", left: CL, top: TOP, width: CW, height: H / 2, background: "#FFFFFF", opacity: 0.55 * landFlash }} />

        {/* white outline : the starting height */}
        <svg id="outline-3-w4" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, filter: `drop-shadow(0px 0px ${Math.round(22 * oGlow)}px rgba(255,255,255,${Math.min(0.9, 0.9 * oGlow)}))` }}>
          <path
            d={`M ${CL} ${BASE} L ${CL} ${TOP} L ${CR} ${TOP} L ${CR} ${BASE}`}
            fill="none"
            stroke={outColor}
            strokeWidth={4}
            strokeDasharray={OUT_LEN}
            strokeDashoffset={OUT_LEN * (1 - drawOut)}
          />
        </svg>

        {/* brackets */}
        <svg id="brackets-3-b5" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: out1 }}>
          <g stroke="#FFFFFF" strokeWidth={3} fill="none">
            <line x1={RBX} y1={TOP} x2={RBX} y2={TOP + (MID - TOP) * brR} opacity={brR > 0 ? 1 : 0} />
            <line x1={RBX - TICK} y1={TOP} x2={RBX} y2={TOP} opacity={brR > 0 ? 1 : 0} />
            <line x1={RBX - TICK} y1={MID} x2={RBX} y2={MID} opacity={prog(frame, 38, 5)} />
            <line x1={RBX} y1={(TOP + MID) / 2} x2={RBX + TICK} y2={(TOP + MID) / 2} opacity={prog(frame, 38, 5)} />
            <line x1={LBX} y1={MID} x2={LBX} y2={MID - (MID - TOP) * brL} opacity={brL > 0 ? 1 : 0} />
            <line x1={LBX} y1={MID} x2={LBX + TICK} y2={MID} opacity={brL > 0 ? 1 : 0} />
            <line x1={LBX} y1={TOP} x2={LBX + TICK} y2={TOP} opacity={prog(frame, 92, 5)} />
            <line x1={LBX - TICK} y1={(TOP + MID) / 2} x2={LBX} y2={(TOP + MID) / 2} opacity={prog(frame, 92, 5)} />
          </g>
        </svg>

        {/* -50 % : red, half the size of +100 % */}
        <Box x={1450} y={(TOP + MID) / 2} w={520} h={190} style={{ opacity: m50 * out1, transform: `translateY(${(1 - m50) * -40}px) scale(0.5)` }}>
          <Text id="lbl-m50-3-r1" text={T_M50} width={520} height={190} sizeGroup={{ texts: [T_M50, T_P100] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: RED }} />
        </Box>

        {/* +100 % : big gold */}
        <Box x={330} y={(TOP + MID) / 2} w={520} h={190} style={{ opacity: p100 * out1, transform: `translateY(${(1 - p100) * 50}px)` }}>
          <Text id="lbl-p100-3-g2" text={T_P100} width={520} height={190} sizeGroup={{ texts: [T_M50, T_P100] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD, textShadow: `0 0 ${Math.round(34 * p100Glow)}px rgba(242,201,76,0.55)` }} />
        </Box>

        {/* DEPART chip on the outline top */}
        <Box x={1480} y={TOP} w={300} h={84} style={{ clipPath: `inset(0px ${(1 - dep) * 100}% 0px 0px)`, opacity: dep > 0 ? 1 - 0.3 * grey : 0 }}>
          <div id="chip-dep-3-c3" style={{ width: 300, height: 84, background: mix("#FFFFFF", "#9A9A9A", grey), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-dep-3-c4" text={T_DEP} width={280} height={78} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000", letterSpacing: 2 }} />
          </div>
        </Box>

        {/* phase 2 : equations inside the empty outline */}
        <Box x={960} y={515} w={540} h={150} style={{ opacity: e1 * phase2, transform: `translateY(${(1 - e1) * 30}px) scale(${1.12 - 0.12 * e1})` }}>
          <Text id="eq1-3-z1" text={EQ1} width={540} height={150} sizeGroup={{ texts: [EQ1, EQ2] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: eqColor }} />
        </Box>
        <Box x={960} y={715} w={540} h={150} style={{ opacity: e2 * phase2, transform: `translateY(${(1 - e2) * 30}px) scale(${1.12 - 0.12 * e2})` }}>
          <Text id="eq2-3-z2" text={EQ2} width={540} height={150} sizeGroup={{ texts: [EQ1, EQ2] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: eqColor }} />
        </Box>
      </div>
    </AbsoluteFill>
  );
};

export default Scene3;
