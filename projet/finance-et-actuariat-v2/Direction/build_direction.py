"""Build Direction/Latest/latest.json for finance-et-actuariat-v2 (user's verbatim text)."""
import json
import os
import re
import sys

T = "/home/user/outscal/video-generator/Outputs/finance-et-actuariat-v2"
flat = re.sub(r"\s+", " ", open(f"{T}/script.md", encoding="utf-8").read()).strip()

SCENES = [
    ("Bonjour, moi c'est",
     "PHASE 1 -- HELLO: From the very first frame a huge animated price line (like a live stock chart) sweeps across the full width, glowing gold, with candlesticks popping along it, while the word 'BONJOUR' slams in large at center on 'Bonjour'. PHASE 2 -- NAME CARD: On 'moi c'est' a large white name card slides up at center showing the presenter name exactly as spoken: 'JENNY GUINCAMP FRANCK LIONEL' (no portrait, no silhouette, no human -- just a bold typographic card with a gold accent bar). PHASE 3 -- THE TWO TOPICS: On 'finance de marche' a gold chip 'FINANCE DE MARCHE' with a small rising chart icon pops in on the left under the card; on 'l'actuariat' a navy chip 'ACTUARIAT' with a small @shield icon pops in on the right. The background keeps breathing with the scrolling price line and drifting digits."),
    ("Étant étudiant",
     "PHASE 1 -- THE SCHOOL: A large @graduation cap drops in at center-left with a tassel swinging; beside it a white card reads 'ECOLE NATIONALE SUPERIEURE' and below a gold chip 'FILIERE FINANCE ET ACTUARIAT' and a navy chip 'NIVEAU 4' that snap in on the spoken words 'filiere' and 'niveau'. PHASE 2 -- THE MISSION: On 'creer du contenu' the card compresses into a large video-player frame (a dark rectangle with a big gold play triangle and a progress bar that fills); on 'banaliser' the title 'BANALISER LA FINANCE ET L'ACTUARIAT' types itself in large white letters under the player, with the words FINANCE and ACTUARIAT highlighted in gold."),
    ("Qu'est-ce que c'est que",
     "PHASE 1 -- THE QUESTION: A giant gold question mark spins in at center on 'Qu'est-ce que'; the two labels 'FINANCE' and 'ACTUARIAT' orbit around it. PHASE 2 -- TWO JOBS, ONE IDEA: On 'deux metiers' the question mark splits into two large panels side by side titled 'FINANCE' and 'ACTUARIAT'. On 'evaluer' a large gauge needle sweeps in both panels; on 'gerer le risque' a @shield appears over each gauge; on 'l'argent dans le temps' a single horizontal timeline arrow runs under both panels from 'AUJOURD'HUI' to 'DEMAIN', and a stack of gold coins travels along it, growing and wobbling as it moves (money exposed to risk over time). Caption at bottom: 'EVALUER ET GERER LE RISQUE DE L'ARGENT DANS LE TEMPS'."),
    ("La finance de marché, c'est l'ensemble",
     "A large, living stock-exchange board fills the frame: a dark trading screen with a header 'MARCHE ORGANISE', rows of tickers with prices flickering green and red, and an order book in the middle with a BUY column (gold) and a SELL column (navy). On 'achete' a gold BUY order slides in from the left; on 'vend' a navy SELL order slides in from the right; they meet at the center and lock together with a bright 'EXECUTE' flash and a price ticks. Title chip at the top: 'LA FINANCE DE MARCHE'. Orders keep arriving and matching in rhythm in the background."),
    ("Elle met en relation",
     "A two-sided flow diagram built from real objects. LEFT column titled 'ONT DE L'ARGENT A PLACER': three large tiles stack vertically and pop in on their words -- 'EPARGNANTS' (a piggy-bank shape of coins), 'ASSUREURS' (an @umbrella), 'FONDS' (a vault of coins). RIGHT column titled 'ONT BESOIN D'ARGENT': on 'les Etats' a large @bank tile labelled 'ETATS' and on 'les entreprises' a factory tile labelled 'ENTREPRISES'. At the center a large glowing ring labelled 'MARCHE'. Gold coins stream from the left tiles into the ring and out to the right tiles once both sides are present, in a continuous flow. During the hesitation 'de, cette, de, ce' the right column is still empty with a pulsing placeholder, so the visual waits with the speaker."),
    ("Concrètement, on y échange",
     "Three large cards are dealt onto the center of the frame like playing cards, one per spoken item. On 'les actions' the first card 'ACTION' shows a company building split into slices with one slice lifting out, caption 'UNE PART D'UNE ENTREPRISE'. On 'les obligations' the second card 'OBLIGATION' shows a certificate with a coupon strip, caption 'UN PRET A UN ETAT OU UNE ENTREPRISE'. On 'Rembourser avec des interets' the obligation card animates: a stack of coins goes out to a @bank, then comes back bigger with small extra coins labelled '+ INTERETS' ticking in. The cards stay large and readable, side by side."),
    ("Les produits dérivés",
     "A third card 'PRODUIT DERIVE' slides in large at center showing a contract with a signature line. Above it a price line moves violently up and down (a volatile price). On 'se proteger' a gold @shield snaps onto the contract and a horizontal gold band locks the price inside a safe corridor: the wild line keeps moving, but a second line labelled 'PRIX GARANTI' stays flat and calm. Caption: 'SE PROTEGER CONTRE LA VARIATION DES PRIX'."),
    ("Un remplit trois rôles",
     "PHASE 1 -- THREE ROLES: A huge number '3' lands at center and the title 'TROIS ROLES' appears under it; on the repeated 'trois roles' the 3 pulses again. PHASE 2 -- THE ROLES: The 3 splits into three large pillars standing side by side, each rising on its spoken words: pillar 1 'FINANCER L'ECONOMIE' with coins flowing up into a factory and a road; pillar 2 'DONNER UN PRIX AUX ACTIFS' with a price tag swinging and a number settling; pillar 3 'SE PROTEGER CONTRE LE RISQUE' with a @shield deflecting red lightning bolts. The three pillars form a temple-like structure at the end."),
    ("La finance de marché pour l'Afrique",
     "A large stylized outline of the African continent made of glowing gold dots (abstract dot pattern, not a geographic map with borders or labels) appears at center-left. On 'financement alternatif' two routes branch from it to the right: the upper route goes to a @bank labelled 'BANQUES' (already crowded, heavy), the lower route goes to a market ring labelled 'MARCHES FINANCIERS' that lights up gold. A chip reads 'UN FINANCEMENT ALTERNATIF AUX BANQUES'."),
    ("En Afrique, L'économie",
     "PHASE 1 -- BANK CREDIT: A tall bar chart titled 'COMMENT L'ECONOMIE SE FINANCE' shows one huge navy bar labelled 'CREDIT BANCAIRE' and one small gold bar labelled 'MARCHES' (qualitative, no exact numbers). PHASE 2 -- FASTER: On 'les marches permettent' two horizontal race lanes appear: lane 'VIA LA BANQUE' with a coin moving slowly through several checkpoint gates, and lane 'VIA LE MARCHE' with a coin sprinting straight to a finish flag. On 'Etats et grandes entreprises' a @bank and a factory sit at the finish line receiving the coins; on 'obligations ou des actions' the fast coin turns into two tickets labelled 'OBLIGATIONS' and 'ACTIONS'. Caption: 'LEVER DES FONDS PLUS RAPIDEMENT'."),
    ("Un enjeu de souveraineté",
     "PHASE 1 -- SOVEREIGNTY: The title 'UN ENJEU DE SOUVERAINETE' slams in at the top. PHASE 2 -- PRICES SET ABROAD: Three large commodity tiles drop in a row exactly on their words: '@cocoa pod' labelled 'CACAO', '@coffee cup' labelled 'CAFE', '@oil barrel' labelled 'PETROLE'. Above each tile a price tag dangles on a string; the strings stretch up and away to the top-right corner, toward a distant skyline labelled 'BOURSES ETRANGERES', which pulls the tags and makes the prices jump up and down -- the price of each African commodity is visibly controlled from elsewhere. Caption: 'PRIX FIXES A L'ETRANGER'."),
    ("Mieux maîtriser la finance",
     "The same three commodity tiles ('@cocoa pod' CACAO, '@coffee cup' CAFE, '@oil barrel' PETROLE) stand large at center with their price tags. On 'mieux maitriser' a gold control panel slides in under them with three sliders; on 'negocier ses prix' the strings to the foreign skyline are cut and the tags are re-attached to the control panel, whose sliders set each price. On 'se proteger contre leurs variations' a gold @shield expands over the three tiles and the jumping price lines behind them flatten into calm corridors. Caption: 'NEGOCIER SES PRIX, SE PROTEGER DES VARIATIONS'."),
    ("Un besoin métier",
     "PHASE 1 -- A SKILLS GAP: The title 'UN BESOIN METIER' appears. A large board of 40 empty desk tiles fills the frame (each tile is a simple desk with a screen, no people); on 'rares sur le continent' only 4 tiles light up gold with a small chart on their screen labelled 'ANALYSTES', the rest stay dark and empty. PHASE 2 -- THE DEMAND: On 'les assurances' an @umbrella tile and on 'les retraites des fonds de pension' a vault tile appear on the right with pulsing red 'BESOIN' badges pointing at the empty desks. PHASE 3 -- GROWTH: On 'accroitre le developpement' the empty desks light up one after another in a wave and a gold growth curve rises across the whole board; final title: 'FINANCE ET ACTUARIAT : UN METIER D'AVENIR'."),
]

