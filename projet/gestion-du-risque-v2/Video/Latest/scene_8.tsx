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

// ---------- geometry ----------
const NF = 25; // floors of the tower == blocks of the stack
const BASE = 1000; // ground level (bottom of floor / block 0)
// phase 1 : glass tower
const TW = 680;
const FH1 = 27;
const P1 = 31;
const FACADE_TOP = BASE - (NF - 1) * P1 - FH1; // 229
const CROWN_H = 158;
const CROWN_Y0 = FACADE_TOP - 7 - CROWN_H; // 64
// phase 2 : stack of 25 blocks
const BW = 340;
const BH = 32;
const P2 = 37;
const STACK_TOP = BASE - (NF - 1) * P2 - BH; // 80
const ONE_TOP = BASE - P2; // 963 : bottom edge of block 1 (top of the gold block gap)
const LBX = 960 - BW / 2 - 50; // 740
const RBX = 960 + BW / 2 + 50; // 1180
const TICK = 22;
// medals
const MED_R = 140;
const MED_L = 300;
const ANCHOR_Y = FACADE_TOP + 3;

const LETTERS = ["L", "T", "C", "M"];
const T_EMP = "EMPRUNT\u00c9S";
const T_MIS = "MIS\u00c9S";
const T_ONE = "1 $ \u00c0 LUI";
const GLASS = "linear-gradient(90deg, #1C344D 0%, #33587E 42%, #2B4C6E 58%, #18304A 100%)";

