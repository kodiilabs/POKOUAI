# PokouAI — AI Crop Disease Advisor for West African Smallholder Farmers

> **Gemma 4 Good Hackathon Submission — Built for Ivory Coast, Designed for Africa**
>
> *A multimodal, offline-first, multilingual AI advisor that diagnoses crop diseases, recommends treatments, and works on the cheapest Android or iOS phone — with or without internet.*

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Why This Wins the Hackathon](#3-why-this-wins-the-hackathon)
4. [Target Users](#4-target-users)
5. [Supported Crops (Roadmap)](#5-supported-crops-roadmap)
6. [Technical Architecture](#6-technical-architecture)
7. [AI Model Strategy](#7-ai-model-strategy)
8. [Offline-First + Sync Architecture](#8-offline-first--sync-architecture)
9. [Multilingual Strategy](#9-multilingual-strategy)
10. [Mobile App (iOS + Android)](#10-mobile-app-ios--android)
11. [Data Sources](#11-data-sources)
12. [Fine-Tuning Pipeline](#12-fine-tuning-pipeline)
13. [Folder Structure](#13-folder-structure)
14. [Environment Setup](#14-environment-setup)
15. [Judging Criteria Alignment](#15-judging-criteria-alignment)
16. [Demo Video Strategy](#16-demo-video-strategy)
17. [Kaggle Submission Write-Up Template](#17-kaggle-submission-write-up-template)
18. [Post-Hackathon Roadmap](#18-post-hackathon-roadmap)
19. [License](#19-license)

---

## 1. Problem Statement

### The human cost

Ivory Coast produces **40% of the world's cocoa supply**. Over **5 million smallholder farmers** depend on cocoa for their income. The average farmer earns less than $1.90/day.

Crop diseases — black pod, frosty pod rot, swollen shoot virus, vascular streak dieback — destroy between **20% and 40% of the annual harvest**. For a farmer earning $600/year, losing 30% of their crop is not an inconvenience. It is a catastrophe.

The standard solution is an agronomist. The reality: there is **one agronomist per 1,500 farmers** in rural Côte d'Ivoire. Travel to reach one costs money the farmer does not have. By the time a diagnosis arrives, the disease has spread.

### The infrastructure reality

- **Network**: 2G/3G in most cocoa-growing regions. Connectivity drops entirely in remote areas.
- **Devices**: Entry-level Android phones (2–3 GB RAM). Some farmers share a single phone per household.
- **Literacy**: French literacy varies. Local languages (Dioula, Baoulé, Agni) are primary for many.
- **Cloud dependency**: Any solution requiring constant internet will fail for this population.

### The gap

Powerful AI exists. It does not reach the farmer standing in a field at 6am watching his pods turn black.

**PokouAI closes that gap.**

---

## 2. Solution Overview

PokouAI is a **multimodal, offline-first mobile application** powered by a fine-tuned Gemma 4 model that:

1. **Accepts a photo** of a diseased crop (leaf, pod, stem, root)
2. **Diagnoses the disease** using on-device vision + language AI
3. **Explains the treatment** in the farmer's local language (French, Dioula, Baoulé)
4. **Provides actionable steps** — what to buy, how to apply, when to spray
5. **Closes a 7-day scientific farming loop** — every diagnosis triggers a hypothesis prompt, schedules a follow-up reminder, and accumulates lessons in a personal Farm Intelligence Log
6. **Works with zero internet** — the full model and the loop run on the device
7. **Syncs when internet is available** — uploads anonymised cases to improve the model, downloads updated disease databases

**First crop: Cocoa** (Ivory Coast — world's #1 producer)
**Next crop: Cassava** (most consumed staple in West Africa)
**Vision: Every major crop in West Africa**

---

## 3. Why This Wins the Hackathon

The Gemma 4 Good Hackathon judges on five axes. PokouAI is engineered to score maximum points on each.

| Judging Axis | PokouAI's Answer |
|---|---|
| **Social impact** | 5M+ farmers in Ivory Coast alone. Directly addresses income, food security, and rural livelihoods. |
| **Technical innovation** | Multimodal fine-tuned Gemma 4 running fully on-device via llama.cpp. Offline-first sync architecture. Multilingual output including low-resource languages. Two-image (Day 0 vs Day 7) comparative inference. |
| **Real-world usability** | Works on a $50 Android phone with no internet. Voice and image input. Output in local languages. |
| **Constrained environments** | Designed specifically for 2G/no-network rural West Africa. Edge model (Gemma 4 E2B as primary, E4B as premium) and 7-day local notifications that don't require connectivity. |
| **Reproducibility** | Full open-source codebase. Public Kaggle notebook for fine-tuning. Documented dataset pipeline. |
| **Adaptive learning** | Every diagnosis triggers a hypothesis-test-conclude cycle that compresses the agricultural feedback loop from a season to 7 days, building a Farm Intelligence Log unique to each farmer. |

### The unfair advantage

No other team has this context. Ivory Coast is the origin of the world's chocolate supply. The story of a farmer photographing a sick pod and receiving advice in Dioula is not an abstract use case — it is a real person's real morning. That specificity is not replicable by a team in Europe or the United States.

---

## 4. Target Users

### Primary: The smallholder farmer

- Lives and farms in rural Côte d'Ivoire
- Grows 2–5 hectares of cocoa
- Earns under $2/day
- Has a basic Android phone, often shared
- Speaks Dioula or Baoulé primarily, some French
- Has 2G connectivity at best; often none
- Cannot afford to lose 30% of crop

### Secondary: The agricultural extension worker

- Covers 50–200 farmers per zone
- Needs rapid triage tool for farm visits
- Has a better device, sometimes internet
- Needs to document cases and share with regional agronomists

### Tertiary: The agronomy NGO / cooperative

- Manages hundreds of farmers
- Needs aggregate disease data by zone
- Wants to monitor outbreak patterns
- Has cloud access and data infrastructure

---

## 5. Supported Crops (Roadmap)

| Phase | Crop | Country focus | Status |
|---|---|---|---|
| v1.0 (Hackathon) | Cocoa | Ivory Coast | Active |
| v1.1 | Cassava | Ivory Coast, Ghana, Nigeria | Planned |
| v1.2 | Plantain / Banana | West Africa | Planned |
| v1.3 | Coffee | Ivory Coast, Ethiopia | Planned |
| v2.0 | Rice | West + East Africa | Planned |
| v2.1 | Yam | Nigeria, Ghana, Côte d'Ivoire | Planned |
| v2.2 | Maize | Pan-Africa | Planned |

Each crop requires:
- A disease-specific image dataset
- A disease knowledge base (symptoms, treatments, prevention)
- Language-specific treatment vocabulary
- A fine-tuning run or LoRA adapter update

The model architecture is designed from day one to support multiple crop modules via **crop-specific LoRA adapters** loaded on demand — so the base model does not need to be retrained for each new crop.

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP LAYER                        │
│              React Native + Expo (iOS + Android)            │
│   Camera → Image → Crop selector → Language selector        │
│   Display: Diagnosis + Treatment + Confidence score         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   ON-DEVICE AI LAYER                        │
│         llama.cpp (Android) / llama.cpp (iOS)               │
│   Fine-tuned Gemma 4 E4B — GGUF quantized (Q4_K_M)         │
│   Multimodal: image encoder + text decoder                  │
│   LoRA adapter: cocoa_v1 / cassava_v1 / etc.               │
│   Runs fully offline — no API calls                         │
└─────────────────┬───────────────────────────────────────────┘
                  │ (when internet available)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 SYNC + CLOUD LAYER                          │
│   FastAPI backend (optional — improves when online)         │
│   Gemma 4 27B via Kaggle/HuggingFace inference              │
│   Anonymised case upload → model improvement pipeline       │
│   Disease outbreak map (aggregate, privacy-safe)            │
│   Updated disease database sync (JSON over HTTPS)           │
└─────────────────────────────────────────────────────────────┘
```

### Core principle: **offline by default, cloud as enhancement**

The app must deliver 100% of its core value with zero internet. When internet is available:
- Use the larger Gemma 4 27B model for more accurate diagnosis
- Upload anonymised case data (no farmer PII) to improve training
- Download updated disease knowledge and model patches
- Show regional outbreak alerts

### The 7-Day Scientific Farming Loop (on-device)

Every diagnosis triggers a structured learning cycle that closes in 7 days, fully on-device:

```
DAY 0  observation        photo → Gemma 4 → disease + treatment
       hypothesis          farmer taps one of 4 causes (rain / neighbour /
                           insects / "I don't know") OR records a voice memo
       schedule            local notification queued for +7 days (no internet)

DAY 7  comparative photo   second photo of the same pod
       comparison          Gemma 4 receives both images and outputs
                           EVOLUTION / COMMENTAIRE / ACTIONS / LECON
       outcome capture     farmer marks stabilised / healed / progressed / unknown
                           confirms or rejects their Day 0 theory
                           types a one-line lesson

DAY 7+ Farm Intelligence   the lesson lands in a personal log; surfaces next
       Log                  season as a preventive reminder when conditions match
```

The farmer does not need to know the word "hypothesis." They need to answer one
question before they treat: *"What do you think caused this?"* That single
prompt is the entire scientific method in practice. Everything else — the
record, the comparison, the conclusion — PokouAI handles automatically.

**Why this matters technically.** Traditional agricultural training disconnects
the lesson from the field by months or seasons. PokouAI compresses the loop to
**7 days** while the farmer still remembers what they did, the visual evidence
is in front of them, and the connection between action and outcome is
undeniable. Over one season, a farmer accumulates 10–20 confirmed lessons
specific to their farm, microclimate, and crop varieties. No agronomist, no
NGO training, no classroom produces knowledge this specific or this actionable.

**Data model.** A `loops` table (SQLite) joins the initial diagnosis, the
hypothesis (category + optional voice memo), the comparative response from
Gemma 4, the outcome the farmer logged, and the lesson learned. Local
notifications via `expo-notifications` schedule the day-7 reminder without any
network call. If notification permission is denied or the user dismisses
the reminder, the Home screen surfaces a red "check now" banner whenever any
loop is past its scheduled date — a deterministic backstop.

**Group-mode amplification.** An extension worker uses the Farm Intelligence
Logs from multiple farmers to teach the group: *"Farmer Kofi tested this
theory in October — here's what he found. Anyone else see the same pattern
after rain?"* The extension worker is now teaching with real data from real
farms in the same region. The scientific method becomes a shared community
practice, not an individual tool.

---

## 7. AI Model Strategy

### Model selection

| Model | Use case | RAM required | When used |
|---|---|---|---|
| Gemma 4 **E2B** (GGUF Q4_K_M) | **Primary on-device model** | ~1.5 GB | Default for the target device (2–3 GB RAM Android) |
| Gemma 4 E4B (GGUF Q4_K_M) | Premium on-device model | ~2.5 GB | Auto-selected on phones with ≥4 GB RAM |
| Gemma 4 27B MoE | Cloud inference + Day-7 comparison | N/A on device | When internet is available — used for two-image comparative diagnosis at follow-up |

### Fine-tuning strategy

**Framework**: Unsloth (Kaggle free GPU — eligible for the $10,000 Unsloth special prize)
**Base model**: `google/gemma-4-e4b-it` (instruction-tuned)
**Method**: QLoRA — 4-bit quantisation + Low-Rank Adaptation
**Rank**: r=16, alpha=32
**Training data**: See Section 11

### What we fine-tune for

The base Gemma 4 model already has strong vision capabilities. Fine-tuning teaches it:

1. **Cocoa-specific visual patterns** — what black pod disease looks like vs. vascular streak dieback
2. **Ivorian agronomic context** — which fungicides are available in local markets, local brand names
3. **Multilingual output** — responding naturally in Dioula and Baoulé, not just translating French
4. **Structured output** — always returning: disease name, confidence, symptoms seen, treatment steps, prevention advice
5. **Comparative output** — when given two photos taken 7 days apart, return EVOLUTION (stabilisé/aggravé/guéri/incertain), COMMENTAIRE, ACTIONS, LECON
6. **Appropriate uncertainty** — saying "I am not certain, consult an agronomist" when confidence is low

### LoRA adapter architecture for multi-crop

```python
# Each crop gets its own LoRA adapter
# Base model stays frozen — no retraining needed per crop
adapters = {
    "cocoa":   "adapters/cocoa_v1.safetensors",
    "cassava": "adapters/cassava_v1.safetensors",
    "coffee":  "adapters/coffee_v1.safetensors",
}

# Load dynamically based on user crop selection
model.load_adapter(adapters[selected_crop])
```

This means adding cassava is a fine-tuning run + new adapter file, not a full retraining. The base model remains shared.

---

## 8. Offline-First + Sync Architecture

### The core rule

> **The app must return a diagnosis in under 10 seconds with zero network connectivity on a 2GB RAM Android device.**

### Offline storage

```
Local device storage:
├── model/
│   ├── gemma4_e4b_cocoa_q4km.gguf     # Primary model
│   └── gemma4_e2b_fallback_q4.gguf    # Fallback for low RAM
├── adapters/
│   └── cocoa_v1.safetensors           # Current crop adapter
├── disease_db/
│   └── cocoa_diseases.json            # Offline disease reference
├── cases/
│   └── pending_sync/                  # Cases waiting to upload
└── updates/
    └── last_sync.json                 # Sync state tracker
```

### Sync protocol

```
1. App opens → check network status
2. No network → use local model only, queue any new cases
3. Network available →
   a. Upload pending cases (anonymised: image hash + diagnosis + GPS region only)
   b. Check for disease_db updates → download if newer version exists
   c. Check for model patch updates → download if available + sufficient storage
   d. If strong WiFi → optionally download 27B model for enhanced accuracy
4. User can always manually trigger sync from settings
```

### Privacy

- No farmer name, phone number, or exact GPS coordinates ever leave the device
- Case uploads contain: crop type, disease name predicted, image perceptual hash, district-level location, date
- Farmers explicitly opt in to data sharing at first launch
- All data is governed by a clear privacy policy in French

---

## 9. Multilingual Strategy

### Languages supported at launch

| Language | Code | Population | Input | Output |
|---|---|---|---|---|
| French | `fr` | Urban + educated farmers | Text + voice | Full |
| Dioula | `dyu` | North Ivory Coast | Voice primary | Full |
| Baoulé | `bci` | Central Ivory Coast | Voice primary | Full |
| English | `en` | Extension workers, NGOs | Text | Full |

### How multilingual output works

The fine-tuning training data includes diagnosis responses written natively in each language — not translations of French. A Dioula-speaking farmer receives advice written the way a Dioula-speaking agronomist would actually give it.

### Voice input strategy

Many farmers have limited literacy. The app supports:
- **Voice questions**: "Ma cabosse est noire" / "Cabosse bi dɔgɔya" (Dioula: "my pod is sick")
- **Whisper-small** for speech-to-text (runs on-device, offline)
- Text-to-speech output using system TTS (Android/iOS native)

---

## 10. Mobile App (iOS + Android)

### Framework: React Native + Expo

**Why Expo**: Camera, image picker, file system, offline storage, and build tooling all pre-integrated. You write JavaScript/TypeScript logic without touching Java, Kotlin, Swift, or Objective-C.

**Why React Native over Flutter**: The llama.cpp React Native bindings (`react-native-llama.cpp`) are more mature and better documented than Flutter equivalents at the time of development.

### Key screens

```
1. Onboarding
   └── Language selector (FR / Dioula / Baoulé / EN)
   └── Crop selector (Cocoa — others greyed as "coming soon")
   └── Data sharing consent (opt-in, clear explanation)

2. Home
   └── Tier badges (📱 local / 🛰 hub / ☁️ cloud — show what's available)
   └── Red overdue banner when any loop is past its Day-7 check date
   └── Large "Take Photo" button
   └── Or: "Upload from Gallery"
   └── Recent diagnoses list (last 3)
   └── Tiles: Calendar · Quiz · 🔬 My Farm Intelligence
   └── Group-mode CTA (extension worker)

3. Diagnosis (capture + analyze)
   └── Image preview, "Analyze" button, progress indicator with chosen tier

4. Diagnosis Result
   └── Disease name (large, in selected language)
   └── Confidence indicator + tier badge (where inference ran)
   └── 🔬 "Test your theory" card — 4 tappable causes + 🎙 voice memo
   └── Treatment steps (numbered, simple language)
   └── Prevention advice
   └── "Why?" → Learn screen, "Practice" → Quiz, Share

5. Day-7 Follow-Up (deep-linked from notification or red Home banner)
   └── Side-by-side Before / Now thumbnails
   └── Camera trigger to capture the Day-7 photo
   └── Comparative diagnosis from Gemma 4 (EVOLUTION / COMMENTAIRE / ACTIONS / LECON)
   └── Outcome buttons (stabilised / healed / progressed / unknown)
   └── Theory ✓ / ✗ toggle (was the Day-0 hypothesis correct?)
   └── One-line lesson textarea
   └── Replay Day-0 voice memo

6. Farm Intelligence Log
   └── Pending loops (overdue ones red-bordered, tap to open Day-7 flow)
   └── Completed loops with the lesson pull-quoted in a yellow box
   └── Audio playback pill on entries with a voice memo

7. Farm Log
   └── Raw history of all diagnoses (separate from the curated Intelligence Log)
   └── Filter by date / disease / crop
   └── Sync status indicator

8. Group Mode
   └── Extension-worker-only flow that runs diagnosis without saving to the
       personal log — designed for live teaching with a group of farmers

9. Learn / Prevention Calendar / Quiz
   └── "Why this happened" cause explanation tied to the latest diagnosis
   └── Seasonal action calendar by month for cocoa in Côte d'Ivoire
   └── Spaced-repetition Q&A keyed off the farmer's recent diagnoses

10. Settings (incl. Hub)
    └── Language preference, crop module status
    └── Cooperative hub URL + model picker (gemma4:27b vs gemma4:e4b on Ollama)
    └── Model version + last sync date
    └── Cloud sync toggle, data sharing toggle
    └── About / Privacy policy
```

### llama.cpp integration

```javascript
// react-native-llama.cpp usage (simplified)
import { LlamaContext } from 'react-native-llama.cpp';

const context = await LlamaContext.create({
  model: `${FileSystem.documentDirectory}models/gemma4_e4b_cocoa_q4km.gguf`,
  n_ctx: 2048,
  n_threads: 4,
});

const result = await context.completion({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: base64ImageUri } },
        { type: 'text', text: buildPrompt(selectedLanguage, cropType) }
      ]
    }
  ],
  temperature: 0.1,   // Low temp for consistent medical-style output
  max_tokens: 512,
});
```

### Development setup (Mac)

```bash
# 1. Install dependencies
brew install node watchman
npm install -g expo-cli

# 2. Install Android Studio (for emulator)
# Download from developer.android.com/studio
# Create AVD: Pixel 6, Android 13, 4GB RAM

# 3. Create project
npx create-expo-app PokouAI --template expo-template-blank-typescript
cd PokouAI

# 4. Install key packages
npx expo install expo-camera expo-image-picker expo-file-system
npm install react-native-llama.cpp
npm install @react-native-async-storage/async-storage
npm install react-native-whisper  # offline speech-to-text

# 5. Run on emulator
npx expo run:android
```

---

## 11. Data Sources

### Cocoa disease image datasets (all public)

| Dataset | Source | Images | Diseases covered |
|---|---|---|---|
| PlantVillage | Kaggle / TensorFlow Datasets | ~54,000 | General plant diseases |
| CGIAR Cocoa Disease Dataset | CGIAR / data.cimmyt.org | ~12,000 | Cocoa-specific |
| IITA Cocoa Pathology Images | iita.org open data | ~3,500 | Black pod, swollen shoot |
| iNaturalist Cocoa observations | inaturalist.org API | ~8,000 | Wild-collected, diverse |
| CaboCo Dataset (academic) | Published 2022, ResearchGate | ~7,000 | Brazilian cocoa diseases (transferable) |

**Augmentation**: Horizontal/vertical flip, brightness ±30%, JPEG compression artifacts (simulate phone camera quality), blur (simulate shaky hands), add text overlays (simulate real phone photos with timestamps).

### Knowledge base for treatment text

- **CABI Crop Protection Compendium** — cocoa disease entries (free tier)
- **FAO Cocoa Pest Management Guidelines**
- **ANADER (Ivory Coast national agronomy agency)** — publicly available extension documents
- **CocoacareHQ** — open disease treatment database

---

## 12. Fine-Tuning Pipeline

### Training data format

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "image": "<base64_encoded_image>"
        },
        {
          "type": "text",
          "text": "Tu es PokouAI, un expert en maladies du cacao. Examine cette image et donne un diagnostic en français."
        }
      ]
    },
    {
      "role": "assistant",
      "content": "**Maladie détectée: Pourriture brune (Phytophthora palmivora)**\n\n**Confiance: Élevée**\n\n**Ce que je vois:** Cabosses avec taches brunes irrégulières envahissant la surface. Brunissement commençant à la pointe ou au milieu de la cabosse.\n\n**Traitement immédiat:**\n1. Retirez et détruisez toutes les cabosses infectées (ne pas composter)\n2. Appliquez de l'hydroxyde de cuivre (Kocide 2000) — dosage: 2g/litre d'eau\n3. Traitez tôt le matin ou en fin d'après-midi, jamais sous la pluie\n4. Répétez toutes les 2 semaines pendant 6 semaines\n\n**Prévention:**\n- Tailler les branches basses pour améliorer la circulation d'air\n- Ramasser régulièrement les cabosses tombées\n\n**Si les symptômes s'aggravent en 2 semaines:** Consultez un technicien ANADER."
    }
  ]
}
```

### Unsloth fine-tuning script (Kaggle notebook)

```python
from unsloth import FastLanguageModel
from unsloth.chat_templates import get_chat_template
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# Load model with Unsloth optimisation (2x faster, 60% less VRAM)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="google/gemma-4-e4b-it",
    max_seq_length=2048,
    dtype=None,          # Auto-detect
    load_in_4bit=True,   # QLoRA
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj","k_proj","v_proj","o_proj",
                    "gate_proj","up_proj","down_proj"],
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    use_gradient_checkpointing="unsloth",
)

# Load cocoa disease training data
dataset = load_dataset("json", data_files="cocoa_train.jsonl", split="train")

# Train
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=2048,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=10,
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        output_dir="cocoa_lora_out",
        optim="adamw_8bit",
        save_strategy="epoch",
    ),
)
trainer.train()

# Export to GGUF for llama.cpp
model.save_pretrained_gguf(
    "cocoa_model_gguf",
    tokenizer,
    quantization_method="q4_k_m"   # Best balance: quality vs size
)
```

### Expected output

- Model size: ~2.8 GB (Q4_K_M GGUF)
- Inference speed: 3–8 tokens/second on mid-range Android
- Full diagnosis response time: ~8–12 seconds offline

---

## 13. Folder Structure

```
PokouAI/
├── README.md
├── LICENSE                          (Apache 2.0)
│
├── ml/                              # All Python / ML code
│   ├── data/
│   │   ├── raw/                     # Downloaded datasets
│   │   ├── processed/               # Cleaned + formatted
│   │   └── augmented/               # Augmented training set
│   ├── notebooks/
│   │   ├── 01_data_exploration.ipynb
│   │   ├── 02_dataset_preparation.ipynb
│   │   ├── 03_finetune_cocoa_unsloth.ipynb   # Kaggle submission notebook
│   │   └── 04_evaluation.ipynb
│   ├── scripts/
│   │   ├── download_datasets.py
│   │   ├── prepare_training_data.py
│   │   ├── augment_images.py
│   │   └── export_gguf.py
│   ├── disease_db/
│   │   ├── cocoa_diseases.json
│   │   └── cassava_diseases.json    # Phase 2
│   └── evaluation/
│       ├── test_images/
│       └── eval_results.json
│
├── app/                             # React Native mobile app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── DiagnosisScreen.tsx
│   │   │   ├── ResultScreen.tsx
│   │   │   ├── FollowUpScreen.tsx              # Day-7 comparative capture
│   │   │   ├── FarmIntelligenceLogScreen.tsx   # Curated lessons (loops)
│   │   │   ├── FarmLogScreen.tsx               # Raw diagnoses log
│   │   │   ├── LearnScreen.tsx                 # "Why this happened"
│   │   │   ├── PreventionCalendarScreen.tsx    # Seasonal calendar
│   │   │   ├── QuizScreen.tsx                  # Spaced repetition
│   │   │   ├── GroupModeScreen.tsx             # Extension worker mode
│   │   │   ├── HubSettingsScreen.tsx           # Cooperative hub config
│   │   │   └── SettingsScreen.tsx
│   │   ├── components/
│   │   │   └── HypothesisCard.tsx              # Inline on Result screen
│   │   ├── services/
│   │   │   ├── LlamaService.ts                 # llama.cpp wrapper
│   │   │   ├── OllamaService.ts                # Cooperative-hub backend
│   │   │   ├── CloudService.ts                 # Cloud 27B backend
│   │   │   ├── InferenceRouter.ts              # 3-tier router + comparison
│   │   │   ├── NetworkService.ts               # Hub + internet probes
│   │   │   ├── SyncService.ts                  # Offline sync logic
│   │   │   ├── db.ts                           # SQLite (diagnoses + loops)
│   │   │   ├── loops.ts                        # Loop CRUD (hypothesis/follow-up)
│   │   │   ├── notifications.ts                # 7-day local reminders
│   │   │   ├── voice.ts                        # Hypothesis voice memo
│   │   │   ├── knowledge.ts                    # Calendar + quiz bank
│   │   │   ├── promptBuilder.ts                # Diagnosis + comparison prompts
│   │   │   ├── responseParser.ts
│   │   │   └── preferences.ts                  # Language, crop, hub URL
│   │   ├── i18n/
│   │   │   ├── fr.json              # French
│   │   │   ├── dyu.json             # Dioula
│   │   │   ├── bci.json             # Baoulé
│   │   │   └── en.json              # English
│   │   ├── data/
│   │   │   └── cocoa_diseases.json  # Bundled disease KB
│   │   └── types/
│   │       └── index.ts
│   ├── assets/
│   │   └── models/                  # GGUF model files (gitignored, downloaded at install)
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                         # Optional cloud sync (FastAPI)
│   ├── main.py
│   ├── routers/
│   │   ├── sync.py                  # Case upload endpoint
│   │   ├── updates.py               # Model/DB update check
│   │   └── inference.py             # 27B cloud inference
│   ├── models/
│   │   └── schemas.py
│   └── requirements.txt
│
├── demo/                            # Hackathon demo assets
│   ├── demo_video/
│   ├── screenshots/
│   └── sample_diagnoses/
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DATASET_SOURCES.md
    └── PRIVACY_POLICY.md
```

---

## 14. Environment Setup

### Mac development environment

```bash
# Python environment (ML)
pyenv install 3.11.9
pyenv local 3.11.9
python -m venv .venv
source .venv/bin/activate
pip install unsloth torch torchvision datasets trl transformers pillow

# Node environment (app)
nvm install 20
nvm use 20
npm install -g expo-cli eas-cli

# Android emulator
# Install Android Studio: developer.android.com/studio
# SDK Manager → install Android 13 (API 33)
# AVD Manager → create Pixel 6a, 4GB RAM, API 33

# iOS simulator (Mac only — free, no Apple Developer account needed for testing)
# Xcode → download from App Store → open → install simulators
# Simulator: iPhone 14, iOS 16
```

### Kaggle fine-tuning environment

```python
# In Kaggle notebook — enable GPU (T4 x2 recommended)
# Settings → Accelerator → GPU T4 x2

!pip install "unsloth[kaggle-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps trl peft accelerate bitsandbytes
```

---

## 15. Judging Criteria Alignment

This section maps every judging criterion to a specific PokouAI deliverable. **Do not remove this section from the submission.**

### Impact

- **Who**: 5+ million cocoa farmers in Ivory Coast. Expandable to 50M+ subsistence farmers across West Africa with cassava, rice, yam additions.
- **What changes**: A farmer who previously lost 30% of crop to undiagnosed disease now receives accurate diagnosis in their own language within 10 seconds, for free, with zero internet.
- **Evidence**: Real diagnosis demo filmed on a working cocoa farm in Côte d'Ivoire.

### Technical execution

- Fine-tuned Gemma 4 E4B using Unsloth (competition-specific tooling)
- Multimodal: image + text + voice
- On-device inference via llama.cpp (GGUF Q4_K_M)
- Offline-first sync architecture
- Multi-language output including Dioula and Baoulé (low-resource languages)
- LoRA adapter architecture enabling multi-crop without full retraining

### Constrained environments

- Works on 2G and zero connectivity
- Tested on entry-level 2GB RAM Android devices (via emulator + real device via Ivory Coast partner)
- Model size optimised: 2.8GB download, minimal inference RAM

### Usability

- Voice input for low-literacy farmers
- Response in farmer's primary language
- Single large button interaction on home screen
- No account required, no login, no cloud dependency

### Reproducibility

- Full training notebook on Kaggle (public)
- Apache 2.0 license
- All dataset sources documented and linkable
- One-command setup for app development

---

## 16. Demo Video Strategy

### The 90-second structure that wins

| Time | What is on screen | Why |
|---|---|---|
| 0–10s | A cocoa farm. Sick pods. Real person. Ivory Coast. | Judges feel the problem before you say a word. |
| 10–20s | The farmer takes a photo on their phone. | No narration needed. The action is the story. |
| 20–32s | The app loading indicator. Then: diagnosis in Dioula. Treatment steps. | Prove it works offline — airplane mode badge visible on phone. |
| 32–45s | The 🔬 "Test your theory" card appears. Farmer taps "Rain". Card collapses to "we'll check in 7 days". | Sells the scientific loop in one beat. |
| 45–55s | Time-lapse cut. Day 7. Notification fires. Farmer takes second photo. Side-by-side with Day 0. EVOLUTION: stabilisé. | Shows the loop closing — the demo's emotional climax. |
| 55–65s | Farm Intelligence Log opens. The lesson "After 3 days of rain, inspect shaded pods within 48h" is highlighted. | The product's real output is knowledge, not just a one-shot diagnosis. |
| 65–75s | Voice: the farmer reads the treatment in Dioula. | Language authenticity. |
| 75–82s | Split: Mac emulator + Kaggle training notebook. | Technical proof. Shows fine-tuning is real. |
| 82–88s | Text: "5M farmers. 40% of world's cocoa. Built in Ivory Coast." | Impact frame. |
| 88–90s | GitHub repo URL. Kaggle notebook URL. PokouAI logo. | Submission proof. |

### Critical: airplane mode

At second 15, before the farmer takes the photo, visibly turn on airplane mode on the phone. This single act proves the entire offline claim more convincingly than any architecture diagram.

---

## 17. Kaggle Submission Write-Up Template

```
Title: PokouAI — Offline Multilingual Crop Disease AI for West African Smallholder Farmers

Problem:
5 million cocoa farmers in Ivory Coast lose 20–40% of their harvest annually to 
undiagnosed crop diseases. There is 1 agronomist per 1,500 farmers. Most farming 
regions have no reliable internet. The farmer who needs help the most is exactly 
the person current AI solutions cannot reach.

Solution:
PokouAI is a fine-tuned Gemma 4 multimodal model running fully on-device on 
Android and iOS phones. A farmer photographs a diseased crop. The model diagnoses 
the disease and responds with treatment steps in French, Dioula, or Baoulé — 
in under 10 seconds, with zero internet connectivity required.

Gemma 4 features used:
- Multimodal vision: image of diseased crop → diagnosis
- Two-image comparative inference at Day 7 follow-up
- On-device inference via Gemma 4 E2B / E4B (GGUF Q4_K_M via llama.cpp)
- Fine-tuned with Unsloth QLoRA on cocoa disease dataset
- LoRA adapter architecture for multi-crop extensibility
- Low-resource language output (Dioula, Baoulé)
- Structured output schema (MALADIE / SYMPTOMES / TRAITEMENT / PREVENTION
  for diagnosis; EVOLUTION / COMMENTAIRE / ACTIONS / LECON for comparison)

Technical highlights:
- Model: Gemma 4 E2B (primary) + E4B (premium) fine-tuned with Unsloth
- Framework: React Native + Expo (iOS + Android)
- Offline inference: llama.cpp GGUF
- 3-tier routing: phone → cooperative Ollama hub → cloud 27B
- Sync: offline-first with background sync when connected
- Languages: French, Dioula, Baoulé, English
- Voice memo for hypothesis (offline; Whisper STT planned v1.1)
- 7-day scientific farming loop with local notifications, no internet required

Impact:
- Primary: 5M+ cocoa farmers in Ivory Coast
- Phase 2: Cassava, plantain (50M+ farmers across West Africa)
- Built by an Ivorian developer with ground-level context and farm access

Reproducibility:
All code, training notebooks, and dataset documentation are open source under 
Apache 2.0. The Kaggle training notebook can be forked and run in under 2 hours 
on free Kaggle GPU.

Links:
- GitHub: [repo URL]
- Kaggle Notebook: [notebook URL]
- Demo video: [video URL]
```

---

## 18. Post-Hackathon Roadmap

### Phase 1 — Post-win (Month 1–3)
- Deploy to Google Play Store + Apple App Store
- Partner with ANADER (Ivory Coast national agronomy agency)
- Recruit 50 pilot farmers in 3 cocoa-producing regions
- Collect real-world usage data and edge cases

### Phase 2 — Cassava module (Month 3–6)
- Collect cassava disease dataset
- Fine-tune cassava LoRA adapter
- Release PokouAI v1.1 with cassava support
- Expand to Ghana and Nigeria

### Phase 3 — NGO + cooperative partnerships (Month 6–12)
- White-label version for agronomy NGOs
- Aggregate disease outbreak dashboard (web, privacy-safe)
- Multilingual expansion: Twi, Yoruba, Hausa
- Training program for agricultural extension workers

### Phase 4 — Platform vision (Year 2+)
- CropDoc: renamed platform supporting 10+ crops
- Open API for agronomy organisations
- Integration with weather data for treatment timing
- Satellite imagery integration for early outbreak detection

---

## 19. License

```
Apache License 2.0

Copyright 2026 PokouAI Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

---

*Built in Ivory Coast. For the farmers who feed the world's chocolate supply and receive nothing in return.*
