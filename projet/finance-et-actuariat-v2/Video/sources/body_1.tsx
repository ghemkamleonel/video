
const Scene1: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  // PHASE 1 -- the school
  const cap = pop(f, -6);
  const swing = Math.sin(f * 0.12) * 10 * Math.exp(-f / 120);
  const school = prog(f, at("ecole"), 12);
  const filiere = prog(f, at("filiere"), 12);
  const niveau = pop(f, at("niveau"));
  const p2 = prog(f, at("creer") - 4, 14);

  // PHASE 2 -- creating content
  const playerIn = prog(f, at("creer"), 14);
  const fill = interpolate(f, [at("creer"), Math.max(at("creer") + 1, DURATION - 4)], [0, 1], CL);
  const typeStart = at("banaliser");
  const typeEnd = Math.max(typeStart + 1, Math.min(DURATION - 6, typeStart + 34));
  const pulse = 1 + 0.06 * Math.sin(f * 0.25);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - p2, transform: `scale(${1 - 0.15 * p2})` }}>
        <Box x={430} y={470} w={480} h={352} style={{ transform: `translateY(${(1 - cap) * -260}px) rotate(${swing}deg)` }}>
          <Asset id="img-cap-1-a1" file="graduation cap.svg" w={480} h={352} />
        </Box>
        <Label T={Text} id="school-1-b2" text={"ÉCOLE NATIONALE SUPÉRIEURE"} x={1240} y={330} w={1100} h={140} bg={WHITE} color="#121212" op={school} dx={(1 - school) * 120} />
        <Label T={Text} id="filiere-1-c3" text={"FILIÈRE FINANCE ET ACTUARIAT"} x={1240} y={530} w={1100} h={130} bg={GOLD} color="#121212" op={filiere} dx={(1 - filiere) * 120} />
        <Label T={Text} id="niveau-1-d4" text="NIVEAU 4" x={900} y={720} w={420} h={130} bg={NAVY} color={WHITE} op={Math.min(1, niveau * 1.5)} scale={0.5 + 0.5 * niveau} />
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: playerIn }}>
        <div style={{ position: "absolute", left: 360, top: 120, width: 1200, height: 620, background: "#0B0F14", border: `6px solid ${WHITE}`, boxSizing: "border-box", transform: `scale(${0.85 + 0.15 * playerIn})` }}>
          <svg width={1188} height={608} style={{ position: "absolute", left: 0, top: 0 }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const h = 40 + seededRandom("s1-bar", i) * 220 + Math.sin(f * 0.1 + i) * 20;
              return <rect key={i} x={80 + i * 88} y={470 - h} width={50} height={h} fill={i % 3 === 0 ? GOLD : NAVY} opacity={0.35} />;
            })}
            <g transform={`translate(594 270) scale(${pulse})`}>
              <circle r={110} fill={GOLD} opacity={0.95} />
              <polygon points="-34,-56 -34,56 62,0" fill="#121212" />
            </g>
            <rect x={60} y={540} width={1068} height={14} fill="#333" />
            <rect x={60} y={540} width={1068 * fill} height={14} fill={GOLD} />
            <circle cx={60 + 1068 * fill} cy={547} r={16} fill={GOLD} />
          </svg>
        </div>
        <Label T={Text} id="cree-1-e5" text={"CRÉER DU CONTENU"} x={960} y={78} w={700} h={100} bg={GOLD} color="#121212" op={playerIn} />
        <div style={{ position: "absolute", left: 110, top: 800, width: 1700, height: 150, display: "flex", alignItems: "center", justifyContent: "center", opacity: f >= typeStart ? 1 : 0 }}>
          <Text id="banaliser-1-f6" text={"BANALISER LA FINANCE ET L'ACTUARIAT"} width={1700} height={140} typing={{ startFrame: typeStart, endFrame: typeEnd, showCursor: false }} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
        </div>
        <div style={{ position: "absolute", left: 160, top: 960, width: 1600 * prog(f, typeEnd, 12), height: 10, background: GOLD }} />
      </div>
    </AbsoluteFill>
  );
};

export default Scene1;
