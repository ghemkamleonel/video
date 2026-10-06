
const NAME = "JENNY GUINCAMP FRANCK LIONEL";

const Scene0: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // Live price line sweeping across the bottom, drawn from frame 0
  const draw = interpolate(f, [0, 50], [0.15, 1], { ...CL, easing: EASE });
  const pts: string[] = [];
  const N = 90;
  let v = 0;
  for (let i = 0; i <= N; i++) {
    v += (seededRandom("s0-walk", i) - 0.42) * 26;
    const x = 60 + (i / N) * 1800;
    const y = 930 - v * 0.9 + Math.sin(i * 0.35 + f * 0.08) * 10;
    if (i / N <= draw) pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const tipX = 60 + draw * 1800;

  // BONJOUR: visible at frame 0 with overshoot, then lifts to make room for the name card
  const hello = pop(f, -4);
  const lift = prog(f, at("moi") - 2, 14);
  const helloY = interpolate(lift, [0, 1], [500, 180]);
  const helloScale = interpolate(hello, [0, 1], [0.7, 1]) * interpolate(lift, [0, 1], [1, 0.62]);

  const card = prog(f, at("moi"), 12);
  const nameIn = prog(f, at("Jenny"), 16);
  const fin = pop(f, at("finance"));
  const act = pop(f, at("actuariat"));

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <polyline points={pts.join(" ")} fill="none" stroke={GOLD} strokeWidth={6} strokeOpacity={0.55} strokeLinejoin="round" />
        {Array.from({ length: 24 }).map((_, i) => {
          const x = 100 + i * 75;
          if (x > tipX) return null;
          const h = 30 + seededRandom("s0-c", i) * 60;
          const up = seededRandom("s0-u", i) > 0.45;
          return <rect key={i} x={x - 9} y={980 - h} width={18} height={h} fill={up ? GOLD : NAVY} opacity={0.35} />;
        })}
        <circle cx={tipX} cy={930} r={12} fill={GOLD} opacity={draw < 1 ? 1 : 0.6} />
      </svg>

      <Label T={Text} id="hello-0-k2" text="BONJOUR" x={960} y={helloY} w={1300} h={260} color={GOLD} scale={helloScale} />

      <div style={{ position: "absolute", left: 210, top: 410, width: 1500, height: 200, opacity: card, transform: `translateY(${(1 - card) * 70}px)`, background: WHITE, display: "flex", alignItems: "center" }}>
        <div style={{ width: 26, height: 200, background: GOLD }} />
        <div style={{ width: 1474, height: 200, display: "flex", alignItems: "center", justifyContent: "center", clipPath: `inset(0 ${(1 - nameIn) * 100}% 0 0)` }}>
          <Text id="name-0-p7" text={NAME} width={1400} height={150} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#121212" }} />
        </div>
      </div>

      <div style={{ position: "absolute", left: 210, top: 690, width: 700, height: 130, background: GOLD, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", boxSizing: "border-box", opacity: Math.min(1, fin * 1.4), transform: `scale(${0.6 + 0.4 * fin})` }}>
        <svg width={86} height={86} viewBox="0 0 100 100">
          <polyline points="8,80 32,56 50,66 76,30 92,38" fill="none" stroke="#121212" strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <Text id="chip-fin-0-q1" text={"FINANCE DE MARCHÉ"} width={540} height={90} sizeGroup={{ texts: ["FINANCE DE MARCHÉ", "ACTUARIAT"] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#121212" }} />
      </div>
      <div style={{ position: "absolute", left: 1010, top: 690, width: 700, height: 130, background: NAVY, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", boxSizing: "border-box", opacity: Math.min(1, act * 1.4), transform: `scale(${0.6 + 0.4 * act})` }}>
        <Asset id="img-shield-0-z3" file="shield.svg" w={74} h={86} />
        <Text id="chip-act-0-r4" text="ACTUARIAT" width={540} height={90} sizeGroup={{ texts: ["FINANCE DE MARCHÉ", "ACTUARIAT"] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene0;
