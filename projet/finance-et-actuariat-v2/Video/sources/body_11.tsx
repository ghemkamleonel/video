
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
