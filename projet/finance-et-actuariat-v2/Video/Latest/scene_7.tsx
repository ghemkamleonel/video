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
const DURATION = 205;
const WORDS: [string, number][] = [["Un", 8], ["remplit", 12], ["trois", 23], ["r\u00f4les", 31], [",", 39], ["trois", 39], ["r\u00f4les", 47], [".", 55], ["Financer", 63], ["l", 76], ["'", 79], ["\u00e9conomie", 79], [",", 92], ["donner", 92], ["un", 103], ["prix", 107], ["aux", 114], ["actifs", 120], ["et", 130], ["permettre", 135], ["de", 149], ["se", 154], ["prot\u00e9ger", 158], ["contre", 171], ["le", 181], ["risque", 186], [".", 196]];
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
const Pillar: React.FC<{ T: React.FC<TextProps>; id: string; label: string; x: number; p: number; children: React.ReactNode }> = ({ T, id, label, x, p, children }) => (
  <div style={{ position: "absolute", left: x - 250, top: 300, width: 500, height: 640, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 640 * (1 - p), width: 500, height: 640, background: "linear-gradient(180deg, #1E2A38 0%, #0B0F14 100%)", border: `5px solid ${GOLD}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, gap: 10 }}>
      <div style={{ width: 440, height: 330, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <T id={id} text={label} width={440} height={200} multiline maxSize={58} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
    </div>
  </div>
);

const Scene7: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const three = pop(f, -4);
  const again = interpolate(f - at("trois", 2), [0, 5, 14], [0, 1, 0], CL);
  const roles = prog(f, at("roles"), 10);
  const toPillars = prog(f, at("financer") - 4, 12);
  const p1 = prog(f, at("financer"), 16);
  const p2 = prog(f, at("donner"), 16);
  const p3 = prog(f, at("permettre"), 16);
  const roof = prog(f, at("risque"), 14);
  const swing = Math.sin(f * 0.18) * 12;
  const price = interpolate(f, [at("prix"), at("prix") + 24], [80, 125.4], CL);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - toPillars, transform: `scale(${1 + 0.4 * toPillars})` }}>
        <Label T={Text} id="three-7-a1" text="3" x={960} y={430} w={600} h={600} color={GOLD} scale={interpolate(three, [0, 1], [0.4, 1]) * (1 + 0.12 * again)} />
        <Label T={Text} id="roles-7-b2" text={"TROIS RÔLES"} x={960} y={860} w={900} h={150} bg={WHITE} color="#121212" op={roles} />
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: toPillars }}>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: roof }}>
          <polygon points={`${960 - 830},290 960,${290 - 190 * roof} ${960 + 830},290`} fill={GOLD} stroke="#121212" strokeWidth={6} />
          <rect x={110} y={940} width={1700} height={26} fill={GOLD} />
        </svg>
        <Pillar T={Text} id="p1-7-c3" label={"FINANCER L'ÉCONOMIE"} x={400} p={p1}>
          <div style={{ position: "relative", width: 300, height: 300 }}>
            <div style={{ position: "absolute", left: 60, top: 110 }}><Factory size={190} /></div>
            {[0, 1, 2].map((k) => {
              const t = ((f * 0.03 + k / 3) % 1);
              return <div key={k} style={{ position: "absolute", left: 20 + k * 90, top: 230 - t * 200, opacity: 1 - t }}><Coin size={60} /></div>;
            })}
          </div>
        </Pillar>
        <Pillar T={Text} id="p2-7-d4" label="DONNER UN PRIX AUX ACTIFS" x={960} p={p2}>
          <div style={{ transform: `rotate(${swing}deg)`, transformOrigin: "50% 0%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 6, height: 70, background: WHITE }} />
            <div style={{ width: 320, height: 160, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)" }}>
              <Text id="price-7-e5" text={`${price.toFixed(2).replace(".", ",")}`} width={230} height={100} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#121212" }} />
            </div>
          </div>
        </Pillar>
        <Pillar T={Text} id="p3-7-f6" label={"SE PROTÉGER CONTRE LE RISQUE"} x={1520} p={p3}>
          <div style={{ position: "relative", width: 320, height: 320 }}>
            {[0, 1, 2].map((k) => {
              const t = ((f * 0.035 + k / 3) % 1);
              const hit = t > 0.55;
              const x = hit ? 160 + (t - 0.55) * 300 * (k - 1) : 30 + k * 130;
              const y = hit ? 120 - (t - 0.55) * 260 : -20 + t * 230;
              return (
                <svg key={k} width={50} height={80} viewBox="0 0 50 80" style={{ position: "absolute", left: x, top: y, opacity: hit ? 1 - (t - 0.55) * 2 : 1 }}>
                  <polygon points="28,0 6,44 22,44 14,80 44,30 28,30 38,0" fill={RED} />
                </svg>
              );
            })}
            <div style={{ position: "absolute", left: 70, top: 90 }}><Asset id="img-shield-7-g7" file="shield.svg" w={180} h={210} /></div>
          </div>
        </Pillar>
      </div>
    </AbsoluteFill>
  );
};

export default Scene7;
