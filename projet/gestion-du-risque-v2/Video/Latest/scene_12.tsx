import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Easing, Img, staticFile } from "remotion";
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
const RED = "#E5534B";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
const bump = (f: number, s: number, up: number, down: number) =>
  interpolate(f, [s, s + up, s + up + down], [0, 1, 0], CLAMP);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// ---------- hourglass geometry (asset viewBox 240 x 360, aspect 2:3) ----------
const HG_W = 600;
const HG_H = 900;
const GLASS_D = "M60 36 H180 C180 110 136 150 126 180 C136 210 180 250 180 324 H60 C60 250 104 210 114 180 C104 150 60 110 60 36 Z";
const bez = (t: number, a: number, b: number, c: number, d: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};
const HW_TABLE = Array.from({ length: 201 }).map((_, i) => {
  const t = i / 200;
  return { y: bez(t, 36, 110, 150, 180), hw: bez(t, 180, 180, 136, 126) - 120 };
});
const halfW = (yy: number) => {
  const y = yy > 180 ? 360 - yy : yy;
  if (y <= 36) return 60;
  for (let i = 1; i < HW_TABLE.length; i++) {
    if (HW_TABLE[i].y >= y) {
      const a = HW_TABLE[i - 1];
      const b = HW_TABLE[i];
      const f = (y - a.y) / Math.max(1e-6, b.y - a.y);
      return a.hw + (b.hw - a.hw) * f;
    }
  }
  return 6;
};
type Pt = { x: number; y: number };
const TOP_CHIPS: Pt[] = [];
for (let k = 0; k < 17; k++) {
  const y = 174 - k * 8.6;
  for (let j = -7; j <= 7; j++) {
    const x = 120 + j * 10 + (k % 2 ? 5 : 0);
    if (Math.abs(x - 120) <= halfW(y) - 1.5) TOP_CHIPS.push({ x, y });
  }
}
const BOT_CHIPS: Pt[] = [];
for (let k = 0; k < 17; k++) {
  const y = 318 - k * 8.6;
  for (let j = -7; j <= 7; j++) {
    const x = 120 + j * 10 + (k % 2 ? 5 : 0);
    if (Math.abs(x - 120) <= halfW(y) - 1.5) BOT_CHIPS.push({ x, y });
  }
}
const CHIP_R = 4.6;

// ---------- bankroll chart geometry ----------
const NP = 121;
const X0 = 110;
const X1 = 1810;
const FLOOR = 950;
const H0 = 330;
const HEND = 760;
const Y0 = FLOOR - H0; // 620
const WAVE = 5;
const WAVE_S = 114;
const WAVE_E = 172;
const DIPS = [
  { c: 14, d: 200, r: 12 },
  { c: 36, d: 372, r: 14 },
  { c: 60, d: 300, r: 12 },
  { c: 82, d: 360, r: 12 },
  { c: 101, d: 262, r: 10 },
];
const xAt = (i: number) => X0 + (i / (NP - 1)) * (X1 - X0);

const buildBankroll = (rnd: SeededRandomFn) => {
  const hs: number[] = [];
  for (let i = 0; i < NP; i++) {
    const u = i / (NP - 1);
    const trend = H0 + (HEND - H0) * Math.pow(u, 1.15);
    const taper = Math.min(1, i / 4, (NP - 1 - i) / 4);
    const noise = (9 * Math.sin(i * 0.55) + 6 * Math.sin(i * 1.37 + 1) + (rnd("bank-12", i) - 0.5) * 12) * taper;
    let dip = 0;
    for (const d of DIPS) {
      const k = i - d.c;
      if (k < 0) continue;
      if (k <= 3) dip -= d.d * (k / 3);
      else dip -= d.d * Math.pow(Math.max(0, 1 - (k - 3) / d.r), 1.6);
    }
    hs.push(Math.max(55, trend + noise + dip));
  }
  return hs;
};
const isRedSeg = (i: number) => DIPS.some((d) => i >= d.c && i < d.c + 4);

const WORDS = ["ACHETER", "DU", "TEMPS"];

