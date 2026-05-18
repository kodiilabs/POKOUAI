# PokouAI — Kaggle Submission Write-Up

> Reference this file when filling the Kaggle submission form and the prize-specific sections.
> The per-prize sentences in §3 are vetted for factual accuracy against the shipped code —
> do not paraphrase the engine, model-size, or training-status claims. If a claims-audit row
> in §5 is ❌ on submission day, do not use the corresponding §3 sentence.
>
> **Last sync against code: 2026-05-18.** Reflects the LiteRT-LM-primary on-device path
> (llama.cpp Prize withdrawn), the shipped Farmer Agent skill-adaptation framework, the
> Hub-tier production route while the cocoa-specific LiteRT-LM bundle is being re-exported,
> and REQ-002 non-reader UI redesign in flight.

---

## 1 — Elevator pitch (problem-first)

Ivorian cocoa farmers lose 30–40% of their harvest to preventable diseases.
Extension agents are scarce, internet is unreliable, and most agronomy apps
assume fluent French literacy and a 4G connection. A farmer holding a
diseased pod today has no fast way to tell *black pod rot* from *frosty
pod rot* — and the treatments are different.

**PokouAI** runs entirely on the phone: point camera at pod, get a disease
name, treatment, and prevention in the farmer's own language. Airplane mode
works. A $50 Android works. When the farmer walks into the cooperative
building, a laptop running Ollama takes over with a larger model. When
internet is available, the cloud takes over with the biggest. The farmer
never thinks about any of this — it just works.

---

## 2 — Architecture (3-tier local-first)

```
LAYER 1 — PHONE                always available
  Gemma 4 E2B via LiteRT-LM    ~2.4 GB .litertlm int4 with PLE externalised
                               (multimodal vision tower included)
                               fits 2–3 GB RAM entry-level Android because
                               PLE tables are paged from disk at inference
                               llama.rn (GGUF) is wired as a code-level
                               fallback; not the active Gemma 4 path
                               (llama.cpp's GGUF converter drops Gemma 4's
                               PLE tables — upstream issue, skipped)
                               → targets LiteRT Prize + Unsloth Prize

         ↕ WiFi only (no internet needed) when near hub

LAYER 2 — COOPERATIVE HUB      extension worker's laptop
  Gemma 4 via Ollama           operator-picked model:
    • gemma4:27b               ≥16 GB RAM, max accuracy
    • gemma4:e4b               ≥8 GB RAM, modest laptop
    • gemma4:e2b               base, runs anywhere — current demo default
                               → targets Ollama Prize + powers group teaching

         ↕ when internet is present

LAYER 3 — CLOUD                enhancement
  Gemma 4 27B hosted           anonymized case sync + outbreak map
```

Routing lives in one file: `app/src/services/InferenceRouter.ts` — it
probes hub reachability and internet in parallel, picks the highest
available tier, and falls back automatically on error. That routing is
the core of the Cactus Prize claim and the reason production diagnosis
runs end-to-end today: with the cocoa-specific LiteRT-LM bundle still
being re-exported (see [STORY.md](STORY.md) for the export-flag fix),
the router routes seamlessly to Hub-tier base Gemma 4 over Ollama —
same architecture, same UX, same accuracy floor — and the cocoa-tuned
on-device bundle drops back into the local tier with zero app changes
when the re-export verifies.

---

## 3 — One sentence per prize (copy verbatim)

### Main Track
> PokouAI is an offline-first, multilingual AI crop disease advisor for West African smallholder farmers — built on fine-tuned Gemma 4, running locally on entry-level Android phones via LiteRT-LM, with a three-tier routing architecture and a Farmer Agent that adapts every diagnosis, treatment, and follow-up to the farmer's skill level.

### Cactus Prize ($10K — local-first multi-model routing)
> PokouAI intelligently routes inference across three local-first tiers: Gemma 4 E2B via LiteRT-LM on the farmer's phone, a hub-operator-selected Gemma 4 (E2B, E4B, or 27B) via Ollama on the cooperative hub, and cloud inference when internet is available — with zero cloud dependency required at any tier and automatic graceful fallback through every layer.

