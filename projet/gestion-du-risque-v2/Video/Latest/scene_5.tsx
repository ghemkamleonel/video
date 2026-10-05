import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, interpolateColors, AbsoluteFill, Easing } from "remotion";
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
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Vintage page (phase 1)
const PAPER = "#EFE8D8";
const INK = "#161616";
const PAGE_W = 1360;
const PAGE_H = 900;

// Bankroll bar (phases 2-3): 1 % = 15 px
const BAR_X0 = 210;
const BAR_W = 1500;
const BAR_H = 150;
const PCT = BAR_W / 100;
const SLOT_X0 = BAR_X0 + 80 * PCT;
const SLOT_W = 20 * PCT;
const LIFT_X = 24;
const LIFT_Y = 56;
const LIFT_S = 0.15;

// Phase 3 rows
const BY = 640;
const EY = 872;

const BODY_LINES = [1200, 1120, 1180, 640];

const Scene5: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background breathing
  const breathe = 0.5 + 0.5 * Math.sin(frame * 0.045);

  // PHASE 1 -- the 1956 page
  const pageIn = prog(frame, 0, 30);
  const push = interpolate(frame, [30, 248], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const comp = prog(frame, 248, 18);
  const contentFade = 1 - prog(frame, 248, 8);
  const pageW = lerp(PAGE_W, BAR_W, comp);
  const pageH = lerp(PAGE_H, BAR_H, comp);
  const pageCY = lerp(540, 590, comp);
  const pageScale = lerp(push, 1, comp);
  const ruleDraw = prog(frame, 0, 26);
  const bellMark = prog(frame, 116, 12);
  const phraseMark = prog(frame, 168, 14);

  // PHASE 2 -- a fixed share
  const showBar = frame >= 266;
  const cut = prog(frame, 266, 8);
  const lift = prog(frame, 274, 18);
  const argentIn = prog(frame, 266, 10);
  const chipIn = prog(frame, 284, 10);
  const connector = prog(frame, 292, 10);
  const up = prog(frame, 333, 20);
  const barY = lerp(590, 350, up);
  const sliceCX = SLOT_X0 + SLOT_W / 2 + LIFT_X * lift;
  const sliceCY = barY + LIFT_Y * lift;
  const sliceS = 1 + LIFT_S * lift;

  // PHASE 3 -- twenty percent
  const g = prog(frame, 339, 20);
  const t60 = prog(frame, 346, 8);
  const navyIn = prog(frame, 400, 14);
  const sub = prog(frame, 424, 16);
  const glow = prog(frame, 440, 14);
  const t20 = prog(frame, 450, 8);
  const fly = prog(frame, 456, 16);
  const snap = frame >= 472 ? 1 - prog(frame, 472, 16) : 0;
  const pulse = 0.75 + 0.25 * Math.sin(frame * 0.25);
  const e1 = prog(frame, 342, 10);
  const e2 = prog(frame, 402, 10);
  const e3 = prog(frame, 450, 10);
  const goldW = 900 * g;
  const leftW = Math.min(600, goldW);
  const remW = Math.max(0, goldW - 600);
  const remCX = lerp(960, SLOT_X0 + SLOT_W / 2 + LIFT_X, fly);
  const remCY = lerp(BY, 350 + LIFT_Y, fly);
  const remS = lerp(1, 1 + LIFT_S, fly);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 48%, #1E1E1E 0%, ${BG} ${42 + 12 * breathe}%, #000000 100%)`, overflow: "hidden" }}>
      {/* Breathing background: drifting grid + rising pixels */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const x = ((i * 120 + frame * 0.8) % 2160) - 120;
          return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={1080} stroke="#FFFFFF" strokeOpacity={0.04 + 0.04 * breathe} strokeWidth={2} />;
        })}
        {Array.from({ length: 11 }).map((_, j) => {
          const y = ((j * 120 + frame * 0.4) % 1320) - 120;
          return <line key={`h${j}`} x1={0} y1={y} x2={1920} y2={y} stroke="#FFFFFF" strokeOpacity={0.04 + 0.04 * breathe} strokeWidth={2} />;
        })}
        {Array.from({ length: 16 }).map((_, i) => {
          const size = 22 + seededRandom("px5-z", i) * 26;
          const speed = 0.5 + seededRandom("px5-s", i) * 1.1;
          const x = 40 + seededRandom("px5-x", i) * 1800;
          const y = ((seededRandom("px5-y", i) * 1240 - frame * speed) % 1240 + 1240) % 1240 - 80;
          const op = 0.05 + 0.08 * seededRandom("px5-o", i);
          return <rect key={`p${i}`} x={x} y={y} width={size} height={size} fill={i % 4 === 0 ? GOLD : "#FFFFFF"} opacity={op} />;
        })}
      </svg>

      {/* PHASE 1: typed research page, compresses into the bar */}
      {!showBar && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, perspective: 1800 }}>
          <div
            id="page-1956-5-k3l9"
            style={{
              position: "absolute",
              left: 960 - pageW / 2,
              top: pageCY - pageH / 2,
              width: pageW,
              height: pageH,
              background: interpolateColors(comp, [0, 1], [PAPER, "#FFFFFF"]),
              transform: `translateY(${420 * (1 - pageIn)}px) rotateX(${16 * (1 - pageIn)}deg) scale(${pageScale})`,
              transformOrigin: "50% 50%",
              boxShadow: `0 40px 90px rgba(0,0,0,0.65), inset 0 0 140px rgba(120,90,40,${0.22 * (1 - comp)})`,
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", left: (pageW - PAGE_W) / 2, top: 0, width: PAGE_W, height: PAGE_H, transform: `scaleY(${pageH / PAGE_H})`, transformOrigin: "50% 0%", opacity: contentFade }}>
              {/* inner frame line */}
              <div style={{ position: "absolute", left: 30, top: 30, width: PAGE_W - 60, height: PAGE_H - 60, border: "2px solid rgba(22,22,22,0.18)", boxSizing: "border-box" }} />
              {/* letterhead: BELL LABS -- 1956 */}
              <div style={{ position: "absolute", left: 70, top: 56, width: 490 * bellMark, height: 96, background: GOLD }} />
              <Box x={80 + 235} y={104} w={470} h={96}>
                <Text id="lh-bell-5-a1s2" text="BELL LABS" width={470} height={96} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: INK }} typing={{ startFrame: 104, endFrame: 122, showCursor: frame < 124 }} />
              </Box>
              <div style={{ position: "absolute", left: 590, top: 101, width: 450 * ruleDraw, height: 6, background: INK }} />
              <Box x={1070 + 105} y={104} w={210} h={96}>
                <Text id="lh-year-5-d3f4" text="1956" width={210} height={96} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: INK }} typing={{ startFrame: 3, endFrame: 45, showCursor: frame < 47 }} />
              </Box>
              <div style={{ position: "absolute", left: 80, top: 172, width: 1200 * ruleDraw, height: 4, background: INK }} />
              {/* title */}
              <Box x={680} y={330} w={1060} h={190}>
                <Text id="title-kelly-5-g5h6" text="J. L. KELLY" width={1060} height={190} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: INK }} typing={{ startFrame: 54, endFrame: 76, showCursor: frame < 78 }} />
              </Box>
              {/* typed phrase */}
              <div style={{ position: "absolute", left: 70, top: 472, width: 1220 * phraseMark, height: 116, background: GOLD }} />
              <Box x={680} y={530} w={1200} h={120}>
                <Text id="phrase-mise-5-j7k8" text="la bonne taille de mise" width={1200} height={120} align="left" textStyles={{ fontFamily: MONO, fontWeight: 500, color: INK }} typing={{ startFrame: 135, endFrame: 172, showCursor: true, cursorBlinkRate: 0.25 }} />
              </Box>
              {/* typed body lines (decorative) */}
              {BODY_LINES.map((w, i) => (
                <div key={i} style={{ position: "absolute", left: 80, top: 680 + i * 50, width: w, height: 16, background: INK, opacity: 0.12 }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2 + 3: bankroll bar, detached slice, label */}
      {showBar && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
          {/* hollow slot left behind */}
          <div style={{ position: "absolute", left: SLOT_X0, top: barY - BAR_H / 2, width: SLOT_W, height: BAR_H, border: `4px solid ${frame >= 472 ? GOLD : "#FFFFFF"}`, boxSizing: "border-box", opacity: lift }} />
          {/* main bar */}
          <div id="bar-argent-5-l9z1" style={{ position: "absolute", left: BAR_X0, top: barY - BAR_H / 2, width: SLOT_X0 - BAR_X0, height: BAR_H, background: "#FFFFFF" }}>
            <Box x={(SLOT_X0 - BAR_X0) / 2} y={BAR_H / 2} w={900} h={110} style={{ opacity: argentIn }}>
              <Text id="bar-label-5-x2c3" text="SON ARGENT" width={900} height={110} textStyles={{ fontFamily: JOST, fontWeight: 900, color: INK }} />
            </Box>
          </div>
          {/* cut line */}
          <div style={{ position: "absolute", left: SLOT_X0 - 3, top: barY - BAR_H / 2, width: 6, height: BAR_H * cut, background: INK, opacity: 1 - lift }} />
          {/* connector from label to slice */}
          <div style={{ position: "absolute", left: sliceCX - 2, top: barY - 125, width: 4, height: 95 * connector, background: GOLD }} />
          {/* the detached slice = the bet */}
          <div
            id="slice-mise-5-v4b5"
            style={{
              position: "absolute",
              left: SLOT_X0,
              top: barY - BAR_H / 2,
              width: SLOT_W,
              height: BAR_H,
              background: interpolateColors(lift, [0, 1], ["#FFFFFF", GOLD]),
              transform: `translate(${LIFT_X * lift}px, ${LIFT_Y * lift}px) scale(${sliceS})`,
              boxShadow: `0 ${28 * lift}px ${50 * lift}px rgba(0,0,0,${0.7 * lift})`,
            }}
          />
          {/* label chip */}
          <Box x={1360} y={barY - 190 + 24 * (1 - chipIn)} w={760} h={130} style={{ opacity: chipIn, background: "#000000", border: `4px solid ${GOLD}`, boxSizing: "border-box", boxShadow: `0 0 ${40 * snap}px ${GOLD}` }}>
            <Text id="chip-mise-5-n6m7" text="MISE = AVANTAGE" width={700} height={110} align="left" textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF" }} typing={{ startFrame: 286, endFrame: 322, showCursor: false }} />
          </Box>
        </div>
      )}

      {/* PHASE 3: 60 % - 40 % = 20 % */}
      {frame >= 333 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
          {/* trace left by the remainder once it flies to the bar */}
          <div style={{ position: "absolute", left: BAR_X0 + 600, top: BY - 75, width: 300, height: 150, border: `4px solid ${GOLD}`, boxSizing: "border-box", opacity: 0.45 * fly }} />
          {/* losing part: drains to grey and drops away */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - sub, filter: `grayscale(${sub})`, transform: `translateY(${60 * sub}px)` }}>
            <div id="block-60-5-q8w9" style={{ position: "absolute", left: BAR_X0, top: BY - 75, width: leftW, height: 150, background: GOLD }} />
            <Box x={BAR_X0 + 450} y={BY} w={400} h={110} style={{ opacity: t60 * (1 - navyIn) }}>
              <Text id="lbl-60-5-e1r2" text={"60 %"} width={400} height={110} textStyles={{ fontFamily: MONO, fontWeight: 700, color: INK }} />
            </Box>
            <Box x={BAR_X0 + 300} y={BY - 110 * (1 - navyIn)} w={600} h={150} style={{ background: NAVY, opacity: Math.min(1, navyIn * 2.5) }}>
              <Text id="lbl-40-5-t3y4" text={"40 %"} width={400} height={110} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
            </Box>
          </div>
          {/* remainder 20 %: glows, then snaps onto the detached slice */}
          <Box x={remCX} y={remCY} w={300} h={150} style={{ transform: `scale(${remS})`, justifyContent: "flex-start" }}>
            <div
              id="block-20-5-u5i6"
              style={{
                width: remW,
                height: 150,
                background: GOLD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 ${60 * glow * pulse}px ${GOLD}, 0 0 ${90 * snap}px #FFFFFF`,
              }}
            >
              <div style={{ opacity: t20, display: "flex" }}>
                <Text id="lbl-20-5-o7p8" text={"20 %"} width={260} height={100} textStyles={{ fontFamily: MONO, fontWeight: 700, color: INK }} />
              </div>
            </div>
          </Box>
          {/* equation: the row re-centres as each term arrives */}
          <div style={{ position: "absolute", left: 0, top: EY - 70, width: 1920, height: 140, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: 300, flexShrink: 0, opacity: e1, transform: `translateY(${30 * (1 - e1)}px)`, display: "flex" }}>
              <Text id="eq-60-5-a9s1" text={"60 %"} width={300} height={140} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
            </div>
            <div style={{ width: 480 * e2, flexShrink: 0, height: 140, overflow: "visible", display: "flex" }}>
              <div style={{ marginLeft: 40, flexShrink: 0, opacity: e2, transform: `translateY(${30 * (1 - e2)}px)`, display: "flex" }}>
                <Text id="eq-40-5-d2f3" text={"- 40 %"} width={440} height={140} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
              </div>
            </div>
            <div style={{ width: 480 * e3, flexShrink: 0, height: 140, overflow: "visible", display: "flex" }}>
              <div style={{ marginLeft: 40, flexShrink: 0, opacity: e3, transform: `translateY(${30 * (1 - e3)}px)`, display: "flex" }}>
                <Text id="eq-20-5-g4h5" text={"= 20 %"} width={440} height={140} textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD, textShadow: `0 0 ${30 * e3 * pulse}px rgba(242,201,76,0.8)` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default Scene5;
