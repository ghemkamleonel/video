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
const DURATION = 331;
const WORDS: [string, number][] = [["Elle", 8], ["met", 17], ["en", 24], ["relation", 29], ["ceux", 46], ["qui", 55], ["ont", 62], ["l", 69], ["'", 73], ["argent", 73], ["\u00e0", 85], ["placer", 89], [",", 101], ["les", 101], ["\u00e9pargnants", 109], [",", 128], ["les", 128], ["assureurs", 136], [",", 154], ["les", 154], ["fonds", 161], [",", 172], ["et", 172], ["ceux", 177], ["qui", 186], ["ont", 193], ["besoin", 201], ["de", 213], [",", 219], ["cette", 219], [",", 229], ["de", 229], [",", 235], ["ce", 235], [",", 240], ["de", 240], ["cet", 246], ["argent", 253], ["-", 265], ["l\u00e0", 265], [",", 271], ["les", 271], ["\u00c9tats", 278], ["et", 289], ["les", 294], ["entreprises", 301], [".", 323]];
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
const PiggyCoins: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    {[0, 1, 2, 3].map((k) => (
      <div key={k} style={{ position: "absolute", left: size * 0.18, top: size * 0.5 - k * size * 0.12 }}>
        <Coin size={size * 0.62} />
      </div>
    ))}
  </div>
);

const Tile: React.FC<{ T: React.FC<TextProps>; id: string; label: string; x: number; y: number; p: number; icon: React.ReactNode; color: string; dx: number }> = ({ T, id, label, x, y, p, icon, color, dx }) => (
  <div style={{ position: "absolute", left: x - 240, top: y - 95, width: 480, height: 190, background: "#0B0F14", border: `5px solid ${color}`, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 18, padding: "0 22px", opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * dx}px) scale(${0.85 + 0.15 * p})` }}>
    <div style={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
    <T id={id} text={label} width={280} height={90} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
  </div>
);

const Scene4: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const ring = prog(f, Math.min(at("relation"), 20), 14);
  const leftTitle = prog(f, at("ceux"), 10);
  const rightTitle = prog(f, at("ceux", 2), 10);
  const ep = prog(f, at("epargnants"), 12);
  const asu = prog(f, at("assureurs"), 12);
  const fo = prog(f, at("fonds"), 12);
  const et = prog(f, at("etats"), 12);
  const en = prog(f, at("entreprises"), 12);
  const waitPulse = 0.35 + 0.25 * Math.sin(f * 0.25);
  const flowIn = prog(f, at("fonds") + 10, 10);
  const flowOut = prog(f, at("etats") + 4, 10);

  const LX = 400;
  const RX = 1520;
  const LY = [330, 560, 790];
  const RY = [430, 700];

  const coins: React.ReactNode[] = [];
  for (let k = 0; k < 18; k++) {
    const src = k % 3;
    const t = (((f * 0.018 + k / 18) % 1) + 1) % 1;
    if (t < 0.5) {
      if (flowIn <= 0) continue;
      const u = t / 0.5;
      const x = LX + 240 + (960 - 170 - LX - 240) * u;
      const y = LY[src] + (560 - LY[src]) * u;
      coins.push(<div key={k} style={{ position: "absolute", left: x - 22, top: y - 22, opacity: flowIn }}><Coin size={44} /></div>);
    } else {
      if (flowOut <= 0) continue;
      const u = (t - 0.5) / 0.5;
      const dst = k % 2;
      const x = 960 + 170 + (RX - 240 - 960 - 170) * u;
      const y = 560 + (RY[dst] - 560) * u;
      coins.push(<div key={k} style={{ position: "absolute", left: x - 22, top: y - 22, opacity: flowOut }}><Coin size={44} /></div>);
    }
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />
      <Label T={Text} id="ltitle-4-a1" text={"ONT DE L'ARGENT À PLACER"} x={LX} y={150} w={620} h={100} bg={GOLD} color="#121212" op={leftTitle} />
      <Label T={Text} id="rtitle-4-b2" text={"ONT BESOIN D'ARGENT"} x={RX} y={150} w={620} h={100} bg={NAVY} color={WHITE} op={rightTitle} />

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: ring }}>
        <circle cx={960} cy={560} r={170} fill="rgba(242,201,76,0.08)" stroke={GOLD} strokeWidth={10} />
        <circle cx={960} cy={560} r={200 + 8 * Math.sin(f * 0.15)} fill="none" stroke={GOLD} strokeOpacity={0.3} strokeWidth={4} />
        {LY.map((y, i) => <line key={`l${i}`} x1={LX + 240} y1={y} x2={790} y2={560} stroke={WHITE} strokeOpacity={0.15 * [ep, asu, fo][i]} strokeWidth={4} />)}
        {RY.map((y, i) => <line key={`r${i}`} x1={1130} y1={560} x2={RX - 240} y2={y} stroke={WHITE} strokeOpacity={0.15 * [et, en][i]} strokeWidth={4} />)}
      </svg>
      <Label T={Text} id="ring-4-c3" text={"MARCHÉ"} x={960} y={560} w={300} h={110} color={GOLD} op={ring} />

      <Tile T={Text} id="ep-4-d4" label={"ÉPARGNANTS"} x={LX} y={LY[0]} p={ep} color={GOLD} dx={-120} icon={<PiggyCoins size={130} />} />
      <Tile T={Text} id="as-4-e5" label="ASSUREURS" x={LX} y={LY[1]} p={asu} color={GOLD} dx={-120} icon={<Asset id="img-umbrella-4-f6" file="umbrella.svg" w={130} h={130} />} />
      <Tile T={Text} id="fo-4-g7" label="FONDS" x={LX} y={LY[2]} p={fo} color={GOLD} dx={-120} icon={<Vault size={130} />} />

      {[0, 1].map((i) => {
        const filled = i === 0 ? et : en;
        const show = f >= at("besoin") && filled < 1;
        return show ? <div key={i} style={{ position: "absolute", left: RX - 240, top: RY[i] - 95, width: 480, height: 190, border: `5px dashed ${WHITE}`, opacity: waitPulse * (1 - filled), boxSizing: "border-box" }} /> : null;
      })}
      <Tile T={Text} id="et-4-h8" label={"ÉTATS"} x={RX} y={RY[0]} p={et} color={NAVY} dx={120} icon={<Asset id="img-bank-4-i9" file="bank.svg" w={130} h={130} />} />
      <Tile T={Text} id="en-4-j1" label="ENTREPRISES" x={RX} y={RY[1]} p={en} color={NAVY} dx={120} icon={<Factory size={130} />} />

      {coins}
    </AbsoluteFill>
  );
};

export default Scene4;