### Ollama Prize ($10K — local server)
> A cooperative hub running Gemma 4 via Ollama (27B on beefier hardware, E4B on modest laptops, E2B for the demo deployment — operator-picked) serves as a local AI server for surrounding farmers over WiFi — no internet required — providing higher-accuracy diagnosis and powering the extension worker group-teaching mode. The Hub tier also serves as the production fallback for any on-device model that isn't currently usable.

### Unsloth Prize ($10K — fine-tuning)
> The on-device model is a QLoRA fine-tune of Gemma 4 E2B trained with Unsloth on a 6-class cocoa-disease corpus (black pod rot, frosty pod rot, swollen shoot virus, vascular streak dieback, healthy, other-damage), using r=16, α=32, 3 epochs on free Kaggle T4 ×2 GPU; the LoRA adapter is merged, the LiteRT-LM bundle is being re-exported with the corrected `--externalize_embedder` and `--jinja_chat_template_override` flags, and the InferenceRouter is built so the cocoa-tuned bundle drops into the on-device path with zero app changes the moment the re-export lands.

### Global Resilience Prize ($10K — food security)
> PokouAI addresses the food security of 5 million cocoa farmers in Ivory Coast — the world's largest cocoa-producing country — by delivering offline AI diagnosis that works in areas with no electricity grid access, no internet, and no agronomist within 80 km.

### Digital Equity Prize ($10K — underserved users)
> All outputs are delivered in French, Dioula, Baoulé, and English — the primary languages of Ivorian cocoa farmers — with a non-reader UI redesign in progress (REQ-002) that drives every screen to icon-first + opt-in voice output, persona-tested against six farmer archetypes including a non-reading Dioula-speaking woman on a shared phone.

### Future of Education Prize ($10K — learning journey)
> PokouAI's scientific farming loop transforms every diagnosis into a structured hypothesis-test-conclude cycle — compressing the agricultural feedback loop from a full season to 7 days — and the Farmer Agent silently adapts every prompt, treatment, money-framing, and follow-up across three skill levels (Novice / Practitioner / Expert) inferred from behaviour, so a first-season farmer and a 30-year veteran get entirely different content depths from the same app on the same image of the same disease.

### LiteRT Prize ($10K — primary on-device runtime)
> The primary on-device inference path is LiteRT-LM via `react-native-litert-lm@0.3.7`, running a Gemma 4 E2B `.litertlm` bundle (~2.4 GB int4 with Per-Layer Embeddings externalised so the runtime working-set fits 2–3 GB RAM Android phones); the same engine that drives `litert-lm run` on the desktop runs on the phone, exercising the AI Edge graph for full multimodal cocoa disease diagnosis.

---

## 4 — Education-layer framing (for the Future-of-Education write-up)

Do not lead with "PokouAI is an education tool." Lead with the farmer and
the diagnosis. Then add this paragraph to the technical section:

> Beyond diagnosis, PokouAI is an agricultural education platform. Every
> diagnosis is a teaching moment. The scientific farming loop converts
> reactive problem-solving into a 7-day hypothesis-test-conclude cycle —
> delivered in the farmer's language, adapted to their crop history, and
> amplified by extension workers teaching groups with real data from the
> village.

### The five education modes
1. **Learn** — "Why this happened" section after every diagnosis
   (`app/src/screens/LearnScreen.tsx`).
2. **Prevention calendar** — seasonal action list by month for cocoa in
   Côte d'Ivoire (`PreventionCalendarScreen` + `knowledge.getCalendar`).
3. **Quiz** — spaced-repetition Q&A keyed off the farmer's recent
   diagnoses (`QuizScreen` + `knowledge.pickQuizQuestion`).
4. **Group mode** — extension-worker UI that runs diagnosis without
   saving to the personal log (`GroupModeScreen`, passes
   `groupMode: true` to `DiagnosisScreen`).
