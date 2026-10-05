import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill, Easing, Img, staticFile } from "remotion";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";

type ArrowProps = { id: string; startX: number; startY: number; endX: number; endY: number; curveX?: number; curveY?: number; progress?: number; color?: string; strokeWidth?: number; dashed?: boolean; arrowLen?: number; arrowWidth?: number; };
type TextProps = { id: string; text: string; width: number; height: number; multiline?: boolean; padding?: number; lineHeight?: number; minSize?: number; maxSize?: number; className?: string; textStyles?: React.CSSProperties; align?: "left" | "center" | "right" | "justify"; typing?: { startFrame: number; endFrame: number; showCursor?: boolean; cursorChar?: string; cursorBlinkRate?: number; }; sizeGroup?: { texts: string[]; pickFontSize?: "min" | "max"; }; };
type SeededRandomFn = (seed: string, n: number) => number;

const { fontFamily: JOST } = loadJost("normal", { weights: ["400", "700", "900"], subsets: ["latin", "latin-ext"] });

const GOLD = "#F2C94C";
const GREY = "#8A8A8A";
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
// LTCM block
const BW = 520;
const BH = 270;
const Y0 = 360; // block centre at frame 0 (already sinking)
const Y_SUNK = 705; // deepest point
const Y_FIN = 400; // rescued position
// water surface
const W_START = 900;
const W_HIGH = 690;
const W_END = 812;
// ring of 14 banks (open at the bottom, where the water is)
const NB = 14;
const BK = 128;
const RCX = 960;
const RCY = 425;
const RX = 780;
const RY = 300;
const RING: { x: number; y: number }[] = (() => {
  const th0 = (140 * Math.PI) / 180;
  const th1 = (400 * Math.PI) / 180;
  const N = 1400;
  const pts: { x: number; y: number }[] = [];
  const cum: number[] = [0];
  for (let i = 0; i <= N; i++) {
    const th = th0 + ((th1 - th0) * i) / N;
    const p = { x: RCX + RX * Math.cos(th), y: RCY + RY * Math.sin(th) };
    if (i > 0) {
      const q = pts[i - 1];
      cum.push(cum[i - 1] + Math.hypot(p.x - q.x, p.y - q.y));
    }
    pts.push(p);
  }
  const total = cum[N];
  const out: { x: number; y: number }[] = [];
  let j = 0;
  for (let k = 0; k < NB; k++) {
    const target = (total * k) / (NB - 1);
    while (j < N && cum[j] < target) j++;
    out.push(pts[j]);
  }
  return out;
})();
const BANK_T0 = 58; // "reunir"
const BANK_STEP = 2;

// bottom label
const LA_W = 600;
const LB_W = 960;
const L_H = 104;
const L_Y = 980;
const ROW_LEFT = 960 - (LA_W + LB_W) / 2;
const T_A = "NEW YORK FED :";
const T_B = "14 BANQUES, 3,6 MILLIARDS $";

const GLASS = "linear-gradient(90deg, #1C344D 0%, #33587E 42%, #2B4C6E 58%, #18304A 100%)";

