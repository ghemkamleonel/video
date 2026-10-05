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
const CXL = 520; // left panel centre
const CXR = 1400; // right panel centre
const PLATE_W = 680;
const PLATE_TOP = 162;
const PLATE_BOT = 1032;
const TITLE_Y = 94;
const TITLE_W = 620;
const TITLE_H = 108;
const BAN_Y = 212;
const BAN_W = 620;
const BAN_H = 80;
const BAN_BOT = BAN_Y + BAN_H / 2; // 252
const T = 50; // tile size
const G = 8; // gap
const STEP = T + G;
const GRID_W = 10 * T + 9 * G; // 572
const GRID_TOP = 276;
const GRID_BOT = GRID_TOP + GRID_W; // 848
const CNT_Y = 944;
const CNT_H = 150;
const FLIGHT = 12;

// fill schedules (fill index 0 = bottom-left tile, row after row upward)
const L_N = 94;
const L_S0 = 58;
const L_DT = 0.8;
const L_LOCK = 134;
const R_N = 21;
const R_S0 = 175;
const R_DT = 1.1;
const R_LOCK = 199;

const T_RULE = "R\u00c8GLE DES 20 %";
const T_REAL = "EN R\u00c9ALIT\u00c9";
const T_BAN = "250 $";
const L_FINAL = "~94";
const R_FINAL = "21";

