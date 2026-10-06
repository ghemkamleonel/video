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
const DURATION = 224;
const WORDS: [string, number][] = [["Un", 8], ["enjeu", 12], ["de", 20], ["souverainet\u00e9", 24], [".", 41], ["Beaucoup", 49], ["de", 61], ["mati\u00e8res", 65], ["premi\u00e8res", 77], ["africaines", 90], ["sont", 105], ["fix\u00e9es", 111], ["\u00e0", 120], ["l", 123], ["'", 126], ["\u00e9tranger", 126], [".", 137], ["Le", 146], ["cacao", 153], [",", 168], ["le", 168], ["caf\u00e9", 175], [",", 188], ["le", 188], ["p\u00e9trole", 195], [".", 215]];
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
const COMMOS = [
  { file: "cocoa pod.svg", w: 150, h: 225, label: "CACAO", word: "cacao", x: 480 },
  { file: "coffee cup.svg", w: 230, h: 197, label: "CAFÉ", word: "cafe", x: 960 },
  { file: "oil barrel.svg", w: 150, h: 210, label: "PÉTROLE", word: "petrole", x: 1440 },
];

const Skyline: React.FC<{ op: number }> = ({ op }) => (
  <svg width={420} height={190} viewBox="0 0 420 190" style={{ opacity: op }}>
    {[[0, 90, 60], [70, 40, 50], [130, 110, 70], [210, 20, 55], [275, 70, 60], [345, 120, 70]].map(([x, top, w], k) => (
      <g key={k}>
        <rect x={x} y={top} width={w} height={190 - top} fill={NAVY_D} stroke={GREY} strokeWidth={3} />
        {Array.from({ length: Math.floor((190 - top) / 30) }).map((_, r) => <rect key={r} x={x + 10} y={top + 12 + r * 30} width={w - 20} height={10} fill={GOLD} opacity={0.35} />)}
      </g>
    ))}
  </svg>
);

const Scene10: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const title = pop(f, -3);
  const sky = prog(f, at("etranger"), 14);
  const tags = prog(f, at("fixees"), 14);
  const caption = prog(f, at("fixees"), 12);
  const SKY_X = 1700;
  const SKY_Y = 300;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#2A2416" />
      <Label T={Text} id="title-10-a1" text={"UN ENJEU DE SOUVERAINETÉ"} x={760} y={100} w={1250} h={140} bg={GOLD} color="#121212" scale={interpolate(title, [0, 1], [1.3, 1])} op={Math.min(1, title * 1.5)} />
      <div style={{ position: "absolute", left: 1480, top: 190 }}><Skyline op={sky} /></div>
      <Label T={Text} id="sky-10-b2" text={"BOURSES ÉTRANGÈRES"} x={1690} y={410} w={400} h={70} color={GREY} op={sky} />

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {COMMOS.map((c, i) => {
          const tagX = c.x + Math.sin(f * 0.2 + i) * 18 * tags;
          return <line key={i} x1={tagX} y1={520} x2={SKY_X} y2={SKY_Y} stroke={WHITE} strokeOpacity={0.5 * tags} strokeWidth={3} strokeDasharray="10 8" />;
        })}
      </svg>

      {COMMOS.map((c, i) => {
        const p = prog(f, at(c.word), 12);
        const jump = Math.floor((f + i * 5) / 8);
        const price = 100 + seededRandom(`s10-p${i}`, jump) * 80;
        const tagX = c.x + Math.sin(f * 0.2 + i) * 18 * tags;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: c.x - 180, top: 620, width: 360, height: 360, border: `4px dashed ${GREY}`, opacity: 0.6 * (1 - p) * caption, boxSizing: "border-box" }} />
            <div style={{ position: "absolute", left: c.x - 180, top: 620, width: 360, height: 360, background: "#0B0F14", border: `5px solid ${GOLD}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * -200}px)` }}>
              <Asset id={`img-commo-10-${i}`} file={c.file} w={c.w} h={c.h} />
              <Text id={`commo-10-${i}`} text={c.label} width={300} height={80} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
            </div>
            <div style={{ position: "absolute", left: tagX - 110, top: 500, width: 220, height: 80, background: WHITE, display: "flex", alignItems: "center", justifyContent: "center", opacity: tags, clipPath: "polygon(12% 0, 100% 0, 100% 100%, 12% 100%, 0 50%)" }}>
              <Text id={`tag-10-${i}`} text={`${price.toFixed(0)} $`} width={170} height={60} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#121212" }} />
            </div>
          </React.Fragment>
        );
      })}

      <Label T={Text} id="caption-10-c3" text={"PRIX FIXÉS À L'ÉTRANGER"} x={760} y={290} w={760} h={90} bg={RED} color={WHITE} op={caption} />
    </AbsoluteFill>
  );
};

export default Scene10;
