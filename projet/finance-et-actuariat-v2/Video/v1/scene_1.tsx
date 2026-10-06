import React from "react";
import { useCurrentFrame, interpolate, spring, AbsoluteFill, Easing, Img, staticFile } from "remotion";
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
const NAVY_D = "#1C3350";
const BROWN = "#443832";
const RED = "#E5534B";
const WHITE = "#FFFFFF";
const GREY = "#8A8A8A";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) => interpolate(f, [s, s + d], [0, 1], { ...CL, easing: EASE });
const pop = (f: number, s: number) => spring({ frame: f - s, fps: 30, config: { damping: 13, stiffness: 170, mass: 0.8 } });

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

const Label: React.FC<{ T: React.FC<TextProps>; id: string; text: string; x: number; y: number; w: number; h: number; bg?: string; color?: string; font?: string; weight?: number; op?: number; dx?: number; dy?: number; scale?: number; border?: string }> = ({ T, id, text, x, y, w, h, bg, color = WHITE, font = JOST, weight = 900, op = 1, dx = 0, dy = 0, scale = 1, border }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", opacity: op, transform: `translate(${dx}px, ${dy}px) scale(${scale})`, background: bg, border, boxSizing: "border-box" }}>
    <T id={id} text={text} width={Math.max(150, w - (bg || border ? 36 : 0))} height={Math.max(50, h - (bg || border ? 18 : 0))} textStyles={{ fontFamily: font, fontWeight: weight, color }} />
  </div>
);

const Backdrop: React.FC<{ f: number; rnd: SeededRandomFn; tint?: string }> = ({ f, rnd, tint = "#1B2633" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${tint} 0%, #121212 58%, #000000 100%)` }}>
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = i * 120 - 120 + ((f * 0.5) % 120);
        return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={1080} stroke={WHITE} strokeOpacity={0.045} strokeWidth={2} />;
      })}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 120} x2={1920} y2={i * 120} stroke={WHITE} strokeOpacity={0.045} strokeWidth={2} />
      ))}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = rnd("bd-x", i) * 1920;
        const y = (((rnd("bd-y", i) * 1200 - f * (0.6 + rnd("bd-s", i))) % 1200) + 1200) % 1200 - 60;
        const s = 16 + rnd("bd-z", i) * 26;
        return <rect key={`s${i}`} x={x} y={y} width={s} height={s} fill="none" stroke={GOLD} strokeOpacity={0.13} strokeWidth={2} transform={`rotate(${f * 0.4 + i * 21} ${x + s / 2} ${y + s / 2})`} />;
      })}
    </svg>
  </AbsoluteFill>
);

const Coin: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <circle cx={50} cy={50} r={46} fill={GOLD} stroke={GOLD_D} strokeWidth={6} />
    <circle cx={50} cy={50} r={30} fill="none" stroke={GOLD_D} strokeWidth={5} />
  </svg>
);

const Asset: React.FC<{ id: string; file: string; w: number; h: number; style?: React.CSSProperties }> = ({ id, file, w, h, style }) => (
  <Img id={id} src={staticFile(file)} style={{ width: w, height: h, ...style }} />
);

const Factory: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <rect x={20} y={70} width={26} height={110} fill={GREY} stroke="#121212" strokeWidth={5} />
    <polygon points="46,180 46,110 86,80 86,110 126,80 126,110 166,80 166,180" fill={NAVY} stroke="#121212" strokeWidth={6} strokeLinejoin="round" />
    <rect x={60} y={130} width={22} height={22} fill={GOLD} />
    <rect x={100} y={130} width={22} height={22} fill={GOLD} />
    <rect x={140} y={130} width={18} height={50} fill={GOLD_D} />
    <rect x={10} y={178} width={180} height={10} fill="#E5E5E5" stroke="#121212" strokeWidth={4} />
  </svg>
);

const Vault: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <rect x={20} y={20} width={160} height={160} rx={10} fill={NAVY} stroke="#121212" strokeWidth={7} />
    <circle cx={100} cy={100} r={50} fill={NAVY_D} stroke={GOLD} strokeWidth={8} />
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <line key={k} x1={100} y1={100} x2={100 + 38 * Math.cos((k * Math.PI) / 3)} y2={100 + 38 * Math.sin((k * Math.PI) / 3)} stroke={GOLD} strokeWidth={6} />
    ))}
    <circle cx={100} cy={100} r={12} fill={GOLD} />
    <rect x={170} y={60} width={14} height={30} fill={GOLD} />
    <rect x={170} y={110} width={14} height={30} fill={GOLD} />
  </svg>
);

