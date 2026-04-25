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

## 2026-04-23 — Pipeline run + Kaggle dataset upload
- Local pipeline ran cleanly: `prepare_training_data.py` → `augment_images.py` → `build_training_jsonl.py`.
- Two albumentations API breaks fixed in `augment_images.py`: `ImageCompression(quality_lower/upper)` → `quality_range=(min, max)`, and `RandomResizedCrop(height, width)` → `size=(h, w)`. Pinned versions in requirements would have prevented this; opting against pinning since Kaggle gives a fresh env anyway.
- `build_training_jsonl.py` was emitting absolute Mac paths — fatal on Kaggle. Switched to relative paths (`relative_to(images_root)`); the notebook's `to_chat` cell now resolves them against `DATA_ROOT` (the Kaggle mount). Re-ran the script after the fix; dataset on Kaggle as `pokou-ai-cocoa-training-data`.
- Kaggle CLI: new auth flow uses `KAGGLE_API_TOKEN` env var (`KGAT_…`) instead of `~/.kaggle/kaggle.json`. Documented in commit messages but not added to README — it's a transient client-side detail that may revert.
- E2B fine-tune now running on Kaggle T4 x2 (~3–4h ETA).

## 2026-04-24 — Addendum v2: scientific farming loop
- New product layer: every diagnosis becomes a 7-day hypothesis → test → conclude → lesson cycle. Reframes Future-of-Education prize from "education layer" to "scientific method made operational."
- **Schema**: new `loops` table joining initial + follow-up diagnoses, with `hypothesis_category`, `hypothesis_note`, `scheduled_for`, `notification_id`, `outcome`, `hypothesis_confirmed`, `lesson`, `completed_at`. Indexes on `scheduled_for` and `completed_at`. Composed inside the existing `initDb` transaction; no migration needed for fresh installs.
- **Services**: `loops.ts` (createLoop / setHypothesis / completeLoop / list*); `notifications.ts` wraps `expo-notifications` with `scheduleFollowUpReminder` (7-day fixed delay, Android channel `followup`, deep-link payload `{kind:'followup', loopId}`). Permission requested lazily on first hypothesis pick.
- **UI**:
  - `components/HypothesisCard.tsx` — inline blue card on `ResultScreen`. 4 tappable options + "I don't know"; on pick it schedules notification, creates the loop, records the hypothesis, and collapses into a green confirmation showing the next-check date.
  - `FollowUpScreen` — deep-linked from the notification (or tapped from the intelligence log when overdue). Side-by-side before/now thumbnails, optional comparative re-diagnosis through the existing `routeInference`, outcome buttons, theory ✓/✗ toggle, lesson textarea, "save to log" CTA.
  - `FarmIntelligenceLogScreen` — pending loops on top (overdue ones get a red border), completed loops below with the lesson pull-quoted in a yellow "Lesson learned" box. Cards show whether the farmer's hypothesis was confirmed.
  - `HomeScreen` — added a blue **🔬 My farm intelligence** tile.
  - `App.tsx` — `useRef<NavigationContainerRef>` + `Notifications.addNotificationResponseReceivedListener` so a notification tap routes straight to `FollowUp(loopId)`.
- **i18n**: full keys for `hypothesis.*`, `followup.*`, `intel.*`, `home.intel_log/sub` in fr + en. dyu/bci stubbed with `[FR→*]` markers.
- **Dependencies**: `expo-notifications ~0.28.0` added to `app/package.json`. User must run `npm install` and grant notification permission on first hypothesis tap; on iOS a TestFlight build is needed for real-device push (simulator works for dev).
- **Docs**: `docs/PokouAI_Addendum_v2.md` saved verbatim. Future-of-Education prize blurb in the submission write-up replaced with the addendum's "scientific farming loop" sentence. Verification steps 7–9 added covering the loop end-to-end. Claims-audit table now lists the loop pieces (all ✅) and downgrades fine-tuned-model from ❌ to 🟡 (in progress).
- **Limitations**:
  - Voice input for hypothesis ("Farmer answers by voice") is **not yet wired** — taps only for v1. `react-native-whisper` was already planned for v1.1; voice will plug into the same `setHypothesis` call.
  - The day-7 comparative diagnosis just runs a fresh inference on the new photo; there is no actual model-level comparison of the two images yet. The UI shows side-by-side thumbnails so the farmer can compare visually, and the model independently diagnoses the new photo. A true diff prompt is a Week-4 stretch.
  - Notification permission is platform-dependent; if the user denies it, `HypothesisCard` falls back to creating the loop without a scheduled notification and the user has to find it via the intelligence log.

