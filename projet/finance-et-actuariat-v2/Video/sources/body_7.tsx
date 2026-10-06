
const Pillar: React.FC<{ T: React.FC<TextProps>; id: string; label: string; x: number; p: number; children: React.ReactNode }> = ({ T, id, label, x, p, children }) => (
  <div style={{ position: "absolute", left: x - 250, top: 300, width: 500, height: 640, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 640 * (1 - p), width: 500, height: 640, background: "linear-gradient(180deg, #1E2A38 0%, #0B0F14 100%)", border: `5px solid ${GOLD}`, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, gap: 10 }}>
      <div style={{ width: 440, height: 330, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <T id={id} text={label} width={440} height={200} multiline maxSize={58} textStyles={{ fontFamily: JOST, fontWeight: 900, color: WHITE }} />
    </div>
  </div>
);

const Scene7: React.FC<{ Arrow: React.FC<ArrowProps>; Text: React.FC<TextProps>; seededRandom: SeededRandomFn; mapboxToken: string }> = ({ Text, seededRandom }) => {
  const f = useCurrentFrame();

  const three = pop(f, -4);
  const again = interpolate(f - at("trois", 2), [0, 5, 14], [0, 1, 0], CL);
  const roles = prog(f, at("roles"), 10);
  const toPillars = prog(f, at("financer") - 4, 12);
  const p1 = prog(f, at("financer"), 16);
  const p2 = prog(f, at("donner"), 16);
  const p3 = prog(f, at("permettre"), 16);
  const roof = prog(f, at("risque"), 14);
  const swing = Math.sin(f * 0.18) * 12;
  const price = interpolate(f, [at("prix"), at("prix") + 24], [80, 125.4], CL);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop f={f} rnd={seededRandom} />

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - toPillars, transform: `scale(${1 + 0.4 * toPillars})` }}>
        <Label T={Text} id="three-7-a1" text="3" x={960} y={430} w={600} h={600} color={GOLD} scale={interpolate(three, [0, 1], [0.4, 1]) * (1 + 0.12 * again)} />
        <Label T={Text} id="roles-7-b2" text={"TROIS RÔLES"} x={960} y={860} w={900} h={150} bg={WHITE} color="#121212" op={roles} />
      </div>

      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: toPillars }}>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: roof }}>
          <polygon points={`${960 - 830},290 960,${290 - 190 * roof} ${960 + 830},290`} fill={GOLD} stroke="#121212" strokeWidth={6} />
          <rect x={110} y={940} width={1700} height={26} fill={GOLD} />
        </svg>
        <Pillar T={Text} id="p1-7-c3" label={"FINANCER L'ÉCONOMIE"} x={400} p={p1}>
          <div style={{ position: "relative", width: 300, height: 300 }}>
            <div style={{ position: "absolute", left: 60, top: 110 }}><Factory size={190} /></div>
            {[0, 1, 2].map((k) => {
              const t = ((f * 0.03 + k / 3) % 1);
              return <div key={k} style={{ position: "absolute", left: 20 + k * 90, top: 230 - t * 200, opacity: 1 - t }}><Coin size={60} /></div>;
            })}
          </div>
        </Pillar>
        <Pillar T={Text} id="p2-7-d4" label="DONNER UN PRIX AUX ACTIFS" x={960} p={p2}>
          <div style={{ transform: `rotate(${swing}deg)`, transformOrigin: "50% 0%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 6, height: 70, background: WHITE }} />
            <div style={{ width: 320, height: 160, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)" }}>
              <Text id="price-7-e5" text={`${price.toFixed(2).replace(".", ",")}`} width={230} height={100} textStyles={{ fontFamily: MONO, fontWeight: 700, color: "#121212" }} />
            </div>
          </div>
        </Pillar>
        <Pillar T={Text} id="p3-7-f6" label={"SE PROTÉGER CONTRE LE RISQUE"} x={1520} p={p3}>
          <div style={{ position: "relative", width: 320, height: 320 }}>
            {[0, 1, 2].map((k) => {
              const t = ((f * 0.035 + k / 3) % 1);
              const hit = t > 0.55;
              const x = hit ? 160 + (t - 0.55) * 300 * (k - 1) : 30 + k * 130;
              const y = hit ? 120 - (t - 0.55) * 260 : -20 + t * 230;
              return (
                <svg key={k} width={50} height={80} viewBox="0 0 50 80" style={{ position: "absolute", left: x, top: y, opacity: hit ? 1 - (t - 0.55) * 2 : 1 }}>
                  <polygon points="28,0 6,44 22,44 14,80 44,30 28,30 38,0" fill={RED} />
                </svg>
              );
            })}
            <div style={{ position: "absolute", left: 70, top: 90 }}><Asset id="img-shield-7-g7" file="shield.svg" w={180} h={210} /></div>
          </div>
        </Pillar>
      </div>
    </AbsoluteFill>
  );
};

export default Scene7;
