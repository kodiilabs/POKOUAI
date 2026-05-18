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

> 📖 **If you're a reviewer running this for the first time, read [docs/STORY.md](docs/STORY.md) first.** It owns the constraints (Mac RAM, training-subset choices, Unsloth fine-tune) and where this is heading (Fair Trade Côte d'Ivoire partnership, first cooperative pilot next month).

### First run — 60 seconds to the Farmer Agent demo

```bash
# Prereqs: Node 20 (via nvm), Xcode + iOS sim (or Android Studio + emulator), pnpm
cd app/
pnpm install                     # if you see deps land in the workspace root, see Troubleshooting
pnpm typecheck                   # must pass clean before reporting bugs
pnpm start --clear
pnpm ios                         # or: pnpm android
```

In the app, on the Home screen, tap the purple **🎬 Farmer Agent — Skill demo** tile. The screen shows the same disease (black pod) and same image at **5 flow stages × 3 skill levels** — the simplest entry into what PokouAI is doing differently. The level you pick persists in AsyncStorage; flipping it from **Settings → Agent skill level (demo)** changes the badge on the production Result screen too.

### Running an actual diagnosis

Three modes — pick whichever matches your setup:

1. **Sideload the on-device GGUF** (~1.5 GB Q4_K_M E2B + 880 MB mmproj) via Finder → iPhone → Files → PokouAI. **Settings → Model version** confirms readiness. Once sideloaded, inference is fully offline. Best on a physical device.
2. **Hub mode** (the current default): run Ollama on a laptop with `gemma4:e2b` pulled, set the LAN URL in **Settings → Hub**. Used for the demo video. See [docs/demo.md](docs/demo.md).
3. **Simulator with no model** — falls back to a deterministic mock; the rest of the UX is testable end-to-end. The Result screen shows a red `DEMO` badge in this mode.

### Troubleshooting first-run

- **Installs landed in the repo root, not in `app/`** — there's no pnpm workspace at root. Run installs from `pokou-ai/app/`. If a stray root-level `package.json` / `pnpm-lock.yaml` / `node_modules` appears, delete them and re-install in `app/`.
- **`pnpm test` exits silently** — you ran it from `pokou-ai/`, not `pokou-ai/app/`. The Jest script lives in `app/package.json`.
- **iOS Simulator fails to boot the model** — that's expected. AI Edge native engines (LiteRT-LM) require a physical device (iPhone 15 Pro / Pixel 8+). Use Hub mode or the mock fallback in Simulator.
- **`npx expo install jest-expo` errors** — `expo install` requires an Expo project as cwd. Run it inside `app/`, not the workspace root.

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

### Scientific farming loop

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

Full positioning in [docs/PokouAI_Submission_WriteUp.md](docs/PokouAI_Submission_WriteUp.md). Architecture, screens, and folder layout: [docs/PokouAI_Project_Documentation.md](docs/PokouAI_Project_Documentation.md).

---

## Repo layout

```
pokou-ai/
├── app/              React Native + Expo app (iOS + Android)
├── ml/               Fine-tuning scripts and Kaggle notebooks
├── data/             Knowledge base + (gitignored) datasets
├── docs/             Full project docs and implementation checklist
├── video/            Remotion post-production project (demo video assembly)
├── .adlc/            ADLC artifacts (REQs, evals, assumptions, knowledge, dashboard)
├── .claude/          Claude Code configuration + custom agents/skills/commands
├── CLAUDE.md         Project-level instructions for Claude Code
├── LICENSE           Apache 2.0
├── PRIVACY_POLICY.md
└── README.md
```

See [docs/PokouAI_Project_Documentation.md](docs/PokouAI_Project_Documentation.md) for the full design and [docs/PokouAI_Future_of_Learning.md](docs/PokouAI_Future_of_Learning.md) for the Farmer Agent + Knowledge Stack + Environmental Signals proposal.

### Farmer Agent demo (sample-data prototype)

The Farmer Agent skill-level adaptation framework is **demonstrated** in the app via [SkillDemoScreen](app/src/screens/SkillDemoScreen.tsx) — reachable from Home via the purple "🎬 Farmer Agent — Skill demo" tile. The screen shows the same black-pod diagnosis at three skill levels (Novice / Practitioner / Expert) across five flow stages (Onboard → Diagnose → Result → Day 7 → Lesson). Content is hardcoded sample data in [app/src/data/skill_demo.json](app/src/data/skill_demo.json) — there is **no live skill tracker, no voice ASR, no real follow-up wiring**. The demo's job is to make the framework visible for reviewers, not to ship the agent. See [.adlc/requirements/REQ-002-non-reader-redesign.md](.adlc/requirements/REQ-002-non-reader-redesign.md) (revision history) for the scope decision that parked the real agent for a future REQ.

### Demo video (Remotion, 100% programmatic)

The submission video is rendered **entirely from React components** — no simulator recording, no manual clips. The phone frame, the mock screens (Home / Skill Demo / Result), and every animation are React. Run:

```sh
cd video
pnpm install   # ~250 MB Chromium on first run
pnpm render    # → video/out/pokouai.mp4 (~62 s, 1080×1920 portrait)
```

`pnpm dev` opens the Remotion Studio for live preview. See [video/README.md](video/README.md) for what each scene shows and how to retime / re-caption.

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

- **Demo video**: _recorded May 2026 — link added after upload_
- **Demo playbook**: [docs/demo.md](docs/demo.md) — pre-flight, capture order, troubleshooting
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