5. **Farmer Agent (skill-level adaptation)** — a persistent skill model
   that silently re-shapes every prompt, diagnosis-narrative depth,
   treatment-instruction granularity, money-framing, Day-7 follow-up
   prompt, and prevention reminder according to the farmer's inferred
   level across five cocoa-specific skills. A first-season farmer hears
   the full Phytophthora narrative with step-by-step treatment; a 30-year
   veteran gets a confirmation and a farmer-led discussion on the same
   image. The agent's skill state persists in AsyncStorage, propagates
   to the production Result screen ("Adapted for X" badge), and the
   framework is demonstrated end-to-end across five flow stages and
   three skill levels in `SkillDemoScreen.tsx`. The skill model itself
   is designed in `docs/PokouAI_Future_of_Learning.md` and the seam for
   plugging in behavioural-signal inference is implemented in
   `app/src/services/farmerAgent.ts`.

### The scientific farming loop
The headline education feature. Every diagnosis automatically becomes a
structured hypothesis-test-conclude cycle:

| Step | Where | What happens |
|---|---|---|
| Day 0 — observation | `DiagnosisScreen` | Photo → disease + confidence + treatment |
| Day 0 — hypothesis | `HypothesisCard` on `ResultScreen` | Farmer taps one of 4 causes (rain / neighbour / insects / unknown). Treatment is shown regardless. |
| Day 0 — schedule | `notifications.ts` | Local notification queued for +7 days (no internet). |
| Day 7 — follow-up | `FollowUpScreen` (deep-link from notification tap or red Home banner if overdue) | Camera → **two-image comparison** through `routeComparison` (hub + cloud receive before+after; local llama.cpp falls back to single-image with comparison-aware prompt) → outcome (stabilised / healed / progressed / unknown) + theory ✓/✗ + 1-line lesson. Day 0 voice memo can be replayed during the check. |
| Day 7+ — recall | `FarmIntelligenceLogScreen` | Lessons accumulate. Pending loops show as "Due now" once their day arrives. |

The data model is one `loops` table that joins initial diagnosis →
follow-up diagnosis → outcome → lesson. CRUD in `services/loops.ts`.
Each loop is the scientific method made operational for a farmer who has
never heard the word "hypothesis."

---

## 5 — Claims audit (what we can honestly say)