const Scene8: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.6) % 120;
  const gy = (frame * 0.35) % 120;
  const breathe = 0.16 + 0.06 * Math.sin(frame * 0.06);

  // ---------- phase 1 : tower ----------
  const tilt = 9 * (1 - prog(frame, 0, 50));
  const push = 1 + 0.03 * prog(frame, 105, 45) - 0.03 * prog(frame, 156, 24);
  const groundIn = prog(frame, -8, 20);
  const groundW = (1080 - 720 * prog(frame, 164, 18)) * groundIn;
  const crownIn = prog(frame, 34, 16);
  const crownOut = prog(frame, 157, 12);
  const medOut = prog(frame, 155, 14);
  const sheen1 = interpolate(frame, [10, 62], [200, 1800], CLAMP);
  const sheen2 = interpolate(frame, [104, 150], [200, 1800], CLAMP);

  // ---------- phase 2 : stack ----------
  const amp = interpolate(frame, [178, 215, 299], [0, 5, 19], CLAMP);
  const swayS = Math.sin(frame * 0.13) + 0.25 * Math.sin(frame * 0.31 + 1);
  const goldIn = prog(frame, 166, 10);
  const navyDim = 1 - 0.22 * prog(frame, 246, 14);
  const goldGlow = 0.3 * goldIn + bump(frame, 257, 5, 20) + 0.8 * bump(frame, 277, 5, 18);

  const lb = prog(frame, 181, 14);
  const lbTicks = prog(frame, 191, 6);
  const lbl24 = prog(frame, 183, 12);
  const chip24 = prog(frame, 188, 12);

  const rb = interpolate(frame, [198, 221], [0, 1], CLAMP);
  const rbOn = frame >= 198 ? 1 : 0;
  const rbTop = prog(frame, 220, 8);
  const lbl25 = prog(frame, 198, 8);
  const chip25 = prog(frame, 204, 12);
  const count = Math.max(1, Math.min(25, Math.ceil(rb * 25)));

  const one = prog(frame, 255, 12);
  const conn = prog(frame, 259, 10);

  const lbMid = (STACK_TOP + ONE_TOP) / 2;
  const lbHalf = ((ONE_TOP - STACK_TOP) / 2) * lb;
  const rbMid = (STACK_TOP + BASE) / 2;

  const floors = Array.from({ length: NF }).map((_, i) => {
    const r = prog(frame, i * 1.2 - 11, 12);
    const m = prog(frame, 163, 16);
    const mc = prog(frame, 163 + i * 0.4, 14);
    const w = TW + (BW - TW) * m;
    const h = FH1 + (BH - FH1) * m;
    const bottom = BASE - i * (P1 + (P2 - P1) * m);
    const dx = amp * Math.pow(i / 24, 1.5) * swayS;
    const rot = ((amp * 1.5 * Math.sqrt(i / 24)) / 888) * swayS * 57.3 * 0.7;
    const left = 960 - w / 2 + dx;
    const top = bottom - h + (1 - r) * 70;
    const flash = i === 0 ? 0 : interpolate(frame, [181 + i * 0.45, 184 + i * 0.45, 196 + i * 0.45], [0, 0.5, 0], CLAMP);
    const ti = 198 + (23 * (i + 1)) / 25 - 0.9;
    const cnt = interpolate(frame, [ti, ti + 2, ti + 11], [0, 1, 0], CLAMP);
    const rise = (BASE - bottom) * 0.42;
    return (
      <div
        key={i}
        id={`block-8-f${i}`}
        style={{
          position: "absolute",
          left,
          top,
          width: w,
          height: h,
          opacity: r,
          overflow: "hidden",
          transform: `rotate(${rot}deg)`,
          boxShadow: i === 0 ? `0 0 ${Math.round(70 * goldGlow)}px ${Math.round(14 * goldGlow)}px rgba(242,201,76,${Math.min(0.85, 0.85 * goldGlow)})` : "none",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: 1 - mc, background: GLASS, borderTop: "2px solid rgba(255,255,255,0.38)", boxSizing: "border-box" }}>
          {Array.from({ length: 10 }).map((__, k) => {
            const lit = seededRandom("lit8", i * 10 + k) > 0.85;
            return (
              <div key={k} style={{ position: "absolute", left: `${k * 10}%`, top: 0, width: "10%", height: "100%", borderLeft: k === 0 ? "none" : "2px solid rgba(255,255,255,0.2)", background: lit ? "rgba(170,210,255,0.16)" : "transparent", boxSizing: "border-box" }} />
            );
          })}
          <div style={{ position: "absolute", left: sheen1 - (960 - TW / 2) - rise - 70, top: 0, width: 140, height: "100%", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0) 100%)" }} />
          <div style={{ position: "absolute", left: sheen2 - (960 - TW / 2) - rise - 70, top: 0, width: 140, height: "100%", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0) 100%)" }} />
        </div>
        {i === 0 ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: goldIn, background: GOLD, borderTop: "3px solid #FFE596", boxSizing: "border-box" }} />
        ) : (
          <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity: mc * navyDim, background: NAVY, borderTop: "3px solid #5E86AD", boxSizing: "border-box" }} />
        )}
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: "#FFFFFF", opacity: flash }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", border: "3px solid #FFFFFF", boxSizing: "border-box", opacity: cnt }} />
      </div>
    );
  });

  const medal = (k: number) => {
    const start = k === 0 ? 80 : 88;
    const t = frame - start;
    const a0 = k === 0 ? 78 : -78;
    const ang = t < 0 ? a0 : a0 * Math.exp(-t / 15) * Math.cos(t * 0.21);
    const op = t < 0 ? 0 : prog(frame, start, 5) * (1 - medOut);
    const ax = 960 + (k === 0 ? -170 : 170);
    const gl = interpolate(frame, [95 + k * 5, 113 + k * 5], [-260, 260], CLAMP);
    return (
      <div key={k} style={{ position: "absolute", left: ax, top: ANCHOR_Y + medOut * 160, width: 0, height: 0, opacity: op, transform: `rotate(${ang}deg)`, transformOrigin: "0px 0px" }}>
        <svg id={`medal-8-m${k}x`} width={320} height={480} viewBox="0 0 320 480" style={{ position: "absolute", left: -160, top: -20, overflow: "visible", filter: "drop-shadow(0px 16px 18px rgba(0,0,0,0.55))" }}>
          <defs>
            <clipPath id={`mclip-8-${k}`}>
              <circle cx={160} cy={20 + MED_L} r={MED_R} />
            </clipPath>
          </defs>
          <rect x={136} y={20} width={48} height={MED_L - MED_R + 10} fill="#FFFFFF" />
          <rect x={155} y={20} width={10} height={MED_L - MED_R + 10} fill={GOLD} />
          <rect x={126} y={12} width={68} height={20} fill={GOLD_D} />
          <circle cx={160} cy={20 + MED_L} r={MED_R} fill={GOLD} />
          <circle cx={160} cy={20 + MED_L} r={MED_R - 13} fill="none" stroke={GOLD_D} strokeWidth={5} />
          <circle cx={160} cy={20 + MED_L} r={MED_R - 26} fill="#E2B53E" />
          <path d={`M ${160 - 82} ${20 + MED_L + 52} A 96 96 0 0 0 ${160 + 82} ${20 + MED_L + 52}`} fill="none" stroke={GOLD_D} strokeWidth={4} />
          <path d={`M ${160 - 82} ${20 + MED_L - 52} A 96 96 0 0 1 ${160 + 82} ${20 + MED_L - 52}`} fill="none" stroke={GOLD_D} strokeWidth={4} />
          <g clipPath={`url(#mclip-8-${k})`}>
            <rect x={160 + gl - 30} y={20 + MED_L - 200} width={60} height={400} fill="#FFFFFF" opacity={0.6} transform={`rotate(25 160 ${20 + MED_L})`} />
          </g>
        </svg>
        <Box x={0} y={MED_L} w={220} h={80}>
          <Text id={`nobel-8-n${k}q`} text="NOBEL" width={220} height={80} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#5C460C", letterSpacing: 3 }} />
        </Box>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 50% 52%, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 58%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const s = 44 + seededRandom("sq8s", i) * 40;
          const x = 60 + seededRandom("sq8x", i) * 1800;
          const sp = 0.5 + seededRandom("sq8v", i) * 0.7;
          const y = (((seededRandom("sq8y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="none" stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={2} transform={`rotate(${frame * 0.3 * (i % 2 ? 1 : -1)} ${x + s / 2} ${y + s / 2})`} />;
        })}
      </svg>

      {/* ground */}
      <Box x={960} y={BASE + 6} w={Math.max(2, groundW)} h={4} style={{ background: "#FFFFFF", opacity: 0.75 }} />

      {/* tower / stack world (tilt + camera push) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "960px 540px", transform: `scale(${push})` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `960px ${BASE}px`, transform: `perspective(1800px) rotateY(${tilt}deg)` }}>
        {floors}

        {/* crown with LTCM */}
        <div
          id="crown-8-ltcm"
          style={{
            position: "absolute",
            left: 960 - TW / 2,
            top: CROWN_Y0,
            width: TW,
            height: CROWN_H,
            background: "#0B0F14",
            border: "3px solid #FFFFFF",
            boxSizing: "border-box",
            overflow: "hidden",
            opacity: crownIn * (1 - crownOut),
            transform: `translateY(${(1 - crownIn) * 60 + crownOut * 30}px) scale(${1 - 0.08 * crownOut})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {LETTERS.map((L, k) => {
            const lp = prog(frame, 60 + k * 3, 10);
            return (
              <div key={k} style={{ transform: `translateY(${(1 - lp) * 130}px)`, opacity: lp, margin: "0 -10px" }}>
                <Text id={`ltcm-8-l${k}`} text={L} width={150} height={140} sizeGroup={{ texts: LETTERS }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
              </div>
            );
          })}
        </div>

        {medal(0)}
        {medal(1)}
      </div>
      </div>

      {/* phase 2 brackets */}
      <svg id="brackets-8-br" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <g stroke="#FFFFFF" strokeWidth={3} fill="none">
          <line x1={LBX} y1={lbMid - lbHalf} x2={LBX} y2={lbMid + lbHalf} opacity={lb > 0 ? 1 : 0} />
          <line x1={LBX} y1={STACK_TOP} x2={LBX + TICK} y2={STACK_TOP} opacity={lbTicks} />
          <line x1={LBX} y1={ONE_TOP} x2={LBX + TICK} y2={ONE_TOP} opacity={lbTicks} />
          <line x1={LBX - TICK} y1={lbMid} x2={LBX} y2={lbMid} opacity={lb} />
          <line x1={RBX} y1={BASE} x2={RBX} y2={BASE - (BASE - STACK_TOP) * rb} opacity={rbOn} />
          <line x1={RBX - TICK} y1={BASE} x2={RBX} y2={BASE} opacity={rbOn} />
          <line x1={RBX - TICK} y1={STACK_TOP} x2={RBX} y2={STACK_TOP} opacity={rbTop} />
          <line x1={RBX} y1={rbMid} x2={RBX + TICK} y2={rbMid} opacity={rbTop} />
        </g>
        <line x1={700} y1={BASE - BH / 2} x2={700 + (960 - BW / 2 - 700) * conn} y2={BASE - BH / 2} stroke={GOLD} strokeWidth={4} opacity={conn > 0 ? 1 : 0} />
      </svg>

      {/* left labels : 24 $ EMPRUNTES */}
      <Box x={LBX - 40 - 175} y={470} w={350} h={170} style={{ opacity: lbl24, transform: `translateX(${(1 - lbl24) * 50}px)` }}>
        <Text id="lbl-24-8-a1" text="24" width={200} height={170} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        <Text id="lbl-24d-8-a2" text="$" width={150} height={170} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
      </Box>
      <Box x={LBX - 40 - 230} y={612} w={460} h={104} style={{ opacity: chip24, transform: `translateX(${(1 - chip24) * 50}px)` }}>
        <div id="chip-emp-8-b2" style={{ background: NAVY, borderTop: "3px solid #5E86AD", display: "flex", width: 460, height: 104, alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
          <Text id="txt-emp-8-c3" text={T_EMP} width={440} height={96} sizeGroup={{ texts: [T_EMP, T_MIS] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
        </div>
      </Box>

      {/* right labels : 25 $ MISES */}
      <Box x={RBX + 40 + 175} y={470} w={350} h={170} style={{ opacity: lbl25, transform: `translateX(${(1 - lbl25) * -50}px)` }}>
        <Text id="lbl-25-8-d4" text={`${count}`} width={200} height={170} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        <Text id="lbl-25d-8-d5" text="$" width={150} height={170} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
      </Box>
      <Box x={RBX + 40 + 230} y={612} w={460} h={104} style={{ opacity: chip25, transform: `translateX(${(1 - chip25) * -50}px)` }}>
        <div id="chip-mis-8-e5" style={{ background: "#FFFFFF", display: "flex", width: 460, height: 104, alignItems: "center", justifyContent: "center" }}>
          <Text id="txt-mis-8-f6" text={T_MIS} width={440} height={96} sizeGroup={{ texts: [T_EMP, T_MIS] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
        </div>
      </Box>

      {/* bottom-left : 1 $ A LUI */}
      <Box x={490} y={BASE - BH / 2} w={420} h={84} style={{ opacity: one, transform: `translateX(${(1 - one) * -60}px)` }}>
        <div id="chip-one-8-g7" style={{ background: GOLD, display: "flex", width: 420, height: 84, alignItems: "center", justifyContent: "center" }}>
          <Text id="txt-one-8-h8" text={T_ONE} width={400} height={78} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene8;
