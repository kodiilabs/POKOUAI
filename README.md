# PokouAI 🌱

**Offline-first, multilingual AI crop disease advisor for West African smallholder farmers.**

Built for the [Gemma 4 Good Hackathon](https://kaggle.com/competitions/gemma-4-good) — submission deadline May 18, 2026.

- 📱 **100% offline** inference on entry-level Android phones (2–3 GB RAM)
- 🗣️ **4 languages**: French, Dioula, Baoulé, English
- 🧠 **Gemma 4 E2B** (multimodal) fine-tuned on cocoa diseases with QLoRA + Unsloth — ~1.5 GB GGUF fits low-end devices. E4B variant built as optional premium for ≥4 GB phones.
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

First launch downloads the GGUF model (~1.5 GB, E2B). Subsequent launches are fully offline.

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
TIER 1 — PHONE                always available
  Gemma 4 E2B via llama.cpp   ~1.5 GB GGUF Q4_K_M, 2–3 GB RAM
  (E4B auto-selected on ≥4 GB phones)

      ↕ local WiFi (no internet)

TIER 2 — COOPERATIVE HUB      extension worker's laptop
  Gemma 4 27B via Ollama      higher accuracy, powers group teaching

      ↕ when internet available

TIER 3 — CLOUD                enhancement
  Gemma 4 27B hosted          anonymized sync + outbreak map
```

Routing: one function in [app/src/services/InferenceRouter.ts](app/src/services/InferenceRouter.ts) probes hub + internet in parallel, picks the highest available tier, and falls back automatically on error. Tier chosen per-diagnosis is recorded in the local DB and shown on the Result screen.

### Education layer

Every diagnosis is a teaching moment. Modes on top of the diagnosis flow:

- **Learn** — "Why this happened" explanation after any diagnosis ([LearnScreen.tsx](app/src/screens/LearnScreen.tsx))
- **Prevention calendar** — seasonal actions for cocoa in Côte d'Ivoire ([PreventionCalendarScreen.tsx](app/src/screens/PreventionCalendarScreen.tsx))
- **Quiz** — spaced-repetition Q&A keyed to the farmer's recent diagnoses ([QuizScreen.tsx](app/src/screens/QuizScreen.tsx))
- **Group mode** — extension worker UI for teaching a group of farmers ([GroupModeScreen.tsx](app/src/screens/GroupModeScreen.tsx))

### Scientific farming loop (Addendum v2)

Compresses the agricultural feedback loop from a season to 7 days, turning each diagnosis into a hypothesis-test-conclude cycle:

```
Day 0 — diagnosis      → photo → disease + treatment
Day 0 — hypothesis     → "what do you think caused this?" (5 s tap, 4 options + "I don't know")
Day 0 — schedule       → local notification queued for +7 days (no internet)
Day 7 — follow-up      → second photo, comparative diagnosis, mark outcome + theory ✓/✗
Day 7 — lesson         → farmer types one-line lesson; saved to Farm Intelligence Log
Next season — recall   → lesson surfaces as preventive reminder when conditions match
```

Implementation: [HypothesisCard.tsx](app/src/components/HypothesisCard.tsx) inline on Result screen (4 theory tiles + 🎙 voice memo via [voice.ts](app/src/services/voice.ts)), [FollowUpScreen.tsx](app/src/screens/FollowUpScreen.tsx) for the day-7 capture (calls [routeComparison](app/src/services/InferenceRouter.ts) — hub + cloud get both images, local llama.cpp falls back to single-image comparison-aware prompt), [FarmIntelligenceLogScreen.tsx](app/src/screens/FarmIntelligenceLogScreen.tsx) for the curated lessons with audio playback. Local notifications via [notifications.ts](app/src/services/notifications.ts) — no internet required. Permission backstop: Home shows a red overdue banner if any pending loop is past its check date. Data model: a `loops` table linking initial diagnosis → hypothesis (category + voice memo) → comparison response → outcome → lesson.

Full positioning in [docs/PokouAI_Submission_WriteUp.md](docs/PokouAI_Submission_WriteUp.md) and rationale in [docs/PokouAI_Addendum_v2.md](docs/PokouAI_Addendum_v2.md).

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
