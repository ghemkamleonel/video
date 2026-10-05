# La finance quantitative en 78 secondes

Vidéo explicative en français sur la finance quantitative. Elle a été générée avec le pipeline
**OVG — Outscal Video Generator** ([outscal/video-generator](https://github.com/outscal/video-generator)).

**▶ Vidéo finale : [`finance-quantitative.mp4`](./finance-quantitative.mp4)** (1920×1080, 30 i/s, 78 s)

**Sous-titres français :** [`finance-quantitative.fr.srt`](./finance-quantitative.fr.srt), aussi intégrés au MP4 comme piste activable (à choisir dans le lecteur). Ils sont générés à partir du transcript mot à mot, et les nombres y sont écrits en chiffres.

## Le propos

> Entre 1988 et 2018, le fonds Medallion de Jim Simons a gagné en moyenne 66 % par an avant frais.
> Pourtant, il avait raison seulement 50,75 % du temps.

La vidéo montre comment un avantage minuscule devient une quasi-certitude quand on répète le pari :

- 10 000 paris rapportent en moyenne 150 €, avec encore une chance sur quinze de perdre.
- 1 000 000 de paris rapportent en moyenne 15 000 €, alors que le hasard ne pèse qu'environ ±1 000 €.

Elle fait ensuite le parallèle avec le casino (la roulette européenne garde 1/37, soit 2,7 % des mises),
puis explique la méthode quant : chercher des régularités, multiplier les petits paris et ne jamais
arrêter de chercher. Conclusion : *répéter, pas prédire*.

Les chiffres et leurs sources sont dans `projet/finance-quantitative-v2/Scripts/drafts/eval_v2.txt` :
Zuckerman, *The Man Who Solved the Market*, pour les 66 % bruts sur 1988-2018 ; Robert Mercer pour
la citation des 50,75 %.

## Comment elle a été produite (pipeline OVG)

| Étape OVG | Ce qui a été fait | Fichiers |
|---|---|---|
| 0. Script (`script-agent`) | 5 angles évalués, brouillons v1 → v2, auto-notation sur 9 critères (9,0/9) | `Scripts/drafts/`, `script.md` |
| init | `cli_pipeline init --style vox --ratio 16:9` | `manifest.json` |
| 1. Direction (`direction-agent`) | 10 scènes avec phases synchronisées sur la narration, validées par `validate_json` | `Direction/` |
| 2. Audio (`audio-agent`) | Balises d'émotion, validées par `validate_script_with_emotions`, puis TTS et timestamps par mot | `Audio/`, `Transcript/` |
| 3. Assets (`asset-agent`) | `server rack` créé en SVG dans la palette vox | `Assets/`, `public/` |
| 4. Code (`code-agent`) | 10 scènes Remotion TSX, validées par `validate_tsx` (statique et runtime), puis composition | `Video/Latest/` |
| Rendu | `remotion render` | `finance-quantitative.mp4` |

Tous les artefacts intermédiaires sont dans [`projet/finance-quantitative-v2/`](./projet/finance-quantitative-v2).

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

## Re-générer

```bash
git clone https://github.com/outscal/video-generator && cd video-generator
git checkout $(cat ../ovg-patches/BASE_COMMIT) && git apply ../ovg-patches/ovg-offline.patch
cp ../ovg-patches/offline_tts.py scripts/utility/
cp -r ../projet/finance-quantitative-v2 Outputs/
cd studio && npm install --legacy-peer-deps && cd ..
python studio.py finance-quantitative-v2     # aperçu sur http://localhost:3000
```
