
const Scene8: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const cluster = prog(f, -6, 18);
  const label = prog(f, at("afrique"), 10);
  const routes = prog(f, at("represente"), 16);
  const alt = prog(f, at("alternatif"), 12);
  const chip = prog(f, at("financement"), 12);
  const CX = 470;
  const CY = 520;

  // abstract glowing dot cluster (not a map): concentric organic rings of dots
  const dots: React.ReactNode[] = [];
  for (let k = 0; k < 160; k++) {
    const a = seededRandom("s8-a", k) * Math.PI * 2;
    const r = Math.sqrt(seededRandom("s8-r", k)) * 260;
    const x = CX + Math.cos(a) * r * 0.85;
    const y = CY + Math.sin(a) * r;
    const tw = 0.5 + 0.5 * Math.sin(f * 0.15 + k);
    dots.push(<circle key={k} cx={x} cy={y} r={7 + 3 * tw} fill={GOLD} opacity={(0.35 + 0.55 * tw) * cluster} />);
  }

  const bankQueue = Array.from({ length: 6 }).map((_, k) => (
    <div key={k} style={{ position: "absolute", left: 1150 - k * 52, top: 330 - 22, opacity: routes }}><Coin size={44} /></div>
  ));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#2A2416" />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={CX} cy={CY} r={300 + 10 * Math.sin(f * 0.1)} fill="none" stroke={GOLD} strokeOpacity={0.2 * cluster} strokeWidth={4} />
        {dots}
        <path d={`M ${CX + 260} ${CY - 60} C 900 ${CY - 200}, 1000 330, ${1250} 330`} fill="none" stroke={GREY} strokeWidth={10} strokeDasharray={900} strokeDashoffset={900 * (1 - routes)} />
        <path d={`M ${CX + 260} ${CY + 60} C 900 ${CY + 200}, 1000 800, ${1250} 800`} fill="none" stroke={GOLD} strokeWidth={10 + 6 * alt} strokeDasharray={900} strokeDashoffset={900 * (1 - routes)} />
        <circle cx={1460} cy={800} r={150} fill={alt > 0 ? "rgba(242,201,76,0.15)" : "none"} stroke={GOLD} strokeWidth={10} opacity={routes} />
        <circle cx={1460} cy={800} r={180 + 10 * Math.sin(f * 0.2)} fill="none" stroke={GOLD} strokeOpacity={0.4 * alt} strokeWidth={5} />
      </svg>
      <Label T={Text} id="afr-8-a1" text="AFRIQUE" x={CX} y={CY} w={420} h={130} bg="rgba(0,0,0,0.65)" color={GOLD} op={label} />

      <div style={{ position: "absolute", left: 1300, top: 220, opacity: routes, filter: `grayscale(${alt * 0.8})` }}>
        <Asset id="img-bank-8-b2" file="bank.svg" w={220} h={220} />
      </div>
      {bankQueue}
      <Label T={Text} id="bank-8-c3" text="BANQUES" x={1690} y={330} w={300} h={90} bg={WHITE} color="#121212" op={routes} />
      <Label T={Text} id="mkt-8-d4" text={"MARCHÉS"} x={1460} y={770} w={260} h={80} color={alt > 0 ? GOLD : WHITE} op={routes} />
      <Label T={Text} id="mkt2-8-d5" text="FINANCIERS" x={1460} y={840} w={260} h={70} color={alt > 0 ? GOLD : WHITE} op={routes} />

      <Label T={Text} id="chip-8-e5" text={"UN FINANCEMENT ALTERNATIF AUX BANQUES"} x={960} y={1000} w={1300} h={100} bg={GOLD} color="#121212" op={chip} />
    </AbsoluteFill>
  );
};

export default Scene8;
