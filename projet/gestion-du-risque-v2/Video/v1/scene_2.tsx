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
const PURPLE = "#44344E";
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

// ---------- wall geometry ----------
const NB = 61; // one bar per player
const NA = 32; // bars 0..31 : economics, 32..60 : finance
const X0 = 250;
const PITCH = 26.5;
const BW = 19;
const BASE = 880; // ground line of the wall
const H0 = 280; // height of 25 $
const REF_Y = BASE - H0;
const FLIP0 = 24; // first coin flip
const FLIP = 8; // frames between flips
const VMIN = 0.4;
const VMAX = 2.0;
const NR = 17; // ruined players
const SHOVE0 = 110;
const SHOVE_DT = 1.4;
const barL = (i: number) => X0 + i * PITCH;
const barC = (i: number) => X0 + i * PITCH + BW / 2;
const GA_L = barL(0);
const GA_R = barL(NA - 1) + BW;
const GB_L = barL(NA);
const GB_R = barL(NB - 1) + BW;

// ---------- hero chip stack ----------
const HN = 13;
const HRX = 118;
const HRY = 22;
const HTH = 24;
const HW = 280;
const HH = 380;
const HERO_X = 300;
const HERO_Y = 300;
const CAP_X = 1110;
const CAP_Y = 290;
const CAP_W = 1240;
const CAP_H = 200;

const T_ECO = "\u00c9CONOMIE";
const T_FIN = "FINANCE";
const T_RUIN = "RUIN\u00c9S";
const T_CAP = "LA TAILLE DES MISES";

