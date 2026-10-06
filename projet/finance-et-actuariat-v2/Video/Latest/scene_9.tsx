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
const DURATION = 333;
const WORDS: [string, number][] = [["En", 8], ["Afrique", 11], [",", 18], ["L", 18], ["'", 20], ["\u00e9conomie", 20], ["d\u00e9pend", 22], ["surtout", 29], ["du", 38], ["cr\u00e9dit", 44], ["bancaire", 55], ["et", 72], ["les", 76], ["march\u00e9s", 81], ["permettent", 90], ["aux", 116], ["\u00c9tats", 120], ["et", 146], ["aux", 169], ["grandes", 185], ["entreprises", 198], ["de", 222], ["lever", 226], ["des", 238], ["fonds", 248], ["plus", 259], ["rapidement", 265], ["via", 280], ["des", 285], ["obligations", 291], ["ou", 305], ["des", 308], ["actions", 313], [".", 324]];
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
const Scene9: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // PHASE 1 -- how the economy is financed
  const title = prog(f, -4, 12);
  const credit = prog(f, at("credit"), 18);
  const mkts = prog(f, at("bancaire"), 14);
  const toLanes = prog(f, at("marches") - 2, 12);

  // PHASE 2 -- faster via the market
  const lanesIn = prog(f, at("marches"), 12);
  const start = at("permettent");
  const end = Math.max(start + 1, DURATION - 10);
  const fast = interpolate(f, [start, Math.max(start + 1, at("fonds"))], [0, 1], { ...CL, easing: EASE });
  // slow coin: stops at four gates
  const tSlow = interpolate(f, [start, end], [0, 1], CL);
  const gates = [0.2, 0.4, 0.6, 0.8];
  let slow = 0;
  const seg = 1 / 9;
  for (let g = 0; g < 9; g++) {
    const a = g * seg;
    const isWait = g % 2 === 1;
    const part = Math.max(0, Math.min(1, (tSlow - a) / seg));
    if (!isWait) slow += part * 0.2;
  }
  slow = Math.min(0.9, slow);
  const etats = prog(f, at("etats"), 12);
  const ent = prog(f, at("entreprises"), 12);
  const ob = prog(f, at("obligations"), 12);
  const ac = prog(f, at("actions"), 12);
  const rapide = prog(f, at("rapidement"), 12);
  const X0 = 260;
  const X1 = 1450;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - toLanes }}>
        <Label T={Text} id="title-9-a1" text={"COMMENT L'ÉCONOMIE SE FINANCE EN AFRIQUE"} x={960} y={110} w={1500} h={110} bg={WHITE} color="#121212" op={title} />
        <div style={{ position: "absolute", left: 600, top: 960 - 680 * credit, width: 300, height: 680 * credit, background: NAVY }} />
        <Label T={Text} id="credit-9-b2" text={"CRÉDIT BANCAIRE"} x={750} y={1010} w={520} h={80} color={WHITE} op={credit} />
        <div style={{ position: "absolute", left: 1060, top: 960 - 170 * mkts, width: 300, height: 170 * mkts, background: GOLD }} />
        <Label T={Text} id="mkts-9-c3" text={"MARCHÉS"} x={1210} y={1010} w={360} h={80} color={GOLD} op={mkts} />
        <div style={{ position: "absolute", left: 480, top: 960, width: 1000, height: 6, background: WHITE, opacity: title }} />
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: lanesIn }}>
        {[{ y: 300, label: "VIA LA BANQUE", c: NAVY }, { y: 560, label: "VIA LE MARCHÉ", c: GOLD }].map((l, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: X0, top: l.y - 50, width: X1 - X0, height: 100, background: "rgba(255,255,255,0.05)", borderTop: `3px solid ${l.c}`, borderBottom: `3px solid ${l.c}` }} />
            <Label T={Text} id={`lane-9-${i}`} text={l.label} x={X0 + 170} y={l.y - 95} w={340} h={70} bg={l.c} color={i === 1 ? "#121212" : WHITE} />
          </React.Fragment>
        ))}
        {gates.map((g, k) => <div key={k} style={{ position: "absolute", left: X0 + (X1 - X0) * g - 6, top: 240, width: 12, height: 120, background: GREY }} />)}
        <div style={{ position: "absolute", left: X0 + (X1 - X0) * slow - 40, top: 300 - 40 }}><Coin size={80} /></div>
        <div style={{ position: "absolute", left: X0 + (X1 - X0) * fast - 40, top: 560 - 40, opacity: 1 - ob }}><Coin size={80} /></div>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={X1 + 20} y1={230} x2={X1 + 20} y2={640} stroke={WHITE} strokeWidth={5} />
          <polygon points={`${X1 + 20},470 ${X1 + 90},495 ${X1 + 20},520`} fill={GOLD} />
        </svg>
        <div style={{ position: "absolute", left: 1600, top: 230, opacity: etats, transform: `scale(${0.6 + 0.4 * etats})` }}>
          <Asset id="img-bank-9-d4" file="bank.svg" w={170} h={170} />
        </div>
        <Label T={Text} id="etats-9-e5" text={"ÉTATS"} x={1685} y={430} w={240} h={70} color={WHITE} op={etats} />
        <div style={{ position: "absolute", left: 1600, top: 490, opacity: ent, transform: `scale(${0.6 + 0.4 * ent})` }}>
          <Factory size={170} />
        </div>
        <Label T={Text} id="ent-9-f6" text="GRANDES ENTREPRISES" x={1685} y={690} w={420} h={70} color={WHITE} op={ent} />
        <Label T={Text} id="ob-9-g7" text="OBLIGATIONS" x={760} y={800} w={500} h={110} bg={GOLD} color="#121212" op={ob} dy={(1 - ob) * 60} />
        <Label T={Text} id="ac-9-h8" text="ACTIONS" x={1260} y={800} w={420} h={110} bg={NAVY} color={WHITE} op={ac} dy={(1 - ac) * 60} />
        <Label T={Text} id="rapide-9-i9" text={"LEVER DES FONDS PLUS RAPIDEMENT"} x={960} y={970} w={1300} h={100} bg={WHITE} color="#121212" op={rapide} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene9;