ASSETS = [
    ("shield", "A protective shield"),
    ("graduation cap", "A graduation mortarboard cap with tassel"),
    ("umbrella", "An open umbrella (insurance symbol)"),
    ("bank", "A classical bank building with columns and a pediment"),
    ("cocoa pod", "A ripe cocoa pod"),
    ("coffee cup", "A cup of coffee with coffee beans"),
    ("oil barrel", "An oil barrel"),
]


def main() -> None:
    starts = []
    for key, _ in SCENES:
        i = flat.find(key)
        if i < 0:
            sys.exit(f"key not found: {key}")
        starts.append(i)
    assert starts == sorted(starts) and starts[0] == 0, starts
    scenes = []
    for n, (key, desc) in enumerate(SCENES):
        end = starts[n + 1] if n + 1 < len(starts) else len(flat)
        assert all(ord(c) < 128 for c in desc), n
        scenes.append({"sceneIndex": n, "audioTranscriptPortion": flat[starts[n]:end].strip(), "videoDescription": desc})
    assert " ".join(s["audioTranscriptPortion"] for s in scenes) == flat
    alltext = " ".join(d for _, d in SCENES)
    names = [a for a, _ in ASSETS]
    for a in names:
        assert "@" + a in alltext, f"orphan asset {a}"
    for m in re.finditer(r"@", alltext):
        assert any(alltext.startswith(a, m.start() + 1) for a in names), alltext[m.start():m.start() + 30]
    out = {"video_aspect_ratio": "landscape", "scenes": scenes,
           "required_assets": [{"name": a, "asset-type": "asset", "description": d} for a, d in ASSETS]}
    path = f"{T}/Direction/Latest/latest.json"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(out, open(path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    for s in scenes:
        print(s["sceneIndex"], len(s["audioTranscriptPortion"].split()), "|", s["audioTranscriptPortion"][:60])


if __name__ == "__main__":
    main()
