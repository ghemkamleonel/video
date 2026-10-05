"""Build Direction/Latest/latest.json for gestion-du-risque-v2 from the final script.

Each scene is defined by the first words of its narration; the narration text is cut
from the script so audioTranscriptPortion always matches script.md exactly.
"""
import json
import re
import sys

T = "/home/user/outscal/video-generator/Outputs/gestion-du-risque-v2"
script = open(f"{T}/script.md", encoding="utf-8").read()
flat = re.sub(r"\s+", " ", script).strip()

SCENES = [
    ("Soixante et un joueurs",
     "The scene unfolds in three phases. PHASE 1 -- THE LOADED COIN: From the very first frame an enormous gold coin fills roughly 60 percent of the frame height at center, already spinning fast around its vertical axis. Its face is split like a pie into a large gold wedge marked 'FACE 60 %' and a smaller navy wedge marked 'PILE 40 %', so the bias is visible even while it spins. Behind it a dark background breathes with a faint pulsing grid and dozens of tiny chips drifting upward. On 'soixante et un joueurs' a counter '61 JOUEURS' snaps in at top left; on 'ils le savaient' a white chip label 'TRUQUEE -- ET ILS LE SAVAIENT' slides in at the bottom. PHASE 2 -- THE CAMERA PULLS BACK: On 'six fois sur dix' the camera pushes in fast on the gold 60 percent wedge, which glows. PHASE 3 -- THE CRACK: On 'plus d'un sur quatre' the camera snaps back, and around the still-spinning coin a ring of 61 small chip tokens appears; on 'tout perdu' 17 of the tokens drain to greyscale and drop out of the ring one after another while a big counter '17 / 61 RUINES' locks in. The coin never stops spinning -- unresolved."),
    ("L'expérience date",
     "PHASE 1 -- 2016: The year '2016' slams in huge at center then shrinks up into a header. PHASE 2 -- THE RULES OF THE GAME: Three large rule cards appear stacked vertically in the center, each on its own spoken item: on 'vingt-cinq dollars' a card with a stack of gold chips and '25 $ AU DEPART'; on 'une demi-heure de jeu' a card with a big countdown timer reading '30:00' that starts ticking down; on 'deux cent cinquante dollars' a card with a horizontal ceiling bar and 'PLAFOND : 250 $'. To the right of the cards, a tall vertical money gauge (like a thermometer) fills from the bottom to the 25 dollar mark, with a glowing gold ceiling line at the top labelled '250 $' -- the gap between them is visibly huge (ten times). Background: faint grid that slowly scrolls."),
    ("Ces joueurs étudiaient",
     "PHASE 1 -- WHO PLAYED: A large wall of 61 vertical bankroll bars (one per player, no people) fills the frame in a tidy row, all starting at the same 25 dollar height; small tags above groups of bars read 'ECONOMIE' and 'FINANCE'. The bars jitter up and down as coin flips happen. PHASE 2 -- THE BET SIZE: On 'Ceux qui ont tout perdu' 17 of the bars are highlighted; for each of them an oversized chip stack (as tall as the whole bar) is shoved forward as a single bet, and the bar collapses to zero and drains to greyscale. On 'la taille de leurs mises' a huge caption 'LA TAILLE DES MISES' appears with the oversized chip stack as its visual anchor, while the surviving bars keep moving."),
    ("Un joueur qui perd",
     "Two phases around one big money column at center: a tall gold block representing the player's money, with a thin white outline that keeps showing its starting height. PHASE 1 -- HALF: On 'perd la moitie' the column drops instantly to half height and a red label '-50 %' appears beside the drop. On 'le doubler' a second gold block of exactly the same size as what remains stacks on top, rebuilding the column to the outline, and a large gold label '+100 %' appears beside the climb -- visibly twice as big as the '-50 %' label. PHASE 2 -- TOTAL: On 'Une perte totale' the column empties completely; only the white outline remains. Inside it a large equation '0 x 2 = 0' appears, then '0 x 10 = 0', while the outline drains to grey -- nothing can grow back from zero. Background: faint horizontal ruler lines."),
    ("C'est ce qui guette",
     "PHASE 1 -- ALL IN: A row of ten large coin slots spans the width. A gold money counter starts at '25 $'. Each slot flips in quick rhythm: on heads the counter doubles (50, 100, 200, 400, 800...) and the slot glows gold; on the sixth flip the coin lands tails, the slot turns red and the counter crashes to '0 $', everything draining to grey. PHASE 2 -- SIX IN A THOUSAND: On 'six fois sur mille' the row compresses away and a large grid of 1000 small dots (40 by 25) fills the frame; only 6 dots light up gold, scattered, while the rest stay dim. A big label '0,6 ^ 10 = 0,6 %' and '6 / 1000' sits above the grid."),
    ("En mille neuf cent cinquante-six",
     "PHASE 1 -- 1956: A vintage typed research page slides up center, filling most of the frame, with a header 'BELL LABS -- 1956' and the title 'J. L. KELLY'; a typewriter effect types 'la bonne taille de mise'. PHASE 2 -- A FIXED SHARE: On 'part fixe de son argent' the page compresses into a wide horizontal bankroll bar; a slice of it detaches and slides forward as the bet, labelled 'MISE = AVANTAGE'. PHASE 3 -- TWENTY PERCENT: On 'soixante chances sur cent' a gold block labelled '60 %' appears; on 'moins quarante' a navy block '40 %' is subtracted from it; the remainder '20 %' glows and snaps onto the bankroll bar as the exact detached slice. The equation '60 % - 40 % = 20 %' reads large under the bar."),
    ("Miser plus fait grossir",
     "A large chart fills the frame: horizontal axis 'PART MISEE A CHAQUE LANCER' from 0 to 60 percent, vertical axis 'CROISSANCE'. A smooth hump-shaped curve draws itself: it rises from zero, peaks at 20 percent (a gold marker 'MAXIMUM : 20 %'), then falls, crosses the zero line at about 40 percent and dives below it. On 'moins vite' a glowing marker slides along the curve from 20 toward 35 percent, the curve height visibly dropping. On 'a partir d'environ quarante pour cent' the region of the chart beyond 40 percent fills red and a small bankroll bar shown under the marker visibly melts down as the marker enters the red zone. Background: faint grid."),
    ("Avec cette règle des vingt",
     "A split comparison with two large panels side by side, each holding a grid of 100 square tiles (10 by 10) and a gold ceiling banner '250 $' above. LEFT panel titled 'REGLE DES 20 %': on 'la grande majorite' the tiles fill gold quickly, row after row, until about 94 tiles are gold, each tile flying up to touch the ceiling banner. RIGHT panel titled 'EN REALITE': on 'vingt et un pour cent' only 21 tiles fill gold, the rest stay dark grey. Two big counters under the panels lock at '~94 %' and '21 %'. The difference between the two panels must be obvious at a glance."),
    ("Le fonds d'investissement",
     "PHASE 1 -- LTCM: A large sleek glass-tower facade made of stacked panels rises at center with the letters 'LTCM' across the top; on 'deux prix Nobel' two large gold medals swing in and hang from the facade, each engraved 'NOBEL'. PHASE 2 -- BORROWED MONEY: On 'argent emprunte' the tower transforms into a tall stack of 25 equal blocks: only the single bottom block is gold and labelled '1 $ A LUI'; the 24 blocks above it are navy and labelled together '24 $ EMPRUNTES'. A bracket on the right side of the full stack reads '25 $ MISES'. The stack is very tall and slightly wobbling."),
    ("À ce niveau",
     "The same kind of tall stack of 25 equal blocks stands at center: one gold block at the bottom labelled 'SON ARGENT', 24 navy borrowed blocks above it. A big label at the top reads 'PLACEMENTS : 25 $'. On 'une perte de quatre pour cent' a red line sweeps down and a slice equal to exactly one block (4 percent of the stack) evaporates from the top of the stack; at the same moment the gold block at the bottom drains to grey and vanishes, because the loss is taken from his own money first. The stack sags. A large equation appears: '-4 % SUR LES PLACEMENTS = -100 % DE SON ARGENT'."),
    ("En mille neuf cent quatre-vingt-dix-huit",
     "A large line chart fills the frame titled 'CAPITAL DE LTCM -- 1998' with months JAN to SEPT along the bottom and billions of dollars on the left axis (0 to 5). The gold line starts near 4,7 at JAN, sags slowly through MAI-JUIN-JUIL, then on 'Le coup de grace' plunges off a cliff in AOUT to about 2,3 and keeps falling in SEPT to below 1. A red counter '-4,6 MILLIARDS $' counts down as the line falls. On 'en aout' the August segment glows red with a tag 'AOUT 1998 : LA RUSSIE NE PAIE PLUS' and the background briefly desaturates. On 'moins de quatre mois' a bracket spans JUIN to SEPT labelled '< 4 MOIS'."),
    ("La banque centrale",
     "A large sinking block labelled 'LTCM' tilts and sinks into dark rising water at center. On 'reunir quatorze banques' fourteen large @bank icons appear in a ring around it one after another in rapid rhythm, each connected to the block by a straight line; the lines tighten and lift the block back above the water. A label 'NEW YORK FED : 14 BANQUES, 3,6 MILLIARDS $' appears at the bottom."),
    ("Gérer le risque",
     "PHASE 1 -- BUYING TIME: A huge @hourglass fills the center; instead of sand, small gold chips trickle down through its neck. A caption 'ACHETER DU TEMPS' sits beside it. PHASE 2 -- STAYING IN THE GAME: On 'garde le joueur dans le jeu' the hourglass compresses into a long bankroll line that runs across the full width: it takes several sharp red dips but never touches the bottom edge, and keeps climbing to the right, glowing gold at the end. On 'son avantage finisse par payer' a final title appears huge at center: 'RESTER DANS LE JEU'."),
]


