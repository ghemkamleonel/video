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
const DURATION = 471;
const WORDS: [string, number][] = [["Un", 12], ["besoin", 20], ["m\u00e9tier", 31], [".", 42], ["Les", 74], ["acteurs", 79], ["et", 90], ["les", 92], ["analystes", 97], ["de", 114], ["march\u00e9", 118], ["sont", 127], ["rares", 135], ["sur", 142], ["le", 146], ["continent", 150], [",", 162], ["alors", 162], ["que", 174], ["les", 180], ["assurances", 192], ["et", 207], ["les", 211], ["retraites", 215], ["des", 227], ["fonds", 234], ["de", 242], ["pension", 245], ["en", 259], ["ont", 285], ["un", 308], ["besoin", 314], ["pour", 324], ["accro\u00eetre", 331], ["le", 390], ["d\u00e9veloppement", 393], [".", 411]];
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
const Desk: React.FC<{ lit: number; chart: boolean }> = ({ lit, chart }) => (
  <svg width={120} height={104} viewBox="0 0 120 104">
    <rect x={10} y={8} width={100} height={60} fill={lit > 0.5 ? "#1B1406" : "#141414"} stroke={lit > 0.5 ? GOLD : "#333"} strokeWidth={4} />
    {chart && lit > 0.5 && <polyline points="20,56 40,42 56,48 76,26 100,20" fill="none" stroke={GOLD} strokeWidth={5} />}
    <rect x={52} y={68} width={16} height={14} fill={lit > 0.5 ? GOLD_D : "#333"} />
    <rect x={4} y={84} width={112} height={12} fill={lit > 0.5 ? GOLD : "#2A2A2A"} />
  </svg>
);

const Scene12: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const title = prog(f, -4, 12);
  const board = prog(f, at("acteurs") - 6, 14);
  const rare = prog(f, at("rares"), 10);
  const assur = prog(f, at("assurances"), 12);
  const pension = prog(f, at("retraites"), 12);
  const badge = 0.6 + 0.4 * Math.sin(f * 0.3);
  const waveStart = at("accroitre");
  const waveEnd = Math.max(waveStart + 1, Math.min(DURATION - 20, waveStart + 40));
  const wave = interpolate(f, [waveStart, waveEnd], [0, 1], CL);
  const final = prog(f, Math.min(Math.max(at("developpement"), waveEnd - 8), DURATION - 26), 12);

  const COLS = 8;
  const ROWS = 5;
  const RARE = [9, 20, 27, 34];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />
      <Label T={Text} id="title-12-a1" text={"UN BESOIN MÉTIER"} x={710} y={90} w={800} h={120} bg={GOLD} color="#121212" op={title} />

      <div style={{ position: "absolute", left: 140, top: 190, width: 1140, height: 690, opacity: board, filter: `brightness(${1 - 0.55 * final})` }}>
        {Array.from({ length: COLS * ROWS }).map((_, k) => {
          const col = k % COLS;
          const row = Math.floor(k / COLS);
          const isRare = RARE.includes(k);
          const order = (col + row) / (COLS + ROWS - 2);
          const lit = isRare ? rare : wave > order ? 1 : 0;
          return (
            <div key={k} style={{ position: "absolute", left: col * 142, top: row * 138 }}>
              <Desk lit={lit} chart={isRare || wave > order} />
            </div>
          );
        })}
        <svg width={1140} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline points={Array.from({ length: 21 }).map((_, i) => `${(i / 20) * 1120 * wave},${(640 - (i / 20) * 560 + Math.sin(i) * 20).toFixed(1)}`).join(" ")} fill="none" stroke={GOLD} strokeWidth={10} opacity={wave > 0 ? 1 : 0} strokeLinejoin="round" />
        </svg>
      </div>
      <Label T={Text} id="rare-12-b2" text={"ANALYSTES DE MARCHÉ : RARES"} x={710} y={950} w={980} h={100} bg={WHITE} color="#121212" op={rare * (1 - wave)} />

      {[{ p: assur, label: "ASSURANCES", y: 330, icon: <Asset id="img-umb-12-c3" file="umbrella.svg" w={140} h={140} /> }, { p: pension, label: "FONDS DE PENSION", y: 640, icon: <Vault size={140} /> }].map((t, i) => (
        <div key={i} style={{ position: "absolute", left: 1370, top: t.y - 120, width: 460, height: 240, background: "#0B0F14", border: `5px solid ${NAVY}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, opacity: t.p * (1 - final * 0.5), transform: `translateX(${(1 - t.p) * 160}px)` }}>
          {t.icon}
          <Text id={`need-12-${i}`} text={t.label} width={420} height={60} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
          <div style={{ position: "absolute", right: -18, top: -22, background: RED, padding: "4px 14px", opacity: badge * (1 - wave) }}>
            <Text id={`badge-12-${i}`} text="BESOIN" width={150} height={50} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
          </div>
        </div>
      ))}

      <div style={{ position: "absolute", left: 160, top: 400, width: 1600, height: 280, background: "rgba(0,0,0,0.82)", border: `6px solid ${GOLD}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: final, transform: `scale(${0.9 + 0.1 * final})` }}>
        <Text id="final-12-d4" text="FINANCE ET ACTUARIAT" width={1400} height={130} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
        <Text id="final2-12-e5" text={"UN MÉTIER D'AVENIR"} width={1000} height={100} textStyles={{ fontFamily: JOST, fontWeight: 900, color: GOLD }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
