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
const DURATION = 157;
const WORDS: [string, number][] = [["La", 2], ["finance", 5], ["de", 17], ["march\u00e9", 17], ["pour", 24], ["l", 30], ["'", 33], ["Afrique", 33], ["repr\u00e9sente", 56], ["un", 73], ["financement", 77], ["alternatif", 104], ["aux", 129], ["banques", 135], [".", 148]];
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
const Scene8: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const cluster = prog(f, -6, 18);
  const label = prog(f, at("afrique"), 10);
  const routes = prog(f, at("represente"), 16);
  const alt = prog(f, at("alternatif"), 12);
  const chip = prog(f, at("financement"), 12);
  const CX = 470;
  const CY = 520;

  // abstract glowing dot cluster (not a map): concentric organic rings of dots
  const dots: React.ReactNode[] = [];
  for (let k = 0; k < 160; k++) {
    const a = seededRandom("s8-a", k) * Math.PI * 2;
    const r = Math.sqrt(seededRandom("s8-r", k)) * 260;
    const x = CX + Math.cos(a) * r * 0.85;
    const y = CY + Math.sin(a) * r;
    const tw = 0.5 + 0.5 * Math.sin(f * 0.15 + k);
    dots.push(<circle key={k} cx={x} cy={y} r={7 + 3 * tw} fill={GOLD} opacity={(0.35 + 0.55 * tw) * cluster} />);
  }

  const bankQueue = Array.from({ length: 6 }).map((_, k) => (
    <div key={k} style={{ position: "absolute", left: 1150 - k * 52, top: 330 - 22, opacity: routes }}><Coin size={44} /></div>
  ));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#2A2416" />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={CX} cy={CY} r={300 + 10 * Math.sin(f * 0.1)} fill="none" stroke={GOLD} strokeOpacity={0.2 * cluster} strokeWidth={4} />
        {dots}
        <path d={`M ${CX + 260} ${CY - 60} C 900 ${CY - 200}, 1000 330, ${1250} 330`} fill="none" stroke={GREY} strokeWidth={10} strokeDasharray={900} strokeDashoffset={900 * (1 - routes)} />
        <path d={`M ${CX + 260} ${CY + 60} C 900 ${CY + 200}, 1000 800, ${1250} 800`} fill="none" stroke={GOLD} strokeWidth={10 + 6 * alt} strokeDasharray={900} strokeDashoffset={900 * (1 - routes)} />
        <circle cx={1460} cy={800} r={150} fill={alt > 0 ? "rgba(242,201,76,0.15)" : "none"} stroke={GOLD} strokeWidth={10} opacity={routes} />
        <circle cx={1460} cy={800} r={180 + 10 * Math.sin(f * 0.2)} fill="none" stroke={GOLD} strokeOpacity={0.4 * alt} strokeWidth={5} />
      </svg>
      <Label T={Text} id="afr-8-a1" text="AFRIQUE" x={CX} y={CY} w={420} h={130} bg="rgba(0,0,0,0.65)" color={GOLD} op={label} />

      <div style={{ position: "absolute", left: 1300, top: 220, opacity: routes, filter: `grayscale(${alt * 0.8})` }}>
        <Asset id="img-bank-8-b2" file="bank.svg" w={220} h={220} />
      </div>
      {bankQueue}
      <Label T={Text} id="bank-8-c3" text="BANQUES" x={1690} y={330} w={300} h={90} bg={WHITE} color="#121212" op={routes} />
      <Label T={Text} id="mkt-8-d4" text={"MARCHÉS"} x={1460} y={770} w={260} h={80} color={alt > 0 ? GOLD : WHITE} op={routes} />
      <Label T={Text} id="mkt2-8-d5" text="FINANCIERS" x={1460} y={840} w={260} h={70} color={alt > 0 ? GOLD : WHITE} op={routes} />

      <Label T={Text} id="chip-8-e5" text={"UN FINANCEMENT ALTERNATIF AUX BANQUES"} x={960} y={1000} w={1300} h={100} bg={GOLD} color="#121212" op={chip} />
    </AbsoluteFill>
  );
};

export default Scene8;