const Scene7: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.6) % 120;
  const gy = (frame * 0.35) % 120;
  const breathe = 0.15 + 0.06 * Math.sin(frame * 0.06);
  const focusX = interpolate(frame, [150, 175], [CXL, CXR], { ...CLAMP, easing: EASE });
  const glowX = frame > 205 ? interpolate(frame, [205, 228], [focusX, 960], { ...CLAMP, easing: EASE }) : focusX;

  // ---------- panel focus ----------
  const rightOn = prog(frame, 160, 14);
  const leftDim = 1 - 0.32 * prog(frame, 162, 12) + 0.32 * prog(frame, 207, 14);
  const divider = prog(frame, 0, 26);

  const lCount = Math.max(0, Math.min(L_N, Math.floor((frame - L_S0) / L_DT) + 1));
  const rCount = Math.max(0, Math.min(R_N, Math.floor((frame - R_S0) / R_DT) + 1));

  const tiles = (side: "L" | "R") => {
    const cx = side === "L" ? CXL : CXR;
    const n = side === "L" ? L_N : R_N;
    const s0 = side === "L" ? L_S0 : R_S0;
    const dt = side === "L" ? L_DT : R_DT;
    const delay = side === "L" ? -14 : -9;
    const els: React.ReactNode[] = [];
    const ghosts: React.ReactNode[] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = (9 - r) * 10 + c;
        const x = cx - GRID_W / 2 + c * STEP;
        const y = GRID_TOP + r * STEP;
        const appear = prog(frame, delay + (r + c) * 0.8, 10);
        const filled = idx < n;
        const s = s0 + idx * dt;
        const g = filled ? prog(frame, s, 7) : 0;
        const flash = filled ? bump(frame, s, 1, 7) : 0;
        const pulse = side === "R" && filled ? bump(frame, 208 + c * 0.6, 4, 16) : 0;
        els.push(
          <div
            key={`${side}${idx}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: T,
              height: T,
              opacity: appear,
              transform: `translateY(${(1 - appear) * 30}px) scale(${0.7 + 0.3 * appear})`,
              background: "#272727",
              border: "2px solid rgba(255,255,255,0.10)",
              boxSizing: "border-box",
              boxShadow: g > 0 ? `0 0 ${Math.round(10 + 26 * (flash + pulse))}px rgba(242,201,76,${0.25 + 0.55 * (flash + pulse)})` : "none",
            }}
          >
            {g > 0 ? (
              <div style={{ position: "absolute", left: -2, top: -2, width: T, height: T, background: GOLD, borderTop: "4px solid #FFE596", boxSizing: "border-box", transform: `scale(${0.35 + 0.65 * g})`, opacity: Math.min(1, g * 1.6) }} />
            ) : null}
            {flash > 0 ? <div style={{ position: "absolute", left: -2, top: -2, width: T, height: T, background: "#FFFFFF", opacity: flash * 0.85 }} /> : null}
          </div>
        );
        if (filled) {
          const t = frame - s;
          if (t >= 0 && t <= FLIGHT) {
            const p = interpolate(t, [0, FLIGHT], [0, 1], { ...CLAMP, easing: Easing.bezier(0.5, 0, 0.75, 0.4) });
            const size = T * (1 - 0.35 * p);
            const gyy = y + T / 2 + (BAN_BOT + size / 2 - (y + T / 2)) * p;
            const op = interpolate(t, [0, 2, FLIGHT - 2, FLIGHT], [0, 0.95, 0.9, 0], CLAMP);
            const tail = Math.min(y + T / 2 - gyy, 24 + 110 * p);
            ghosts.push(
              <div key={`g${side}${idx}`} style={{ position: "absolute", left: x + T / 2 - size / 2, top: gyy - size / 2, width: size, height: size, opacity: op }}>
                <div style={{ position: "absolute", left: size * 0.2, top: size * 0.5, width: size * 0.6, height: Math.max(0, tail), background: "linear-gradient(180deg, rgba(242,201,76,0.75) 0%, rgba(242,201,76,0) 100%)" }} />
                <div style={{ position: "absolute", left: 0, top: 0, width: size, height: size, background: GOLD, borderTop: "3px solid #FFF3C4", boxSizing: "border-box", boxShadow: "0 0 18px 4px rgba(242,201,76,0.6)" }} />
              </div>
            );
          }
        }
      }
    }
    return { els, ghosts };
  };

  const hits = (side: "L" | "R") => {
    const n = side === "L" ? L_N : R_N;
    const s0 = side === "L" ? L_S0 : R_S0;
    const dt = side === "L" ? L_DT : R_DT;
    let h = 0;
    for (let i = 0; i < n; i++) {
      h += bump(frame, s0 + i * dt + FLIGHT - 1, 1, 9);
    }
    return Math.min(1, h * 0.3);
  };

  const panel = (side: "L" | "R") => {
    const cx = side === "L" ? CXL : CXR;
    const sign = side === "L" ? 1 : -1;
    const tilt = sign * 12 * (1 - prog(frame, side === "L" ? -4 : 0, 40));
    const plateIn = prog(frame, side === "L" ? -10 : -6, 20);
    const banIn = prog(frame, side === "L" ? -6 : -2, 16);
    const titleIn = side === "L" ? prog(frame, 21, 12) : prog(frame, 165, 12);
    const ruleBar = prog(frame, 35, 14);
    const cntIn = side === "L" ? prog(frame, 54, 10) : prog(frame, 170, 10);
    const lockF = side === "L" ? L_LOCK : R_LOCK;
    const locked = frame >= lockF;
    const lockP = prog(frame, lockF, 12);
    const lockFlash = bump(frame, lockF, 1, 10);
    const count = side === "L" ? lCount : rCount;
    const cntText = locked ? (side === "L" ? L_FINAL : R_FINAL) : `${count}`;
    const hit = hits(side);
    const banPulse = side === "L" ? bump(frame, 121, 5, 34) : bump(frame, 208, 5, 22);
    const banGlow = Math.min(1, hit + banPulse);
    const { els, ghosts } = tiles(side);
    const op = side === "L" ? leftDim : 0.3 + 0.7 * rightOn;
    const sat = side === "L" ? 1 : 0.15 + 0.85 * rightOn;
    const finalGlow = side === "R" ? bump(frame, 214, 4, 18) : 0;
    const cntCol = locked ? GOLD : "#FFFFFF";
    const cntShadow = lockFlash > 0 || finalGlow > 0 ? `0 0 ${Math.round(30 * Math.max(lockFlash, finalGlow))}px rgba(242,201,76,0.9)` : "none";

    return (
      <div
        key={side}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          opacity: op,
          filter: `saturate(${sat})`,
          transformOrigin: `${cx}px 560px`,
          transform: `perspective(2000px) rotateY(${tilt}deg)`,
        }}
      >
        {/* plate */}
        <div
          id={`plate-7-${side}p`}
          style={{
            position: "absolute",
            left: cx - PLATE_W / 2,
            top: PLATE_TOP,
            width: PLATE_W,
            height: PLATE_BOT - PLATE_TOP,
            background: side === "L" ? "rgba(242,201,76,0.035)" : "rgba(46,79,112,0.10)",
            border: "2px solid rgba(255,255,255,0.16)",
            boxSizing: "border-box",
            opacity: plateIn,
            transform: `scaleY(${0.6 + 0.4 * plateIn})`,
            transformOrigin: "50% 0%",
          }}
        />

        {/* ceiling banner */}
        <Box x={cx} y={BAN_Y} w={BAN_W} h={BAN_H} style={{ clipPath: `inset(0 ${(1 - banIn) * 50}% 0 ${(1 - banIn) * 50}%)` }}>
          <div
            id={`banner-7-${side}b`}
            style={{
              width: BAN_W,
              height: BAN_H,
              background: GOLD,
              borderBottom: "4px solid #FFE596",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 ${Math.round(16 + 50 * banGlow)}px ${Math.round(2 + 12 * banGlow)}px rgba(242,201,76,${0.25 + 0.6 * banGlow})`,
              filter: `brightness(${1 + 0.25 * banGlow})`,
            }}
          >
            <div style={{ transform: `scale(${1 + 0.08 * banPulse})` }}>
              <Text id={`ban-7-${side}t`} text={T_BAN} width={360} height={74} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000" }} />
            </div>
          </div>
        </Box>

        {/* grid */}
        <div id={`grid-7-${side}g`} style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
          {els}
          {ghosts}
        </div>

        {/* counter */}
        <Box x={cx} y={CNT_Y} w={560} h={CNT_H} style={{ opacity: cntIn, transform: `translateY(${(1 - cntIn) * 40}px) scale(${1 + 0.1 * lockFlash + 0.06 * finalGlow})` }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 560,
              height: CNT_H,
              border: `3px solid ${GOLD}`,
              boxSizing: "border-box",
              opacity: lockP,
              background: `rgba(242,201,76,${0.1 * lockP})`,
              clipPath: `inset(0 ${(1 - lockP) * 50}% 0 ${(1 - lockP) * 50}%)`,
            }}
          />
          <div style={{ position: "absolute", left: 0, top: 5, width: 560, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text
              id={`count-7-${side}c`}
              text={cntText}
              width={300}
              height={140}
              align="right"
              sizeGroup={{ texts: [L_FINAL, R_FINAL] }}
              textStyles={{ fontFamily: MONO, fontWeight: 700, color: cntCol, textShadow: cntShadow }}
            />
            <div style={{ width: 30, height: 10 }} />
            <Text id={`count-pct-7-${side}q`} text="%" width={160} height={140} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: cntCol, textShadow: cntShadow }} />
          </div>
        </Box>

        {/* title chip */}
        <Box x={cx} y={TITLE_Y} w={TITLE_W} h={TITLE_H} style={{ clipPath: `inset(0 ${(1 - titleIn) * 100}% 0 0)`, transform: `translateX(${(1 - titleIn) * -30 * sign}px)` }}>
          <div id={`title-7-${side}h`} style={{ width: TITLE_W, height: TITLE_H, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id={`title-txt-7-${side}k`} text={side === "L" ? T_RULE : T_REAL} width={TITLE_W - 30} height={100} sizeGroup={{ texts: [T_RULE, T_REAL] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          </div>
        </Box>
        {side === "L" ? (
          <div style={{ position: "absolute", left: cx - TITLE_W / 2, top: TITLE_Y + TITLE_H / 2, width: TITLE_W * ruleBar, height: 8, background: GOLD }} />
        ) : null}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at ${glowX}px 560px, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 40%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const s = 44 + seededRandom("sq7s", i) * 40;
          const x = 60 + seededRandom("sq7x", i) * 1800;
          const sp = 0.5 + seededRandom("sq7v", i) * 0.7;
          const y = (((seededRandom("sq7y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="none" stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={2} transform={`rotate(${frame * 0.3 * (i % 2 ? 1 : -1)} ${x + s / 2} ${y + s / 2})`} />;
        })}
        <line id="divider-7-dv" x1={960} y1={600 - 440 * divider} x2={960} y2={600 + 430 * divider} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={3} />
      </svg>

      {panel("L")}
      {panel("R")}
    </AbsoluteFill>
  );
};

export default Scene7;