const Scene12: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---------- background ----------
  const gx = (frame * 0.7) % 120;
  const gy = (frame * 0.4) % 120;
  const breathe = 0.07 + 0.04 * Math.sin(frame * 0.07);
  const glowX = 960 + 260 * Math.sin(frame * 0.012);
  const glowA = 0.1 + 0.05 * Math.sin(frame * 0.05);

  // ---------- phase 1 : hourglass ----------
  const hgIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  const slide = prog(frame, 37, 16);
  const squash = prog(frame, 100, 12);
  const push = 1 + 0.035 * interpolate(frame, [0, 100], [0, 1], CLAMP);
  const hgX = 960 - 360 * slide + 360 * squash;
  const hgY = 540 + (Y0 - 540) * squash;
  const sx = (0.9 + 0.1 * hgIn) * push * (1 + (1700 / HG_W - 1) * squash);
  const sy = (0.9 + 0.1 * hgIn) * push * (1 - 0.99 * squash);
  const hgOp = (0.55 + 0.45 * hgIn) * (1 - prog(frame, 104, 6));
  const tempsGlow = bump(frame, 58, 5, 26);
  const hgTilt = -6 * (1 - hgIn);

  const topLevel = interpolate(frame, [-40, 112], [56, 150], CLAMP);
  const moundH = interpolate(frame, [-40, 112], [22, 92], CLAMP);
  const moundTop = 322 - moundH;
  const falling: { x: number; y: number; ry: number; k: number }[] = [];
  for (let k = 0; k < 90; k++) {
    const s = -60 + 2 * k;
    const a = frame - s;
    if (a < 0) continue;
    const y = 166 + 1.1 * a + 0.11 * a * a;
    if (y > moundTop + 4) continue;
    const jit = (seededRandom("chip-x-12", k) - 0.5) * 5;
    const x = 120 + jit * clamp01((y - 182) / 30) + jit * 0.3;
    const ry = CHIP_R * Math.max(0.28, Math.abs(Math.cos(a * 0.32 + seededRandom("chip-r-12", k) * 6)));
    falling.push({ x, y, ry, k });
  }

  // caption chips
  const capOut = prog(frame, 96, 8);
  const capIn = [prog(frame, 40, 8), prog(frame, 52, 7), prog(frame, 57, 8)];
  const capW = [640, 290, 480];
  const capBg = ["#FFFFFF", "#FFFFFF", GOLD];
  const capY = [346, 540, 734];
  const CAP_L = 990;

  // gold bar = compressed hourglass
  const barP = prog(frame, 101, 10);
  const barOp = barP * (1 - prog(frame, 114, 8));

  // ---------- phase 2 : bankroll line ----------
  const chartIn = prog(frame, 108, 6);
  const floorIn = prog(frame, 110, 14);
  const hs = buildBankroll(seededRandom);
  const head = interpolate(frame, [WAVE_S, WAVE_E], [0, NP - 1 + WAVE], CLAMP);
  const mAt = (i: number) => {
    const v = clamp01((head - i) / WAVE);
    return v * v * (3 - 2 * v);
  };
  // Points ahead of the wave wait at the level already reached (no cliff at the front).
  const shapedIdx = Math.max(0, Math.min(NP - 1, Math.floor(head - WAVE)));
  const aheadH = hs[shapedIdx];
  const disp = hs.map((h, i) => FLOOR - (aheadH + (h - aheadH) * mAt(i)));
  const front = Math.max(0, Math.min(NP - 1, head - WAVE));
  const fi = Math.floor(front);
  const ff = front - fi;
  const fj = Math.min(NP - 1, fi + 1);
  const tipX = xAt(front);
  const tipY = disp[fi] + (disp[fj] - disp[fi]) * ff;
  const tipRed = isRedSeg(fi) && front < NP - 2;
  let floorFlash = 0;
  for (const d of DIPS) {
    const minH = hs[d.c + 3];
    const w = clamp01((260 - minH) / 190);
    floorFlash = Math.max(floorFlash, w * Math.exp(-((front - (d.c + 3)) ** 2) / 6));
  }
  const endGlow = prog(frame, 166, 16);
  const pulse = 0.75 + 0.25 * Math.sin(frame * 0.18);
  const payBurst = interpolate(frame, [201, 228], [0, 1], CLAMP);
  const payFlash = bump(frame, 201, 4, 22);

  // ---------- final title ----------
  const dim = prog(frame, 172, 14);
  const titleIn = prog(frame, 174, 12);
  const titlePush = 1 + 0.03 * interpolate(frame, [186, 268], [0, 1], CLAMP);
  const underline = prog(frame, 200, 14);

  const segs = [] as React.ReactNode[];
  for (let i = 0; i < NP - 1; i++) {
    const shaped = mAt(i + 1) >= 0.999;
    const red = shaped && isRedSeg(i);
    segs.push(
      <line
        key={i}
        x1={xAt(i)}
        y1={disp[i]}
        x2={xAt(i + 1)}
        y2={disp[i + 1]}
        stroke={red ? RED : GOLD}
        strokeOpacity={shaped ? 1 : 0.45}
        strokeWidth={red ? 10 : shaped ? 8 : 5}
        strokeLinecap="round"
      />
    );
  }
  const tailPts = disp
    .map((y, i) => ({ x: xAt(i), y, i }))
    .filter((p) => p.i >= NP - 16)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1B1B1B 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id="bg-glow-12" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity={1} />
            <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={glowX} cy={540} rx={900} ry={520} fill="url(#bg-glow-12)" opacity={glowA * 0.5} />
        {Array.from({ length: 18 }).map((_, i) => {
          const x = i * 120 - 120 + gx;
          return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={1080} stroke="#FFFFFF" strokeOpacity={breathe} strokeWidth={2} />;
        })}
        {Array.from({ length: 11 }).map((_, i) => {
          const y = i * 120 - 120 + gy;
          return <line key={`h${i}`} x1={0} y1={y} x2={1920} y2={y} stroke="#FFFFFF" strokeOpacity={breathe} strokeWidth={2} />;
        })}
      </svg>

      {/* PHASE 1 : hourglass of gold chips */}
      <div
        id="hourglass-wrap-12-h4k8"
        style={{
          position: "absolute",
          left: hgX - HG_W / 2,
          top: hgY - HG_H / 2,
          width: HG_W,
          height: HG_H,
          opacity: hgOp,
          transform: `rotate(${hgTilt}deg) scale(${sx}, ${sy})`,
          filter: `drop-shadow(0 0 ${8 + 40 * tempsGlow}px rgba(242, 201, 76, ${0.25 + 0.5 * tempsGlow}))`,
        }}
      >
        <Img id="img-hourglass-12-q7w2" src={staticFile("hourglass.svg")} style={{ position: "absolute", left: 0, top: 0, width: HG_W, height: HG_H }} />
        <svg id="hourglass-chips-12-z3x9" viewBox="0 0 240 360" width={HG_W} height={HG_H} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <clipPath id="glass-clip-12">
              <path d={GLASS_D} />
            </clipPath>
          </defs>
          <path d={GLASS_D} fill="#1A1A1A" />
          <path d={GLASS_D} fill="#FFFFFF" fillOpacity={0.07} />
          <g clipPath="url(#glass-clip-12)">
            {TOP_CHIPS.map((c, i) => {
              const dip = 16 * Math.max(0, 1 - Math.abs(c.x - 120) / 45);
              if (c.y < topLevel + dip) return null;
              return (
                <g key={`t${i}`}>
                  <circle cx={c.x} cy={c.y} r={CHIP_R} fill={GOLD} stroke={GOLD_D} strokeWidth={0.9} />
                  <circle cx={c.x} cy={c.y} r={CHIP_R * 0.5} fill="none" stroke={GOLD_D} strokeWidth={0.8} />
                </g>
              );
            })}
            {BOT_CHIPS.map((c, i) => {
              const shape = Math.max(0.22, 1 - ((c.x - 120) / 62) ** 2);
              if (c.y < 322 - moundH * shape) return null;
              return (
                <g key={`b${i}`}>
                  <circle cx={c.x} cy={c.y} r={CHIP_R} fill={GOLD} stroke={GOLD_D} strokeWidth={0.9} />
                  <circle cx={c.x} cy={c.y} r={CHIP_R * 0.5} fill="none" stroke={GOLD_D} strokeWidth={0.8} />
                </g>
              );
            })}
            {falling.map((c) => (
              <ellipse key={`f${c.k}`} cx={c.x} cy={c.y} rx={CHIP_R} ry={c.ry} fill={GOLD} stroke={GOLD_D} strokeWidth={0.8} />
            ))}
          </g>
          <path d={GLASS_D} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinejoin="round" />
          <path d="M76 52 C80 90 96 120 108 140" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={6} fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* caption : ACHETER / DU / TEMPS */}
      {WORDS.map((w, i) => (
        <div
          key={w}
          style={{
            position: "absolute",
            left: CAP_L,
            top: capY[i] - 85,
            width: capW[i],
            height: 170,
            background: capBg[i],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: (capIn[i] > 0 ? 1 : 0) * (1 - capOut),
            clipPath: `inset(0 ${(1 - capIn[i]) * 100}% 0 0)`,
            transform: `translateX(${-40 * (1 - capIn[i]) + 90 * capOut}px)`,
          }}
        >
          <Text
            id={`caption-${w.toLowerCase()}-12-c${i}m5`}
            text={w}
            width={capW[i] - 20}
            height={150}
            textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }}
          />
        </div>
      ))}

      {/* compressed hourglass -> gold bar */}
      <div
        style={{
          position: "absolute",
          left: 960 - (1700 * barP) / 2,
          top: Y0 - 6,
          width: 1700 * barP,
          height: 12,
          background: GOLD,
          opacity: barOp,
          boxShadow: `0 0 30px ${GOLD}`,
        }}
      />

      {/* PHASE 2 : bankroll line */}
      <svg id="bankroll-chart-12-b8n1" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: chartIn }}>
        <defs>
          <linearGradient id="floor-grad-12" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={RED} stopOpacity={0.5} />
            <stop offset="100%" stopColor={RED} stopOpacity={0} />
          </linearGradient>
          <filter id="glow-12" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
        </defs>
        <g opacity={1 - 0.75 * dim}>
          {/* the bottom edge : ruin */}
          <rect x={960 - 860 * floorIn} y={FLOOR} width={1720 * floorIn} height={70} fill="url(#floor-grad-12)" opacity={0.35 + 0.65 * floorFlash} />
          <line x1={960 - 860 * floorIn} y1={FLOOR} x2={960 + 860 * floorIn} y2={FLOOR} stroke={RED} strokeWidth={4 + 4 * floorFlash} strokeOpacity={0.65 + 0.35 * floorFlash} />
          {segs}
          {endGlow > 0 && <polyline points={tailPts} fill="none" stroke={GOLD} strokeWidth={22} strokeOpacity={0.55 * endGlow} filter="url(#glow-12)" strokeLinejoin="round" />}
          {frame >= WAVE_S && endGlow < 1 && <circle cx={tipX} cy={tipY} r={14} fill={tipRed ? RED : GOLD} />}
        </g>
      </svg>

      {/* glowing end of the line (kept bright behind the title) */}
      <svg id="bankroll-tip-12-g2v6" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: endGlow }}>
        <defs>
          <filter id="tip-glow-12" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>
        <circle cx={xAt(NP - 1)} cy={disp[NP - 1]} r={44 + 10 * pulse + 20 * payFlash} fill={GOLD} opacity={0.55} filter="url(#tip-glow-12)" />
        <circle cx={xAt(NP - 1)} cy={disp[NP - 1]} r={18 + 6 * payFlash} fill={GOLD} />
        {payBurst > 0 && payBurst < 1 && (
          <circle cx={xAt(NP - 1)} cy={disp[NP - 1]} r={20 + 70 * payBurst} fill="none" stroke={GOLD} strokeWidth={5} opacity={1 - payBurst} />
        )}
      </svg>

      {/* FINAL TITLE */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: titleIn,
          transform: `scale(${(1.12 - 0.12 * titleIn) * titlePush})`,
        }}
      >
        <Text
          id="title-rester-12-t9r4"
          text="RESTER DANS LE JEU"
          width={1720}
          height={240}
          textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", textShadow: "0 0 40px rgba(0,0,0,0.9)" }}
        />
        <div style={{ width: 1500, height: 16, marginTop: 6, display: "flex" }}>
          <div id="title-underline-12-u1p0" style={{ width: 1500 * underline, height: 16, background: GOLD, boxShadow: `0 0 ${20 + 30 * payFlash}px ${GOLD}` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
