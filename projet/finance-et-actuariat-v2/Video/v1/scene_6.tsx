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
const DURATION = 174;
const WORDS: [string, number][] = [["Les", 8], ["produits", 14], ["d\u00e9riv\u00e9s", 28], [",", 40], ["les", 40], ["contrats", 47], ["qui", 60], [",", 67], ["qui", 67], ["sont", 73], ["utilis\u00e9s", 81], ["pour", 94], ["se", 102], ["prot\u00e9ger", 107], ["contre", 121], ["la", 132], ["variation", 136], ["des", 152], ["prix", 158], [".", 166]];
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
const Scene6: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const card = prog(f, -6, 16);
  const title = prog(f, at("derives"), 10);
  const sign = prog(f, at("contrats"), 20);
  const protect = prog(f, at("proteger"), 14);
  const shieldPop = pop(f, at("proteger"));
  const caption = prog(f, at("variation"), 12);

  // volatile price line in the chart area (x 980-1820, y 200-800)
  const pts: string[] = [];
  const N = 70;
  for (let i = 0; i <= N; i++) {
    const k = i + Math.floor(f / 2);
    const y = 500 + Math.sin(k * 0.45) * 120 + (seededRandom("s6-v", k) - 0.5) * 220;
    pts.push(`${(980 + (i / N) * 840).toFixed(1)},${y.toFixed(1)}`);
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#1E1E2A" />
      <Label T={Text} id="title-6-a1" text={"PRODUITS DÉRIVÉS"} x={960} y={80} w={760} h={100} bg={GOLD} color="#121212" op={title} />

      <div style={{ position: "absolute", left: 160, top: 170, width: 640, height: 760, background: "#F4EBD0", border: `8px solid ${GOLD_D}`, boxSizing: "border-box", opacity: card, transform: `translateX(${(1 - card) * -200}px) rotate(${(1 - card) * -8}deg)`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 30, gap: 24 }}>
        <Text id="contract-6-b2" text={"PRODUIT DÉRIVÉ"} width={560} height={90} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#121212" }} />
        <svg width={560} height={420} viewBox="0 0 560 420">
          {[0, 1, 2, 3, 4, 5, 6].map((r) => <rect key={r} x={20} y={20 + r * 44} width={520 - (r % 3) * 70} height={16} fill="#C9BE9C" />)}
          <line x1={40} y1={380} x2={300} y2={380} stroke="#121212" strokeWidth={4} />
          <path d="M 50 370 C 80 320 110 400 140 350 C 170 310 200 390 240 345" fill="none" stroke={NAVY} strokeWidth={6} strokeDasharray={420} strokeDashoffset={420 * (1 - sign)} strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 380, top: 470, opacity: Math.min(1, shieldPop * 1.4), transform: `scale(${0.3 + 0.7 * shieldPop})` }}>
        <Asset id="img-shield-6-c3" file="shield.svg" w={300} h={350} />
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: card }}>
        <rect x={980} y={180} width={840} height={640} fill="rgba(0,0,0,0.35)" stroke="#333" strokeWidth={3} />
        <rect x={980} y={500 - 70 * protect} width={840} height={140 * protect} fill={GOLD} opacity={0.18} />
        <polyline points={pts.join(" ")} fill="none" stroke={RED} strokeWidth={5} strokeOpacity={1 - 0.45 * protect} strokeLinejoin="round" />
        <line x1={980} y1={500} x2={980 + 840 * protect} y2={500} stroke={GOLD} strokeWidth={10} />
      </svg>
      <Label T={Text} id="volat-6-d4" text="PRIX DU MARCHÉ" x={1180} y={230} w={360} h={70} color={RED} op={card * (1 - protect)} />
      <Label T={Text} id="garanti-6-e5" text="PRIX GARANTI" x={1400} y={420} w={420} h={90} bg={GOLD} color="#121212" op={protect} />

      <Label T={Text} id="caption-6-f6" text={"SE PROTÉGER CONTRE LA VARIATION DES PRIX"} x={1300} y={930} w={1000} h={110} bg={WHITE} color="#121212" op={caption} />
    </AbsoluteFill>
  );
};

export default Scene6;
