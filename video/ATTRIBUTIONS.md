# Video — third-party credits

The PokouAI submission video includes photographs and synthesised audio. This file lists every external asset and the credit / licence terms that go with it. When the video is published (e.g. YouTube), copy the **YouTube description block** at the bottom of this file verbatim.

## Photographs — Wikimedia Commons (CC BY-SA 4.0)

All photographs in the `FieldScene` are sourced from Wikimedia Commons under the **Creative Commons Attribution-ShareAlike 4.0 International** license. ShareAlike means: derivative works (including this video) are released under a compatible license.

| File in repo | Wikimedia source | Author | Year |
|---|---|---|---|
| `public/images/farmers_group.jpg` | [Cultivateurs de cacao.jpg](https://commons.wikimedia.org/wiki/File:Cultivateurs_de_cacao.jpg) | KokoDZ (Diorne Zausa) | 2015 |
| `public/images/farmer_field.jpg` | [Cultivateur de cacao 01.jpg](https://commons.wikimedia.org/wiki/File:Cultivateur_de_cacao_01.jpg) | KokoDZ (Diorne Zausa) | 2017 |
| `public/images/cocoa_worker.jpg` | [Ouvrier du domaine du Cacao ivoirien 01.jpg](https://commons.wikimedia.org/wiki/File:Ouvrier_du_domaine_du_Cacao_ivoirien_01.jpg) | Aman ADO | 2017 |
| `public/images/woman_harvest.jpg` | [La paysanne et sa bassine de maïs.jpg](https://commons.wikimedia.org/wiki/File:La_paysanne_et_sa_bassine_de_ma%C3%AFs.jpg) | SYLLA Cheick 225 | 2019 |

Full licence: <https://creativecommons.org/licenses/by-sa/4.0/>

## Audio — generated locally, no API or paid services

- `public/audio/voice.mp3` — narration generated with [Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) (released by hexgrad, Apache 2.0 licence) via [`kokoro-js`](https://github.com/hexgrad/kokoro), running locally on Apple Silicon via Transformers.js / ONNX Runtime. Free, offline, no API key. Generation script: [`scripts/gen-voice.mjs`](scripts/gen-voice.mjs).
- `public/audio/voice.say-samantha.mp3` — fallback narration generated with the macOS `say` command (voice: Samantha). Apple's bundled TTS voices are licensed for use in user-created media on Apple platforms.
- `public/audio/music.mp3` — original ambient drone synthesised in ffmpeg (sine waves + tremolo + low-pass filter). No external music source; no rights to attribute.

## YouTube description block — copy-paste this when publishing

```
PokouAI — an offline AI advisor for cocoa farmers in Côte d'Ivoire.
Built for the Gemma 4 Good Hackathon. Code: <repo URL>

Field photos (in order of appearance):
- "Cultivateurs de cacao" by KokoDZ (Diorne Zausa), 2015 — CC BY-SA 4.0
  https://commons.wikimedia.org/wiki/File:Cultivateurs_de_cacao.jpg
- "Cultivateur de cacao 01" by KokoDZ (Diorne Zausa), 2017 — CC BY-SA 4.0
  https://commons.wikimedia.org/wiki/File:Cultivateur_de_cacao_01.jpg
- "La paysanne et sa bassine de maïs" by SYLLA Cheick 225, 2019 — CC BY-SA 4.0
  https://commons.wikimedia.org/wiki/File:La_paysanne_et_sa_bassine_de_ma%C3%AFs.jpg
- "Ouvrier du domaine du Cacao ivoirien 01" by Aman ADO, 2017 — CC BY-SA 4.0
  https://commons.wikimedia.org/wiki/File:Ouvrier_du_domaine_du_Cacao_ivoirien_01.jpg

License: https://creativecommons.org/licenses/by-sa/4.0/
This video is released under CC BY-SA 4.0 in compliance with the photo licences.
```

## YouTube licence selection

When uploading to YouTube, set the video's licence to **Creative Commons – Attribution (CC BY)** *or* keep it as Standard YouTube License with the attribution block above. The CC BY-SA 4.0 ShareAlike clause is satisfied as long as the attribution block (and a link to the licence) is visible to viewers.
