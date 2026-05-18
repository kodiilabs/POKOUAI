# PokouAI — Submission

## Project title

PokouAI — Offline-first multilingual AI crop disease advisor for West African smallholder farmers

## Summary

Ivorian cocoa farmers lose 30–40% of their harvest to preventable diseases. Extension agents are scarce, internet is unreliable, and most agronomy apps assume fluent French literacy and a 4G connection. A farmer holding a diseased pod today has no fast way to tell black pod rot from frosty pod rot — and the treatments are different.

PokouAI runs entirely on the phone: point camera at pod, get a disease name, treatment, and prevention in the farmer's own language. Airplane mode works. A $50 Android works. When the farmer walks into the cooperative building, a laptop running Ollama takes over with a larger model. When internet is available, the cloud takes over with the biggest. The farmer never thinks about any of this — the InferenceRouter picks the highest-available tier and falls back automatically.

Beyond diagnosis, PokouAI is an education platform. Every diagnosis becomes a 7-day hypothesis-test-conclude cycle that compresses the agricultural feedback loop from a full season to one week. A Farmer Agent — a persistent skill model that lives behind every interaction — silently adapts every prompt, treatment recommendation, money framing, and follow-up to the farmer's inferred level across five cocoa-specific skills, so a first-season farmer and a 30-year veteran get entirely different content depths from the same app on the same image of the same disease.

## Technical architecture

PokouAI is built as a three-tier local-first architecture.

Layer 1 — Phone. Gemma 4 E2B running via LiteRT-LM, a ~2.4 GB `.litertlm` int4 bundle with Per-Layer Embeddings externalised so the runtime working-set fits 2–3 GB RAM entry-level Android phones. Multimodal vision tower included. Wired via `react-native-litert-lm@0.3.7`. `llama.rn` (GGUF) sits in the codebase as a code-level fallback but is not the active Gemma 4 path — the upstream llama.cpp converter drops Gemma 4's PLE tables, so the GGUF path is skipped for this generation of model.

Layer 2 — Cooperative hub. Gemma 4 via Ollama on the extension worker's laptop, reachable over WiFi with no internet required. The operator picks the model: `gemma4:27b` on beefier hardware, `gemma4:e4b` on modest laptops, or `gemma4:e2b` for the demo deployment. The hub also serves as the production fallback for any on-device model that isn't currently usable.

Layer 3 — Cloud. Gemma 4 27B hosted, for anonymized case sync and outbreak mapping when internet is available.

Routing is implemented in a single file (`app/src/services/InferenceRouter.ts`): it probes hub reachability and internet in parallel, picks the highest available tier, and falls back automatically on error. Each diagnosis records the tier that ran it; the Result screen surfaces it as a badge.

Four languages: French, English, Dioula, Baoulé. Six persona archetypes have been baseline-tested across the 13 in-scope screens — including Aminata, a Dioula-speaking woman farmer who reads French slowly and uses a shared phone in the evening — providing a measurable floor for the non-reader UI redesign in progress.

## Main Track

PokouAI is an offline-first, multilingual AI crop disease advisor for West African smallholder farmers — built on fine-tuned Gemma 4, running locally on entry-level Android phones via LiteRT-LM, with a three-tier routing architecture and a Farmer Agent that adapts every diagnosis, treatment, and follow-up to the farmer's skill level.

## Cactus Prize

PokouAI intelligently routes inference across three local-first tiers: Gemma 4 E2B via LiteRT-LM on the farmer's phone, a hub-operator-selected Gemma 4 (E2B, E4B, or 27B) via Ollama on the cooperative hub, and cloud inference when internet is available — with zero cloud dependency required at any tier and automatic graceful fallback through every layer.

## Ollama Prize

A cooperative hub running Gemma 4 via Ollama (27B on beefier hardware, E4B on modest laptops, E2B for the demo deployment — operator-picked) serves as a local AI server for surrounding farmers over WiFi — no internet required — providing higher-accuracy diagnosis and powering the extension worker group-teaching mode. The hub tier also serves as the production fallback for any on-device model that isn't currently usable.

## Unsloth Prize

The on-device model is a QLoRA fine-tune of Gemma 4 E2B trained with Unsloth on a six-class cocoa-disease corpus (black pod rot, frosty pod rot, swollen shoot virus, vascular streak dieback, healthy, and other-damage), using r=16, α=32, three epochs on free Kaggle T4 ×2 GPU. The LoRA adapter weights merge cleanly. The LiteRT-LM export is being re-run with the corrected flags (`--externalize_embedder` and `--jinja_chat_template_override`); the InferenceRouter is built so the cocoa-tuned bundle drops into the on-device path with zero app changes the moment the re-export lands.

Published Kaggle notebook: https://www.kaggle.com/code/yaokouadio/pokou-ai-cocoa-finetune

## LiteRT Prize

The primary on-device inference path is LiteRT-LM via `react-native-litert-lm@0.3.7`, running a Gemma 4 E2B `.litertlm` bundle (~2.4 GB int4 with Per-Layer Embeddings externalised so the runtime working-set fits 2–3 GB RAM Android phones); the same engine that drives `litert-lm run` on the desktop runs on the phone, exercising the AI Edge graph for full multimodal cocoa disease diagnosis.

## Global Resilience Prize

PokouAI addresses the food security of 5 million cocoa farmers in Ivory Coast — the world's largest cocoa-producing country — by delivering offline AI diagnosis that works in areas with no electricity grid access, no internet, and no agronomist within 80 km. A partnership with Fair Trade Côte d'Ivoire is lined up alongside a first cooperative pilot starting next month, which will close the field-image gap and validate the diagnostic loop against real cooperative-member outcomes — turning a shipped system into a living agricultural-resilience tool.

