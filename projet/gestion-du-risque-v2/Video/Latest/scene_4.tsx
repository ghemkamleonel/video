import React from "react";
import { useCurrentFrame, interpolate, interpolateColors, AbsoluteFill, Easing } from "remotion";
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
const RED = "#E5534B";
const GREY = "#8A8A8A";
const BG = "#121212";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const prog = (f: number, s: number, d: number) =>
  interpolate(f, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
const bump = (f: number, s: number, up: number, down: number) =>
  interpolate(f, [s, s + up, s + up + down], [0, 1, 0], CLAMP);

const Box: React.FC<{ x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{children}</div>
);

// ---------- phase 1 : ten coin slots ----------
const NS = 10;
const SW = 156;
const PITCH = 176;
const X0 = 960 - PITCH * 4.5; // 168 : centre of slot 0
const ROW_Y = 596;
const COIN = 124;
const TAG_Y = 738;
const BR_Y = 812;
const CHIP_Y = 920;
const CTR_Y = 300;
const CAP_Y = 96;
const MID_Y = 662; // line the row compresses into / the grid unfolds from

const START = [-6, 15, 30, 44, 58, 86];
const LAND = [12, 27, 42, 56, 70, 129];
const VALUES = ["50 $", "100 $", "200 $", "400 $", "800 $", "0 $"];
const CRASH = LAND[5];

// ---------- phase 2 : 40 x 25 grid ----------
const GC = 40;
const GR = 25;
const GPX = 36;
const GPY = 29;
const GX0 = 960 - ((GC - 1) * GPX) / 2; // 258
const GY0 = MID_Y - ((GR - 1) * GPY) / 2; // 314
const LIT: [number, number][] = [
  [5, 4],
  [31, 3],
  [17, 11],
  [35, 15],
  [9, 19],
  [25, 21],
];
const LIT_T = [186, 189, 192, 195, 198, 201];

const T_CAP1 = "TOUT MISER \u00c0 CHAQUE LANCER";
const T_CAP2 = "FACE : 6 CHANCES SUR 10";
const T_TEN = "10 LANCERS D'AFFIL\u00c9E";
const T_APPROX = "\u2248 0,6 %";

const Scene4: React.FC<{
  Arrow: React.FC<ArrowProps>;
  Text: React.FC<TextProps>;
  seededRandom: SeededRandomFn;
  mapboxToken: string;
}> = ({ Arrow, Text, seededRandom, mapboxToken }) => {
  const frame = useCurrentFrame();

  // ---------- background ----------
  const gx = (frame * 0.6) % 120;
  const gy = (frame * 0.35) % 120;
  const breathe = 0.16 + 0.06 * Math.sin(frame * 0.06);
  const redFlash = bump(frame, CRASH, 2, 18);

  // ---------- phase timing ----------
  const out1 = prog(frame, 166, 12);
  const rowC = prog(frame, 164, 10);
  const rowOp = 1 - prog(frame, 173, 5);
  const push = 1 + 0.03 * prog(frame, 74, 55) - 0.03 * prog(frame, CRASH, 8);
  const shake = frame >= CRASH ? 16 * Math.sin((frame - CRASH) * 2.4) * Math.exp(-(frame - CRASH) / 4) : 0;

  // ---------- counter ----------
  let heads = 0;
  for (let i = 0; i < 5; i++) if (frame >= LAND[i]) heads++;
  const crashed = frame >= CRASH;
  const ctrText = crashed ? "0 $" : `${25 * Math.pow(2, heads)} $`;
  const lastLand = crashed ? CRASH : heads > 0 ? LAND[heads - 1] : -100;
  const ctrPulse = 1 + 0.09 * bump(frame, lastLand, 2, 10);
  const ctrColor = crashed ? interpolateColors(frame, [CRASH, CRASH + 9, CRASH + 27], [RED, RED, GREY]) : GOLD;
  const ctrIn = prog(frame, -8, 12);
  const ctrDrop = crashed ? 26 * Math.exp(-(frame - CRASH) / 5) * Math.abs(Math.sin((frame - CRASH) * 0.9)) : 0;
  const x2 = Math.max(
    ...LAND.slice(0, 5).map((l) => interpolate(frame, [l, l + 3, l + 11, l + 15], [0, 1, 1, 0], CLAMP))
  );
  const x2Lift = (1 - prog(frame, lastLand, 8)) * 24;

  // ---------- captions ----------
  const capIn = prog(frame, 40, 10);
  const botChip = prog(frame, 94, 10);
  const cap2Op = 1 - prog(frame, 145, 5);

  // ---------- bracket : 10 lancers d'affilee ----------
  const brHalf = 870 * prog(frame, 144, 14);
  const brEnds = prog(frame, 156, 6);
  const brStem = prog(frame, 150, 8);
  const tenChip = prog(frame, 149, 9);

  // ---------- slots ----------
  const slots = Array.from({ length: NS }).map((_, i) => {
    const cx = X0 + i * PITCH;
    const si = prog(frame, -10 + i * 1.3, 14);
    const hasFlip = i < 6;
    const tails = i === 5;
    const s = hasFlip ? START[i] : 99999;
    const l = hasFlip ? LAND[i] : 100000;
    const started = frame >= s;
    const flipping = started && frame < l;
    const landed = frame >= l;
    const t = hasFlip ? interpolate(frame, [s, l], [0, 1], CLAMP) : 0;
    const e = tails ? Easing.out(Easing.cubic)(t) : Easing.out(Easing.quad)(t);
    const ang = (tails ? 9 : 4) * Math.PI * e;
    const c = Math.cos(ang);
    const sx = Math.max(0.06, Math.abs(c));
    const headsUp = c >= 0;
    const hop = flipping ? -(tails ? 92 : 70) * Math.sin(Math.PI * t) : 0;
    const land = hasFlip ? bump(frame, l, 2, 14) : 0;
    const drain = i < 5 ? prog(frame, CRASH + 3 + i * 1.5, 18) : 0;
    const ten = bump(frame, 144 + i * 1.6, 3, 10);
    const antic = tails ? bump(frame, 74, 6, 10) + bump(frame, 80, 4, 8) : 0;

    let border = "rgba(255,255,255,0.32)";
    let fill = "rgba(255,255,255,0.03)";
    let glow = "none";
    if (landed && !tails) {
      const g = 0.35 + 0.9 * land;
      border = GOLD;
      fill = "rgba(242,201,76,0.14)";
      glow = `0 0 ${Math.round(50 * g)}px ${Math.round(10 * g)}px rgba(242,201,76,${Math.min(0.8, 0.6 * g)})`;
    } else if (landed && tails) {
      const g = 0.4 + 1.1 * land;
      border = RED;
      fill = "rgba(229,83,75,0.24)";
      glow = `0 0 ${Math.round(56 * g)}px ${Math.round(12 * g)}px rgba(229,83,75,${Math.min(0.85, 0.6 * g)})`;
    } else if (flipping) {
      border = "rgba(255,255,255,0.85)";
    }

    let face = GOLD;
    let ring = GOLD_D;
    let ink = "#5C460C";
    let word = "FACE";
    if (!headsUp) {
      word = "PILE";
      ink = "#FFFFFF";
      if (landed) {
        face = RED;
        ring = "#8E2A24";
      } else {
        face = NAVY;
        ring = "#5E86AD";
      }
    }
    const squash = 1 - 0.12 * land;

    return (
      <React.Fragment key={i}>
        <div
          id={`slot-4-s${i}`}
          style={{
            position: "absolute",
            left: cx - SW / 2,
            top: ROW_Y - SW / 2,
            width: SW,
            height: SW,
            opacity: si * (1 - 0.4 * drain),
            transform: `translateY(${(1 - si) * 60 - 8 * ten}px)`,
            filter: drain > 0 ? `grayscale(${drain})` : "none",
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SW, background: fill, border: `3px solid ${border}`, boxSizing: "border-box", boxShadow: glow }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SW, border: "4px solid #FFFFFF", boxSizing: "border-box", opacity: Math.min(1, ten + antic) }} />
          {/* ghost coin */}
          {!started ? (
            <div style={{ position: "absolute", left: SW / 2 - COIN / 2, top: SW / 2 - COIN / 2, width: COIN, height: COIN, borderRadius: "50%", border: `3px solid rgba(255,255,255,${0.18 + 0.6 * ten + 0.4 * antic})`, boxSizing: "border-box" }} />
          ) : null}
          {/* coin */}
          {started ? (
            <div
              id={`coin-4-c${i}`}
              style={{
                position: "absolute",
                left: SW / 2 - COIN / 2,
                top: SW / 2 - COIN / 2 + hop,
                width: COIN,
                height: COIN,
                borderRadius: "50%",
                background: face,
                transform: `scaleX(${sx}) scaleY(${squash})`,
                boxShadow: flipping ? "0 18px 22px rgba(0,0,0,0.55)" : "none",
              }}
            >
              <div style={{ position: "absolute", left: 9, top: 9, width: COIN - 18, height: COIN - 18, borderRadius: "50%", border: `4px solid ${ring}`, boxSizing: "border-box" }} />
              <Box x={COIN / 2} y={COIN / 2} w={150} h={56}>
                <Text id={`coinw-4-w${i}`} text={word} width={150} height={56} maxSize={34} sizeGroup={{ texts: ["FACE", "PILE"] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: ink, letterSpacing: 1 }} />
              </Box>
            </div>
          ) : null}
        </div>
        {hasFlip ? (
          <Box
            x={cx}
            y={TAG_Y}
            w={SW}
            h={64}
            style={{
              opacity: prog(frame, l, 9) * (1 - 0.4 * drain),
              transform: `translateY(${(1 - prog(frame, l, 9)) * -26}px)`,
              filter: drain > 0 ? `grayscale(${drain})` : "none",
            }}
          >
            <Text id={`tag-4-t${i}`} text={VALUES[i]} width={SW} height={64} maxSize={44} textStyles={{ fontFamily: MONO, fontWeight: 700, color: tails ? RED : GOLD }} />
          </Box>
        ) : null}
      </React.Fragment>
    );
  });

  // ---------- grid ----------
  const gU = prog(frame, 172, 16);
  const gOp = prog(frame, 172, 6);
  const dimOp = gOp * (0.3 - 0.12 * prog(frame, 188, 16));
  const gPush = 1 + 0.025 * prog(frame, 186, 40);
  const dots: React.ReactNode[] = [];
  if (frame >= 170) {
    for (let r = 0; r < GR; r++) {
      const y = MID_Y + (GY0 + r * GPY - MID_Y) * gU;
      for (let cc = 0; cc < GC; cc++) {
        dots.push(<circle key={`d${r}-${cc}`} cx={GX0 + cc * GPX} cy={y} r={8.5} fill="#FFFFFF" />);
      }
    }
  }
  let litCount = 0;
  LIT_T.forEach((lt) => {
    if (frame >= lt) litCount++;
  });
  const fo = prog(frame, 180, 10);
  const ratio = prog(frame, 185, 8);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, #1A1D22 0%, ${BG} 55%, #000000 100%)`, overflow: "hidden" }}>
      {/* breathing background */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 50% 52%, rgba(46,79,112,${breathe}) 0%, rgba(46,79,112,0) 58%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 120 - gx} y1={0} x2={i * 120 - gx} y2={1080} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120 + gy} x2={1920} y2={i * 120 + gy} stroke="#FFFFFF" strokeOpacity={0.045} strokeWidth={2} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const s = 44 + seededRandom("sq4s", i) * 40;
          const x = 60 + seededRandom("sq4x", i) * 1800;
          const sp = 0.5 + seededRandom("sq4v", i) * 0.7;
          const y = (((seededRandom("sq4y", i) * 1240 - frame * sp) % 1240) + 1240) % 1240 - 80;
          return <circle key={`s${i}`} cx={x + s / 2} cy={y + s / 2} r={s / 2} fill="none" stroke="#FFFFFF" strokeOpacity={0.07} strokeWidth={2} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(circle at 50% 52%, rgba(229,83,75,${0.3 * redFlash}) 0%, rgba(229,83,75,0) 65%)` }} />

      {/* ================= PHASE 1 ================= */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "960px 540px", transform: `translateX(${shake}px) scale(${push})` }}>
        {/* counter */}
        <Box x={960} y={CTR_Y} w={1000} h={220} style={{ opacity: ctrIn * (1 - out1), transform: `translateY(${(1 - ctrIn) * 30 - 50 * out1 + ctrDrop}px) scale(${ctrPulse})` }}>
          <Text id="counter-4-k1" text={ctrText} width={1000} height={220} maxSize={170} textStyles={{ fontFamily: MONO, fontWeight: 700, color: ctrColor }} />
        </Box>
        <Box x={1415} y={CTR_Y} w={170} h={104} style={{ opacity: x2 * (1 - out1), transform: `translateY(${x2Lift}px)` }}>
          <div id="chip-x2-4-m2" style={{ background: GOLD, width: 170, height: 104, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Text id="txt-x2-4-m3" text={"\u00d72"} width={160} height={96} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
          </div>
        </Box>

        {/* row of ten slots + value tags */}
        <div
          id="row-4-r1"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            opacity: rowOp,
            transformOrigin: `960px ${MID_Y}px`,
            transform: `scale(${1 - 0.17 * rowC}, ${1 - 0.97 * rowC})`,
          }}
        >
          {slots}
        </div>

        {/* bracket under the ten slots */}
        <svg id="bracket-4-b1" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - out1 }}>
          <g stroke="#FFFFFF" strokeWidth={3} fill="none">
            <line x1={960 - brHalf} y1={BR_Y} x2={960 + brHalf} y2={BR_Y} opacity={brHalf > 1 ? 1 : 0} />
            <line x1={960 - 870} y1={BR_Y} x2={960 - 870} y2={BR_Y - 24} opacity={brEnds} />
            <line x1={960 + 870} y1={BR_Y} x2={960 + 870} y2={BR_Y - 24} opacity={brEnds} />
            <line x1={960} y1={BR_Y} x2={960} y2={BR_Y + 56 * brStem} opacity={brStem > 0 ? 1 : 0} />
          </g>
        </svg>
        <Box x={960} y={CHIP_Y} w={940} h={104} style={{ opacity: botChip * (1 - out1), transform: `translateY(${(1 - botChip) * 40 + 50 * out1}px)` }}>
          <div id="chip-bot-4-n1" style={{ position: "relative", background: "#FFFFFF", width: 940, height: 104 }}>
            <Box x={470} y={52} w={900} h={96} style={{ opacity: cap2Op }}>
              <Text id="txt-cap2-4-p3" text={T_CAP2} width={900} height={96} sizeGroup={{ texts: [T_CAP2, T_TEN] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
            </Box>
            <Box x={470} y={52} w={900} h={96} style={{ opacity: tenChip, transform: `translateY(${(1 - tenChip) * 20}px)` }}>
              <Text id="txt-ten-4-n2" text={T_TEN} width={900} height={96} sizeGroup={{ texts: [T_CAP2, T_TEN] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
            </Box>
          </div>
        </Box>
      </div>

      {/* top caption */}
      <Box x={960} y={CAP_Y} w={1240} h={104} style={{ opacity: capIn * (1 - out1), transform: `translateY(${(1 - capIn) * -40 - 50 * out1}px)` }}>
        <div id="chip-cap-4-p1" style={{ background: "#FFFFFF", width: 1240, height: 104, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text id="txt-cap1-4-p2" text={T_CAP1} width={1200} height={96} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#000000" }} />
        </div>
      </Box>

      {/* ================= PHASE 2 ================= */}
      {frame >= 170 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `960px ${MID_Y}px`, transform: `scale(${gPush})` }}>
          <svg id="grid-4-g1" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            <g opacity={dimOp}>{dots}</g>
            {LIT.map(([cc, r], k) => {
              const lt = LIT_T[k];
              const on = prog(frame, lt, 5);
              const rp = interpolate(frame, [lt, lt + 14], [0, 1], CLAMP);
              const x = GX0 + cc * GPX;
              const y = MID_Y + (GY0 + r * GPY - MID_Y) * gU;
              const tw = 0.85 + 0.15 * Math.sin(frame * 0.3 + k);
              return (
                <g key={`lit${k}`} id={`lit-4-l${k}`}>
                  <circle cx={x} cy={y} r={32} fill={GOLD} opacity={0.22 * on * tw} />
                  <circle cx={x} cy={y} r={12 + 34 * rp} fill="none" stroke={GOLD} strokeWidth={3} opacity={frame >= lt ? 1 - rp : 0} />
                  <circle cx={x} cy={y} r={23} fill="none" stroke={GOLD} strokeWidth={4} opacity={0.9 * on} />
                  <circle cx={x} cy={y} r={13 * (0.6 + 0.4 * on)} fill={GOLD} opacity={on} />
                </g>
              );
            })}
          </svg>
        </div>
      ) : null}

      {/* formula 0,6^10 ~ 0,6 % */}
      <div id="formula-4-f1" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 330, opacity: fo, transform: `translateY(${(1 - fo) * -30}px)` }}>
        <div style={{ position: "absolute", left: 110, top: 80, width: 270, height: 170 }}>
          <Text id="txt-base-4-f2" text="0,6" width={270} height={170} maxSize={112} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        </div>
        <div style={{ position: "absolute", left: 370, top: 72, width: 150, height: 76 }}>
          <Text id="txt-exp-4-f3" text="10" width={150} height={76} maxSize={60} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        </div>
        <div style={{ position: "absolute", left: 460, top: 80, width: 520, height: 170 }}>
          <Text id="txt-res-4-f4" text={T_APPROX} width={520} height={170} maxSize={112} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 1040, top: 108, width: 3, height: 114, background: "#FFFFFF", opacity: 0.35 * ratio }} />
      <div id="ratio-4-q1" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 330, opacity: ratio, transform: `translateY(${(1 - ratio) * -30}px)` }}>
        <div style={{ position: "absolute", left: 1070, top: 80, width: 150, height: 170 }}>
          <Text id="txt-num-4-q2" text={`${Math.max(1, litCount)}`} width={150} height={170} maxSize={112} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: GOLD }} />
        </div>
        <div style={{ position: "absolute", left: 1271, top: 80, width: 560, height: 170 }}>
          <Text id="txt-den-4-q3" text="/ 1 000" width={560} height={170} maxSize={112} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#FFFFFF" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default Scene4;