const Scene2: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.6) % 120;
  const gy = (frame * 0.35) % 120;
  const breathe = 0.15 + 0.06 * Math.sin(frame * 0.07);

  // ---------- ruined selection (17 smallest keys, random collapse order) ----------
  const keys = Array.from({ length: NB }).map((_, i) => ({ i, k: seededRandom("ruin2", i) }));
  const sorted = [...keys].sort((a, b) => a.k - b.k);
  const rank: number[] = Array.from({ length: NB }).map(() => -1);
  for (let r = 0; r < NR; r++) rank[sorted[r].i] = r;
  const shoveT = (i: number) => SHOVE0 + rank[i] * SHOVE_DT;

  // ---------- bankroll random walk ----------
  const betOf = (i: number) => (rank[i] >= 0 ? 0.24 + 0.1 * seededRandom("f2r", i) : 0.05 + 0.07 * seededRandom("f2s", i));
  const walk = (i: number, f: number) => {
    const off = Math.floor(seededRandom("off2", i) * FLIP);
    const st = FLIP0 + off;
    if (f < st) return { v: 1, flash: 0 };
    const n = Math.floor((f - st) / FLIP) + 1;
    const bet = betOf(i);
    let prev = 1;
    let cur = 1;
    for (let k = 1; k <= n; k++) {
      prev = cur;
      const win = seededRandom("win2", i * 64 + k) < 0.6;
      cur = Math.min(VMAX, Math.max(VMIN, cur * (win ? 1 + bet : 1 - bet)));
    }
    const s0 = st + (n - 1) * FLIP;
    const t = prog(f, s0, 5);
    return { v: prev + (cur - prev) * t, flash: cur > prev ? bump(f, s0, 1, 7) : 0 };
  };

  // ---------- timeline ----------
  const refLine = prog(frame, 4, 18);
  const refChip = prog(frame, 8, 10);
  const tagsOut = prog(frame, 94, 9);
  const ecoIn = prog(frame, 33, 10);
  const finIn = prog(frame, 74, 10);
  const hlIn = prog(frame, 97, 10);
  const survDim = 1 - 0.6 * hlIn + 0.6 * prog(frame, 134, 12);
  const pull = prog(frame, 134, 18);
  const wallS = 1 - 0.24 * pull;
  const wallTy = 90 * pull;

  const cIn = prog(frame, 105, 8);
  const cOut = prog(frame, 139, 7);
  let ruinedCount = 0;
  for (let i = 0; i < NB; i++) if (rank[i] >= 0 && frame >= shoveT(i) + 3) ruinedCount++;
  let lastHit = -100;
  for (let i = 0; i < NB; i++) if (rank[i] >= 0 && frame >= shoveT(i) + 3) lastHit = Math.max(lastHit, shoveT(i) + 3);
  const cPulse = bump(frame, lastHit, 1, 5);

  const capIn = prog(frame, 144, 9);
  const underline = prog(frame, 160, 10);
  const heroShove = prog(frame, 160, 10);
  const heroGlow = 0.35 * prog(frame, 150, 8) + bump(frame, 161, 4, 14);

  // ---------- bars ----------
  const bars: React.ReactNode[] = [];
  const stacks: React.ReactNode[] = [];
  for (let i = 0; i < NB; i++) {
    const isR = rank[i] >= 0;
    const tS = isR ? shoveT(i) : 9999;
    const grow = prog(frame, -8 + i * 0.3, 18);
    const w = walk(i, isR ? Math.min(frame, tS) : frame);
    const collapse = isR ? prog(frame, tS, 2) : 0;
    const grey = isR ? prog(frame, tS + 1, 8) : 0;
    const h = Math.max(0, H0 * w.v * grow * (1 - collapse));
    const hl = isR ? hlIn * (1 - prog(frame, tS + 2, 6)) : 0;
    const op = isR ? 1 - 0.55 * grey : survDim;
    bars.push(
      <div
        key={`b${i}`}
        id={`bar-2-b${i}`}
        style={{
          position: "absolute",
          left: barL(i),
          top: BASE - h,
          width: BW,
          height: h,
          background: `linear-gradient(180deg, ${GOLD} 0%, #C99A2E 100%)`,
          borderTop: h > 6 ? "4px solid #FFE596" : "none",
          boxSizing: "border-box",
          opacity: op,
          filter: grey > 0 ? `grayscale(${grey}) brightness(${1 - 0.35 * grey})` : "none",
          boxShadow: hl > 0 ? `0 0 0 3px rgba(255,255,255,${hl}), 0 0 22px rgba(255,255,255,${0.55 * hl})` : "none",
        }}
      />
    );
    // win flash cap
    if (w.flash > 0 && collapse < 0.5) {
      bars.push(
        <div key={`f${i}`} style={{ position: "absolute", left: barL(i) - 2, top: BASE - h - 4, width: BW + 4, height: 9, background: "#FFFFFF", opacity: w.flash * op * 0.95, boxShadow: `0 0 14px rgba(255,255,255,${0.7 * w.flash})` }} />
      );
    }
    // ruined stub
    if (isR && grey > 0) {
      bars.push(<div key={`s${i}`} style={{ position: "absolute", left: barL(i), top: BASE - 12, width: BW, height: 12, background: "#8A8A8A", opacity: 0.9 * grey }} />);
    }
    // oversized chip stack : the whole bankroll shoved as one bet
    if (isR) {
      const sIn = prog(frame, tS - 5, 4);
      const sh = prog(frame, tS, 12);
      const sOut = prog(frame, tS + 5, 8);
      const sOp = sIn * (1 - sOut);
      if (sOp > 0.001) {
        const hs = H0 * walk(i, tS).v;
        const sw = 56;
        stacks.push(
          <div
            key={`c${i}`}
            id={`stack-2-c${i}`}
            style={{
              position: "absolute",
              left: barC(i) - sw / 2,
              top: BASE - hs,
              width: sw,
              height: hs,
              opacity: sOp,
              filter: `grayscale(${prog(frame, tS + 3, 8)})`,
              transformOrigin: "50% 100%",
              transform: `translateY(${sh * 95}px) scale(${1 + 0.45 * sh})`,
              background: `repeating-linear-gradient(90deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 9px, rgba(255,255,255,0.8) 9px, rgba(255,255,255,0.8) 16px, rgba(255,255,255,0) 16px, rgba(255,255,255,0) 25px), repeating-linear-gradient(180deg, ${GOLD} 0px, ${GOLD} 14px, #5C460C 14px, #5C460C 18px)`,
              border: "3px solid #FFFFFF",
              boxSizing: "border-box",
              boxShadow: "0 18px 26px rgba(0,0,0,0.6)",
            }}
          />
        );
      }
    }
  }

  // ---------- hero chip stack ----------
  const heroChips = Array.from({ length: HN }).map((_, k) => {
    const p = prog(frame, 139 + k * 0.85, 7);
    const yTop = HH - HRY - 4 - (k + 1) * HTH;
    const dx = (seededRandom("hx2", k) - 0.5) * 12;
    const cx = HW / 2 + dx;
    const notches = [-0.82, -0.3, 0.3, 0.82];
    return (
      <g key={k} opacity={p} transform={`translate(0 ${-(1 - p) * 170})`}>
        <ellipse cx={cx} cy={yTop + HTH} rx={HRX} ry={HRY} fill="#D9AE3A" stroke="#5C460C" strokeWidth={3} />
        <rect x={cx - HRX} y={yTop} width={2 * HRX} height={HTH} fill={GOLD} />
        {notches.map((s, j) => {
          const nw = 20 * Math.sqrt(1 - s * s);
          return <rect key={j} x={cx + s * HRX - nw / 2} y={yTop + 2} width={nw} height={HTH - 2} fill="#FFFFFF" opacity={0.9} />;
        })}
        <ellipse cx={cx} cy={yTop} rx={HRX} ry={HRY} fill="#F8DA7C" stroke="#5C460C" strokeWidth={2} />
        <ellipse cx={cx} cy={yTop} rx={HRX * 0.66} ry={HRY * 0.66} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeOpacity={0.85} />
      </g>
    );
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 50% 60%, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 60%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 14 }).map((_, i) => {
          const r = 18 + seededRandom("ch2r", i) * 26;
          const x = 60 + seededRandom("ch2x", i) * 1800;
          const sp = 0.5 + seededRandom("ch2v", i) * 0.8;
          const y = (((seededRandom("ch2y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return (
            <g key={`c${i}`} opacity={0.08}>
              <circle cx={x} cy={y} r={r} fill="none" stroke="#FFFFFF" strokeWidth={2} />
              <circle cx={x} cy={y} r={r * 0.62} fill="none" stroke="#FFFFFF" strokeWidth={2} />
            </g>
          );
        })}
      </svg>

      {/* wall world (camera pull in phase 2b) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `960px ${BASE}px`, transform: `translateY(${wallTy}px) scale(${wallS})` }}>
        {/* ground + 25 $ reference */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={X0 - 20} y1={BASE + 3} x2={X0 - 20 + (GB_R - X0 + 40) * prog(frame, -6, 18)} y2={BASE + 3} stroke="#FFFFFF" strokeWidth={4} strokeOpacity={0.8} />
          <line x1={X0 - 24} y1={REF_Y} x2={X0 - 24 + (GB_R - X0 + 44) * refLine} y2={REF_Y} stroke="#FFFFFF" strokeWidth={2} strokeOpacity={0.4} />
        </svg>
        <Box x={135} y={REF_Y} w={170} h={80} style={{ opacity: refChip, transform: `translateX(${(1 - refChip) * -40}px)` }}>
          <div id="chip-25-2-ref" style={{ background: "#FFFFFF", width: 170, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-25-2-ref" text="25 $" width={160} height={72} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000" }} />
          </div>
        </Box>

        {/* group brackets + tags */}
        <svg id="brackets-2-grp" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - tagsOut }}>
          <g stroke="#FFFFFF" strokeWidth={3} fill="none">
            <g opacity={ecoIn}>
              <line x1={(GA_L + GA_R) / 2 - ((GA_R - GA_L) / 2) * ecoIn} y1={278} x2={(GA_L + GA_R) / 2 + ((GA_R - GA_L) / 2) * ecoIn} y2={278} />
              <line x1={GA_L} y1={278} x2={GA_L} y2={300} opacity={prog(frame, 38, 6)} />
              <line x1={GA_R} y1={278} x2={GA_R} y2={300} opacity={prog(frame, 38, 6)} />
              <line x1={(GA_L + GA_R) / 2} y1={246} x2={(GA_L + GA_R) / 2} y2={278} />
            </g>
            <g opacity={finIn}>
              <line x1={(GB_L + GB_R) / 2 - ((GB_R - GB_L) / 2) * finIn} y1={278} x2={(GB_L + GB_R) / 2 + ((GB_R - GB_L) / 2) * finIn} y2={278} />
              <line x1={GB_L} y1={278} x2={GB_L} y2={300} opacity={prog(frame, 79, 6)} />
              <line x1={GB_R} y1={278} x2={GB_R} y2={300} opacity={prog(frame, 79, 6)} />
              <line x1={(GB_L + GB_R) / 2} y1={246} x2={(GB_L + GB_R) / 2} y2={278} />
            </g>
          </g>
        </svg>
        <Box x={(GA_L + GA_R) / 2} y={200} w={420} h={92} style={{ opacity: ecoIn * (1 - tagsOut), transform: `translateY(${(1 - ecoIn) * -40 - tagsOut * 30}px)` }}>
          <div id="tag-eco-2-t1" style={{ background: NAVY, borderTop: "3px solid #5E86AD", width: 420, height: 92, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
            <Text id="txt-eco-2-t1" text={T_ECO} width={400} height={80} sizeGroup={{ texts: [T_ECO, T_FIN] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: 2 }} />
          </div>
        </Box>
        <Box x={(GB_L + GB_R) / 2} y={200} w={420} h={92} style={{ opacity: finIn * (1 - tagsOut), transform: `translateY(${(1 - finIn) * -40 - tagsOut * 30}px)` }}>
          <div id="tag-fin-2-t2" style={{ background: PURPLE, borderTop: "3px solid #7A5F8A", width: 420, height: 92, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
            <Text id="txt-fin-2-t2" text={T_FIN} width={400} height={80} sizeGroup={{ texts: [T_ECO, T_FIN] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: 2 }} />
          </div>
        </Box>

        <div id="wall-2-bars" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
          {bars}
        </div>
        <div id="wall-2-stacks" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
          {stacks}
        </div>
      </div>

      {/* ruined counter */}
      <Box x={960} y={200} w={600} h={116} style={{ opacity: cIn * (1 - cOut), transform: `translateY(${(1 - cIn) * -40 - cOut * 60}px)` }}>
        <div id="chip-ruin-2-r1" style={{ background: "#FFFFFF", width: 400, height: 116, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text id="txt-ruin-2-r1" text={T_RUIN} width={380} height={100} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000", letterSpacing: 2 }} />
        </div>
        <div id="chip-cnt-2-r2" style={{ background: RED, width: 200, height: 116, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.08 * cPulse})` }}>
          <Text id="txt-cnt-2-r2" text={`${ruinedCount}`} width={180} height={100} sizeGroup={{ texts: ["17", "0"] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        </div>
      </Box>

      {/* hero chip stack : visual anchor of the caption */}
      <div
        id="hero-2-stack"
        style={{
          position: "absolute",
          left: HERO_X - HW / 2,
          top: HERO_Y - HH / 2,
          width: HW,
          height: HH,
          transform: `translateX(${heroShove * 22}px) scale(${1 + 0.04 * heroShove})`,
          transformOrigin: "50% 100%",
          filter: `drop-shadow(0px 0px ${Math.round(36 * heroGlow)}px rgba(242,201,76,${Math.min(0.9, 0.9 * heroGlow)}))`,
        }}
      >
        <svg width={HW} height={HH} viewBox={`0 0 ${HW} ${HH}`} style={{ overflow: "visible" }}>
          {heroChips}
        </svg>
      </div>

      {/* caption */}
      <Box x={CAP_X} y={CAP_Y} w={CAP_W} h={CAP_H} style={{ clipPath: `inset(0px ${(1 - capIn) * 100}% 0px 0px)`, transform: `translateY(${(1 - capIn) * 20}px)` }}>
        <div id="chip-cap-2-k1" style={{ background: "#FFFFFF", width: CAP_W, height: CAP_H, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 50px rgba(0,0,0,0.55)" }}>
          <Text id="txt-cap-2-k1" text={T_CAP} width={CAP_W - 50} height={CAP_H - 30} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000", letterSpacing: -1 }} />
        </div>
      </Box>
      <div id="bar-cap-2-u1" style={{ position: "absolute", left: CAP_X - CAP_W / 2, top: CAP_Y + CAP_H / 2 + 16, width: CAP_W * underline, height: 16, background: GOLD, boxShadow: `0 0 ${Math.round(24 * underline)}px rgba(242,201,76,0.6)` }} />
    </AbsoluteFill>
  );
};

export default Scene2;
