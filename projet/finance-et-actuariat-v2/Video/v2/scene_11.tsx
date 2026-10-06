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
const DURATION = 200;
const WORDS: [string, number][] = [["Mieux", 10], ["ma\u00eetriser", 15], ["la", 29], ["finance", 33], ["de", 40], ["march\u00e9", 43], [",", 60], ["c", 60], ["'", 62], ["est", 62], ["n\u00e9gocier", 66], ["ses", 84], ["prix", 89], ["pour", 95], ["se", 103], ["prot\u00e9ger", 107], ["contre", 154], ["leurs", 166], ["variations", 176], [".", 192]];
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
const COMMOS11 = [
  { file: "cocoa pod.svg", w: 120, h: 180, label: "CACAO", x: 560 },
  { file: "coffee cup.svg", w: 190, h: 163, label: "CAFÉ", x: 960 },
  { file: "oil barrel.svg", w: 120, h: 168, label: "PÉTROLE", x: 1360 },
];

const Scene11: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const tiles = prog(f, -6, 14);
  const panel = prog(f, at("maitriser"), 14);
  const cut = prog(f, at("negocier"), 10);
  const reattach = prog(f, at("negocier") + 8, 14);
  const shield = pop(f, at("proteger"));
  const calm = prog(f, at("proteger"), 18);
  const caption = prog(f, at("negocier") + 10, 12);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#2A2416" />

      <div style={{ position: "absolute", left: 960 - 330, top: 120, opacity: Math.min(1, shield * 1.3) * 0.9, transform: `scale(${0.4 + 1.2 * shield})`, transformOrigin: "330px 330px" }}>
        <Asset id="img-shield-11-a1" file="shield.svg" w={660} h={770} style={{ opacity: 0.35 }} />
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {COMMOS11.map((c, i) => (
          <g key={i}>
            <line x1={c.x} y1={150} x2={1820} y2={40} stroke={RED} strokeOpacity={0.6 * (1 - cut)} strokeWidth={3} strokeDasharray="10 8" />
            <line x1={c.x} y1={190} x2={c.x} y2={190 + 560 * reattach} stroke={GOLD} strokeWidth={4} opacity={reattach} />
          </g>
        ))}
      </svg>

      {COMMOS11.map((c, i) => {
        const jump = Math.floor((f + i * 5) / 7);
        const wild = 100 + seededRandom(`s11-p${i}`, jump) * 80;
        const target = 140 + i * 6;
        const price = wild + (target - wild) * reattach;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: c.x - 150, top: 260, width: 300, height: 320, background: "#0B0F14", border: `5px solid ${GOLD}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: tiles, transform: `translateY(${(1 - tiles) * 80}px)` }}>
              <Asset id={`img-c11-${i}`} file={c.file} w={c.w} h={c.h} />
              <Text id={`c11-${i}`} text={c.label} width={260} height={70} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
            </div>
            <div style={{ position: "absolute", left: c.x - 110, top: 140, width: 220, height: 80, background: reattach > 0.5 ? GOLD : WHITE, display: "flex", alignItems: "center", justifyContent: "center", opacity: tiles, clipPath: "polygon(12% 0, 100% 0, 100% 100%, 12% 100%, 0 50%)", transform: `rotate(${(1 - calm) * Math.sin(f * 0.4 + i) * 8}deg)` }}>
              <Text id={`p11-${i}`} text={`${price.toFixed(0)} $`} width={170} height={60} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#121212" }} />
            </div>
          </React.Fragment>
        );
      })}

      <div style={{ position: "absolute", left: 310, top: 700, width: 1300, height: 220, background: "linear-gradient(180deg, #2B2414 0%, #14110A 100%)", border: `6px solid ${GOLD}`, boxSizing: "border-box", opacity: panel, transform: `translateY(${(1 - panel) * 260}px)` }}>
        {COMMOS11.map((c, i) => {
          const knob = 0.5 + (1 - reattach) * Math.sin(f * 0.3 + i * 2) * 0.35 + reattach * (i - 1) * 0.08;
          return (
            <div key={i} style={{ position: "absolute", left: c.x - 310 - 150, top: 60, width: 300, height: 100 }}>
              <div style={{ position: "absolute", left: 0, top: 44, width: 300, height: 12, background: "#444" }} />
              <div style={{ position: "absolute", left: 300 * knob - 24, top: 26, width: 48, height: 48, background: GOLD, border: "4px solid #121212", boxSizing: "border-box" }} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, top: 160, width: 1288, height: 50, display: "flex", justifyContent: "center" }}>
          <Text id="panel-11-b2" text={"MAÎTRISER LA FINANCE DE MARCHÉ"} width={900} height={50} textStyles={{ fontFamily: JOST, fontWeight: 700, color: GOLD }} />
        </div>
      </div>

      <Label T={Text} id="caption-11-c3" text={"NÉGOCIER SES PRIX, SE PROTÉGER DES VARIATIONS"} x={960} y={1005} w={1500} h={100} bg={WHITE} color="#121212" op={caption} />
    </AbsoluteFill>
  );
};

export default Scene11;
