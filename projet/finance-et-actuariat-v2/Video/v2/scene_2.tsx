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
const DURATION = 343;
const WORDS: [string, number][] = [["Qu", 27], ["'", 30], ["est", 30], ["-", 35], ["ce", 35], ["que", 39], ["c", 50], ["'", 53], ["est", 53], ["que", 61], ["la", 86], ["finance", 93], ["et", 126], ["l", 130], ["'", 140], ["actuariat", 140], ["?", 177], ["C", 190], ["'", 192], ["est", 192], ["deux", 197], ["m\u00e9tiers", 206], ["qui", 214], ["consistent", 219], ["d", 229], ["'", 231], ["abord", 231], ["\u00e0", 239], ["\u00e9valuer", 241], ["et", 248], ["g\u00e9rer", 269], ["le", 277], ["risque", 280], ["de", 286], ["l", 290], ["'", 292], ["argent", 292], ["dans", 301], ["le", 308], ["temps", 321], [".", 334]];
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
const Gauge: React.FC<{ value: number; shield: number; id: string }> = ({ value, shield, id }) => {
  const a = Math.PI * (1 - value);
  return (
    <div style={{ position: "relative", width: 420, height: 260 }}>
      <svg width={420} height={260} viewBox="0 0 420 260">
        <path d="M 30 230 A 180 180 0 0 1 390 230" fill="none" stroke="#333" strokeWidth={30} />
        <path d="M 30 230 A 180 180 0 0 1 390 230" fill="none" stroke={GOLD} strokeWidth={30} strokeDasharray={565} strokeDashoffset={565 * (1 - value)} />
        <line x1={210} y1={230} x2={210 + 150 * Math.cos(a)} y2={230 - 150 * Math.sin(a)} stroke={WHITE} strokeWidth={10} strokeLinecap="round" />
        <circle cx={210} cy={230} r={18} fill={WHITE} />
      </svg>
      <div style={{ position: "absolute", left: 150, top: 60, opacity: shield, transform: `scale(${0.4 + 0.6 * shield})` }}>
        <Asset id={id} file="shield.svg" w={120} h={140} />
      </div>
    </div>
  );
};

const Scene2: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // PHASE 1 -- the question
  const q = pop(f, -4);
  const split = prog(f, at("deux") - 2, 12);
  const orbit = f * 0.05;

  // PHASE 2 -- two jobs, one idea
  const panels = prog(f, at("deux"), 14);
  const gauge = interpolate(f, [at("evaluer"), at("evaluer") + 18], [0.1, 0.72], { ...CL, easing: EASE });
  const shield = prog(f, at("gerer"), 12);
  const line = prog(f, at("argent"), 16);
  const travel = interpolate(f, [at("argent") + 6, Math.max(at("argent") + 7, DURATION - 2)], [0, 1], CL);
  const caption = prog(f, at("evaluer"), 12);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - split }}>
        <Label T={Text} id="qmark-2-a1" text="?" x={960} y={500} w={460} h={620} color={GOLD} scale={interpolate(q, [0, 1], [0.6, 1])} />
        {["FINANCE", "ACTUARIAT"].map((t, i) => {
          const ang = orbit + i * Math.PI;
          return <Label key={t} T={Text} id={`orb-2-${i}`} text={t} x={960 + Math.cos(ang) * 520} y={500 + Math.sin(ang) * 200} w={460} h={110} bg={i === 0 ? GOLD : NAVY} color={i === 0 ? "#121212" : WHITE} />;
        })}
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: panels }}>
        {["FINANCE", "ACTUARIAT"].map((t, i) => (
          <div key={t} style={{ position: "absolute", left: 140 + i * 860, top: 90, width: 780, height: 560, border: `4px solid ${i === 0 ? GOLD : NAVY}`, background: "rgba(0,0,0,0.35)", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", gap: 30, paddingTop: 30, transform: `translateX(${(1 - panels) * (i === 0 ? -160 : 160)}px)` }}>
            <div style={{ background: i === 0 ? GOLD : NAVY, padding: "0 30px" }}>
              <Text id={`panel-title-2-${i}`} text={t} width={420} height={100} textStyles={{ fontFamily: JOST, fontWeight: 900, color: i === 0 ? "#121212" : WHITE }} />
            </div>
            <Gauge value={gauge} shield={shield} id={`img-shield-2-${i}`} />
          </div>
        ))}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={200} y1={800} x2={200 + 1520 * line} y2={800} stroke={WHITE} strokeWidth={6} />
          <polygon points={`${200 + 1520 * line},786 ${200 + 1520 * line + 26},800 ${200 + 1520 * line},814`} fill={WHITE} opacity={line} />
        </svg>
        <Label T={Text} id="today-2-b2" text={"AUJOURD'HUI"} x={290} y={860} w={360} h={70} color={GREY} op={line} />
        <Label T={Text} id="tomorrow-2-c3" text="DEMAIN" x={1640} y={860} w={300} h={70} color={GREY} op={line} />
        <div style={{ position: "absolute", left: 200 + 1400 * travel - 50, top: 800 - 70 - 60 * travel, opacity: line, transform: `rotate(${Math.sin(f * 0.3) * 6 * travel}deg)` }}>
          {Array.from({ length: 3 + Math.floor(travel * 4) }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: 0, top: -k * 18 }}>
              <Coin size={100} />
            </div>
          ))}
        </div>
        <Label T={Text} id="caption-2-d4" text={"ÉVALUER ET GÉRER LE RISQUE DE L'ARGENT DANS LE TEMPS"} x={960} y={985} w={1760} h={100} bg={WHITE} color="#121212" op={caption} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene2;