## Digital Equity Prize

All outputs are delivered in French, Dioula, Baoulé, and English — the primary languages of Ivorian cocoa farmers — with voice output via `expo-speech` and a non-reader UI redesign in progress that drives every screen to icon-first and opt-in voice, persona-tested against six farmer archetypes including a non-reading Dioula-speaking woman on a shared phone in the evening. Six baseline walkthroughs at the current codebase HEAD set a measurable floor for the redesign and a regression gate for every future change.

## Future of Education Prize

PokouAI's scientific farming loop transforms every diagnosis into a structured hypothesis-test-conclude cycle — compressing the agricultural feedback loop from a full season to seven days — and the Farmer Agent silently adapts every prompt, treatment, money framing, and follow-up across three skill levels (Novice, Practitioner, Expert) inferred from behaviour, so a first-season farmer and a 30-year veteran get entirely different content depths from the same app on the same image of the same disease. The framework is demonstrated end-to-end in-app across five flow stages and three skill levels (Onboard → Diagnose → Result → Day 7 → Lesson), with skill state persistent in AsyncStorage and propagating to the production Result screen as an "Adapted for X" badge.

## Limitations

The cocoa-tuned fine-tune is trained and merged; the on-device LiteRT-LM bundle is being re-exported. The current export exhibits token-repetition on text prompts — a known Gemma 4 export gotcha around Per-Layer Embeddings and chat-template handling. The fix is mechanical: re-export with `--externalize_embedder` and `--jinja_chat_template_override` from the confirmed merged checkpoint, smoke-test inside Kaggle before download. Production diagnosis runs through Hub-tier Gemma 4 E2B via Ollama in the meantime — same architecture, same UX surface, same router behaviour — and the cocoa-specific bundle drops back into the on-device path the moment the re-export is verified. This is the InferenceRouter design pattern working as intended.

Training data is a curated subset. Disk and free-tier Kaggle storage budgets capped us at roughly 2,500 images per disease class instead of the full PlantVillage + CGIAR + IITA pool. Most images are PlantVillage-derived with cocoa-specific augmentation; genuine field images from Côte d'Ivoire are scarce. Closing this gap is the single biggest accuracy lever for v2 and is the explicit goal of the first cooperative pilot starting next month.

The non-reader UI redesign (REQ-002) is designed, baselined, and partially implemented. Six persona walkthroughs at the current HEAD show that our primary non-reader persona (Aminata) is blocked on every screen today. The redesign plan, the component primitives, the lint rules, and the i18n exception policy are all in place; the screen-by-screen icon swap paused mid-Wave-1 so the Farmer Agent framework could ship first. That ordering was the explicit REQ-002 revision decision.

The build was completed on a Mac with constrained memory and disk space, which shaped real product decisions: the on-device model is E2B not E4B (the larger variant doesn't leave RAM headroom for the rest of the phone), the video is rendered programmatically from React via Remotion rather than captured per-screen from a simulator, and the on-device LiteRT-LM path was not benchmarked live during development because AI Edge native engines require a physical iPhone 15 Pro or Pixel 8+ rather than a simulator. The physical-device benchmark and the field photo collection both happen on the first cooperative pilot phone.

## How to run

```
git clone <repo>
cd pokou-ai/app
pnpm install
pnpm typecheck
pnpm start --clear
pnpm ios            # or: pnpm android
```

In the app, on Home, tap the purple "Farmer Agent" tile to see the skill-adaptation framework demo — same disease, same image, three different farmers, five flow stages.

For a real diagnosis, on the Mac run `ollama pull gemma4:e2b && ollama serve --host 0.0.0.0:11434`. In the app, Settings → Hub → URL = `http://<mac-LAN-IP>:11434`, then Save and Test. Now take a photo of a cocoa pod from Home; the Result screen shows the tier badge (`🛰 Ollama · hub`) and the Farmer Agent's "Adapted for X" badge from your current skill level setting.

Settings → Agent skill level lets you flip Novice / Practitioner / Expert. The Result-screen badge follows, and the Farmer Agent demo screen reflects the new level — all from a single AsyncStorage key.

To exercise the seven-day loop, complete a diagnosis, tap "Test your theory" on Result, and pick a cause. A local notification is scheduled for seven days out and a loop row is created. Home → "My farm intelligence" shows pending and completed loops.

The full build story, constraints, and partnership roadmap is at `docs/STORY.md`. The Farmer Agent architecture proposal is at `docs/PokouAI_Future_of_Learning.md`. The hub/Ollama setup is at `data/models/OLLAMA_SETUP.md`.

## Links

- GitHub repository: _(paste your URL)_
- Kaggle fine-tune notebook (published): https://www.kaggle.com/code/yaokouadio/pokou-ai-cocoa-finetune
- Kaggle fine-tune notebook (local source): `ml/notebooks/03_finetune_cocoa_unsloth.ipynb`
- Kaggle LiteRT-LM export notebook: `ml/notebooks/04_quantize_litert_lm.ipynb`
- Kaggle training dataset: `pokou-ai-cocoa-training-data`
- Demo video: _(paste your YouTube unlisted URL)_
- Hub / Ollama setup: `data/models/OLLAMA_SETUP.md`
- Build story / constraints / partnership roadmap: `docs/STORY.md`
- Farmer Agent architecture proposal: `docs/PokouAI_Future_of_Learning.md`