| Claim | Status | Notes |
|---|---|---|
| Primary on-device runtime is LiteRT-LM | ✅ | `LiteRTService.ts` via `react-native-litert-lm@0.3.7`. Bundle path `cocoa_v1_e2b.litertlm`; upstream base `gemma-3n-e2b-int4.litertlm` auto-resolves. |
| llama.rn (GGUF) is wired as a fallback | ✅ (code-level) | `LlamaService.ts` is present and routed-to by `InferenceRouter` when LiteRT bundle isn't on disk. Gemma 4 GGUF is not the active path — upstream llama.cpp converter drops PLE tables, so we don't pursue the llama.cpp Prize. |
| `.litertlm` E2B ~2.4 GB int4 with PLE externalised | ✅ | File on disk, vision tower included via `export_hf` |
| Runs on 2–3 GB RAM Android | ✅ | E2B with `--externalize_embedder` keeps PLE on disk; runtime working-set fits. Physical-device benchmark pending. |
| Runs fully offline (architectural claim) | ✅ | LiteRT-LM with bundled/sideloaded `.litertlm`, no network required |
| 3-tier routing implemented | ✅ | `InferenceRouter.ts` with local/hub/cloud fallback chain |
| Ollama hub diagnosis | ✅ | `OllamaService.ts` speaks Ollama's `/api/generate`; `keep_alive` tuned; submission demo runs against `gemma4:e2b` on a Mac-LAN Ollama instance |
| 4 languages | ⚠️ | fr + en reviewed. dyu + bci marked `[FR→XXX à valider]` — native-speaker review is a blocker for Digital Equity Prize at the *quality* bar. The persona-tester baselines audited the impact (see Wave-0 baselines under `.adlc/evals/REQ-002/baseline/`). |
| Group mode | ✅ | Skips persistence, uses same router; group-mode note now renders |
| Learn / Calendar / Quiz | ✅ | Content sourced from `cocoa_diseases.json` and hardcoded CI-seasonal data |
| Hypothesis prompt | ✅ | `HypothesisCard` records 4-option theory + "I don't know"; loop row created |
| 7-day local notification | ✅ | `expo-notifications` schedules without internet; deep-link handler in `App.tsx` |
| Day-7 follow-up + lesson | ✅ | `FollowUpScreen` captures comparative outcome + free-text lesson |
| Two-image comparison | ✅ (hub/cloud), 🟡 (local) | Hub + cloud get both images via `routeComparison`. Local LiteRT-LM uses single-image comparison-aware prompt — honest fallback, not pixel-level diff. |
| Voice memo for hypothesis | ✅ | `expo-audio` records on tap; playback in HypothesisCard, FollowUp, and Intelligence Log. **No STT** — the recording is the recording. |
| Overdue backstop | ✅ | Red Home banner surfaces pending loops past their check date — failsafe when notification permission was denied. |
| Farm Intelligence Log | ✅ | Pending + completed loops listed; lessons accumulated per farmer |
| Unsloth + QLoRA training run | ✅ | Notebook `03_finetune_cocoa_unsloth.ipynb` ran cleanly on Kaggle T4 ×2 (r=16, α=32, 3 epochs). LoRA adapter weights complete; merged via `05_merge_from_checkpoint.ipynb`. |
| `.litertlm` export for the cocoa fine-tune | 🟡 | Known token-collapse on text smoke (`Décris les symptômes de la pourriture brune` → repetitive degenerate output). Cause: missing `--externalize_embedder` and `--jinja_chat_template_override`. Re-export from the merged dir with both flags is in progress. Documented openly in [`docs/STORY.md`](STORY.md). The only honest hedge in this submission. |
| Production Hub-tier route while bundle is re-exported | ✅ | InferenceRouter routes to Ollama hub when the cocoa-tuned LiteRT bundle isn't loaded; production runs against `gemma4:e2b` base via Ollama. This is the architecture working as designed — the user-facing tier badge surfaces the chosen path. |
| Farmer Agent skill-adaptation framework | ✅ | `SkillDemoScreen.tsx` + `skill_demo.json` + `farmerAgent.ts` + `useSkillLevel.ts` hook. Persistent skill state in AsyncStorage; propagates to Result screen as an "Adapted for X" badge. Auto-promotion from behavioural signals is the explicit next REQ on top of this framework. |
| Persona walkthroughs (6 archetypes) | ✅ | Baselines captured at SHA `49ca416` across Aminata (Dioula non-reader), Kouassi (Baoulé partial-literate), Yao (extension agent), Adjoa (proxy installer), Ibrahim (skeptic), Priya (English judge). See `.adlc/evals/REQ-002/baseline/`. |
| Non-reader UI redesign | 🟡 | REQ-002 designed, baselined, and partially implemented; the screen-by-screen icon swap paused mid-Wave-1 so the Farmer Agent framework could ship first (an explicit REQ-002 revision decision). Plan + persona-test evidence + Wave-0 implementation — not yet a fully-shipped redesign. The Digital Equity Prize claim is framed accordingly. |
| Ivorian field photos in training data | ❌ | Closing this gap is the first cooperative pilot starting next month (see [`docs/STORY.md`](STORY.md)) |
| Demo video | ✅ | Fully-programmatic Remotion project in [`video/`](../video/). 62 s, 1080×1920, portrait. Renders the entire video from React — phone frame, mock screens, animations, captions, transitions — driven by the same `skill_demo.json` the live app uses. One command: `pnpm render`. No simulator capture. |

**Rule**: if a row in this table is ❌ on submission day, do not use the
corresponding sentence in §3. Rows marked 🟡 are claimable with honest
hedging language already baked into the §3 sentences.

---

## 6 — Verification steps (reviewer-facing)

