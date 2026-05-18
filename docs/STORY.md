# PokouAI — The Build Story, the Constraints, and What Comes Next

> A candid record of what we shipped, what we couldn't, and where this is going. Written for the reviewers who will read the code and run the app.

---

## What this project actually is

PokouAI is an **offline, voice-first, multilingual disease advisor** for smallholder cocoa farmers in Côte d'Ivoire. It runs on a $50 Android in a field with no signal, in the farmer's own language, and is built to *teach* — not just diagnose. The submission ships an end-to-end system (see [`PokouAI_Future_of_Learning.md`](PokouAI_Future_of_Learning.md) for the long-arc roadmap): the diagnostic loop, the four-language UI, the three-tier inference router, the 7-day scientific loop, and the **Farmer Agent skill-adaptation framework** that personalises every interaction.

The app works today. Diagnosis runs end-to-end via the InferenceRouter — on-device LiteRT-LM is the primary path, with the cooperative-hub Ollama tier serving as the production fallback while we re-export the cocoa-specific fine-tune. This document is the honest engineering narrative behind the code; the polished version is in the submission write-up.

---

## What's shipped and verifiable

| Surface | What you can run | Where to look |
|---|---|---|
| Cocoa-tuned LLM (training shipped, on-device export being re-run) | Gemma 4 E2B fine-tuned on a cocoa-disease corpus with **Unsloth + QLoRA** (r=16, α=32, 3 epochs) on free Kaggle T4 ×2 GPU across the 6 classes (black pod, frosty pod rot, swollen shoot, vascular streak dieback, healthy, other-damage). Training run is complete; LoRA adapter weights are merged. The LiteRT-LM `.litertlm` export is being re-run with the corrected export flags (see *Known issue* below). Production diagnosis runs on **Hub-tier Gemma 4 E2B** via Ollama; the InferenceRouter drops the cocoa-tuned bundle into the on-device path with zero app changes once the re-export lands. | [`03_finetune_cocoa_unsloth.ipynb`](../ml/notebooks/03_finetune_cocoa_unsloth.ipynb) (published on Kaggle: [pokou-ai-cocoa-finetune](https://www.kaggle.com/code/yaokouadio/pokou-ai-cocoa-finetune)) · [`04_quantize_litert_lm.ipynb`](../ml/notebooks/04_quantize_litert_lm.ipynb) · [`InferenceRouter.ts`](../app/src/services/InferenceRouter.ts) |
| Three-tier inference router | Phone → Hub (Ollama on a laptop) → Cloud. Auto-fallback, tier badge persisted per diagnosis. | [`app/src/services/InferenceRouter.ts`](../app/src/services/InferenceRouter.ts) |
| 7-day scientific loop | Hypothesis at Day 0 (voice memo + 4 theory tiles) → Day-7 follow-up notification → comparison diagnosis → lesson logged into the Farm Intelligence Log. | [`app/src/components/HypothesisCard.tsx`](../app/src/components/HypothesisCard.tsx) · [`app/src/screens/FollowUpScreen.tsx`](../app/src/screens/FollowUpScreen.tsx) |
| Four-language UI scaffold | French, English, Dioula, Baoulé. EN/FR complete; DYU/BCI stubs pending native review. | [`app/src/i18n/locales/`](../app/src/i18n/) |
| Farmer Agent framework | A working in-app feature that shows the **same disease**, on the **same image**, adapted across **5 flow stages × 3 skill levels** (Onboard → Diagnose → Result → Day 7 → Lesson). Skill level persists in AsyncStorage; flipping it from Settings propagates to Result-screen "Adapted for" badge and to the demo screen. The behavioural-signal auto-promotion path is the next deliverable on top of this framework. | [`app/src/screens/SkillDemoScreen.tsx`](../app/src/screens/SkillDemoScreen.tsx) · [`app/src/services/farmerAgent.ts`](../app/src/services/farmerAgent.ts) |
| ADLC trail | Two REQs, six persona baselines, an architect design doc, 52-task breakdown, eval set, assumptions log, knowledge log, metrics dashboard. The methodology is visible, not just the artefact. | [`.adlc/`](../.adlc/) |
| Remotion video — 100% programmatic | The submission video renders entirely from React components: a custom phone frame, mock screens (Home / Skill Demo / Result) driven by the same `skill_demo.json` data the live app uses, and seven scenes (Title, Problem, Home reveal, Skill-level adaptation auto-cycle, Architecture, Diagnosis, Outro) sequenced into a 62-second 1080×1920 portrait MP4. No manual screen recording. `pnpm render` produces the MP4. | [`video/`](../video/) |

Everything above runs from a clean clone after `pnpm install`. See the [README's First Run section](../README.md).

---

## Constraints we accepted (because being honest beats overclaiming)

### Hardware

The build machine is a Mac with **limited RAM** (16 GB shared across IDE, Metro bundler, Xcode, iOS Simulator, Chromium tabs, Ollama, occasional Remotion preview). That ceiling shaped real product decisions:

- The on-device model is **Gemma 4 E2B**, not E4B. E4B Q4_K_M needs roughly 2.8 GB of RAM headroom; E2B Q4_K_M fits inside the ~1.5 GB budget that leaves the rest of the phone usable. The same RAM dynamic applies to the dev machine while running the model locally for iteration.
- The video demo flow is recorded **per-screen**, not as a continuous walk-through of every flow we'd want to show. Memory pressure on the dev Mac means the iOS Simulator drops frames if more than a few sessions run alongside Metro + a model load. The Remotion composition is designed around this: short clips, stitched.
- We do **not** demo the LiteRT-LM path live on the Simulator. AI Edge native engines require a physical device (iPhone 15 Pro / Pixel 8+). The submission ships the wiring; the on-device benchmark waits for the field-pilot phone.

### Data / training

The Unsloth fine-tune **does not use every image** we could have used. The corpus we built (`ml/scripts/organize_raw_data.py`, `ml/scripts/extract_coco_dataset.py`, `data/processed/`) is a deliberate subset:

- Disk + free-tier Kaggle storage budgets forced a balanced cap of ~2,500 images per disease class instead of the full PlantVillage + CGIAR + IITA pool.
- We trained on the **most diagnostically useful subset** — clean lighting, distinct symptom presentation, a deliberate mix of early-/late-stage examples per class. Edge-case images (sun-flare, motion-blur, occluded pods) were deferred to Phase 2 because they need either more compute or better refusal-to-diagnose logic before they help.
- Field images from Côte d'Ivoire are **scarce** in our current dataset — most images are PlantVillage-derived, with cocoa-specific augmentation. Closing this gap is the single biggest accuracy lever for v2; it requires the partner pilot below.

### Known issue: LiteRT-LM export token-collapse

The fine-tuned `cocoa_v1_e2b.litertlm` bundle currently degrades to token-repetition on text prompts (e.g. "Décris les symptômes…" → "admire bén admire bén admire bén…"). The training run itself completed cleanly; the failure is at the `litert-torch export_hf` step. Three plausible causes (in likelihood order):

1. **`--externalize_embedder` not set** during export. Gemma 4 E2B's Per-Layer Embeddings tables are large; inlining produces malformed embeddings on load and degenerate sampling downstream. Symptom matches.
2. **Chat template not pinned** with `--jinja_chat_template_override=litert-community/gemma-4-E2B-it-litert-lm`. Without that, the on-device tokenizer config may not match what the fine-tune was trained against — the model never sees a valid turn boundary.
3. **Export run against the LoRA adapter directory** instead of the merged HF dir. Notebook 05 must run `model.merge_and_unload()` and `save_pretrained(MERGED_DIR)` before notebook 04 reads from it.

**How production handles this:** the InferenceRouter routes diagnosis to the Hub-tier Ollama (`gemma4:e2b` base) when the cocoa-tuned on-device bundle isn't loaded. Same architecture, same UX surface, same accuracy floor — the only loss is the cocoa-specific output bias. Farmer Agent skill adaptation, three-tier routing, the seven-day loop, and the four-language UI all run on top of this and are unaffected.

**Re-export path:** re-run [`04_quantize_litert_lm.ipynb`](../ml/notebooks/04_quantize_litert_lm.ipynb) from the confirmed merged checkpoint with **all three** flags set, smoke-test inside Kaggle via `litert-lm run` BEFORE downloading. Once the bundle lands on the phone, the router picks it up and the local tier turns cocoa-specific without any app change.

### Implementation choices we *intentionally* parked

- **Behavioural-signal promotion of the Farmer Agent.** The framework is shipped: persistent skill state, "Adapted for X" badge on the production Result screen, 5-stage × 3-level adaptation surface, hand-off seam in [`farmerAgent.recordSignal()`](../app/src/services/farmerAgent.ts). The next deliverable is replacing the manual skill picker with auto-promotion driven by behavioural signals — gated behind a follow-up REQ because doing it right needs longitudinal pilot data, and shipping the framework first is the correct sequencing.
- **REQ-002 non-reader UI implementation.** Six persona baselines captured at `SHA 49ca416`: Aminata (Dioula non-reader) fails 13/13 screens today, Kouassi 12/13. The redesign plan, the 5 component primitives (Pictogram, ListenButton, IconAction, StatusBadge, SectionHeader), the lint rules, and the i18n exception policy are all designed and reviewed. The icon-swap implementation is paused mid-Wave-1 so the Farmer Agent framework could ship first — that ordering was the explicit REQ-002 revision decision.

If a reviewer reads the code expecting an agent that learns from behavioural signals and finds a manual-flip skill picker — that is intentional. The framework is the deliverable. The agent that learns is the next deliverable.

---

## What we got right

A few decisions that, in retrospect, paid out:

1. **ADLC discipline.** Two REQs with explicit revision history, baselines captured *before* code, kill criteria written down up front, assumptions logged when we couldn't verify them. When a partner reviews this for a pilot, they can audit the methodology not just the diff.
2. **The "park, design the seam" pattern.** A mid-build PRD rewrite (the Farmer Agent architecture proposal) could have eaten the REQ. We re-spec'd in 30 minutes, parked the agent for a future REQ, and designed the interface (`IconAction.label` toggleable, `farmerAgent` service with `recordSignal` stub) so the future agent drops in without a refactor.
3. **Voice-first as a first-class affordance, not a checkbox.** TTS in fr/en works today; dyu/bci pronunciation needs cooperative-recorded audio rather than a TTS hack. We surfaced this honestly in the dashboards and the dealbreakers list.
4. **Tier-aware UI.** Every diagnosis records the tier (local / hub / cloud) it ran on, and the result screen shows it. When a partner-cooperative laptop running Ollama is in range, the user gets bigger-model accuracy without changing anything they do — and when it's not, the phone still works.

---

## Where this goes next: Fair Trade Côte d'Ivoire + first cooperative pilot

The app is shipped and working today — Hub-tier diagnosis via Ollama, three-tier routing, the seven-day scientific loop, the Farmer Agent framework, four-language UI, and the Remotion video pipeline all run end-to-end on a clean clone. The work that comes next is field validation, not building from scratch.

**Concrete next steps** (1–3 months):

1. **Partnership with Fair Trade Côte d'Ivoire** — to get PokouAI into the hands of certified-cooperative farmers, with their feedback feeding the next training cycle. Fair Trade's regional structure gives us a path to a real eval set (genuine field photos, real diagnoses, follow-up outcomes) that no public dataset offers.
2. **First cooperative pilot — next month.** An Ivorian cocoa cooperative is lined up as the first real-world deployment. Five to ten farmers, a single shared mid-range Android with the sideloaded model, hub mode on a laptop the cooperative office runs. We use this to collect:
   - Real Day-7 follow-up outcomes (the missing signal that makes the Farmer Agent's promotion logic shippable).
   - Voice samples in Dioula and Baoulé for native pronunciation review and TTS replacement.
   - Field images that close the PlantVillage-bias gap.
   - Persona-tester corrections — Aminata and Kouassi are well-grounded archetypes, but they're archetypes. Real cooperative members will surface things we haven't imagined.
3. **Promote the Farmer Agent to behavioural inference.** The framework is shipped and demoable in-app today — same disease, same image, three skill levels, five flow stages, persistent skill state, "Adapted for X" badge on the production Result screen. With longitudinal data from the pilot, the next deliverable is replacing the manual skill picker with the behavioural-signal promotion path already stubbed in `farmerAgent.recordSignal()`.
4. **Native review of Dioula & Baoulé locales.** REQ-002 Wave 2 needs this — the 3-word exception policy depends on a native-speaker pass that we can run with cooperative members directly, not with a translation vendor at arm's length.

This isn't a hackathon-and-disappear project. The repo's `.adlc/` directory is built for the long arc: a regression suite that catches Aminata regressions across model upgrades, an assumptions log that turns "we think this is true" into "we measured it on day 90," a knowledge log that captures what we learned the hard way.

---

## If you're a reviewer and you want to run this in 60 seconds

```sh
cd /path/to/pokou-ai/app
pnpm install
pnpm typecheck            # should pass clean
pnpm start --clear
pnpm ios                  # or: pnpm android
```

In the app: tap the **purple "🎬 Farmer Agent — Skill demo" tile** on Home. That screen is the simplest entry to *what the framework does* — it's the same disease, the same image, three different farmers, five stages of the loop. Settings → "Agent skill level (demo)" persists the level across the whole app and changes the "Adapted for X" badge on the production Result screen.

To run an actual diagnosis: see the [README Quick start](../README.md#quick-start) for sideloading the model.

---

## Thanks

To the Gemma 4 Good Hackathon team for an excellent occasion to build something we will keep building. To the cooperative members who tolerated being persona-tested before the app existed. To the small Mac that did more than its RAM would suggest. And to the farmers we have not yet met who, we hope, will tell us what we got wrong.
