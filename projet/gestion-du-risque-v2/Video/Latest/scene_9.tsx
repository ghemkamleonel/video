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
const COUNT_EASE = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
const bump = (f: number, s: number, up: number, down: number) =>
  interpolate(f, [s, s + up, s + up + down], [0, 1, 0], CLAMP);

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// ---------- geometry ----------
const NF = 25; // 25 equal blocks : 1 gold (his money) + 24 navy (borrowed)
const BASE = 1000; // ground level
const BW = 360;
const BH = 27;
const P = 32;
const STACK_TOP = BASE - (NF - 1) * P - BH; // 205
const CUT_Y = BASE - (NF - 1) * P + 2; // 234 : between slot 23 and slot 24
const GH_TOP = STACK_TOP - 2; // 203
const GH_H = CUT_Y - GH_TOP; // 31
const LINE_W = 540;
const SHIFT = -320; // stack moves to x = 640 for the equation
const EQX = 1395; // equation column centre
const CELLS = 12;

const T_PLACE = "PLACEMENTS :";
const T_ARGENT = "SON ARGENT";
const T_SUR = "SUR LES PLACEMENTS";
const T_DE = "DE SON ARGENT";

const Scene9: React.FC<{
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
  const redT = prog(frame, 96, 22);

  // ---------- camera ----------
  const push = 1.03 - 0.03 * prog(frame, 0, 34) + 0.015 * bump(frame, 52, 8, 22);
  const shift = prog(frame, 70, 20);
  const dxW = SHIFT * shift;

  // ---------- stack ----------
  const amp = interpolate(frame, [0, 30, 58, 82, 136], [12, 4, 3, 8, 10], CLAMP);
  const sway = Math.sin(frame * 0.13 + 0.4) + 0.25 * Math.sin(frame * 0.31 + 1);
  const drain = prog(frame, 52, 8);
  const vanish = prog(frame, 60, 8);
  const goldGlow = (0.55 + 0.25 * Math.sin(frame * 0.2)) * (1 - drain);
  const redFlash = bump(frame, 52, 3, 12);
  const stackDim = prog(frame, 96, 16);

  // ---------- red line + slice ----------
  const lineIn = prog(frame, 26, 5);
  const lineY = interpolate(frame, [28, 44], [172, CUT_Y], { ...CLAMP, easing: EASE });
  const lineFlare = bump(frame, 44, 2, 10) + bump(frame, 96, 3, 16);
  const cellH = Math.max(0, Math.min(GH_H, lineY - GH_TOP));
  const outline = prog(frame, 68, 10);
  const dx24 = amp * sway;

  // ---------- labels ----------
  const topIn = prog(frame, 0, 14);
  const cnt = prog(frame, 66, 8);
  const topScale = 1 - 0.15 * shift;
  const topX = 960 + dxW;
  const chipIn = prog(frame, 12, 12);
  const chipOut = prog(frame, 60, 10);

  // ---------- -4 % tag -> equation ----------
  const tagIn = prog(frame, 44, 9);
  const tagM = prog(frame, 72, 18);
  const tagX = 1350 + (EQX - 1350) * tagM;
  const tagY = 220 + (282 - 220) * tagM;
  const tagS = 1 + 1.0 * tagM;

  const sub1 = prog(frame, 76, 12);
  const eqIn = prog(frame, 96, 8);
  const hundredIn = prog(frame, 100, 8);
  const pct = Math.round(interpolate(frame, [100, 116], [4, 100], { ...CLAMP, easing: COUNT_EASE }));
  const lock = bump(frame, 116, 3, 16);
  const pulse = frame >= 116 ? 0.5 + 0.5 * Math.sin((frame - 116) * 0.25) : 0;
  const sub3 = prog(frame, 112, 10);

  const blocks = Array.from({ length: NF }).map((_, i) => {
    const drop = i === 0 ? 0 : P * prog(frame, 62 + i * 0.22, 14);
    const bottom = BASE - i * P + drop;
    const top = bottom - BH;
    const dx = amp * Math.pow(i / 24, 1.5) * sway;
    const rot = ((amp * 1.2 * Math.sqrt(i / 24)) / 800) * sway * 57.3 * 0.6;
    if (i === 0) {
      return (
        <div
          key={i}
          id="block-9-gold"
          style={{
            position: "absolute",
            left: 960 - BW / 2,
            top,
            width: BW,
            height: BH,
            opacity: 1 - vanish,
            transform: `scaleX(${1 - 0.85 * vanish})`,
            filter: `grayscale(${drain}) brightness(${1 - 0.35 * drain})`,
            boxShadow: `0 0 ${Math.round(60 * goldGlow)}px ${Math.round(12 * goldGlow)}px rgba(242,201,76,${Math.min(0.8, 0.8 * goldGlow)})`,
            background: GOLD,
            borderTop: "3px solid #FFE596",
            boxSizing: "border-box",
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: RED, opacity: 0.85 * redFlash }} />
        </div>
      );
    }
    return (
      <div
        key={i}
        id={`block-9-n${i}`}
        style={{
          position: "absolute",
          left: 960 - BW / 2 + dx,
          top,
          width: BW,
          height: BH,
          transform: `rotate(${rot}deg)`,
          background: NAVY,
          borderTop: "3px solid #5E86AD",
          boxSizing: "border-box",
        }}
      />
    );
  });

  const cells = Array.from({ length: CELLS }).map((_, c) => {
    const cw = BW / CELLS;
    const st = 66 + seededRandom("ev9s", c) * 12;
    const e = prog(frame, st, 20);
    const rise = e * (110 + seededRandom("ev9r", c) * 110);
    const side = (seededRandom("ev9x", c) - 0.5) * 60 * e;
    const spin = (seededRandom("ev9a", c) - 0.5) * 140 * e;
    return (
      <div
        key={c}
        style={{
          position: "absolute",
          left: 960 - BW / 2 + c * cw + dx24 + side,
          top: GH_TOP - rise,
          width: cw - 2,
          height: cellH,
          background: RED,
          opacity: 0.6 * (1 - e),
          transform: `rotate(${spin}deg) scale(${1 - 0.35 * e})`,
        }}
      />
    );
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 50% 52%, rgba(46,79,112,${breathe * (1 - 0.6 * redT)}) 0%, rgba(46,79,112,0) 58%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(ellipse at 50% 50%, rgba(229,83,75,0) 45%, rgba(229,83,75,${0.16 * redT + 0.05 * redT * pulse}) 100%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const s = 44 + seededRandom("sq9s", i) * 40;
          const x = 60 + seededRandom("sq9x", i) * 1800;
          const sp = 0.5 + seededRandom("sq9v", i) * 0.7;
          const y = (((seededRandom("sq9y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="none" stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={2} transform={`rotate(${frame * 0.3 * (i % 2 ? 1 : -1)} ${x + s / 2} ${y + s / 2})`} />;
        })}
      </svg>

      {/* stack world (shift left + camera push) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "960px 540px", transform: `translateX(${dxW}px) scale(${push})` }}>
        {/* ground */}
        <Box x={960} y={BASE + 6} w={BW + 140} h={4} style={{ background: "#FFFFFF", opacity: 0.75 }} />

        {/* blocks */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, filter: `grayscale(${0.5 * stackDim}) brightness(${1 - 0.18 * stackDim})` }}>
          {blocks}
        </div>

        {/* lost slice : red highlight cells that evaporate, then a hollow outline */}
        {cells}
        <div
          id="ghost-9-slice"
          style={{
            position: "absolute",
            left: 960 - BW / 2 + dx24 - 3,
            top: GH_TOP - 3,
            width: BW + 6,
            height: GH_H + 3,
            border: `3px solid ${RED}`,
            boxSizing: "border-box",
            opacity: 0.9 * outline,
          }}
        />

        {/* red cut line */}
        <div
          id="redline-9-cut"
          style={{
            position: "absolute",
            left: 960 - LINE_W / 2,
            top: lineY - 3 - lineFlare,
            width: LINE_W,
            height: 6 + 2 * lineFlare,
            background: RED,
            opacity: lineIn,
            boxShadow: `0 0 ${18 + 30 * lineFlare}px ${4 + 6 * lineFlare}px rgba(229,83,75,0.7)`,
          }}
        />

        {/* SON ARGENT chip + connector */}
        <div style={{ position: "absolute", left: 730, top: BASE - BH / 2 - 2, width: 50 * chipIn, height: 4, background: GOLD, opacity: (1 - chipOut) * (1 - drain * 0.6), filter: `grayscale(${drain})` }} />
        <Box
          x={570}
          y={BASE - BH / 2}
          w={320}
          h={76}
          style={{ opacity: chipIn * (1 - chipOut), transform: `translateX(${(1 - chipIn) * -60 - chipOut * 40}px)`, filter: `grayscale(${drain}) brightness(${1 - 0.3 * drain})` }}
        >
          <div id="chip-argent-9-a1" style={{ background: GOLD, display: "flex", width: 320, height: 76, alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-argent-9-a2" text={T_ARGENT} width={300} height={70} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          </div>
        </Box>
      </div>

      {/* top label : PLACEMENTS : 25 $ -> 24 $ */}
      <Box
        x={topX}
        y={105}
        w={800}
        h={124}
        style={{ opacity: topIn, transform: `translateY(${(1 - topIn) * -50}px) scale(${topScale})` }}
      >
        <div id="chip-place-9-b1" style={{ background: "#FFFFFF", display: "flex", flexDirection: "row", width: 800, height: 124, alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${Math.round(40 * bump(frame, 66, 3, 14))}px rgba(229,83,75,0.9)` }}>
          <Text id="txt-place-9-b2" text={T_PLACE} width={500} height={106} align="right" textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          <div style={{ position: "relative", width: 250, height: 106, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${-106 * cnt}px)`, opacity: 1 - cnt }}>
              <Text id="txt-place-9-b3" text="25 $" width={250} height={106} sizeGroup={{ texts: ["25 $", "24 $"] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#000000", letterSpacing: "-0.04em" }} />
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${106 * (1 - cnt)}px)`, opacity: cnt }}>
              <Text id="txt-place-9-b4" text="24 $" width={250} height={106} sizeGroup={{ texts: ["25 $", "24 $"] }} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#B8322B", letterSpacing: "-0.04em" }} />
            </div>
          </div>
        </div>
      </Box>

      {/* -4 % tag (becomes the first term of the equation) */}
      <Box
        x={tagX}
        y={tagY}
        w={220}
        h={90}
        style={{ opacity: tagIn, transform: `translateX(${(1 - tagIn) * 50}px) scale(${tagS})` }}
      >
        <div id="tag-minus4-9-c1" style={{ position: "relative", display: "flex", width: 220, height: 90, alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 220, height: 90, background: RED, opacity: 1 - tagM }} />
          <Text id="txt-minus4-9-c2" text="-4 %" width={210} height={84} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.06em" }} />
        </div>
      </Box>

      {/* equation */}
      <Box x={EQX} y={422} w={720} h={92} style={{ opacity: sub1, transform: `translateX(${(1 - sub1) * 60}px)` }}>
        <div id="chip-sur-9-d1" style={{ background: NAVY, borderTop: "3px solid #5E86AD", display: "flex", width: 720, height: 92, alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
          <Text id="txt-sur-9-d2" text={T_SUR} width={690} height={84} sizeGroup={{ texts: [T_SUR, T_DE] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
        </div>
      </Box>

      <Box x={EQX} y={534} w={240} h={130} style={{ opacity: eqIn, transform: `scale(${0.6 + 0.4 * eqIn})` }}>
        <Text id="txt-eq-9-e1" text="=" width={240} height={130} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} />
      </Box>

      <Box x={EQX} y={670} w={780} h={200} style={{ opacity: hundredIn, transform: `translateY(${(1 - hundredIn) * 40}px) scale(${1 + 0.06 * lock})` }}>
        <Text
          id="txt-hundred-9-f1"
          text={`-${pct} %`}
          width={780}
          height={200}
          sizeGroup={{ texts: ["-100 %"] }}
          textStyles={{ fontFamily: MONO, fontWeight: 700, color: RED, letterSpacing: "-0.06em", textShadow: `0 0 ${Math.round(20 + 40 * lock + 18 * pulse)}px rgba(229,83,75,${0.45 + 0.4 * lock})` }}
        />
      </Box>

      <Box x={EQX} y={818} w={720} h={92} style={{ opacity: sub3, transform: `translateX(${(1 - sub3) * 60}px)` }}>
        <div id="chip-de-9-g1" style={{ background: GOLD, display: "flex", width: 720, height: 92, alignItems: "center", justifyContent: "center" }}>
          <Text id="txt-de-9-g2" text={T_DE} width={690} height={84} sizeGroup={{ texts: [T_SUR, T_DE] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene9;
