
const Scene6: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const card = prog(f, -6, 16);
  const title = prog(f, at("derives"), 10);
  const sign = prog(f, at("contrats"), 20);
  const protect = prog(f, at("proteger"), 14);
  const shieldPop = pop(f, at("proteger"));
  const caption = prog(f, at("variation"), 12);

  // volatile price line in the chart area (x 980-1820, y 200-800)
  const pts: string[] = [];
  const N = 70;
  for (let i = 0; i <= N; i++) {
    const k = i + Math.floor(f / 2);
    const y = 500 + Math.sin(k * 0.45) * 120 + (seededRandom("s6-v", k) - 0.5) * 220;
    pts.push(`${(980 + (i / N) * 840).toFixed(1)},${y.toFixed(1)}`);
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} tint="#1E1E2A" />
      <Label T={Text} id="title-6-a1" text={"PRODUITS DÉRIVÉS"} x={960} y={80} w={760} h={100} bg={GOLD} color="#121212" op={title} />

      <div style={{ position: "absolute", left: 160, top: 170, width: 640, height: 760, background: "#F4EBD0", border: `8px solid ${GOLD_D}`, boxSizing: "border-box", opacity: card, transform: `translateX(${(1 - card) * -200}px) rotate(${(1 - card) * -8}deg)`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 30, gap: 24 }}>
        <Text id="contract-6-b2" text={"PRODUIT DÉRIVÉ"} width={560} height={90} textStyles={{ fontFamily: JOST, fontWeight: 900, color: "#121212" }} />
        <svg width={560} height={420} viewBox="0 0 560 420">
          {[0, 1, 2, 3, 4, 5, 6].map((r) => <rect key={r} x={20} y={20 + r * 44} width={520 - (r % 3) * 70} height={16} fill="#C9BE9C" />)}
          <line x1={40} y1={380} x2={300} y2={380} stroke="#121212" strokeWidth={4} />
          <path d="M 50 370 C 80 320 110 400 140 350 C 170 310 200 390 240 345" fill="none" stroke={NAVY} strokeWidth={6} strokeDasharray={420} strokeDashoffset={420 * (1 - sign)} strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: 380, top: 470, opacity: Math.min(1, shieldPop * 1.4), transform: `scale(${0.3 + 0.7 * shieldPop})` }}>
        <Asset id="img-shield-6-c3" file="shield.svg" w={300} h={350} />
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: card }}>
        <rect x={980} y={180} width={840} height={640} fill="rgba(0,0,0,0.35)" stroke="#333" strokeWidth={3} />
        <rect x={980} y={500 - 70 * protect} width={840} height={140 * protect} fill={GOLD} opacity={0.18} />
        <polyline points={pts.join(" ")} fill="none" stroke={RED} strokeWidth={5} strokeOpacity={1 - 0.45 * protect} strokeLinejoin="round" />
        <line x1={980} y1={500} x2={980 + 840 * protect} y2={500} stroke={GOLD} strokeWidth={10} />
      </svg>
      <Label T={Text} id="volat-6-d4" text="PRIX DU MARCHÉ" x={1180} y={230} w={360} h={70} color={RED} op={card * (1 - protect)} />
      <Label T={Text} id="garanti-6-e5" text="PRIX GARANTI" x={1400} y={420} w={420} h={90} bg={GOLD} color="#121212" op={protect} />

      <Label T={Text} id="caption-6-f6" text={"SE PROTÉGER CONTRE LA VARIATION DES PRIX"} x={960} y={1000} w={1500} h={110} bg={WHITE} color="#121212" op={caption} />
    </AbsoluteFill>
  );
};

export default Scene6;