## 2026-04-24 — Closed the three honest gaps from the previous commit
Same day as Addendum v2; this addresses the limitations explicitly.

- **Voice memo for hypothesis** (closes gap #1, partial). `expo-av` (~14.0.0) added; `services/voice.ts` wraps `Audio.Recording` and `Audio.Sound`. `HypothesisCard` gains a 🎙 record / ⏹ stop toggle next to the 4 theory tiles; the recorded URI is saved on `loops.hypothesis_audio_uri`. Playback button on the card once a memo exists, replay button in `FollowUpScreen`, audio pill on completed Intelligence Log entries. **No STT** — the recording is the artefact (offline-honest). Whisper transcription remains v1.1; when it lands it can populate `hypothesis_note` from the audio.
- **Two-image comparison** (closes gap #2). New `buildComparisonPrompt` (two images, structured EVOLUTION/COMMENTAIRE/ACTIONS/LECON output) + `buildComparisonPromptSingle` (one image, comparison-aware text only). New `compareLocal` / `compareViaHub` / `compareViaCloud`; new `routeComparison` mirrors `routeInference` with the same fallback chain. Hub and cloud receive both base64 images; local llama.cpp falls back to single-image because the current React Native llama bindings only accept one `image_path` per completion (not a model limitation, an SDK one). `FollowUpScreen` now calls `routeComparison(beforeUri, afterUri, lang, diseaseName)` instead of independent inference; the comparison text shows in a blue "🔬 PokouAI compares the two photos" box and is persisted to `loops.comparison_response`. The follow-up no longer creates a separate diagnosis row — the comparison IS the day-7 output.
- **Overdue backstop banner** (closes gap #3). `HomeScreen` fetches `listPendingLoops()` and filters by `scheduledFor <= now`. Any overdue loop renders a red banner above the camera tile that deep-links into `FollowUp` for the oldest. This means even if notification permission was denied, the farmer is reminded as soon as they open the app on or after day 7.
- **Schema**: additive migrations for two new columns on `loops` — `hypothesis_audio_uri TEXT NULL`, `comparison_response TEXT NULL`. Wrapped in try/catch so existing installs don't trip on duplicate-column errors.
- **i18n**: full keys for `hypothesis.start_voice / stop_voice / play_voice`, `followup.ai_compare / compare_failed / play_hypothesis_audio`, `home.overdue_title / overdue_body`, `intel.play_voice` in fr + en. dyu/bci stubbed with `[FR→*]` markers.

**Honest caveats** (nothing in the addendum is now ❌; these are the residual ones):
- Local-tier comparison isn't a true two-image diff. It's the same text-prompt pattern with comparison framing, fed only the day-7 image. The UI presents side-by-side thumbnails so the *farmer* still does the visual comparison; the model output supplements but doesn't replace human judgment. When the React Native llama binding gains multi-image support (`react-native-llama` 0.5+ has it on the roadmap) this becomes a one-line change.
- Voice memos are saved but not yet synced to the cloud or transcribed. Offline-only for now. Storage is `expo-file-system` document directory.
- The cloud `/v1/compare` endpoint (`api.pokou.ai/v1/compare`) is referenced in `CloudService` but does not exist server-side yet. If cloud is the chosen tier and the call 404s, the router falls back to local single-image comparison.

## 2026-04-25 — Folded the v2 addendum into the project spec
- Deleted `docs/PokouAI_Addendum_v2.md`. Its content now lives where it should have lived from day one:
  - `PokouAI_Project_Documentation.md` §2 (loop in solution overview), §3 (judging axis), §6 (new "7-Day Scientific Farming Loop" subsection), §10 (FollowUp + IntelligenceLog screens), §13 (folder structure), §16 (demo storyboard beats), §17 (submission template).
  - `PokouAI_Implementation_Checklist.md` Week 3 (loop sections, education layer, 3-tier router) and Week 4 (manual loop end-to-end test).
  - `README.md` and `.claude.md` lost the "(Addendum v2)" parenthetical; the loop is now referenced as the core product.
- DEVLOG entries from 2026-04-24 stay verbatim — they record the actual history. The submission write-up keeps its claims-audit table.