/* @ovg-timings:begin -- generated by retime_scenes.py, do not edit by hand */
const DURATION = 305;
const WORDS: [string, number][] = [["\u00c9tant", 8], ["\u00e9tudiant", 17], ["\u00e0", 31], ["l", 34], ["'", 37], ["\u00e9cole", 37], ["nationale", 46], ["sup\u00e9rieure", 61], ["pour", 78], ["\u00eatre", 86], ["n\u00e9", 93], [",", 98], ["o\u00f9", 98], ["j", 103], ["'", 106], ["ai", 106], ["fait", 110], ["la", 118], ["fili\u00e8re", 123], ["finance", 135], ["et", 147], ["actuariat", 152], ["en", 167], ["niveau", 171], ["4", 182], [",", 185], ["j", 185], ["'", 188], ["ai", 188], ["d\u00e9cid\u00e9", 193], ["de", 203], ["cr\u00e9er", 208], ["du", 217], ["contenu", 222], ["pour", 234], ["banaliser", 242], ["la", 257], ["finance", 262], ["et", 274], ["l", 278], ["'", 281], ["actuariat", 281], [".", 297]];
/* @ovg-timings:end */
const MARKS = new RegExp("[" + String.fromCharCode(0x300) + "-" + String.fromCharCode(0x36f) + "]", "g");
const norm = (s: string): string => s.normalize("NFD").replace(MARKS, "").toLowerCase().replace(/[^a-z0-9]/g, "");
// Local frame at which the n-th occurrence of `word` starts being spoken in this scene.
// Apostrophes and hyphens split tokens (l ' actuariat), so pass the plain word: at("actuariat").
const at = (word: string, nth: number = 1): number => {
  const target = norm(word);
  let k = 0;
  for (const [w, f] of WORDS) {
    if (norm(w) === target) {
      k += 1;
      if (k === nth) return f;
    }
  }
  throw new Error("at(): word not found in this scene: " + word + " #" + nth);
};

// ---- scene body ----
const Scene1: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // PHASE 1 -- the school
  const cap = pop(f, -6);
  const swing = Math.sin(f * 0.12) * 10 * Math.exp(-f / 120);
  const school = prog(f, at("ecole"), 12);
  const filiere = prog(f, at("filiere"), 12);
  const niveau = pop(f, at("niveau"));
  const p2 = prog(f, at("creer") - 4, 14);

  // PHASE 2 -- creating content
  const playerIn = prog(f, at("creer"), 14);
  const fill = interpolate(f, [at("creer"), Math.max(at("creer") + 1, DURATION - 4)], [0, 1], CL);
  const typeStart = at("banaliser");
  const typeEnd = Math.max(typeStart + 1, Math.min(DURATION - 6, typeStart + 34));
  const pulse = 1 + 0.06 * Math.sin(f * 0.25);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - p2, transform: `scale(${1 - 0.15 * p2})` }}>
        <Box x={430} y={470} w={480} h={352} style={{ transform: `translateY(${(1 - cap) * -260}px) rotate(${swing}deg)` }}>
          <Asset id="img-cap-1-a1" file="graduation cap.svg" w={480} h={352} />
        </Box>
        <Label T={Text} id="school-1-b2" text={"ÉCOLE NATIONALE SUPÉRIEURE"} x={1240} y={330} w={1100} h={140} bg={WHITE} color="#121212" op={school} dx={(1 - school) * 120} />
        <Label T={Text} id="filiere-1-c3" text={"FILIÈRE FINANCE ET ACTUARIAT"} x={1240} y={530} w={1100} h={130} bg={GOLD} color="#121212" op={filiere} dx={(1 - filiere) * 120} />
        <Label T={Text} id="niveau-1-d4" text="NIVEAU 4" x={900} y={720} w={420} h={130} bg={NAVY} color={WHITE} op={Math.min(1, niveau * 1.5)} scale={0.5 + 0.5 * niveau} />
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: playerIn }}>
        <div style={{ position: "absolute", left: 360, top: 120, width: 1200, height: 620, background: "#0B0F14", border: `6px solid ${WHITE}`, boxSizing: "border-box", transform: `scale(${0.85 + 0.15 * playerIn})` }}>
          <svg width={1188} height={608} style={{ position: "absolute", left: 0, top: 0 }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const h = 40 + seededRandom("s1-bar", i) * 220 + Math.sin(f * 0.1 + i) * 20;
              return <rect key={i} x={80 + i * 88} y={470 - h} width={50} height={h} fill={i % 3 === 0 ? GOLD : NAVY} opacity={0.35} />;
            })}
            <g transform={`translate(594 270) scale(${pulse})`}>
              <circle r={110} fill={GOLD} opacity={0.95} />
              <polygon points="-34,-56 -34,56 62,0" fill="#121212" />
            </g>
            <rect x={60} y={540} width={1068} height={14} fill="#333" />
            <rect x={60} y={540} width={1068 * fill} height={14} fill={GOLD} />
            <circle cx={60 + 1068 * fill} cy={547} r={16} fill={GOLD} />
          </svg>
        </div>
        <Label T={Text} id="cree-1-e5" text={"CRÉER DU CONTENU"} x={960} y={78} w={700} h={100} bg={GOLD} color="#121212" op={playerIn} />
        <div style={{ position: "absolute", left: 110, top: 800, width: 1700, height: 150, display: "flex", alignItems: "center", justifyContent: "center", opacity: f >= typeStart ? 1 : 0 }}>
          <Text id="banaliser-1-f6" text={"BANALISER LA FINANCE ET L'ACTUARIAT"} width={1700} height={140} typing={{ startFrame: typeStart, endFrame: typeEnd, showCursor: false }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
        </div>
        <div style={{ position: "absolute", left: 160, top: 960, width: 1600 * prog(f, typeEnd, 12), height: 10, background: GOLD }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene1;
