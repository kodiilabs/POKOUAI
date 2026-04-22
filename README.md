# PokouAI 🌱

**Offline-first, multilingual AI crop disease advisor for West African smallholder farmers.**

Built for the [Gemma 4 Good Hackathon](https://kaggle.com/competitions/gemma-4-good) — submission deadline May 18, 2026.

- 📱 **100% offline** inference on entry-level Android phones (2–3 GB RAM)
- 🗣️ **4 languages**: French, Dioula, Baoulé, English
- 🧠 **Gemma 4 E4B** (multimodal) fine-tuned on cocoa diseases with QLoRA + Unsloth
- 🌾 **Primary use case**: cocoa disease diagnosis in Ivory Coast (5M+ farmers, mostly offline)

---

## The problem

Ivorian cocoa farmers lose 30–40% of their harvest to preventable diseases. Extension agents are scarce, internet is unreliable, and most agronomy apps assume fluent French literacy and 4G. A farmer holding a diseased pod today has no fast way to identify *black pod rot* from *frosty pod rot* — and the treatments are different.

PokouAI runs entirely on the phone: point camera at pod, get a disease name, treatment steps, and prevention advice in the farmer's own language. Airplane mode works. A $50 Android works.

---

## Quick start

### Mobile app

```bash
# Prereqs: Node 20 (via nvm), Android Studio + emulator OR Xcode + iOS sim
cd app/
npm install
npx expo start        # press 'a' for Android, 'i' for iOS
```

First launch downloads the GGUF model (~2.8 GB). Subsequent launches are fully offline.

### ML pipeline (fine-tuning)

```bash
# Prereqs: Python 3.11, a Kaggle account (for free T4 x2 GPU)
python3.11 -m venv venv
source venv/bin/activate
pip install -r ml/requirements.txt

# Data prep (local)
python ml/scripts/prepare_training_data.py --input data/raw --output data/processed
python ml/scripts/augment_images.py --input data/processed --output data/processed_aug
python ml/scripts/build_training_jsonl.py --images data/processed_aug --diseases data/cocoa_diseases.json --out data/train.jsonl

# Fine-tune on Kaggle
# Upload ml/notebooks/03_finetune_cocoa_unsloth.ipynb to Kaggle, attach the dataset, enable T4 x2.
```

---

## Architecture

```
Camera → Image preprocess → Gemma 4 E4B (GGUF Q4_K_M) → Response parser → UI (i18n)
                                    ↑
                              LoRA adapter
                         (fine-tuned on cocoa)
```

- **On-device**: `react-native-llama.cpp` loads the GGUF, runs multimodal inference.
- **Cloud (optional)**: Gemma 4 27B MoE fallback for low-confidence results, over opt-in sync only.

---

## Repo layout

```
pokou-ai/
├── app/              React Native + Expo app (iOS + Android)
├── ml/               Fine-tuning scripts and Kaggle notebooks
├── data/             Knowledge base + (gitignored) datasets
├── docs/             Full project docs and implementation checklist
├── .claude.md        Claude Code configuration
├── LICENSE           Apache 2.0
├── PRIVACY_POLICY.md
└── README.md
```

See [docs/PokouAI_Project_Documentation.md](docs/PokouAI_Project_Documentation.md) for the full design.

---

## Languages

| Code | Language | Speakers (Côte d'Ivoire) |
|------|----------|--------------------------|
| `fr` | French   | ~10M (official)          |
| `dyu`| Dioula   | ~5M (trade language)     |
| `bci`| Baoulé   | ~4M                      |
| `en` | English  | Hackathon / review       |

All 5 disease responses (name, symptoms, treatment, prevention) ship in all 4 languages. Native-speaker review is required before v1 release.

---

## Links

- **Demo video**: _TBD_ (hosted on YouTube, unlisted)
- **Kaggle notebook**: _TBD_
- **GitHub**: this repo (public)

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

Built with [Unsloth](https://github.com/unslothai/unsloth), [llama.cpp](https://github.com/ggerganov/llama.cpp), and Google's Gemma 4 (under Gemma Terms of Use).

Dataset attributions: PlantVillage, CGIAR, IITA, iNaturalist, CaboCo (see [docs](docs/PokouAI_Project_Documentation.md) for full credits).

---

## Privacy

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md). TL;DR: all data stays on the phone. Cloud sync is opt-in and never transmits raw images or personal identifiers.