const Scene11: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: SeededRandomFn;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.6) % 120;
  const gy = (frame * 0.35) % 120;
  const breathe = 0.15 + 0.06 * Math.sin(frame * 0.07);

  // ---------- timing ----------
  const sink = interpolate(frame, [0, 58], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const inWater = prog(frame, 22, 20);
  const tg = prog(frame, 88, 7); // lines tighten ("pour")
  const lp = prog(frame, 94, 22); // lift ("le sauver")
  const settle = prog(frame, 104, 15);

  // nudges : each attached line yanks the block up a little
  let nudge = 0;
  for (let i = 0; i < NB; i++) nudge += 3 * prog(frame, BANK_T0 + i * BANK_STEP + 8, 5);

  const bob = 5 * Math.sin(frame * 0.16) * inWater;
  const yPre = Y0 + (Y_SUNK - Y0) * sink - nudge + bob;
  const yPost = Y_FIN + 4 * Math.sin(frame * 0.1) * settle;
  const by = yPre + (yPost - yPre) * lp;
  const bx = 960;
  const rotPre = 9 * sink + 1.8 * Math.sin(frame * 0.14) * inWater - 0.12 * nudge;
  const rotPost = 0.5 * Math.sin(frame * 0.09) * settle;
  const rot = rotPre + (rotPost - rotPre) * lp;
  const grey = 0.75 * prog(frame, 8, 40) * (1 - prog(frame, 94, 14));
  const blockGlow = bump(frame, 100, 4, 16);

  // water level
  const wq = interpolate(frame, [0, 56], [0, 1], { ...CLAMP, easing: Easing.out(Easing.quad) });
  const W = W_START + (W_HIGH - W_START) * wq - 10 * prog(frame, 56, 30) + (W_END - W_HIGH + 10) * prog(frame, 93, 24);
  const surf = (x: number) => W + 7 * Math.sin(x * 0.011 + frame * 0.13) + 4 * Math.sin(x * 0.029 - frame * 0.08 + 1.3);
  const surf2 = (x: number) => W - 6 + 6 * Math.sin(x * 0.008 - frame * 0.1 + 2.1);
  const xs = Array.from({ length: 49 }).map((_, i) => i * 40);
  const wavePath = `M 0 ${surf(0)} ` + xs.map((x) => `L ${x} ${surf(x)}`).join(" ") + ` L 1920 1080 L 0 1080 Z`;
  const wave2Path = `M 0 ${surf2(0)} ` + xs.map((x) => `L ${x} ${surf2(x)}`).join(" ") + ` L 1920 1080 L 0 1080 Z`;
  const surfLine = xs.map((x) => `${x},${surf(x)}`).join(" ");

  // camera push at the end
  const cam = 1 + 0.02 * prog(frame, 98, 21);
  const camT = `scale(${cam})`;

  // ---------- banks + lines ----------
  const pull = 10 * bump(frame, 88, 4, 10);
  const goldLines = bump(frame, 92, 4, 18);
  const lineWhite = tg;
  const banks = RING.map((p, i) => {
    const s = BANK_T0 + i * BANK_STEP;
    const dxr = p.x - RCX;
    const dyr = p.y - RCY;
    const dr = Math.hypot(dxr, dyr) || 1;
    return { x: p.x + (dxr / dr) * pull, y: p.y + (dyr / dr) * pull, s };
  });

  const lines = banks.map((b, i) => {
    const p = prog(frame, b.s + 2, 7);
    if (p <= 0) return null;
    const dx = bx - b.x;
    const dy = by - b.y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const sag = len * 0.08 * (1 - tg);
    const cx = (b.x + bx) / 2 + nx * sag;
    const cy = (b.y + by) / 2 + ny * sag;
    const qx = b.x + (cx - b.x) * p;
    const qy = b.y + (cy - b.y) * p;
    const rx = (1 - p) * (1 - p) * b.x + 2 * (1 - p) * p * cx + p * p * bx;
    const ry = (1 - p) * (1 - p) * b.y + 2 * (1 - p) * p * cy + p * p * by;
    const d = `M ${b.x} ${b.y} Q ${qx} ${qy} ${rx} ${ry}`;
    return (
      <g key={i}>
        <path d={d} stroke={GOLD} strokeWidth={12} strokeOpacity={0.35 * goldLines} fill="none" />
        <path d={d} stroke={GREY} strokeWidth={3} fill="none" strokeOpacity={0.9} />
        <path d={d} stroke="#FFFFFF" strokeWidth={4} fill="none" strokeOpacity={lineWhite} />
        <path d={d} stroke={GOLD} strokeWidth={5} fill="none" strokeOpacity={goldLines} />
      </g>
    );
  });

  // ripples where the block enters / leaves the water
  const ripple = (start: number, k: number) => {
    const t = interpolate(frame, [start, start + 26], [0, 1], { ...CLAMP, easing: Easing.out(Easing.quad) });
    const op = frame < start ? 0 : 0.55 * (1 - t);
    const r = 260 + 520 * t;
    return <ellipse key={`rp${start}-${k}`} cx={960} cy={W + 2} rx={r} ry={r * 0.07} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeOpacity={op} />;
  };

  // ---------- label ----------
  const aIn = prog(frame, 13, 10);
  const bIn = prog(frame, 62, 14);
  const wipe = interpolate(frame, [64, 86], [0, 1], { ...CLAMP, easing: Easing.out(Easing.quad) });
  const shift = (1 - bIn) * (LB_W / 2);
  const chipFlash = bump(frame, 100, 4, 14);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 50% 40%, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 60%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const s = 44 + seededRandom("sq11s", i) * 40;
          const x = 60 + seededRandom("sq11x", i) * 1800;
          const sp = 0.5 + seededRandom("sq11v", i) * 0.7;
          const y = (((seededRandom("sq11y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="none" stroke="#FFFFFF" strokeOpacity={0.06} strokeWidth={2} transform={`rotate(${frame * 0.3 * (i % 2 ? 1 : -1)} ${x + s / 2} ${y + s / 2})`} />;
        })}
      </svg>

      {/* world layer 1 : lines + block */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "960px 440px", transform: camT }}>
        <svg id="lines-11-k3v8" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {lines}
        </svg>

        <div
          id="block-11-ltcm"
          style={{
            position: "absolute",
            left: bx - BW / 2,
            top: by - BH / 2,
            width: BW,
            height: BH,
            transform: `rotate(${rot}deg)`,
            filter: `grayscale(${grey}) brightness(${1 - 0.3 * grey})`,
            boxShadow: `0 0 ${Math.round(90 * blockGlow)}px ${Math.round(18 * blockGlow)}px rgba(242,201,76,${0.8 * blockGlow})`,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH, background: GLASS, border: "4px solid #FFFFFF", boxSizing: "border-box", overflow: "hidden" }}>
            {Array.from({ length: 5 }).map((_, k) => (
              <div key={`fl${k}`} style={{ position: "absolute", left: 0, top: (k + 1) * (BH / 6), width: BW, height: 2, background: "rgba(255,255,255,0.12)" }} />
            ))}
            {Array.from({ length: 7 }).map((_, k) => (
              <div key={`mu${k}`} style={{ position: "absolute", left: (k + 1) * (BW / 8), top: 0, width: 2, height: BH, background: "rgba(255,255,255,0.08)" }} />
            ))}
            <div style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH, border: `4px solid ${GOLD}`, boxSizing: "border-box", opacity: blockGlow }} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, width: BW, height: BH, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="ltcm-11-t0" text="LTCM" width={BW - 60} height={200} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
          </div>
        </div>
      </div>

      {/* dark rising water (in front of the block) */}
      <svg id="water-11-w5q1" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="wgrad-11" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14304B" stopOpacity={0.84} />
            <stop offset="45%" stopColor="#0A1A2A" stopOpacity={0.93} />
            <stop offset="100%" stopColor="#03070C" stopOpacity={0.98} />
          </linearGradient>
        </defs>
        <path d={wave2Path} fill="#2E4F70" fillOpacity={0.22} />
        <path d={wavePath} fill="url(#wgrad-11)" />
        {Array.from({ length: 5 }).map((_, k) => {
          const yy = W + 70 + k * 70 + ((frame * 0.5) % 70);
          return <line key={`dl${k}`} x1={0} y1={yy} x2={1920} y2={yy} stroke="#FFFFFF" strokeOpacity={0.035} strokeWidth={2} />;
        })}
        <polyline points={surfLine} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeOpacity={0.55} />
        {ripple(22, 0)}
        {ripple(29, 1)}
        {ripple(93, 2)}
        {ripple(99, 3)}
      </svg>

      {/* world layer 2 : banks (same camera) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "960px 440px", transform: camT }}>
        {banks.map((b, i) => {
          const a = prog(frame, b.s, 8);
          const op = interpolate(frame, [b.s, b.s + 3], [0, 1], CLAMP);
          const fl = 0.7 * bump(frame, b.s, 2, 6);
          const sz = BK + 40 * prog(frame, b.s, 8);
          const gl = goldLines;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: b.x - sz / 2, top: b.y - sz / 2, width: sz, height: sz, border: "3px solid #FFFFFF", boxSizing: "border-box", opacity: fl }} />
              <div
                style={{
                  position: "absolute",
                  left: b.x - BK / 2,
                  top: b.y - BK / 2,
                  width: BK,
                  height: BK,
                  opacity: op,
                  transform: `scale(${0.45 + 0.55 * a})`,
                  filter: `drop-shadow(0px 0px ${Math.round(4 + 22 * gl)}px rgba(242,201,76,${0.25 + 0.6 * gl}))`,
                }}
              >
                <Img id={`img-bank-11-b${i}`} src={staticFile("bank.svg")} style={{ position: "absolute", left: 0, top: 0, width: BK, height: BK }} />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* bottom label : NEW YORK FED : 14 BANQUES, 3,6 MILLIARDS $ */}
      <div style={{ position: "absolute", left: ROW_LEFT + shift, top: L_Y - L_H / 2, width: LA_W + LB_W, height: L_H }}>
        <div
          id="chip-fed-11-a1"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: LA_W,
            height: L_H,
            background: "#000000",
            border: "3px solid #FFFFFF",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: aIn,
            transform: `translateY(${(1 - aIn) * 40}px)`,
          }}
        >
          <Text id="txt-fed-11-a2" text={T_A} width={LA_W - 40} height={88} maxSize={58} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
        </div>
        <div
          id="chip-banks-11-b1"
          style={{
            position: "absolute",
            left: LA_W,
            top: 0,
            width: LB_W,
            height: L_H,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: bIn > 0 ? 1 : 0,
            clipPath: `inset(0px ${(1 - wipe) * 100}% 0px 0px)`,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: LB_W, height: L_H, background: GOLD, opacity: chipFlash }} />
          <div style={{ position: "relative" }}>
            <Text id="txt-banks-11-b2" text={T_B} width={LB_W - 40} height={88} maxSize={58} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene11;
