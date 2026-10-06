
const TICKERS = ["BANQUE", "T\u00c9L\u00c9COM", "CACAO", "\u00c9NERGIE", "CIMENT", "TRANSPORT"];

const Scene3: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const boardIn = prog(f, -6, 16);
  const buy = prog(f, at("achete"), 14);
  const sell = prog(f, at("vend"), 14);
  const meet = prog(f, Math.max(at("vend") + 14, at("titres")), 10);
  const flash = interpolate(f - Math.max(at("vend") + 14, at("titres")), [0, 4, 22], [0, 1, 0], CL);
  const org = prog(f, at("organise"), 10);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#16202B" />
      <Label T={Text} id="title-3-a1" text={"LA FINANCE DE MARCHÉ"} x={960} y={80} w={900} h={110} bg={GOLD} color="#121212" op={boardIn} />

      <div style={{ position: "absolute", left: 110, top: 160, width: 1700, height: 860, background: "#0B0F14", border: `4px solid ${org > 0 ? GOLD : "#2A2A2A"}`, boxSizing: "border-box", opacity: boardIn, transform: `scale(${0.94 + 0.06 * boardIn})` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1692, height: 110, background: org > 0 ? GOLD : "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text id="header-3-b2" text={"MARCHÉ ORGANISÉ"} width={900} height={90} textStyles={{ fontFamily: JOST, fontWeight: 900, color: org > 0 ? "#121212" : WHITE }} />
        </div>
        {TICKERS.map((t, i) => {
          const tick = Math.floor((f + i * 7) / 9);
          const ch = (seededRandom("s3-ch", tick * 10 + i) - 0.45) * 4;
          const price = 100 + seededRandom("s3-p", i) * 900 + ch * 3;
          return (
            <div key={t} style={{ position: "absolute", left: 30, top: 140 + i * 115, width: 640, height: 95, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #222" }}>
              <Text id={`tk-3-${i}`} text={t} width={300} height={70} align="left" textStyles={{ fontFamily: MONO, fontWeight: 700, color: WHITE }} />
              <Text id={`tp-3-${i}`} text={`${price.toFixed(2).replace(".", ",")} ${ch >= 0 ? "+" : "-"}${Math.abs(ch).toFixed(1).replace(".", ",")} %`} width={320} height={70} align="right" textStyles={{ fontFamily: MONO, fontWeight: 700, color: ch >= 0 ? GOLD : RED }} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 700, top: 130, width: 2, height: 700, background: "#333" }} />
      </div>

      {/* order book: background orders */}
      {Array.from({ length: 8 }).map((_, k) => {
        const birth = k * 22;
        const age = (((f - birth) % 176) + 176) % 176;
        const side = k % 2 === 0;
        const x = side ? interpolate(age, [0, 40], [860, 1150], CL) : interpolate(age, [0, 40], [1760, 1470], CL);
        const op = interpolate(age, [0, 8, 40, 52], [0, 0.35, 0.35, 0], CL) * boardIn * (1 - 0.85 * meet);
        return <div key={k} style={{ position: "absolute", left: x - 90, top: 300 + (k % 3) * 130, width: 180, height: 60, background: side ? GOLD : NAVY, opacity: op }} />;
      })}

      <Label T={Text} id="buy-3-c3" text={"ACHAT"} x={interpolate(buy, [0, 1], [700, 1080]) + 120 * meet} y={560} w={330} h={140} bg={GOLD} color="#121212" op={buy} />
      <Label T={Text} id="sell-3-d4" text="VENTE" x={interpolate(sell, [0, 1], [1900, 1640]) - 120 * meet} y={560} w={330} h={140} bg={NAVY} color={WHITE} op={sell} />
      <div style={{ position: "absolute", left: 1060, top: 400, width: 600, height: 320, background: WHITE, opacity: flash * 0.5 }} />
      <Label T={Text} id="exec-3-e5" text={"EXÉCUTÉ"} x={1360} y={760} w={420} h={110} bg={WHITE} color="#121212" op={meet} scale={0.8 + 0.2 * meet} />
      <Label T={Text} id="titres-3-f6" text="TITRES FINANCIERS" x={1360} y={900} w={620} h={90} color={GOLD} op={prog(f, at("titres"), 10)} />
    </AbsoluteFill>
  );
};

export default Scene3;
