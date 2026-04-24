# PokouAI — Development Log

## 2026-04-21 — Project scaffold
- Initialized repo structure: `app/`, `ml/`, `data/`, `docs/`
- Wrote `cocoa_diseases.json` with 5 classes (black pod, frosty pod rot, swollen shoot, vascular streak dieback, healthy) × 4 languages
- Scaffolded Expo + TypeScript app with all 6 screens and navigation
- Drafted `LlamaService.ts`, `promptBuilder.ts`, `db.ts`, `SyncService.ts`
- Added i18n with `fr.json`, `dyu.json`, `bci.json`, `en.json`
- Wrote ML scripts: `prepare_training_data.py`, `augment_images.py`, `build_training_jsonl.py`
- Added `03_finetune_cocoa_unsloth.ipynb` notebook stub (QLoRA r=16, α=32, 3 epochs)
- README, LICENSE (Apache 2.0), PRIVACY_POLICY published

**Next**: download datasets (PlantVillage, CGIAR, IITA), contact Ivorian farmer for 20–30 field photos, get Gemma 4 license accepted on HuggingFace.

## 2026-04-22 — Switch primary model to E2B
- Flipped on-device primary from Gemma 4 E4B → **E2B**. Reason: target phone is 2–3 GB RAM; E4B Q4_K_M (~2.8 GB) leaves no headroom for OS + camera. E2B Q4_K_M (~1.5 GB) fits with margin. Expected accuracy tradeoff: ~75–80% vs >80% target; acceptable on narrow 6-class domain.
- Fine-tune notebook now parameterized on `VARIANT = 'e2b' | 'e4b'` — same pipeline trains both, outputs separate GGUFs. Default is E2B.
- Notebook Section 2: try `google/gemma-4-{variant}-it` directly; fall back to `unsloth/gemma-4-{variant}-it-bnb-4bit` only on load failure. Gemma 4 weights are public (Gemma Terms of Use) — no click-through gating.
- App-side: `LlamaService` points at `cocoa_v1_e2b.gguf`, `MODEL_SIZE_MB = 1500`; `DiagnosisScreen` download label derived from the constant.
- README + `.claude.md` updated to reflect E2B primary / E4B premium split.

## 2026-04-23 — Addendum v1: 3-tier routing + education layer
- **Architecture**: added Ollama hub tier between on-device and cloud. New modules: `NetworkService` (hub + internet probes), `OllamaService` (Ollama `/api/generate` with image base64), `CloudService` (cloud endpoint stub), `InferenceRouter` (picks highest-available tier, falls back on error). `DiagnosisScreen` now calls the router instead of `diagnose()` directly; chosen tier is surfaced live in the progress panel.
- **DB**: added `tier` column to `diagnoses`, additive migration for existing installs; Result screen shows a dark tier badge alongside the confidence band.
- **Hub config**: new `HubSettingsScreen` + row in Settings. Hub URL in `preferences.ts` (default `http://192.168.1.100:11434`); on save we probe `/api/tags` and report reachable/unreachable.
- **Education layer (4 screens)**: `LearnScreen` (cause + contributing + next-season), `PreventionCalendarScreen` (7-month cocoa-CI calendar, fr/en), `QuizScreen` (disease-keyed questions with keyword scoring), `GroupModeScreen` (extension worker UI, sets `groupMode: true` so diagnosis skips personal-log persistence). `Home` got a Learn section + group-mode CTA; `Result` got "Why?" and "Practice" buttons.
- **Knowledge**: new `services/knowledge.ts` sources `cocoa_diseases.json` for causes and ships a hardcoded Ivorian seasonal calendar + quiz bank.
- **i18n**: new keys (`tier.*`, `hub.*`, `learn.*`, `calendar.*`, `quiz.*`, `group.*`, `home.learn_section`, `home.group_mode*`, `result.learn_more`, `result.practice`) added to fr + en. dyu/bci carry the same keys with `[FR→*]` markers — native review remains a blocker for the Digital Equity prize claim.
- **Docs**: new `docs/PokouAI_Submission_WriteUp.md` with architecture diagram, per-prize one-sentence blurbs, and a **claims audit** table distinguishing what we can factually say today vs. what's still pending (training, field photos, demo video, native review). README + `.claude.md` reflect the 3-tier architecture + education layer.

### Honesty note on the addendum's A5 claims
The addendum's A5 llama.cpp-prize snippet says "E4B on a 2 GB RAM Android." That is not factually defensible for Q4_K_M (~2.8 GB model + overhead). The shipped default is E2B (~1.5 GB); the submission write-up updates the snippet to reflect what's actually running, with the E4B variant as the auto-selected premium on ≥4 GB phones. Pre-submission review must keep that distinction intact — inaccurate claims against a working prototype are worse than the smaller model.

### Later 2026-04-23 — Hub model is operator-configurable
- Decision: on-device stays E2B. Hub runs **E4B or 27B** depending on what the cooperative's laptop can host — not every hub operator has a 16 GB RAM machine.
- `preferences.ts` gains `getHubModel/setHubModel` + `HUB_MODEL_OPTIONS = ['gemma4:27b', 'gemma4:e4b']`, default 27B.
- `OllamaService` reads the preference on every call and tags `modelVersion` as `ollama/<model>` so the Result screen and submitted telemetry show which tier *and* which hub model answered.
- `HubSettingsScreen` has a radio-style picker with RAM hints; the install snippet's `ollama pull` line reflects the current choice.
- Submission write-up + Cactus/Ollama prize blurbs updated to reflect the operator-picked hub model (no hardcoded 27B claim).
