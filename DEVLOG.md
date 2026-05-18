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

## 2026-05-02 — v1.1 backlog: model interpretability (Grad-CAM)
- **Decision**: do NOT add Grad-CAM in v1. Logged here so it isn't lost.
- **Why deferred**:
  - The cheap implementation (Grad-CAM on a separately-trained EfficientNet-B0) is misleading — the heatmap shows what the *companion CNN* attended to, not what Gemma 4 actually used to diagnose. Calling that "model interpretability" to a farmer or a judge is dishonest.
  - The honest implementation (attention rollout on Gemma 4's vision encoder) is research-grade work — extract cross-attention from the vision projector, normalize, fold layer weights, project back to 14×14 patches. Days, not hours.
  - Neither runs on-device (Gemma 4 GGUF doesn't expose attention; llama.rn doesn't surface them either). Visualization is hub/cloud-only, eroding the offline-first pitch.
- **v1.1 plan**:
  - Attention-rollout path: when `react-native-llama` exposes attention tensors (open issue), wire a `services/attention.ts` that takes the post-inference rollout, resizes to image space, and overlays as a translucent jet colormap on `ResultScreen`. Hub-only at first; on-device when the binding allows.
  - Companion-CNN path is a no-go even in v1.1 unless we restructure to "CNN classifies → Gemma 4 explains." Then Grad-CAM on the CNN is honest because the CNN *is* the classifier.
- **What we ship in v1 instead** (today): minor `ResultScreen` polish — show the *cropped/resized image the model actually saw* (after `prepareForInference`) alongside the original, with a "What AI analyzed" caption. Honest, offline, no new dependencies.

## 2026-05-05 → 2026-05-16 — Simulator runnability + language correctness + demo prep

A two-week sprint focused on (a) making the app runnable end-to-end in the iOS Simulator for demo recording and (b) closing every language-leak bug we hit while testing.

### Simulator runnability
- **New Architecture** enabled in `app.json` (matches the working becanty config). Required because llama.rn now needs the new arch's bridgeless module.
- `expo-av` → `expo-audio` for new-arch compatibility. Voice memos (hypothesis card, follow-up replay) ported to the new API.
- `expo-file-system` legacy import for `documentDirectory` access (new SDK split the API).
- Camera fallbacks: Simulator silently no-ops the camera; users tap **🖼 From gallery** instead. Drag-drop or `xcrun simctl addmedia` lands sample images from `data/raw/<class>/` into Photos.
- LiteRT-LM smoke test screen (`LiteRTSmokeScreen`) gated behind `__DEV__` for binding probes.

### On-device model story
- `llama.rn` re-added with mmproj loader: `initLlama` then `initMultimodal({ path: mmprojLocalPath(), use_gpu: true })` so Metal-offloaded vision works on iOS. Falls back to text-only if mmproj load fails.
- 10-issue llama review applied: n_ctx bumped to 2048 (1024 truncated replies mid-generation → low confidence), `n_gpu_layers: 99` for Metal offload, Gemma 4 stop tokens (`<end_of_turn>`, `<eos>`) so the model doesn't ramble past the structured answer, 90 s completion timeout, auto-unload after 30 s idle to keep RSS under iPhone jetsam, `<think>/<reasoning>/<thought>` strip pass for Gemma 4 variants that emit reasoning blocks, dead Hugging Face URL paths removed.
- **Auto-download is intentionally disabled** — the previous HF path 404'd and silently wrote bad GGUFs. Models are sideloaded via Finder → iPhone → Files → PokouAI until we publish a public repo.
- Settings → **Model version** now shows on-device readiness (`✓ ready` / `⚠ not installed`) with a sideload hint when missing. The DiagnosisScreen no longer pre-checks model readiness or offers a download button — those phases were misleading because routing prefers the hub. Diagnosis is now: image → Analyze → analyzing (tier badge) → result.

### Ollama hub hardening
- Per-call timeout, exponential retry (500 ms × attempt), structured logging, `keep_alive` honored so the model stays warm between calls in a recording session, URL validation up-front (catches typo'd `http://`), `<think>` block stripping (Gemma 4 27B occasionally emits reasoning).

### Language correctness — the long tail
A series of bugs where French leaked into otherwise-English UI. Each fix below was driven by a real test session.
- **Prompts were forcing French output.** `data/prompts/diagnosis.json` now has `system_by_lang` + `user_by_lang` maps with proper English headers (`DISEASE:` / `SYMPTOMS:` / `TREATMENT:` / `PREVENTION:` / `AGRONOMIST:`). Response parser updated to accept either header set via `HEADER_ALIASES`.
- **Mock detected the wrong language.** `detectLang` checks French-marker phrases (`[FR→DYU`, `[FR→BCI`) first, then English signals (`DISEASE:`, `in English`, `Look at this cocoa pod`, `Respond ONLY in`, etc.), with French as the default.
- **Language change required app restart.** `setLanguage` now drops the cached `LlamaContext` via `unloadModel()` so the next diagnosis re-creates the mock closure against the new language.
- **Mock was always picking the same disease.** `mockDiagnosisText` now hashes the image path → picks one of `MOCK_DISEASES`, so flipping between sample images produces varied output.
- **Mock leaked the only hardcoded French string.** Response parser's fallback was `?? 'Non identifié'` — when the model output had no `DISEASE:` header, that French string was stored in the DB and rendered on Home (recent-diagnoses card) + Result (title) next to English `t(…)` labels. Parser now returns empty `diseaseName`; UI substitutes a localized label (`result.unidentified_short`). The LlamaService mock's defensive fallback dropped the hardcoded text too.
- **TTS section labels were French regardless of language.** `diagnosisToSpeech` builds section headers from the user's language; `SpeakButton` wires proper TTS callbacks (`onStart` / `onDone` / `onStopped` / `onError`).
- **i18next `pluralResolver` warning on every boot.** Hermes lacks `Intl.PluralRules`; `compatibilityJSON: 'v3'` skips the probe i18next does for v4. No plural keys in the locale files, so format choice is otherwise moot.

### Honest confidence + demo trust
- **Mock badge**: Result page renders a red `DEMO` chip when `modelVersion` ends in `-MOCK`. No more confusion between a real on-device result and the deterministic mock during recording.
- **Confidence estimator**: `estimateHubConfidence` counts which of the four section headers are present (`DISEASE` / `SYMPTOMS` / `TREATMENT` / `PREVENTION`), penalizes any "uncertain" / "non identifié" / "unidentified" tokens (cap 0.4), otherwise returns `0.6 + present × 0.35` (cap 0.95). Replaces the previous fixed 0.85.

### Dev tooling
- **Settings → Dev → 🗑 Clear all diagnoses** wipes both `loops` and `diagnoses` and resets `sqlite_sequence`. Wrapped in a native `Alert.alert` confirm (destructive button). Gated behind `__DEV__`. Use it before every demo take so the Home recent-diagnoses list starts empty.

### Docs
- `docs/demo.md` updated for the iOS Simulator path (no camera → gallery + `xcrun simctl addmedia`), the model-status pre-flight, and the clear-diagnoses pre-record step. The "French/English mix" troubleshooting row now references the parser fix and points at *Clear diagnoses* for pre-fix DB rows.
- `README.md` quick-start no longer promises an auto-download. It enumerates the three runnable paths: sideload, hub mode (the demo path), and simulator mock.
- `docs/personas/` added — short user-profile briefs used with the `persona-tester` skill during simulator audits.

## 2026-05-16 — LiteRT-LM wired into the local tier

- `services/LiteRTService.ts` added — lazy-imports `react-native-litert-lm@0.3.7`, exposes `diagnose` / `compareLocal` / `isModelReady` / `unloadModel` matching `LlamaService`'s shape so the router can swap them. Vision via `sendMessageWithImage`; `resetConversation()` runs per call so prior turns don't leak. 30 s auto-unload mirrors LlamaService.
- **Load policy**: prefer sideloaded `cocoa_v1_e2b.litertlm`, else the smoke-screen-downloaded upstream `gemma-3n-e2b-int4.litertlm`. No silent auto-download in the diagnose hot path — that stays an explicit one-time tap in *Settings → LiteRT smoke test* so a farmer offline doesn't get blocked on 1.3 GB.
- **Router** (`InferenceRouter.ts`): local tier is now "prefer LiteRT, fall back to llama.rn". `isLocalReady() = isLiteRTReady() || isLlamaReady()`. Inside `diagnoseLocal` / `compareLocal`, if LiteRT is on-disk we try it first; on any throw we fall through to llama.rn. The existing hub→cloud→local fallback chain is untouched.
- Settings model-readiness row now ORs both backends so the green ✓ fires when either has its file on-disk.
- Notebook `ml/notebooks/04_quantize_litert_lm.ipynb` still produces the fine-tuned `.litertlm` artifact; until that artifact ships, LiteRT runs the upstream Gemma 3n E2B INT4 base (quality on par with pre-fine-tune llama.rn).
- llama.rn stays on disk for now as the local-tier safety net. Removal can come once LiteRT has logged enough real-device runs.

## 2026-05-17 — Notebook 04 rewritten to use `litert-torch export_hf`

- **Correction of yesterday's notebook 04**: I had it routed through `ai-edge-torch` + `litert-lm-builder` because my source survey at the time hit the LiteRT-LM `/cli` docs page (silent on packaging) and concluded no public path existed for user fine-tunes. Wrong. Google's `models/gemma-4` docs (updated 2026-05-01) ship a "Deploy from Safetensors" section with `litert-torch export_hf` as the supported, one-command path from merged HF → `.litertlm`. The earlier dance (re-author Gemma 4 in PyTorch → quantize to TFLite via `ai-edge-torch` → repackage via `litert-lm-builder`) is obsolete and was failing on the Kaggle env (wheel-stripping + torchao ABI conflicts). Rewrote the notebook from 22 cells to 11.
- **New flow**: `pip install uv` → `uv tool install litert-torch-nightly litert-lm` → `litert-torch export_hf --model=<merged_dir> --output_dir=<out> --externalize_embedder --jinja_chat_template_override=litert-community/gemma-4-E2B-it-litert-lm` → smoke-test with `litert-lm run <path> --prompt=...` → download / sideload.
- **`--externalize_embedder` is non-optional for Gemma 4 E2B/E4B**: Per-Layer Embeddings tables are large; default inline-export either fails or produces a bundle that won't load in mobile RAM. This is the same root cause as the 900 MB GGUF problem in notebook 03's old GGUF artefact — llama.cpp's converter silently drops the PLE tables (upstream issue #22243). Skip GGUF for Gemma 4 entirely until that lands.
- **Multimodal carries automatically** through `export_hf` — it reads the vision tower from the merged safetensors directly. The standalone `cocoa_v1_e2b-mmproj.gguf` from the old GGUF flow is unused.
- **App side: no changes**. The 2026-05-16 wiring (`LiteRTService.ts`, router prefers LiteRT → falls back to llama.rn, smoke screen, Settings readiness row) all stands as-is; `react-native-litert-lm@0.3.7` already supports `sendMessageWithImage`. The fine-tune drops in as a sideloaded `cocoa_v1_e2b.litertlm` and the router picks it up over the upstream Gemma 3n base.
- **Validation must happen on a physical device** — iOS Simulator and x86_64 Android emulators don't run the AI Edge native engines. iPhone 15 Pro / Pixel 8+ for usable t/s on E2B.

## 2026-05-16 — REQ-002 opened (non-reader UI redesign)
- **Trigger**: persona walkthroughs revealed Aminata (Dioula non-reader) blocked on every screen today; Kouassi (Baoulé partial-literate) blocked on 12/13. App is text-heavy with emoji-as-icons.
- **REQ written** at [`.adlc/requirements/REQ-002-non-reader-redesign.md`](.adlc/requirements/REQ-002-non-reader-redesign.md) — 13-screen icon-first redesign (`lucide-react-native` locked), opt-in audio (Listen button), ≤2-word labels with documented 3-word exception escape hatch for dyu/bci. Hybrid success metric (persona-test gate + code-audit gate). 50 ms / 300 KB budgets.
- **Architect output** at [`REQ-002-design.md`](.adlc/requirements/REQ-002-design.md), tasks at [`REQ-002-tasks.md`](.adlc/requirements/REQ-002-tasks.md), eval at [`.adlc/evals/REQ-002/`](.adlc/evals/REQ-002/) — 5 primitives (Pictogram, ListenButton, IconAction, StatusBadge, SectionHeader), 52 tasks across 7 waves, critical path W0 → W1 → W4 → /validate.
- **Wave 0 baselines captured** for all 6 personas at SHA `49ca416` — Aminata 0/13 Pass, Kouassi 1/13, Ibrahim 4/13 (Result trust-break flagged), Adjoa 5/13, Priya 9/13, Yao 13/13.
- **Pre-Wave-1 defect fixes shipped** (caught by Yao + Priya baselines): missing `hub.model_cocoa_hint` / `hub.model_e2b_hint` keys added to en/fr/bci/dyu; dead `group.note_no_save` string now rendered in [GroupModeScreen](app/src/screens/GroupModeScreen.tsx).

## 2026-05-17 — REQ-002 rev 2 (Farmer Agent doc parked)
- **Trigger**: user rewrote [`docs/PokouAI_Future_of_Learning.md`](docs/PokouAI_Future_of_Learning.md) into a Farmer Agent + 5-skill + Two-Track architecture proposal.
- **Decision via /spec re-interview**: all 7 intersection questions converged on "park the agent for a future REQ — REQ-002 ships only the 'First Time' UI baseline." `IconAction.label` is designed to be cleanly toggleable so a future App Familiarity Flag REQ can swap labels off without component changes.
- **Two new assumptions logged** in [`ASSUMPTIONS.md`](.adlc/assumptions/ASSUMPTIONS.md): agent infra deferred to REQ-TBD; `IconAction.label` must remain optional.
- **Wave 1 scaffolding partial**: `react-native-svg@15.15.3` installed; Jest config + canary import test written; `lucide-react-native` + remaining Jest deps queued in `app/package.json` pending `pnpm install` in `app/`.

## 2026-05-18 — Farmer Agent demo prototype + Remotion post-production
- **Trigger**: user needed a video-ready demo of the Farmer Agent framework for hackathon reviewers within ~2 hours; REQ-002 Wave 1 paused.
- **Sample-data demo built** — [`app/src/data/skill_demo.json`](app/src/data/skill_demo.json) covers 5 flow stages (Onboard → Diagnose → Result → Day 7 → Lesson) × 3 skill levels (Novice / Practitioner / Expert) for one disease scenario (black pod, forest-edge plot, post-rain). Mirrors the "What Changes at Each Level" table from PokouAI_Future_of_Learning.md.
- **New screen** [`SkillDemoScreen.tsx`](app/src/screens/SkillDemoScreen.tsx) — stage stepper (5 chips, horizontal scroll) over a 3-level switcher. Tapping a stage or level re-renders every section with that combination. Agent-memory footer changes with level; scenario card stays constant for video continuity. Wired into navigation (`SkillDemo` route) and HomeScreen ("🎬 Farmer Agent — Skill demo" tile below Group Mode).
- **Remotion post-production project** at [`video/`](video/) — 3 compositions: `TitleOnly` (5 s portrait), `SkillComparison` (25 s landscape, three-panel novice/practitioner/expert with simulator clips), `PokouAISkillDemo` (90 s portrait master). Workflow: capture iOS-Simulator `.mov` clips → drop into `video/public/clips/` with named filenames → `pnpm render`. Remotion is *not* a screen recorder; it composes captured clips with title cards, captions, and side-by-side layouts.
- **Still hardcoded / mock** (explicit for reviewers): no skill tracker, no voice ASR for Farmer Speaks First, no Day-7 follow-up wired to real outcomes, no Knowledge Stack retrieval, no App Familiarity Flag. The demo shows the *framework*, not a running agent — stated in the screen's footer and the Remotion README.
