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
const GOLD_DD = "#5E470C";
const NAVY = "#2E4F70";
const RED = "#E5534B";
const BG = "#121212";
const INK = "#1A1300";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
const bump = (f: number, s: number, up: number, down: number) =>
  interpolate(f, [s, s + up, s + up + down], [0, 1, 0], CLAMP);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const shake = (f: number, s: number, amp: number) => (f < s ? 0 : amp * Math.exp(-(f - s) / 3.5) * Math.sin((f - s) * 2.4));

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// ---------- coin geometry (world space, coin centred on 960,540) ----------
const R = 330; // coin radius
const RP = 288; // pie radius
const T = 40; // coin thickness
const C0 = 330; // centre inside the 660x660 face
const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C0 + r * Math.sin(a), y: C0 - r * Math.cos(a) };
};
const P108 = pt(108, RP);
const P252 = pt(252, RP);
const PATH_NAVY = `M ${C0} ${C0} L ${P108.x} ${P108.y} A ${RP} ${RP} 0 0 1 ${P252.x} ${P252.y} Z`;
const PATH_GOLD = `M ${C0} ${C0} L ${P252.x} ${P252.y} A ${RP} ${RP} 0 1 1 ${P108.x} ${P108.y} Z`;

// ---------- spin : warped so the face lingers face-on, edge-on flicks fast ----------
const U0 = 0.7828947368420955; // puts a face-on moment exactly at frame 150 (inside the push-in)
const WARP = 0.65;
const rateAt = (i: number) =>
  i < 118 ? 1 / 12 : i < 136 ? 1 / 12 + (1 / 38 - 1 / 12) * ((i - 118) / 18) : i < 164 ? 1 / 38 : i < 176 ? 1 / 38 + (1 / 10 - 1 / 38) * ((i - 164) / 12) : 1 / 10;

// ---------- phase 3 ring ----------
const NT = 61;
const RING_CX = 720;
const RING_CY = 540;
const RING_R = 425;
const TOK = 42;
const DRAINED = Array.from({ length: 17 }).map((_, j) => Math.round(1.8 + (j * NT) / 17) % NT);

// ---------- strings ----------
const T_FACE = "FACE";
const T_60 = "60 %";
const T_PILE = "PILE";
const T_40 = "40 %";
const T_TRUQ = "TRUQU\u00c9E";
const T_SAV = "ET ILS LE SAVAIENT";
const T_JOU = "JOUEURS";
const T_RUI = "RUIN\u00c9S";
const T_OF = "61";

