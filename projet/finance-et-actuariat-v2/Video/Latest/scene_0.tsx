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
const DURATION = 166;
const WORDS: [string, number][] = [["Bonjour", 0], [",", 13], ["moi", 13], ["c", 19], ["'", 22], ["est", 22], ["Jenny", 28], ["Guincamp", 38], ["Franck", 52], ["Lionel", 63], [".", 74], ["Je", 82], ["m", 86], ["'", 89], ["int\u00e9resse", 89], ["\u00e0", 103], ["la", 106], ["finance", 110], ["de", 122], ["march\u00e9", 126], ["et", 136], ["l", 140], ["'", 143], ["actuariat", 143], [".", 157]];
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
const NAME = "JENNY GUINCAMP FRANCK LIONEL";

const Scene0: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // Live price line sweeping across the bottom, drawn from frame 0
  const draw = interpolate(f, [0, 50], [0.15, 1], { ...CL, easing: EASE });
  const pts: string[] = [];
  const N = 90;
  let v = 0;
  for (let i = 0; i <= N; i++) {
    v += (seededRandom("s0-walk", i) - 0.42) * 26;
    const x = 60 + (i / N) * 1800;
    const y = 930 - v * 0.9 + Math.sin(i * 0.35 + f * 0.08) * 10;
    if (i / N <= draw) pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const tipX = 60 + draw * 1800;

  // BONJOUR: visible at frame 0 with overshoot, then lifts to make room for the name card
  const hello = pop(f, -4);
  const lift = prog(f, at("moi") - 2, 14);
  const helloY = interpolate(lift, [0, 1], [500, 180]);
  const helloScale = interpolate(hello, [0, 1], [0.7, 1]) * interpolate(lift, [0, 1], [1, 0.62]);

  const card = prog(f, at("moi"), 12);
  const nameIn = prog(f, at("Jenny"), 16);
  const fin = pop(f, at("finance"));
  const act = pop(f, at("actuariat"));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <polyline points={pts.join(" ")} fill="none" stroke={GOLD} strokeWidth={6} strokeOpacity={0.55} strokeLinejoin="round" />
        {Array.from({ length: 24 }).map((_, i) => {
          const x = 100 + i * 75;
          if (x > tipX) return null;
          const h = 30 + seededRandom("s0-c", i) * 60;
          const up = seededRandom("s0-u", i) > 0.45;
          return <rect key={i} x={x - 9} y={980 - h} width={18} height={h} fill={up ? GOLD : NAVY} opacity={0.35} />;
        })}
        <circle cx={tipX} cy={930} r={12} fill={GOLD} opacity={draw < 1 ? 1 : 0.6} />
      </svg>

      <Label T={Text} id="hello-0-k2" text="BONJOUR" x={960} y={helloY} w={1300} h={260} color={GOLD} scale={helloScale} />

      <div style={{ position: "absolute", left: 210, top: 410, width: 1500, height: 200, opacity: card, transform: `translateY(${(1 - card) * 70}px)`, background: WHITE, display: "flex", alignItems: "center" }}>
        <div style={{ width: 26, height: 200, background: GOLD }} />
        <div style={{ width: 1474, height: 200, display: "flex", alignItems: "center", justifyContent: "center", clipPath: `inset(0 ${(1 - nameIn) * 100}% 0 0)` }}>
          <Text id="name-0-p7" text={NAME} width={1400} height={150} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#121212" }} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 210, top: 690, width: 700, height: 130, background: GOLD, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", boxSizing: "border-box", opacity: Math.min(1, fin * 1.4), transform: `scale(${0.6 + 0.4 * fin})` }}>
        <svg width={86} height={86} viewBox="0 0 100 100">
          <polyline points="8,80 32,56 50,66 76,30 92,38" fill="none" stroke="#121212" strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <Text id="chip-fin-0-q1" text={"FINANCE DE MARCHÉ"} width={540} height={90} sizeGroup={{ texts: ["FINANCE DE MARCHÉ", "ACTUARIAT"] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#121212" }} />
      </div>
      <div style={{ position: "absolute", left: 1010, top: 690, width: 700, height: 130, background: NAVY, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", boxSizing: "border-box", opacity: Math.min(1, act * 1.4), transform: `scale(${0.6 + 0.4 * act})` }}>
        <Asset id="img-shield-0-z3" file="shield.svg" w={74} h={86} />
        <Text id="chip-act-0-r4" text="ACTUARIAT" width={540} height={90} sizeGroup={{ texts: ["FINANCE DE MARCHÉ", "ACTUARIAT"] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene0;