def main() -> None:
    starts = []
    for key, _ in SCENES:
        i = flat.find(key)
        if i < 0:
            sys.exit(f"scene key not found in script: {key}")
        starts.append(i)
    assert starts == sorted(starts) and starts[0] == 0, starts
    scenes = []
    for n, (key, desc) in enumerate(SCENES):
        end = starts[n + 1] if n + 1 < len(starts) else len(flat)
        scenes.append({"sceneIndex": n, "audioTranscriptPortion": flat[starts[n]:end].strip(), "videoDescription": desc})
    for s in scenes:
        assert all(ord(c) < 128 for c in s["videoDescription"]), s["sceneIndex"]
    out = {"video_aspect_ratio": "landscape", "scenes": scenes, "required_assets": [
        {"name": "bank", "asset-type": "asset", "description": "A classical bank building with columns and a triangular pediment"},
        {"name": "hourglass", "asset-type": "asset", "description": "An hourglass with a wooden frame and glass bulbs"},
    ]}
    path = f"{T}/Direction/Latest/latest.json"
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(out, open(path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"wrote {len(scenes)} scenes to {path}")
    for s in scenes:
        print(s["sceneIndex"], len(s["audioTranscriptPortion"].split()), "|", s["audioTranscriptPortion"][:70])


if __name__ == "__main__":
    main()
