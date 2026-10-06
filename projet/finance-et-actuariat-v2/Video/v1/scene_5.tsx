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
const DURATION = 301;
const WORDS: [string, number][] = [["Concr\u00e8tement", 8], [",", 29], ["on", 29], ["y", 34], ["\u00e9change", 37], ["les", 49], ["actions", 56], [",", 68], ["les", 68], ["parts", 75], ["d", 84], ["'", 87], ["une", 87], ["entreprise", 93], [",", 111], ["les", 111], ["obligations", 117], [",", 136], ["les", 136], ["pr\u00eats", 142], ["qu", 152], ["'", 156], ["on", 156], ["fait", 161], ["\u00e0", 169], ["l", 172], ["'", 175], ["\u00c9tat", 175], ["ou", 183], ["une", 188], ["entreprise", 194], [".", 211], ["Rembourser", 220], ["avec", 238], ["des", 246], ["int\u00e9r\u00eats", 252], [",", 267], ["bien", 267], ["\u00e9videmment", 275], [".", 292]];
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
const Card: React.FC<{ T: React.FC<TextProps>; id: string; title: string; caption: string; x: number; p: number; color: string; children: React.ReactNode }> = ({ T, id, title, caption, x, p, color, children }) => (
  <div style={{ position: "absolute", left: x - 330, top: 150, width: 660, height: 650, background: "#0B0F14", border: `6px solid ${color}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 260}px) rotate(${(1 - p) * (x < 960 ? -12 : 12)}deg)` }}>
    <div style={{ width: 648, height: 120, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <T id={`${id}-t`} text={title} width={560} height={100} textStyles={{ fontFamily: JOST, fontWeight: 900, color: color === GOLD ? "#121212" : WHITE }} />
    </div>
    <div style={{ width: 600, height: 330, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    <T id={`${id}-c`} text={caption} width={600} height={150} multiline textStyles={{ fontFamily: JOST, fontWeight: 700, color: WHITE }} />
  </div>
);

const Scene5: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const title = prog(f, -4, 12);
  const action = prog(f, at("actions"), 14);
  const slice = prog(f, at("parts"), 14);
  const oblig = prog(f, at("obligations"), 14);
  const coupon = prog(f, at("prets"), 14);
  const rS = at("rembourser");
  const band = prog(f, rS, 10);
  const go = interpolate(f, [rS + 4, rS + 34], [0, 1], { ...CL, easing: EASE });
  const back = interpolate(f, [Math.max(rS + 35, at("interets") - 4), Math.max(rS + 36, at("interets") + 26)], [0, 1], { ...CL, easing: EASE });
  const plus = prog(f, at("interets"), 12);
  const coinX = 520 + 820 * go - 820 * back;
  const nCoins = back > 0.5 ? 5 : 3;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />
      <Label T={Text} id="title-5-a1" text={"CONCRÈTEMENT, ON ÉCHANGE"} x={960} y={78} w={900} h={100} bg={WHITE} color="#121212" op={title} />

      <Card T={Text} id="card-action-5" title="ACTION" caption={"UNE PART D'UNE ENTREPRISE"} x={560} p={action} color={GOLD}>
        <svg width={420} height={320} viewBox="0 0 420 320">
          {[0, 1, 2, 3, 4].map((k) => (
            <g key={k} transform={`translate(0 ${k === 2 ? -60 * slice : 0})`}>
              <rect x={60 + k * 62} y={90} width={56} height={200} fill={k === 2 ? GOLD : NAVY} stroke="#121212" strokeWidth={4} />
              {[0, 1, 2].map((r) => <rect key={r} x={72 + k * 62} y={115 + r * 55} width={32} height={26} fill={k === 2 ? GOLD_D : NAVY_D} />)}
            </g>
          ))}
          <polygon points="50,90 210,20 370,90" fill={GREY} stroke="#121212" strokeWidth={4} />
        </svg>
      </Card>

      <Card T={Text} id="card-oblig-5" title="OBLIGATION" caption={"UN PRÊT À UN ÉTAT OU UNE ENTREPRISE"} x={1360} p={oblig} color={NAVY}>
        <svg width={460} height={320} viewBox="0 0 460 320">
          <rect x={30} y={30} width={330} height={260} fill="#F4EBD0" stroke={GOLD_D} strokeWidth={8} />
          {[0, 1, 2, 3].map((r) => <rect key={r} x={60} y={80 + r * 45} width={270 - r * 30} height={14} fill="#B7AC8C" />)}
          <circle cx={290} cy={240} r={30} fill={GOLD} stroke={GOLD_D} strokeWidth={5} />
          <g opacity={coupon} transform={`translate(${(1 - coupon) * -40} 0)`}>
            {[0, 1, 2, 3, 4].map((r) => <rect key={r} x={372} y={34 + r * 51} width={62} height={44} fill={GOLD} stroke={GOLD_D} strokeWidth={4} strokeDasharray="6 4" />)}
          </g>
        </svg>
      </Card>

      <div style={{ position: "absolute", left: 0, top: 830, width: 1920, height: 250, opacity: band }}>
        <div style={{ position: "absolute", left: 1290, top: 10, width: 200, height: 200 }}>
          <Asset id="img-bank-5-b2" file="bank.svg" w={190} h={190} />
        </div>
        <div style={{ position: "absolute", left: coinX - 50, top: 120 }}>
          {Array.from({ length: nCoins }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: 0, top: -k * 20 }}>
              <Coin size={100} />
            </div>
          ))}
        </div>
        <Label T={Text} id="interets-5-c3" text={"+ INTÉRÊTS"} x={760} y={100} w={420} h={100} bg={GOLD} color="#121212" op={plus} scale={0.7 + 0.3 * plus} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene5;
