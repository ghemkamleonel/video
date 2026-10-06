
const Gauge: React.FC<{ value: number; shield: number; id: string }> = ({ value, shield, id }) => {
  const a = Math.PI * (1 - value);
  return (
    <div style={{ position: "relative", width: 420, height: 260 }}>
      <svg width={420} height={260} viewBox="0 0 420 260">
        <path d="M 30 230 A 180 180 0 0 1 390 230" fill="none" stroke="#333" strokeWidth={30} />
        <path d="M 30 230 A 180 180 0 0 1 390 230" fill="none" stroke={GOLD} strokeWidth={30} strokeDasharray={565} strokeDashoffset={565 * (1 - value)} />
        <line x1={210} y1={230} x2={210 + 150 * Math.cos(a)} y2={230 - 150 * Math.sin(a)} stroke={WHITE} strokeWidth={10} strokeLinecap="round" />
        <circle cx={210} cy={230} r={18} fill={WHITE} />
      </svg>
      <div style={{ position: "absolute", left: 150, top: 60, opacity: shield, transform: `scale(${0.4 + 0.6 * shield})` }}>
        <Asset id={id} file="shield.svg" w={120} h={140} />
      </div>
    </div>
  );
};

const Scene2: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // PHASE 1 -- the question
  const q = pop(f, -4);
  const split = prog(f, at("deux") - 2, 12);
  const orbit = f * 0.05;

  // PHASE 2 -- two jobs, one idea
  const panels = prog(f, at("deux"), 14);
  const gauge = interpolate(f, [at("evaluer"), at("evaluer") + 18], [0.1, 0.72], { ...CL, easing: EASE });
  const shield = prog(f, at("gerer"), 12);
  const line = prog(f, at("argent"), 16);
  const travel = interpolate(f, [at("argent") + 6, Math.max(at("argent") + 7, DURATION - 2)], [0, 1], CL);
  const caption = prog(f, at("evaluer"), 12);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - split }}>
        <Label T={Text} id="qmark-2-a1" text="?" x={960} y={500} w={460} h={620} color={GOLD} scale={interpolate(q, [0, 1], [0.6, 1])} />
        {["FINANCE", "ACTUARIAT"].map((t, i) => {
          const ang = orbit + i * Math.PI;
          return <Label key={t} T={Text} id={`orb-2-${i}`} text={t} x={960 + Math.cos(ang) * 520} y={500 + Math.sin(ang) * 200} w={460} h={110} bg={i === 0 ? GOLD : NAVY} color={i === 0 ? "#121212" : WHITE} />;
        })}
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: panels }}>
        {["FINANCE", "ACTUARIAT"].map((t, i) => (
          <div key={t} style={{ position: "absolute", left: 140 + i * 860, top: 90, width: 780, height: 560, border: `4px solid ${i === 0 ? GOLD : NAVY}`, background: "rgba(0,0,0,0.35)", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", gap: 30, paddingTop: 30, transform: `translateX(${(1 - panels) * (i === 0 ? -160 : 160)}px)` }}>
            <div style={{ background: i === 0 ? GOLD : NAVY, padding: "0 30px" }}>
              <Text id={`panel-title-2-${i}`} text={t} width={420} height={100} textStyles={{ fontFamily: JOST, fontWeight: 900, color: i === 0 ? "#121212" : WHITE }} />
            </div>
            <Gauge value={gauge} shield={shield} id={`img-shield-2-${i}`} />
          </div>
        ))}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={200} y1={800} x2={200 + 1520 * line} y2={800} stroke={WHITE} strokeWidth={6} />
          <polygon points={`${200 + 1520 * line},786 ${200 + 1520 * line + 26},800 ${200 + 1520 * line},814`} fill={WHITE} opacity={line} />
        </svg>
        <Label T={Text} id="today-2-b2" text={"AUJOURD'HUI"} x={290} y={860} w={360} h={70} color={GREY} op={line} />
        <Label T={Text} id="tomorrow-2-c3" text="DEMAIN" x={1640} y={860} w={300} h={70} color={GREY} op={line} />
        <div style={{ position: "absolute", left: 200 + 1400 * travel - 50, top: 800 - 70 - 60 * travel, opacity: line, transform: `rotate(${Math.sin(f * 0.3) * 6 * travel}deg)` }}>
          {Array.from({ length: 3 + Math.floor(travel * 4) }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: 0, top: -k * 18 }}>
              <Coin size={100} />
            </div>
          ))}
        </div>
        <Label T={Text} id="caption-2-d4" text={"ÉVALUER ET GÉRER LE RISQUE DE L'ARGENT DANS LE TEMPS"} x={960} y={985} w={1760} h={100} bg={WHITE} color="#121212" op={caption} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene2;
