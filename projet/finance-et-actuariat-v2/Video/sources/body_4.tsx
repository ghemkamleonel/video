
const PiggyCoins: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    {[0, 1, 2, 3].map((k) => (
      <div key={k} style={{ position: "absolute", left: size * 0.18, top: size * 0.5 - k * size * 0.12 }}>
        <Coin size={size * 0.62} />
      </div>
    ))}
  </div>
);

const Tile: React.FC<{ T: React.FC<TextProps>; id: string; label: string; x: number; y: number; p: number; icon: React.ReactNode; color: string; dx: number }> = ({ T, id, label, x, y, p, icon, color, dx }) => (
  <div style={{ position: "absolute", left: x - 240, top: y - 95, width: 480, height: 190, background: "#0B0F14", border: `5px solid ${color}`, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 18, padding: "0 22px", opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * dx}px) scale(${0.85 + 0.15 * p})` }}>
    <div style={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
    <T id={id} text={label} width={280} height={90} sizeGroup={{ texts: ["ÉPARGNANTS", "ASSUREURS", "FONDS", "ÉTATS", "ENTREPRISES"] }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
  </div>
);

const Scene4: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const ring = prog(f, Math.min(at("relation"), 20), 14);
  const leftTitle = prog(f, at("ceux"), 10);
  const rightTitle = prog(f, at("ceux", 2), 10);
  const ep = prog(f, at("epargnants"), 12);
  const asu = prog(f, at("assureurs"), 12);
  const fo = prog(f, at("fonds"), 12);
  const et = prog(f, at("etats"), 12);
  const en = prog(f, at("entreprises"), 12);
  const waitPulse = 0.35 + 0.25 * Math.sin(f * 0.25);
  const flowIn = prog(f, at("fonds") + 10, 10);
  const flowOut = prog(f, at("etats") + 4, 10);

  const LX = 400;
  const RX = 1520;
  const LY = [330, 560, 790];
  const RY = [430, 700];

  const coins: React.ReactNode[] = [];
  for (let k = 0; k < 18; k++) {
    const src = k % 3;
    const t = (((f * 0.018 + k / 18) % 1) + 1) % 1;
    if (t < 0.5) {
      if (flowIn <= 0) continue;
      const u = t / 0.5;
      const x = LX + 240 + (960 - 170 - LX - 240) * u;
      const y = LY[src] + (560 - LY[src]) * u;
      coins.push(<div key={k} style={{ position: "absolute", left: x - 22, top: y - 22, opacity: flowIn }}><Coin size={44} /></div>);
    } else {
      if (flowOut <= 0) continue;
      const u = (t - 0.5) / 0.5;
      const dst = k % 2;
      const x = 960 + 170 + (RX - 240 - 960 - 170) * u;
      const y = 560 + (RY[dst] - 560) * u;
      coins.push(<div key={k} style={{ position: "absolute", left: x - 22, top: y - 22, opacity: flowOut }}><Coin size={44} /></div>);
    }
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />
      <Label T={Text} id="ltitle-4-a1" text={"ONT DE L'ARGENT À PLACER"} x={LX} y={150} w={620} h={100} bg={GOLD} color="#121212" op={leftTitle} />
      <Label T={Text} id="rtitle-4-b2" text={"ONT BESOIN D'ARGENT"} x={RX} y={150} w={620} h={100} bg={NAVY} color={WHITE} op={rightTitle} />

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: ring }}>
        <circle cx={960} cy={560} r={170} fill="rgba(242,201,76,0.08)" stroke={GOLD} strokeWidth={10} />
        <circle cx={960} cy={560} r={200 + 8 * Math.sin(f * 0.15)} fill="none" stroke={GOLD} strokeOpacity={0.3} strokeWidth={4} />
        {LY.map((y, i) => <line key={`l${i}`} x1={LX + 240} y1={y} x2={790} y2={560} stroke={WHITE} strokeOpacity={0.15 * [ep, asu, fo][i]} strokeWidth={4} />)}
        {RY.map((y, i) => <line key={`r${i}`} x1={1130} y1={560} x2={RX - 240} y2={y} stroke={WHITE} strokeOpacity={0.15 * [et, en][i]} strokeWidth={4} />)}
      </svg>
      <Label T={Text} id="ring-4-c3" text={"MARCHÉ"} x={960} y={560} w={300} h={110} color={GOLD} op={ring} />

      <Tile T={Text} id="ep-4-d4" label={"ÉPARGNANTS"} x={LX} y={LY[0]} p={ep} color={GOLD} dx={-120} icon={<PiggyCoins size={130} />} />
      <Tile T={Text} id="as-4-e5" label="ASSUREURS" x={LX} y={LY[1]} p={asu} color={GOLD} dx={-120} icon={<Asset id="img-umbrella-4-f6" file="umbrella.svg" w={130} h={130} />} />
      <Tile T={Text} id="fo-4-g7" label="FONDS" x={LX} y={LY[2]} p={fo} color={GOLD} dx={-120} icon={<Vault size={130} />} />

      {[0, 1].map((i) => {
        const filled = i === 0 ? et : en;
        const show = f >= at("besoin") && filled < 1;
        return show ? <div key={i} style={{ position: "absolute", left: RX - 240, top: RY[i] - 95, width: 480, height: 190, border: `5px dashed ${WHITE}`, opacity: waitPulse * (1 - filled), boxSizing: "border-box" }} /> : null;
      })}
      <Tile T={Text} id="et-4-h8" label={"ÉTATS"} x={RX} y={RY[0]} p={et} color={NAVY} dx={120} icon={<Asset id="img-bank-4-i9" file="bank.svg" w={130} h={130} />} />
      <Tile T={Text} id="en-4-j1" label="ENTREPRISES" x={RX} y={RY[1]} p={en} color={NAVY} dx={120} icon={<Factory size={130} />} />

      {coins}
    </AbsoluteFill>
  );
};

export default Scene4;
