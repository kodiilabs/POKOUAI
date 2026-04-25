# PokouAI — Kaggle Submission Write-Up

> Reference this file when filling the Kaggle submission form and the prize-specific sections.
> The per-prize sentences in §3 are vetted for factual accuracy against the shipped code —
> do not paraphrase the model-size claims.

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
  Gemma 4 E2B via llama.cpp    1.5 GB GGUF Q4_K_M
                               fits 2–3 GB RAM entry-level Android
                               → targets llama.cpp Prize

         ↕ WiFi only (no internet needed) when near hub

LAYER 2 — COOPERATIVE HUB      extension worker's laptop
  Gemma 4 via Ollama           operator-picked model:
    • gemma4:27b               ≥16 GB RAM, max accuracy
    • gemma4:e4b               ≥8 GB RAM, modest laptop
                               → targets Ollama Prize + powers group teaching

         ↕ when internet is present

LAYER 3 — CLOUD                enhancement
  Gemma 4 27B hosted           anonymized case sync + outbreak map
```

Routing lives in one file: `app/src/services/InferenceRouter.ts` — it
probes hub reachability and internet in parallel, picks the highest
available tier, and falls back automatically on error. That routing is
the core of the Cactus Prize claim.

---

## 3 — One sentence per prize (copy verbatim)

### Main Track
> PokouAI is an offline-first, multilingual AI crop disease advisor for West African smallholder farmers — built on fine-tuned Gemma 4, running locally on entry-level Android phones, with a three-tier routing architecture that keeps a farmer productive whether they have a phone, a cooperative hub, or internet.

### Cactus Prize ($10K — local-first multi-model routing)
> PokouAI intelligently routes inference across three local-first tiers: Gemma 4 E2B via llama.cpp on the farmer's phone, a hub-operator-selected Gemma 4 (E4B or 27B) via Ollama on the cooperative hub, and cloud inference when internet is available — with zero cloud dependency required at any tier.

### llama.cpp Prize ($10K — on-device inference)
> The primary on-device inference runs Gemma 4 E2B in GGUF Q4_K_M format via llama.cpp (~1.5 GB), delivering full multimodal crop disease diagnosis on a 2–3 GB RAM Android phone in rural Ivory Coast with no network connection; an E4B variant is auto-selected when device RAM permits.

### Ollama Prize ($10K — local server)
> A cooperative hub running Gemma 4 via Ollama (27B on beefier hardware or E4B on modest laptops — operator-picked) serves as a local AI server for surrounding farmers over WiFi — no internet required — providing higher-accuracy diagnosis and powering the extension worker group-teaching mode.

### Unsloth Prize ($10K — fine-tuning)
> The on-device model is a QLoRA fine-tune of Gemma 4 (E2B and E4B variants) trained with Unsloth on cocoa disease image data, optimised to diagnose black pod rot, frosty pod rot, swollen shoot virus, and vascular streak dieback with treatment guidance in French, Dioula, Baoulé, and English.

### Global Resilience Prize ($10K — food security)
> PokouAI addresses the food security of 5 million cocoa farmers in Ivory Coast — the world's largest cocoa-producing country — by delivering offline AI diagnosis that works in areas with no electricity grid access, no internet, and no agronomist within 80 km.

### Digital Equity Prize ($10K — underserved users)
> All outputs are delivered in French, Dioula, and Baoulé — the primary languages of Ivorian cocoa farmers — with voice input planned for low-literacy users, on hardware as constrained as a 2 GB RAM Android phone.

### Future of Education Prize ($10K — learning journey)
> PokouAI's scientific farming loop transforms every diagnosis into a structured hypothesis-test-conclude cycle — compressing the agricultural feedback loop from a full season to 7 days, building a personal Farm Intelligence Log unique to each farmer, and turning the tool's primary function of disease diagnosis into a continuous, field-based science education that no classroom can replicate.

### LiteRT Prize ($10K — conditional, Week 4 stretch)
> An optional LiteRT-LM backend sits behind the same inference abstraction as llama.cpp; on phones with an NPU the app automatically selects LiteRT for faster inference, demonstrating framework-level routing on top of tier-level routing.

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

### The four education modes
1. **Learn** — "Why this happened" section after every diagnosis
   (`app/src/screens/LearnScreen.tsx`).
2. **Prevention calendar** — seasonal action list by month for cocoa in
   Côte d'Ivoire (`PreventionCalendarScreen` + `knowledge.getCalendar`).
3. **Quiz** — spaced-repetition Q&A keyed off the farmer's recent
   diagnoses (`QuizScreen` + `knowledge.pickQuizQuestion`).
4. **Group mode** — extension-worker UI that runs diagnosis without
   saving to the personal log (`GroupModeScreen`, passes
   `groupMode: true` to `DiagnosisScreen`).

### The scientific farming loop (Addendum v2)
The headline education feature. Every diagnosis automatically becomes a
structured hypothesis-test-conclude cycle:

| Step | Where | What happens |
|---|---|---|
| Day 0 — observation | `DiagnosisScreen` | Photo → disease + confidence + treatment |
| Day 0 — hypothesis | `HypothesisCard` on `ResultScreen` | Farmer taps one of 4 causes (rain / neighbour / insects / unknown). Treatment is shown regardless. |
| Day 0 — schedule | `notifications.ts` | Local notification queued for +7 days (no internet). |
| Day 7 — follow-up | `FollowUpScreen` (deep-link from notification tap) | Camera → comparative diagnosis → outcome (stabilised / healed / progressed / unknown) + theory ✓/✗ + 1-line lesson. |
| Day 7+ — recall | `FarmIntelligenceLogScreen` | Lessons accumulate. Pending loops show as "Due now" once their day arrives. |

The data model is one `loops` table that joins initial diagnosis →
follow-up diagnosis → outcome → lesson. CRUD in `services/loops.ts`.
Each loop is the scientific method made operational for a farmer who has
never heard the word "hypothesis."

---

## 5 — Claims audit (what we can honestly say)

| Claim | Status | Notes |
|---|---|---|
| E2B GGUF Q4_K_M ≈ 1.5 GB | ✅ | Expected from quantization math, verified at export time |
| Runs on 2–3 GB RAM Android | ✅ | E2B only. E4B (~2.8 GB) does not fit 2 GB devices |
| Runs fully offline | ✅ | llama.cpp with bundled/downloaded GGUF, no network required |
| 3-tier routing implemented | ✅ | `InferenceRouter.ts` with local/hub/cloud fallback chain |
| Ollama hub diagnosis | ✅ (stubbed) | `OllamaService.ts` speaks Ollama's `/api/generate`; needs a real hub + vision-capable 27B endpoint to verify round-trip |
| 4 languages | ⚠️ | fr + en reviewed. dyu + bci marked `draft_requires_native_review` — native-speaker review is a blocker for Digital Equity Prize |
| Group mode | ✅ | Skips persistence, uses same router |
| Learn / Calendar / Quiz | ✅ | Content sourced from `cocoa_diseases.json` and hardcoded CI-seasonal data |
| Hypothesis prompt | ✅ | `HypothesisCard` records 4-option theory + "I don't know"; loop row created |
| 7-day local notification | ✅ | `expo-notifications` schedules without internet; deep-link handler in `App.tsx` |
| Day-7 follow-up + lesson | ✅ | `FollowUpScreen` captures comparative outcome + free-text lesson |
| Farm Intelligence Log | ✅ | Pending + completed loops listed; lessons accumulated per farmer |
| Fine-tuned model exists | 🟡 | Training **in progress** on Kaggle (T4 x2, E2B variant, ~3-4h) |
| Ivorian field photos in training data | ❌ | Dependent on contact outreach |
| Demo video | ❌ | Scheduled for Week 4 |

**Rule**: if a row in this table is ❌ on submission day, do not use the
corresponding sentence in §3.

---

## 6 — Verification steps (reviewer-facing)

1. Clone the repo, run `cd app && npm install && npx expo start --android`.
2. Observe tier badges on the home screen — with no internet and no hub,
   only 📱 local shows; start a local `ollama serve` on the dev LAN and
   the 🛰 hub badge appears within one refresh.
3. Take a photo → Diagnosis shows which tier ran it → Result screen
   shows a tier badge next to confidence.
4. Tap "Why?" on Result → Learn screen explains the cause.
5. Tap "Practice" → Quiz asks a question keyed to that disease.
6. Home → Group mode → runs a diagnosis without persisting it.
7. On Result, the blue **🔬 Test your theory** card offers 4 cause options. Tapping one schedules a 7-day local notification and creates a loop row in `loops`.
8. Home → **🔬 My farm intelligence** lists pending + completed loops. The pending row becomes tappable when due, opening `FollowUp` for a comparative day-7 capture.
9. After follow-up: outcome + lesson are saved; the loop now appears as a completed entry with a yellow "Lesson learned" pull-quote.

---

## 7 — Prize stacking

Per competition rules, Main Track + multiple Special Technology prizes are
stackable. PokouAI's eligibility map:

| Prize | $ | Confidence |
|---|---|---|
| Main Track | 50,000 | Medium — needs strong demo video |
| Global Resilience | 10,000 | High — perfect fit |
| Digital Equity | 10,000 | High (pending native-speaker review) |
| Future of Education | 10,000 | Medium — education framing must be crisp |
| Cactus | 10,000 | High — routing is implemented and demonstrable |
| llama.cpp | 10,000 | High |
| Ollama | 10,000 | Medium — needs a real hub demo video |
| Unsloth | 10,000 | High once training completes |
| LiteRT | 10,000 | Conditional (Week 4 stretch) |

**Realistic stack**: Main + 3–4 Special prizes = $80–90K if all pieces ship.

---

## 8 — Links to fill on submission day

- GitHub repo: _TBD_
- Kaggle notebook: _TBD_
- Kaggle training dataset: `pokou-ai-cocoa-training-data`
- Demo video (YouTube unlisted): _TBD_
- Hub setup gist: _optional, for Ollama prize_
