# Vidéos explicatives de finance, générées avec OVG

Trois vidéos explicatives en français, produites avec le pipeline
**OVG — Outscal Video Generator** ([outscal/video-generator](https://github.com/outscal/video-generator)).

| Vidéo | Durée | Fichier | Sous-titres |
|---|---|---|---|
| La finance quantitative | 78 s | [`finance-quantitative.mp4`](./finance-quantitative.mp4) | [`finance-quantitative.fr.srt`](./finance-quantitative.fr.srt) |
| La gestion du risque | 103 s | [`gestion-du-risque.mp4`](./gestion-du-risque.mp4) | [`gestion-du-risque.fr.srt`](./gestion-du-risque.fr.srt) |
| La finance de marché et l'actuariat (texte et voix du présentateur) | 152 s | [`finance-et-actuariat.mp4`](./finance-et-actuariat.mp4) | [`finance-et-actuariat.fr.srt`](./finance-et-actuariat.fr.srt) |

Toutes sont en 1920×1080, 30 i/s, encodées en H.264 (yuv420p) + AAC avec `faststart` : elles se lisent
dans un navigateur, sur mobile, dans VLC ou QuickTime. Les sous-titres sont générés à partir du
transcript mot à mot, avec les nombres écrits en chiffres. Pour les afficher dans VLC : Sous-titres →
Ajouter un fichier de sous-titres.

## 1. La finance quantitative

> Entre 1988 et 2018, le fonds Medallion de Jim Simons a gagné en moyenne 66 % par an avant frais.
> Pourtant, il avait raison seulement 50,75 % du temps.

La vidéo montre comment un avantage minuscule devient une quasi-certitude quand on répète le pari :

- 10 000 paris rapportent en moyenne 150 €, avec encore une chance sur quinze de perdre.
- 1 000 000 de paris rapportent en moyenne 15 000 €, alors que le hasard ne pèse qu'environ ±1 000 €.

Elle fait ensuite le parallèle avec le casino (la roulette européenne garde 1/37, soit 2,7 % des mises),
puis explique la méthode quant : chercher des régularités, multiplier les petits paris et ne jamais
arrêter de chercher. Conclusion : *répéter, pas prédire*.

Sources (dans `projet/finance-quantitative-v2/Scripts/drafts/eval_v2.txt`) : Zuckerman,
*The Man Who Solved the Market*, pour les 66 % bruts sur 1988-2018 ; Robert Mercer pour la citation
des 50,75 %.

## 2. La gestion du risque

> 61 joueurs ont parié sur une pièce truquée, et ils le savaient : elle tombait sur face six fois sur dix.
> Plus d'un sur quatre a quand même tout perdu.

Le fil de la vidéo :

- **L'expérience de 2016** (Haghani et Dewey) : 25 $ au départ, 30 minutes de jeu, gains plafonnés
  à 250 $. 28 % des joueurs ont été ruinés par la taille de leurs mises.
- **L'asymétrie des pertes** : après −50 %, il faut +100 % pour revenir au départ, et une perte totale
  ne se répare jamais. Miser tout à chaque lancer ne survit à 10 lancers que 6 fois sur 1 000.
- **Le critère de Kelly (1956)** : miser une part fixe égale à son avantage, soit 60 % − 40 % = 20 %.
  Au-delà d'environ 40 %, le capital fond. Avec cette règle, environ 94 % des joueurs auraient atteint
  250 $ ; en réalité, seuls 21 % y sont arrivés.
- **LTCM (1998)** : deux prix Nobel, environ 25 $ misés pour 1 $ possédé, donc une perte de 4 % sur les
  placements efface tout le capital. Le fonds a perdu 4,6 milliards de dollars en moins de quatre mois,
  avant un sauvetage par 14 banques réunies par la Réserve fédérale de New York.
- **Conclusion** : gérer le risque, c'est acheter du temps et *rester dans le jeu*.

Chaque affirmation a été vérifiée par des agents indépendants chargés de la réfuter, avec recherche web.
Les traces sont dans `projet/gestion-du-risque-v2/Scripts/drafts/eval_v*.txt`. Cinq imprécisions ont été
corrigées entre le v2 et le v3 : la chronologie de LTCM, le plafond qui porte sur le montant encaissé,
le seuil de Kelly « environ 40 % », etc.

## 3. La finance de marché et l'actuariat (texte du présentateur)

Le texte fourni par le présentateur est utilisé **mot pour mot** comme narration
(`projet/finance-et-actuariat-v2/script.md`). Les 13 scènes illustrent chaque passage :

- la présentation et la filière finance et actuariat ;
- la définition des deux métiers ;
- le marché organisé ;
- épargnants, assureurs et fonds face aux États et aux entreprises ;
- actions, obligations et dérivés ;
- les trois rôles des marchés ;
- l'Afrique : financement alternatif, souveraineté sur les prix du cacao, du café et du pétrole, besoin d'analystes.

Les hésitations du discours oral restent dans la narration et les sous-titres, mais pas dans les textes à l'écran.

**Voix du présentateur.** La narration est l'enregistrement original du présentateur (note vocale WhatsApp de
150 s), simplement nettoyé : grondement filtré et volume normalisé. Elle a été alignée mot à mot sur le texte
sans modèle de reconnaissance vocale, puis les 13 scènes ont été recalées automatiquement sur ce rythme naturel :
pendant les hésitations, l'image attend.

Contrôles du calage (détails dans `projet/finance-et-actuariat-v2/Transcript/alignement_voix.png`) :

- les frontières de phrase qui tombent sur une pause y tombent exactement (écart médian de 0 ms) ;
- le débit par phrase est régulier, autour de 5 syllabes/s, sauf aux hésitations ;
- sur un test de référence à vérité connue, l'aligneur est précis à 10 ms en moyenne (67 ms au pire).

## Comment elles ont été produites (pipeline OVG)

| Étape OVG | Finance quantitative | Gestion du risque |
|---|---|---|
| 0. Script (`script-agent`) | 5 angles, v1 → v2, 9,0/9 | v1 → v4 : critique indépendant (5,25 → 8,5 → 9,0/9) et vérification des faits par 4 agents |
| init | `--style vox --ratio 16:9` | idem |
| 1. Direction (`direction-agent`) | 10 scènes | 13 scènes (`Direction/build_direction.py` garde la narration identique au script) |
| 2. Audio (`audio-agent`) | balises d'émotion, TTS, timestamps par mot | idem |
| 3. Assets (`asset-agent`) | `server rack` (SVG) | `bank`, `hourglass` (SVG) |
| 4. Code (`code-agent`) | 10 scènes TSX | 13 scènes TSX, un agent par scène avec aperçu visuel et autocorrection, puis revue d'ensemble |
| Rendu | `remotion render` + réencodage | idem |

Tous les artefacts intermédiaires sont dans [`projet/`](./projet) : scripts et évaluations, direction,
audio, transcript, assets, prompts et scènes TSX.

## Écarts par rapport au pipeline d'origine

Le pipeline a tourné dans un conteneur sans clé ElevenLabs, sans jeton OAuth Claude pour le sélecteur
d'icônes, et avec un accès réseau restreint. Les adaptations sont dans [`ovg-patches/`](./ovg-patches).
Ce dossier contient le patch, appliqué sur le commit indiqué dans `BASE_COMMIT`.

- **Voix** : `offline_tts.py` est un moteur TTS hors-ligne basé sur SVOX Pico (`pico2wave`, fr-FR).
  Il n'est utilisé que si `ELEVENLABS_API_KEY` est absente. Il produit le même format de transcript
  mot à mot que le backend ElevenLabs. La voix est donc **synthétique et assez robotique**.
  Avec une clé ElevenLabs, relancer `cli_pipeline post --step audio` donnera une narration naturelle.
- **tiktoken** : si l'encodage ne peut pas être téléchargé, le comptage de tokens passe à une
  estimation d'environ 4 caractères par token.
- **Correctif** : `MAPBOX_TOKENS` non défini faisait planter la génération de la composition
  (`None.split`).
- **Accents** : la narration (`audioTranscriptPortion`) garde ses accents pour que la prononciation
  française soit correcte. Les descriptions visuelles restent en ASCII, comme l'exige OVG.
- **Assets** : le sélecteur d'icônes a besoin d'un jeton Claude. Les assets ont donc été dessinés en SVG,
  comme le prévoit la règle de repli de l'`asset-agent`.
- **Outils** (`ovg-patches/tools/`) :
  - `preview_scene.py` rend des images fixes d'une seule scène, isolée des autres ;
  - `finalize.sh` fait le rendu, le réencodage compatible web et les sous-titres ;
  - `make_srt.py` génère les sous-titres à partir du transcript.

  Ces outils contiennent des chemins propres au conteneur de génération.

## Utiliser sa propre voix

Le présentateur peut remplacer la voix de synthèse par son propre enregistrement, en lisant le texte du script.
Une seule commande suffit, depuis la racine d'OVG :

```bash
bash scripts/utility/use_my_voice.sh finance-et-actuariat-v2 ma_voix.m4a
python studio.py finance-et-actuariat-v2        # aperçu ; ou ovg-patches/tools/finalize.sh pour le MP4
```

Ce que fait la commande :

1. **Alignement** (`voice_align.py`) : le texte est synthétisé avec la voix hors-ligne, dont le minutage mot à
   mot est connu, puis aligné sur l'enregistrement par DTW sur des MFCC. Aucun modèle de reconnaissance vocale
   n'est nécessaire. Test sur 14 phrases lues par une autre voix : erreur moyenne de 19 ms, 118 ms au maximum.
2. **Minutage des scènes** : il est recalculé par OVG sans appel TTS (`skipAudioApiCall`).
3. **Recalage** (`retime_scenes.py`) : chaque scène s'ancre sur les mots (`at("mot")`) et non sur des numéros
   d'image. Seul le bloc `@ovg-timings` de chaque scène est régénéré.
4. **Revalidation** de toutes les scènes, puis **composition**.

Prérequis : l'enregistrement doit suivre le texte. Les écarts d'improvisation dégradent le calage.

## Re-générer

```bash
git clone https://github.com/outscal/video-generator && cd video-generator
git checkout $(cat ../ovg-patches/BASE_COMMIT) && git apply ../ovg-patches/ovg-offline.patch
cp ../ovg-patches/offline_tts.py scripts/utility/
cp ../ovg-patches/{voice_align.py,retime_scenes.py,use_my_voice.sh} scripts/utility/
cp -r ../projet/finance-quantitative-v2 ../projet/gestion-du-risque-v2 ../projet/finance-et-actuariat-v2 Outputs/
cd studio && npm install --legacy-peer-deps && cd ..
python studio.py gestion-du-risque-v2     # aperçu sur http://localhost:3000
```