const Scene0: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: (seed: string, n: number) => number;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.9) % 96;
  const gy = (frame * 0.5) % 96;
  const gridOp = 0.04 + 0.025 * Math.sin(frame * 0.14);
  const breathe = 0.2 + 0.08 * Math.sin(frame * 0.09);

  // ---------- spin ----------
  let u = U0;
  for (let i = 0; i < frame; i++) u += rateAt(i);
  const th = Math.PI * (u - (WARP / (2 * Math.PI)) * Math.sin(2 * Math.PI * u));
  const cs = Math.cos(th);
  const sn = Math.sin(th);
  const ac = Math.max(0.025, Math.abs(cs));
  const off = (cs >= 0 ? 1 : -1) * (T / 2) * sn;
  const aoff = Math.abs(off);

  // ---------- hero entrance (overshoot and settle) ----------
  const spring = 1 - 0.22 * Math.exp(-frame / 5.5) * Math.cos(frame * 0.38);
  const truqPulse = 0.05 * bump(frame, 64, 3, 12);
  const coinScale = spring + truqPulse;
  const shock1 = interpolate(frame, [0, 18], [0, 1], CLAMP);
  const shock2 = interpolate(frame, [4, 24], [0, 1], CLAMP);

  // ---------- camera ----------
  const p2 = prog(frame, 133, 15); // push in on the gold wedge
  const p3 = prog(frame, 167, 11); // snap back
  const s1 = 1 + 0.025 * prog(frame, 16, 110);
  const s2 = 1.6 + 0.06 * prog(frame, 148, 18);
  const camS = lerp(lerp(s1, s2, p2), 0.92, p3);
  const camFy = lerp(lerp(540, 455, p2), 540, p3);
  const camCx = lerp(960, RING_CX, p3);
  const camCy = lerp(lerp(515, 540, p2), RING_CY, p3);
  const shx = shake(frame, 0, 14) + shake(frame, 65, 9) + shake(frame, 167, 10) + shake(frame, 219, 9);
  const shy = 0.6 * (shake(frame, 1, 12) + shake(frame, 66, 7) + shake(frame, 220, 8));
  const tx = camCx - camS * 960 + shx;
  const ty = camCy - camS * camFy + shy;

  // ---------- glow / highlights on the gold wedge ----------
  const zoomGlow = prog(frame, 134, 10) * (1 - prog(frame, 167, 8));
  const goldFlash = 0.55 * bump(frame, 64, 3, 14) + 0.35 * bump(frame, 128, 3, 12) + 0.5 * bump(frame, 135, 3, 14) + 0.45 * bump(frame, 152, 3, 14);
  const glowA = Math.min(1, 0.25 + 0.75 * zoomGlow + 0.6 * goldFlash);
  const navyDim = 0.5 * zoomGlow;
  const sheenX = C0 - 430 * sn;

  // ---------- top-left counter : 61 JOUEURS (moves to the right column in phase 3) ----------
  const cntIn = prog(frame, 10, 8);
  const cntVal = frame < 17 ? `${10 + Math.floor(seededRandom("scr0", frame) * 89)}` : "61";
  const cntLock = bump(frame, 17, 2, 12);
  const jouIn = prog(frame, 20, 9);
  const mv = prog(frame, 167, 14);
  const grpL = lerp(60, 1540 - 285, mv);
  const grpT = lerp(46, 238, mv);

  // ---------- bottom chip ----------
  const chipA = prog(frame, 62, 9);
  const chipB = prog(frame, 87, 10);
  const chipOut = prog(frame, 131, 12);

  // ---------- ring + ruin ----------
  const ringRot = frame > 167 ? (frame - 167) * 0.18 : 0;
  const order = DRAINED.map((idx, j) => ({ idx, r: seededRandom("ord0", j) }))
    .sort((a, b) => a.r - b.r)
    .map((o) => o.idx);
  const drainAt = (k: number) => {
    const m = order.indexOf(k);
    return m < 0 ? -1 : 203 + m * 1.0;
  };
  const ruined = DRAINED.filter((k) => frame >= drainAt(k)).length;
  const ratioIn = prog(frame, 202, 7);
  const ratioLock = bump(frame, 219, 2, 10);
  const ruiIn = prog(frame, 211, 9);

  const tokens = Array.from({ length: NT }).map((_, k) => {
    const t0 = 168 + k * 0.32;
    const a = prog(frame, t0, 9);
    if (frame < t0) return null;
    const ang = ((-90 + (k * 360) / NT + ringRot) * Math.PI) / 180;
    const rr = lerp(330, RING_R, a);
    const td = drainAt(k);
    const g = td > 0 ? prog(frame, td, 4) : 0;
    const fall = td > 0 && frame > td + 2 ? 2.2 * Math.pow(frame - td - 2, 2) : 0;
    const fade = td > 0 ? 1 - 0.8 * prog(frame, td + 4, 8) : 1;
    const flash = td > 0 ? interpolate(frame, [td, td + 7], [0, 1], CLAMP) : 0;
    const x = RING_CX + rr * Math.cos(ang);
    const y = RING_CY + rr * Math.sin(ang) + fall;
    const sc = lerp(0.4, 1, a);
    return (
      <div key={k} style={{ position: "absolute", left: x - TOK / 2, top: y - TOK / 2, width: TOK, height: TOK }}>
        {td > 0 && frame >= td && flash < 1 ? (
          <svg width={120} height={120} viewBox="0 0 120 120" style={{ position: "absolute", left: TOK / 2 - 60, top: TOK / 2 - 60 - fall }}>
            <circle cx={60} cy={60} r={22 + 34 * flash} fill="none" stroke={RED} strokeWidth={4} opacity={0.9 * (1 - flash)} />
          </svg>
        ) : null}
        <svg
          id={`token-0-t${k}`}
          width={TOK}
          height={TOK}
          viewBox="0 0 42 42"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: a * fade,
            transform: `scale(${sc}) rotate(${fall * 0.8}deg)`,
            filter: g > 0 ? `grayscale(${g}) brightness(${1 - 0.45 * g})` : "none",
          }}
        >
          <circle cx={21} cy={21} r={20} fill={GOLD} />
          <circle cx={21} cy={21} r={12.5} fill="none" stroke={GOLD_D} strokeWidth={3} />
          <rect x={18} y={1} width={6} height={6} fill="#FFFFFF" />
          <rect x={18} y={35} width={6} height={6} fill="#FFFFFF" />
          <rect x={1} y={18} width={6} height={6} fill="#FFFFFF" />
          <rect x={35} y={18} width={6} height={6} fill="#FFFFFF" />
        </svg>
      </div>
    );
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at ${(camCx / 1920) * 100}% 50%, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 55%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 96 - gx} y1={0} x2={i * 96 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={gridOp} strokeWidth={2} />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 96 - gy + 96} x2={1920} y2={i * 96 - gy + 96} stroke="#FFFFFF" strokeOpacity={gridOp} strokeWidth={2} />
        ))}
        {Array.from({ length: 34 }).map((_, i) => {
          const r = 22 + seededRandom("bcr0", i) * 22;
          const x = 50 + seededRandom("bcx0", i) * 1820;
          const sp = 1.3 + seededRandom("bcv0", i) * 2.2;
          const y = ((((seededRandom("bcy0", i) * 1300 - frame * sp) % 1300) + 1300) % 1300) - 110;
          const op = 0.07 + seededRandom("bco0", i) * 0.08;
          const rot = frame * (i % 2 ? 1.2 : -1.2);
          return (
            <g key={`c${i}`} opacity={op} transform={`rotate(${rot} ${x} ${y})`}>
              <circle cx={x} cy={y} r={r} fill="none" stroke="#FFFFFF" strokeWidth={3} />
              <circle cx={x} cy={y} r={r * 0.6} fill="none" stroke={GOLD} strokeWidth={2} />
              <rect x={x - 3} y={y - r - 1} width={6} height={8} fill="#FFFFFF" />
              <rect x={x - 3} y={y + r - 7} width={6} height={8} fill="#FFFFFF" />
              <rect x={x - r - 1} y={y - 3} width={8} height={6} fill="#FFFFFF" />
              <rect x={x + r - 7} y={y - 3} width={8} height={6} fill="#FFFFFF" />
            </g>
          );
        })}
      </svg>

      {/* camera world */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0px 0px", transform: `translate(${tx}px, ${ty}px) scale(${camS})` }}>
        {/* shockwaves at frame 0 */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={960} cy={540} r={R * (0.95 + 0.75 * shock1)} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.7 * (1 - shock1)} />
          <circle cx={960} cy={540} r={R * (0.95 + 0.55 * shock2)} fill="none" stroke={GOLD} strokeWidth={4} opacity={frame >= 4 ? 0.6 * (1 - shock2) : 0} />
        </svg>

        {/* the loaded coin */}
        <div
          id="coin-0-hero"
          style={{
            position: "absolute",
            left: 960,
            top: 540,
            width: 0,
            height: 0,
            transform: `scale(${coinScale})`,
            filter: `drop-shadow(0px 0px ${Math.round(18 + 50 * glowA)}px rgba(242,201,76,${(0.35 + 0.55 * glowA).toFixed(3)}))`,
          }}
        >
          <svg width={2 * R + 2 * T} height={2 * R + 8} viewBox={`0 0 ${2 * R + 2 * T} ${2 * R + 8}`} style={{ position: "absolute", left: -R - T, top: -R - 4 }}>
            <defs>
              <pattern id="reed-0-p" width={10} height={10} patternUnits="userSpaceOnUse">
                <rect x={0} y={0} width={10} height={10} fill={GOLD_D} />
                <rect x={0} y={0} width={10} height={4} fill={GOLD_DD} />
              </pattern>
            </defs>
            <ellipse cx={R + T - off} cy={R + 4} rx={R * ac} ry={R} fill={GOLD_DD} />
            <rect x={R + T - aoff} y={4} width={Math.max(0.5, 2 * aoff)} height={2 * R} fill="url(#reed-0-p)" />
          </svg>
          <div
            id="coin-0-face"
            style={{
              position: "absolute",
              left: off - R,
              top: -R,
              width: 2 * R,
              height: 2 * R,
              borderRadius: "50%",
              overflow: "hidden",
              transform: `scaleX(${ac})`,
              filter: `brightness(${(0.68 + 0.32 * ac).toFixed(3)})`,
            }}
          >
            <svg width={2 * R} height={2 * R} viewBox="0 0 660 660" style={{ position: "absolute", left: 0, top: 0 }}>
              <circle cx={C0} cy={C0} r={330} fill={GOLD} />
              <circle cx={C0} cy={C0} r={323} fill="none" stroke={GOLD_D} strokeWidth={5} />
              {Array.from({ length: 72 }).map((_, i) => {
                const p = pt(i * 5, 305);
                const q = pt(i * 5, 317);
                return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={GOLD_D} strokeWidth={3} opacity={0.75} />;
              })}
              <circle cx={C0} cy={C0} r={RP + 4} fill="none" stroke={GOLD_D} strokeWidth={6} />
              <path d={PATH_GOLD} fill="#F5D060" />
              <path d={PATH_GOLD} fill="#FFF6D2" opacity={Math.min(0.75, 0.3 * zoomGlow + goldFlash)} />
              <path d={PATH_NAVY} fill={NAVY} />
              <path d={PATH_NAVY} fill="#000000" opacity={navyDim} />
              <line x1={C0} y1={C0} x2={P108.x} y2={P108.y} stroke="#FFFFFF" strokeWidth={4} />
              <line x1={C0} y1={C0} x2={P252.x} y2={P252.y} stroke="#FFFFFF" strokeWidth={4} />
            </svg>
            <Box x={C0} y={148} w={300} h={104}>
              <Text id="face-0-lbl" text={T_FACE} width={300} height={104} textStyles={{ fontFamily: JOST, fontWeight: 900, color: INK, letterSpacing: 4 }} />
            </Box>
            <Box x={C0} y={258} w={400} h={148}>
              <Text id="face-0-pct" text={T_60} width={400} height={148} textStyles={{ fontFamily: MONO, fontWeight: 700, color: INK }} />
            </Box>
            <Box x={C0} y={448} w={240} h={78} style={{ opacity: 1 - 0.4 * zoomGlow }}>
              <Text id="pile-0-lbl" text={T_PILE} width={240} height={78} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: 3 }} />
            </Box>
            <Box x={C0} y={530} w={260} h={92} style={{ opacity: 1 - 0.4 * zoomGlow }}>
              <Text id="pile-0-pct" text={T_40} width={260} height={92} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
            </Box>
            <div style={{ position: "absolute", left: sheenX - 130, top: -40, width: 260, height: 740, transform: "rotate(14deg)", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 100%)" }} />
          </div>
        </div>
      </div>

      {/* ring of 61 players */}
      <div id="ring-0-players" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
        {tokens}
      </div>

      {/* bottom chip : TRUQUEE / ET ILS LE SAVAIENT */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - chipOut, transform: `translateY(${chipOut * 140}px)` }}>
        <Box x={1193} y={962} w={820} h={112} style={{ opacity: chipB, transform: `translateX(${(1 - chipB) * 200}px)` }}>
          <div id="chip-0-sav" style={{ background: "#FFFFFF", width: 820, height: 112, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-0-sav" text={T_SAV} width={800} height={96} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000", letterSpacing: 2 }} />
          </div>
        </Box>
        <Box x={lerp(960, 530, chipB)} y={962} w={380} h={112} style={{ opacity: chipA, transform: `translateY(${(1 - chipA) * 90}px)` }}>
          <div id="chip-0-truq" style={{ background: GOLD, width: 380, height: 112, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-0-truq" text={T_TRUQ} width={360} height={96} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000", letterSpacing: 2 }} />
          </div>
        </Box>
      </div>

      {/* counter : 61 JOUEURS */}
      <div id="counter-0-players" style={{ position: "absolute", left: grpL, top: grpT, width: 570, height: 150, opacity: cntIn, transform: `translateX(${(1 - cntIn) * -80}px) scale(${1 + 0.08 * cntLock})`, transformOrigin: "0px 75px" }}>
        <Box x={95} y={75} w={190} h={150}>
          <Text id="cnt-0-61" text={cntVal} width={190} height={150} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD, textShadow: `0 0 ${Math.round(30 * cntLock)}px rgba(242,201,76,0.9)` }} />
        </Box>
        <Box x={385} y={82} w={370} h={108} style={{ opacity: jouIn, transform: `translateX(${(1 - jouIn) * -40}px)` }}>
          <Text id="cnt-0-jou" text={T_JOU} width={370} height={108} align="left" textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: 2 }} />
        </Box>
        <div style={{ position: "absolute", left: 8, top: 146, width: 554 * jouIn, height: 6, background: GOLD }} />
      </div>

      {/* right column : divider + 17 / 61 RUINES */}
      <div id="ratio-0-ruin" style={{ position: "absolute", left: 1270, top: 435, width: 540, height: 180, opacity: ratioIn, transform: `scale(${1 + 0.25 * (1 - ratioIn) + 0.07 * ratioLock})`, transformOrigin: "270px 90px" }}>
        <Box x={100} y={90} w={200} h={180}>
          <Text id="ratio-0-n" text={`${Math.max(1, ruined)}`} width={200} height={180} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: RED, textShadow: `0 0 ${Math.round(34 * ratioLock)}px rgba(229,83,75,0.9)` }} />
        </Box>
        <Box x={257} y={90} w={150} h={180}>
          <Text id="ratio-0-sl" text="/" width={150} height={180} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        </Box>
        <Box x={414} y={90} w={200} h={180}>
          <Text id="ratio-0-d" text={T_OF} width={200} height={180} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        </Box>
      </div>
      <Box x={1540} y={725} w={470} h={124} style={{ opacity: ruiIn, transform: `translateX(${(1 - ruiIn) * 90}px)` }}>
        <div id="chip-0-ruin" style={{ background: RED, width: 470, height: 124, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text id="txt-0-ruin" text={T_RUI} width={440} height={104} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#FFFFFF", letterSpacing: 4 }} />
        </div>
      </Box>
    </AbsoluteFill>
  );
};

export default Scene0;