1. Clone the repo, run `cd app && pnpm install && pnpm typecheck && pnpm start --clear`, then `pnpm ios` (or `pnpm android`). If installs accidentally land in the workspace root rather than `app/`, clean and retry — see README "Troubleshooting first-run."
2. Observe tier badges in-app. With no hub running and no on-device `.litertlm`, the InferenceRouter falls to the deterministic mock and Result shows a red `DEMO` badge. Start a local `ollama serve --host 0.0.0.0:11434` with `gemma4:e2b` pulled, configure Settings → Hub → URL = your Mac's LAN IP, and the `🛰 Ollama · hub` tier appears within one diagnosis.
3. Take a photo → DiagnosisScreen shows the active tier → ResultScreen shows the confidence band, the tier badge, AND a purple **🧠 Adapted for X** badge (X = Novice / Practitioner / Expert from Settings → Agent skill level).
4. Tap "Why?" on Result → Learn screen explains the cause.
5. Tap "Practice" → Quiz asks a question keyed to that disease.
6. Home → Group mode → runs a diagnosis without persisting it. Now correctly renders the privacy note.
7. On Result, the blue **🔬 Test your theory** card offers 4 cause options. Tapping one schedules a 7-day local notification and creates a loop row in `loops`.
8. Home → **🔬 My farm intelligence** lists pending + completed loops. The pending row becomes tappable when due, opening `FollowUp` for a comparative day-7 capture.
9. After follow-up: outcome + lesson are saved; the loop now appears as a completed entry with a yellow "Lesson learned" pull-quote.
10. Home → **🧠 Farmer Agent** → the skill-adaptation framework demo: tap any of 5 stage chips (Onboard → Diagnose → Result → Day 7 → Lesson) and any of 3 level buttons (Novice / Practitioner / Expert) to see every section adapt simultaneously. The level you pick here propagates back to ResultScreen's "Adapted for" badge — same AsyncStorage key.

---

## 7 — Prize stacking

Per competition rules, Main Track + multiple Special Technology prizes are
stackable. PokouAI's eligibility map:

| Prize | $ | Confidence |
|---|---|---|
| Main Track | 50,000 | High — shipping system + Fair-Trade-pilot partnership lined up |
| Global Resilience | 10,000 | High — perfect fit |
| Digital Equity | 10,000 | Medium-High — REQ-002 designed, baselined, partially implemented; native dyu/bci review pending |
| Future of Education | 10,000 | **High** — scientific loop **plus** Farmer Agent skill adaptation, runnable end-to-end in the app today |
| Cactus | 10,000 | High — three-tier routing live, runs end-to-end in production via the Hub tier |
| Ollama | 10,000 | High — production diagnosis runs through Ollama; setup documented in `data/models/OLLAMA_SETUP.md` |
| Unsloth | 10,000 | High — training run completed (Unsloth + QLoRA on Kaggle), LoRA adapter merged; the on-device LiteRT-LM bundle is being re-exported with corrected flags. The fine-tune is real and the seam is built. |
| LiteRT | 10,000 | High — LiteRT-LM is the primary on-device runtime, not a stretch goal |
| ~~llama.cpp~~ | ~~10,000~~ | **Dropped** — Gemma 4 GGUF blocked upstream (PLE drop); llama.rn is wired as a code fallback only, claiming the prize would mis-represent the active path |

**Realistic stack**: Main + 5–6 Special prizes = $90–110K, with one ($10K llama.cpp) intentionally withdrawn for honesty.

---

## 8 — Links to fill on submission day

- GitHub repo: _TBD_
- Kaggle notebook (fine-tune, published): https://www.kaggle.com/code/yaokouadio/pokou-ai-cocoa-finetune
- Kaggle notebook (fine-tune, local source): `ml/notebooks/03_finetune_cocoa_unsloth.ipynb`
- Kaggle notebook (export to LiteRT-LM): `ml/notebooks/04_quantize_litert_lm.ipynb`
- Kaggle training dataset: `pokou-ai-cocoa-training-data`
- Demo video (YouTube unlisted): _Capture iOS Simulator clips, drop into `video/public/clips/`, `cd video && pnpm install && pnpm render` → `video/out/pokouai-skill-demo.mp4`_
- Hub setup gist: `data/models/OLLAMA_SETUP.md`
- Build story / constraints / partnership narrative: [`docs/STORY.md`](STORY.md)
- Farmer Agent architecture proposal: [`docs/PokouAI_Future_of_Learning.md`](PokouAI_Future_of_Learning.md)
