
const COMMOS = [
  { file: "cocoa pod.svg", w: 150, h: 225, label: "CACAO", word: "cacao", x: 480 },
  { file: "coffee cup.svg", w: 230, h: 197, label: "CAFÉ", word: "cafe", x: 960 },
  { file: "oil barrel.svg", w: 150, h: 210, label: "PÉTROLE", word: "petrole", x: 1440 },
];

const Skyline: React.FC<{ op: number }> = ({ op }) => (
  <svg width={420} height={190} viewBox="0 0 420 190" style={{ opacity: op }}>
    {[[0, 90, 60], [70, 40, 50], [130, 110, 70], [210, 20, 55], [275, 70, 60], [345, 120, 70]].map(([x, top, w], k) => (
      <g key={k}>
        <rect x={x} y={top} width={w} height={190 - top} fill={NAVY_D} stroke={GREY} strokeWidth={3} />
        {Array.from({ length: Math.floor((190 - top) / 30) }).map((_, r) => <rect key={r} x={x + 10} y={top + 12 + r * 30} width={w - 20} height={10} fill={GOLD} opacity={0.35} />)}
      </g>
    ))}
  </svg>
);

const Scene10: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const title = pop(f, -3);
  const sky = prog(f, at("etranger"), 14);
  const tags = prog(f, at("fixees"), 14);
  const caption = prog(f, at("fixees"), 12);
  const slots = prog(f, at("matieres"), 12);
  const SKY_X = 1700;
  const SKY_Y = 300;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#2A2416" />
      <Label T={Text} id="title-10-a1" text={"UN ENJEU DE SOUVERAINETÉ"} x={760} y={100} w={1250} h={140} bg={GOLD} color="#121212" scale={interpolate(title, [0, 1], [1.3, 1])} op={Math.min(1, title * 1.5)} />
      <div style={{ position: "absolute", left: 1480, top: 190 }}><Skyline op={sky} /></div>
      <Label T={Text} id="sky-10-b2" text={"BOURSES ÉTRANGÈRES"} x={1690} y={410} w={400} h={70} color={GREY} op={sky} />

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {COMMOS.map((c, i) => {
          const tagX = c.x + Math.sin(f * 0.2 + i) * 18 * tags;
          return <line key={i} x1={tagX} y1={520} x2={SKY_X} y2={SKY_Y} stroke={WHITE} strokeOpacity={0.5 * tags} strokeWidth={3} strokeDasharray="10 8" />;
        })}
      </svg>

      {COMMOS.map((c, i) => {
        const p = prog(f, at(c.word), 12);
        const jump = Math.floor((f + i * 5) / 8);
        const price = 100 + seededRandom(`s10-p${i}`, jump) * 80;
        const tagX = c.x + Math.sin(f * 0.2 + i) * 18 * tags;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: c.x - 180, top: 620, width: 360, height: 360, border: `4px dashed ${GREY}`, opacity: 0.6 * (1 - p) * slots, boxSizing: "border-box" }} />
            <div style={{ position: "absolute", left: c.x - 180, top: 620, width: 360, height: 360, background: "#0B0F14", border: `5px solid ${GOLD}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * -200}px)` }}>
              <Asset id={`img-commo-10-${i}`} file={c.file} w={c.w} h={c.h} />
              <Text id={`commo-10-${i}`} text={c.label} width={300} height={80} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
            </div>
            <div style={{ position: "absolute", left: tagX - 110, top: 500, width: 220, height: 80, background: WHITE, display: "flex", alignItems: "center", justifyContent: "center", opacity: tags, clipPath: "polygon(12% 0, 100% 0, 100% 100%, 12% 100%, 0 50%)" }}>
              <Text id={`tag-10-${i}`} text={`${price.toFixed(0)} $`} width={170} height={60} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#121212" }} />
            </div>
          </React.Fragment>
        );
      })}

      <Label T={Text} id="mp-10-d4" text={"MATIÈRES PREMIÈRES AFRICAINES"} x={960} y={1030} w={1200} h={80} color={GOLD} op={slots} />
      <Label T={Text} id="caption-10-c3" text={"PRIX FIXÉS À L'ÉTRANGER"} x={760} y={290} w={760} h={90} bg={RED} color={WHITE} op={caption} />
    </AbsoluteFill>
  );
};

export default Scene10;
