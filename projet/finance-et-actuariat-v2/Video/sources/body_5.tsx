
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
