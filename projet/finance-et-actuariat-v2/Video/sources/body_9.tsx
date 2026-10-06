
const Scene9: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // PHASE 1 -- how the economy is financed
  const title = prog(f, -4, 12);
  const credit = prog(f, at("credit"), 18);
  const mkts = prog(f, at("bancaire"), 14);
  const toLanes = prog(f, at("marches") - 2, 12);

  // PHASE 2 -- faster via the market
  const lanesIn = prog(f, at("marches"), 12);
  const start = at("permettent");
  const end = Math.max(start + 1, DURATION - 10);
  const fast = interpolate(f, [start, Math.max(start + 1, at("fonds"))], [0, 1], { ...CL, easing: EASE });
  // slow coin: stops at four gates
  const tSlow = interpolate(f, [start, end], [0, 1], CL);
  const gates = [0.2, 0.4, 0.6, 0.8];
  let slow = 0;
  const seg = 1 / 9;
  for (let g = 0; g < 9; g++) {
    const a = g * seg;
    const isWait = g % 2 === 1;
    const part = Math.max(0, Math.min(1, (tSlow - a) / seg));
    if (!isWait) slow += part * 0.2;
  }
  slow = Math.min(0.9, slow);
  const etats = prog(f, at("etats"), 12);
  const ent = prog(f, at("entreprises"), 12);
  const ob = prog(f, at("obligations"), 12);
  const ac = prog(f, at("actions"), 12);
  const rapide = prog(f, at("rapidement"), 12);
  const X0 = 260;
  const X1 = 1450;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - toLanes }}>
        <Label T={Text} id="title-9-a1" text={"COMMENT L'ÉCONOMIE SE FINANCE EN AFRIQUE"} x={960} y={110} w={1500} h={110} bg={WHITE} color="#121212" op={title} />
        <div style={{ position: "absolute", left: 600, top: 960 - 680 * credit, width: 300, height: 680 * credit, background: NAVY }} />
        <Label T={Text} id="credit-9-b2" text={"CRÉDIT BANCAIRE"} x={750} y={1010} w={520} h={80} color={WHITE} op={credit} />
        <div style={{ position: "absolute", left: 1060, top: 960 - 170 * mkts, width: 300, height: 170 * mkts, background: GOLD }} />
        <Label T={Text} id="mkts-9-c3" text={"MARCHÉS"} x={1210} y={1010} w={360} h={80} color={GOLD} op={mkts} />
        <div style={{ position: "absolute", left: 480, top: 960, width: 1000, height: 6, background: WHITE, opacity: title }} />
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: lanesIn }}>
        {[{ y: 300, label: "VIA LA BANQUE", c: NAVY }, { y: 560, label: "VIA LE MARCHÉ", c: GOLD }].map((l, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: X0, top: l.y - 50, width: X1 - X0, height: 100, background: "rgba(255,255,255,0.05)", borderTop: `3px solid ${l.c}`, borderBottom: `3px solid ${l.c}` }} />
            <Label T={Text} id={`lane-9-${i}`} text={l.label} x={X0 + 170} y={l.y - 95} w={340} h={70} bg={l.c} color={i === 1 ? "#121212" : WHITE} />
          </React.Fragment>
        ))}
        {gates.map((g, k) => <div key={k} style={{ position: "absolute", left: X0 + (X1 - X0) * g - 6, top: 240, width: 12, height: 120, background: GREY }} />)}
        <div style={{ position: "absolute", left: X0 + (X1 - X0) * slow - 40, top: 300 - 40 }}><Coin size={80} /></div>
        <div style={{ position: "absolute", left: X0 + (X1 - X0) * fast - 40, top: 560 - 40, opacity: 1 - ob }}><Coin size={80} /></div>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={X1 + 20} y1={230} x2={X1 + 20} y2={640} stroke={WHITE} strokeWidth={5} />
          <polygon points={`${X1 + 20},470 ${X1 + 90},495 ${X1 + 20},520`} fill={GOLD} />
        </svg>
        <div style={{ position: "absolute", left: 1600, top: 230, opacity: etats, transform: `scale(${0.6 + 0.4 * etats})` }}>
          <Asset id="img-bank-9-d4" file="bank.svg" w={170} h={170} />
        </div>
        <Label T={Text} id="etats-9-e5" text={"ÉTATS"} x={1685} y={430} w={240} h={70} color={WHITE} op={etats} />
        <div style={{ position: "absolute", left: 1600, top: 490, opacity: ent, transform: `scale(${0.6 + 0.4 * ent})` }}>
          <Factory size={170} />
        </div>
        <Label T={Text} id="ent-9-f6" text="GRANDES ENTREPRISES" x={1685} y={690} w={420} h={70} color={WHITE} op={ent} />
        <Label T={Text} id="ob-9-g7" text="OBLIGATIONS" x={760} y={800} w={500} h={110} bg={GOLD} color="#121212" op={ob} dy={(1 - ob) * 60} />
        <Label T={Text} id="ac-9-h8" text="ACTIONS" x={1260} y={800} w={420} h={110} bg={NAVY} color={WHITE} op={ac} dy={(1 - ac) * 60} />
        <Label T={Text} id="rapide-9-i9" text={"LEVER DES FONDS PLUS RAPIDEMENT"} x={960} y={970} w={1300} h={100} bg={WHITE} color="#121212" op={rapide} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene9;
