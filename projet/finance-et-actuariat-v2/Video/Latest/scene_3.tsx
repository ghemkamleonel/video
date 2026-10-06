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
const DURATION = 216;
const WORDS: [string, number][] = [["La", -1], ["finance", 3], ["de", 22], ["march\u00e9", 29], [",", 44], ["c", 44], ["'", 47], ["est", 47], ["l", 54], ["'", 58], ["ensemble", 58], ["des", 72], ["activit\u00e9s", 78], ["o\u00f9", 100], ["l", 107], ["'", 111], ["on", 111], ["ach\u00e8te", 117], ["et", 127], ["vend", 129], ["des", 143], ["titres", 149], ["financiers", 156], ["sur", 171], ["le", 177], ["march\u00e9", 181], ["organis\u00e9", 193], [".", 208]];
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
const TICKERS = ["BANQUE", "T\u00c9L\u00c9COM", "CACAO", "\u00c9NERGIE", "CIMENT", "TRANSPORT"];

const Scene3: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const boardIn = prog(f, -6, 16);
  const buy = prog(f, at("achete"), 14);
  const sell = prog(f, at("vend"), 14);
  const meet = prog(f, Math.max(at("vend") + 14, at("titres")), 10);
  const flash = interpolate(f - Math.max(at("vend") + 14, at("titres")), [0, 4, 22], [0, 1, 0], CL);
  const org = prog(f, at("organise"), 10);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#16202B" />
      <Label T={Text} id="title-3-a1" text={"LA FINANCE DE MARCHÉ"} x={960} y={80} w={900} h={110} bg={GOLD} color="#121212" op={boardIn} />

      <div style={{ position: "absolute", left: 110, top: 160, width: 1700, height: 860, background: "#0B0F14", border: `4px solid ${org > 0 ? GOLD : "#2A2A2A"}`, boxSizing: "border-box", opacity: boardIn, transform: `scale(${0.94 + 0.06 * boardIn})` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1692, height: 110, background: org > 0 ? GOLD : "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text id="header-3-b2" text={"MARCHÉ ORGANISÉ"} width={900} height={90} textStyles={{ fontFamily: JOST, fontWeight: 900, color: org > 0 ? "#121212" : WHITE }} />
        </div>
        {TICKERS.map((t, i) => {
          const tick = Math.floor((f + i * 7) / 9);
          const ch = (seededRandom("s3-ch", tick * 10 + i) - 0.45) * 4;
          const price = 100 + seededRandom("s3-p", i) * 900 + ch * 3;
          return (
            <div key={t} style={{ position: "absolute", left: 30, top: 140 + i * 115, width: 640, height: 95, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #222" }}>
              <Text id={`tk-3-${i}`} text={t} width={300} height={70} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: WHITE }} />
              <Text id={`tp-3-${i}`} text={`${price.toFixed(2).replace(".", ",")} ${ch >= 0 ? "+" : "-"}${Math.abs(ch).toFixed(1).replace(".", ",")} %`} width={320} height={70} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: ch >= 0 ? GOLD : RED }} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 700, top: 130, width: 2, height: 700, background: "#333" }} />
      </div>

      {/* order book: background orders */}
      {Array.from({ length: 8 }).map((_, k) => {
        const birth = k * 22;
        const age = (((f - birth) % 176) + 176) % 176;
        const side = k % 2 === 0;
        const x = side ? interpolate(age, [0, 40], [860, 1150], CL) : interpolate(age, [0, 40], [1760, 1470], CL);
        const op = interpolate(age, [0, 8, 40, 52], [0, 0.35, 0.35, 0], CL) * boardIn * (1 - 0.85 * meet);
        return <div key={k} style={{ position: "absolute", left: x - 90, top: 300 + (k % 3) * 130, width: 180, height: 60, background: side ? GOLD : NAVY, opacity: op }} />;
      })}

      <Label T={Text} id="buy-3-c3" text={"ACHAT"} x={interpolate(buy, [0, 1], [700, 1080]) + 120 * meet} y={560} w={330} h={140} bg={GOLD} color="#121212" op={buy} />
      <Label T={Text} id="sell-3-d4" text="VENTE" x={interpolate(sell, [0, 1], [1900, 1640]) - 120 * meet} y={560} w={330} h={140} bg={NAVY} color={WHITE} op={sell} />
      <div style={{ position: "absolute", left: 1060, top: 400, width: 600, height: 320, background: WHITE, opacity: flash * 0.5 }} />
      <Label T={Text} id="exec-3-e5" text={"EXÉCUTÉ"} x={1360} y={760} w={420} h={110} bg={WHITE} color="#121212" op={meet} scale={0.8 + 0.2 * meet} />
      <Label T={Text} id="titres-3-f6" text="TITRES FINANCIERS" x={1360} y={900} w={620} h={90} color={GOLD} op={prog(f, at("titres"), 10)} />
    </AbsoluteFill>
  );
};

export default Scene3;
