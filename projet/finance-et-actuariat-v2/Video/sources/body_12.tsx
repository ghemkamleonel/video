
const Desk: React.FC<{ lit: number; chart: boolean }> = ({ lit, chart }) => (
  <svg width={120} height={104} viewBox="0 0 120 104">
    <rect x={10} y={8} width={100} height={60} fill={lit > 0.5 ? "#1B1406" : "#141414"} stroke={lit > 0.5 ? GOLD : "#333"} strokeWidth={4} />
    {chart && lit > 0.5 && <polyline points="20,56 40,42 56,48 76,26 100,20" fill="none" stroke={GOLD} strokeWidth={5} />}
    <rect x={52} y={68} width={16} height={14} fill={lit > 0.5 ? GOLD_D : "#333"} />
    <rect x={4} y={84} width={112} height={12} fill={lit > 0.5 ? GOLD : "#2A2A2A"} />
  </svg>
);

const Scene12: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const title = prog(f, -4, 12);
  const board = prog(f, at("acteurs") - 6, 14);
  const rare = prog(f, at("rares"), 10);
  const assur = prog(f, at("assurances"), 12);
  const pension = prog(f, at("retraites"), 12);
  const badge = 0.6 + 0.4 * Math.sin(f * 0.3);
  const waveStart = at("accroitre");
  const waveEnd = Math.max(waveStart + 1, Math.min(DURATION - 20, waveStart + 40));
  const wave = interpolate(f, [waveStart, waveEnd], [0, 1], CL);
  const final = prog(f, Math.min(Math.max(at("developpement"), waveEnd - 8), DURATION - 26), 12);

  const COLS = 8;
  const ROWS = 5;
  const RARE = [9, 20, 27, 34];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />
      <Label T={Text} id="title-12-a1" text={"UN BESOIN MÉTIER"} x={710} y={90} w={800} h={120} bg={GOLD} color="#121212" op={title} />

      <div style={{ position: "absolute", left: 140, top: 190, width: 1140, height: 690, opacity: board, filter: `brightness(${1 - 0.55 * final})` }}>
        {Array.from({ length: COLS * ROWS }).map((_, k) => {
          const col = k % COLS;
          const row = Math.floor(k / COLS);
          const isRare = RARE.includes(k);
          const order = (col + row) / (COLS + ROWS - 2);
          const lit = isRare ? rare : wave > order ? 1 : 0;
          return (
            <div key={k} style={{ position: "absolute", left: col * 142, top: row * 138 }}>
              <Desk lit={lit} chart={isRare || wave > order} />
            </div>
          );
        })}
        <svg width={1140} height={690} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline points={Array.from({ length: 21 }).map((_, i) => `${(i / 20) * 1120 * wave},${(640 - (i / 20) * 560 + Math.sin(i) * 20).toFixed(1)}`).join(" ")} fill="none" stroke={GOLD} strokeWidth={10} opacity={wave > 0 ? 1 : 0} strokeLinejoin="round" />
        </svg>
      </div>
      <Label T={Text} id="rare-12-b2" text={"ANALYSTES DE MARCHÉ : RARES"} x={710} y={950} w={980} h={100} bg={WHITE} color="#121212" op={rare * (1 - wave)} />

      {[{ p: assur, label: "ASSURANCES", y: 330, icon: <Asset id="img-umb-12-c3" file="umbrella.svg" w={140} h={140} /> }, { p: pension, label: "FONDS DE PENSION", y: 640, icon: <Vault size={140} /> }].map((t, i) => (
        <div key={i} style={{ position: "absolute", left: 1370, top: t.y - 120, width: 460, height: 240, background: "#0B0F14", border: `5px solid ${NAVY}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, opacity: t.p * (1 - final * 0.5), transform: `translateX(${(1 - t.p) * 160}px)` }}>
          {t.icon}
          <Text id={`need-12-${i}`} text={t.label} width={420} height={60} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
          <div style={{ position: "absolute", right: -18, top: -22, background: RED, padding: "4px 14px", opacity: badge * (1 - wave) }}>
            <Text id={`badge-12-${i}`} text="BESOIN" width={150} height={50} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
          </div>
        </div>
      ))}

      <div style={{ position: "absolute", left: 160, top: 400, width: 1600, height: 280, background: "rgba(0,0,0,0.82)", border: `6px solid ${GOLD}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: final, transform: `scale(${0.9 + 0.1 * final})` }}>
        <Text id="final-12-d4" text="FINANCE ET ACTUARIAT" width={1400} height={130} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
        <Text id="final2-12-e5" text={"UN MÉTIER D'AVENIR"} width={1000} height={100} textStyles={{ fontFamily: JOST, fontWeight: 900, color: GOLD }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene12;
