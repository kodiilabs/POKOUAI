# PokouAI — Implementation Checklist

> **Deadline: May 18, 2026 @ 23:59 UTC** | **Days remaining: 27** | Effort: Full-time

**Legend:** `[ ]` = Not started | `[~]` = In progress | `[x]` = Done | `[!]` = Blocked | **CRITICAL** = must-have

---

## Week 1 — Apr 15–21 | Foundation + Data
Goal: Environments ready. Data collected. Fine-tune started.

### Python + ML Setup
- [ ] Python 3.11 + venv (per [.claude.md](../../.claude.md#build-commands))
- [ ] ML dependencies: unsloth, torch, transformers, pillow
- [ ] Kaggle: GPU enabled (T4 x2), Unsloth installed, Gemma 4 E4B accessible
- [ ] Gemma license accepted on HuggingFace

### Node + App Setup
- [ ] Node 20 + Expo CLI globally
- [ ] Android Studio → AVD: Pixel 6a, Android 13, 4GB RAM (boots + verified)
- [ ] Xcode → iOS simulator (verified)
- [ ] Blank Expo project created + runs on both emulators
- [ ] GitHub: public repo + initial structure pushed **CRITICAL**

### Dataset Collection
- [ ] Cocoa images: PlantVillage, CGIAR, IITA, iNaturalist, CaboCo combined (~20k target)
- [ ] Organized by disease: `black_pod/`, `frosty_pod_rot/`, `swollen_shoot/`, `vascular_streak_dieback/`, `healthy/`, `other_damage/`

### Ivory Coast Contact
- [ ] Reached + confirmed Android phone availability
- [ ] Requested: 20–30 photos (healthy + diseased cocoa) with disease/location/date noted
- [ ] Shared folder established (WhatsApp/Drive/iCloud)
- [ ] Confirmed willing to film demo in Week 4

---

## Week 2 — Apr 22–28 | Data Pipeline + Fine-Tuning
Goal: Training data formatted. Fine-tune Run 1 complete. Model tested.

### Data Preparation
- [ ] `prepare_training_data.py`: normalize images (JPEG, max 1024px, RGB)
- [ ] `augment_images.py`: flip, brightness, JPEG sim, blur, crop → ~50k images target
- [ ] `cocoa_diseases.json`: 5 disease classes + symptoms, treatment, prevention per disease
- [ ] Training data formatted as conversation JSON (reference: [docs Section 12](PokouAI_Project_Documentation.md#12-fine-tuning-pipeline))
- [ ] Responses in all 4 languages: French, Dioula (review w/ contact), Baoulé, English
- [ ] Split: 80% train / 10% val / 10% test
- [ ] Uploaded to Kaggle Datasets (public) **CRITICAL**

### Fine-Tuning Run 1 (Kaggle)
- [ ] Notebook `03_finetune_cocoa_unsloth.ipynb`: Load Gemma 4 E4B + QLoRA (r=16, a=32, dropout=0.05)
- [ ] Train 3 epochs — verify loss decreasing
- [ ] Save LoRA checkpoints per epoch
- [ ] Evaluate on test set: accuracy >80%, manual language review (10 examples each), structure consistency
- [ ] Export to GGUF Q4_K_M: 2.5–3.0 GB expected
- [ ] Test locally: `brew install llama.cpp` + `llama-cli -m cocoa_v1.gguf --multimodal` with 5 sample images

### Model Validation
- [ ] French output: coherent + accurate
- [ ] Dioula output: natural (contact review if possible)
- [ ] Document worst failures → inform Run 2 improvements

---

## Week 3 — Apr 29–May 5 | App Core + Integration
Goal: App runs on emulator with real inference. Offline mode proven.

### React Native Setup
- [ ] Dependencies installed: camera, image-picker, sqlite, llama.cpp, async-storage, i18n (see [.claude.md](../../.claude.md#mobile-app))
- [ ] Folder structure: `src/screens/`, `src/services/`, `src/types/`, `src/data/`

### App Screens (6 total)
- [ ] `OnboardingScreen.tsx`: language + crop selectors, consent, AsyncStorage persistence
- [ ] `HomeScreen.tsx`: camera button, gallery, offline badge, last 3 diagnoses
- [ ] `DiagnosisScreen.tsx`: capture + preview, analyze button, progress indicator
- [ ] `ResultScreen.tsx`: disease name, confidence badge, treatment steps, save + share buttons
- [ ] `FarmLogScreen.tsx`: SQLite local log, past diagnoses + sync status
- [ ] `SettingsScreen.tsx`: language toggle, model version, sync date, manual sync

### i18n Integration
- [ ] Language files created: `fr.json`, `dyu.json`, `bci.json`, `en.json`
- [ ] i18next wired to preference store
- [ ] All 4 languages tested on emulator

### Model Integration (LlamaService)
- [ ] `LlamaService.ts`: load GGUF, inference + streaming, response parsing (disease/confidence/steps)
- [ ] `promptBuilder.ts`: image + text prompt construction
- [ ] GGUF bundled in app (or lazy-download on first launch)
- [ ] Full pipeline tested: photo → inference → result displayed
- [ ] **CRITICAL**: Offline test — airplane mode ON, confirm inference works

### SyncService Skeleton
- [ ] Network detection + queue management (basic implementation)
- [ ] Backend health ping + disease_db update download

### Fine-Tune Run 2 (parallel on Kaggle)
- [ ] Failures from Run 1 addressed
- [ ] Add photos from Ivory Coast contact to training data
- [ ] Train 3 more epochs → target accuracy >85%
- [ ] Export GGUF v2 model
- [ ] Integrate v2 into app

---

## Week 4 — May 6–12 | Polish + Demo + Submission
Goal: App stable. Demo filmed. Submission draft ready.

### App Polish
- [ ] All Week 3 crashes fixed
- [ ] Error handling: "Model loading...", "Image too dark", "Uncertain — consult agronomist"
- [ ] Offline indicator visible
- [ ] Model download progress on first launch
- [ ] Tested on 3 configs: 2GB RAM (low), 4GB (standard), Android 12/13
- [ ] iOS simulator tested
- [ ] APK sent to Ivory Coast contact via WhatsApp → fix critical feedback

### Voice Input (bonus — if time)
- [ ] Integrate `react-native-whisper`
- [ ] Voice-to-text in French + test
- [ ] Wire to diagnosis pipeline

### Demo Video Production **CRITICAL**
- [ ] 60 seconds max, English, subtitles OK
- [ ] Story: Show farmer, phone, photo of diseased pod, diagnosis, treatment in local language
- [ ] Include: real device or emulator, offline indicator, multiple languages
- [ ] Hosted on YouTube (unlisted OK) with public link
- [ ] Focus on problem → solution, not technical details

### GitHub Documentation
- [ ] README: problem + solution, how to train + how to build app, license
- [ ] PRIVACY_POLICY.md
- [ ] DEVLOG.md with Week-by-week progress
- [ ] `.gitignore`: excludes model files, venv, node_modules, .DS_Store
- [ ] All sources attributed

### Kaggle Notebook Finalized **CRITICAL**
- [ ] Imports Unsloth + credited in text
- [ ] Runs end-to-end without errors on fresh Kaggle kernel
- [ ] Outputs GGUF v2 model
- [ ] Section: "Why Unsloth" (2x faster, 60% less VRAM, enables QLoRA on free GPU)
- [ ] Public + tagged "unsloth"

### Submission Prep
- [ ] Write-up drafted (see [template](PokouAI_Project_Documentation.md#17-kaggle-submission-write-up-template))
- [ ] Links verified: GitHub, Kaggle notebook, demo video
- [ ] Dataset credited + publicly readable on Kaggle
- [ ] Apache 2.0 LICENSE file in repo

---

## Week 5 — May 13–18 | Final Checks + Submit
Goal: Submit May 17 23:59 UTC (1-day buffer).

### Reproducibility Audit **CRITICAL**
- [ ] Clone repo to new folder → follow README setup → works from scratch
- [ ] Fork Kaggle notebook → run fresh → trains + exports GGUF
- [ ] App builds + runs from cloned repo, all screens work
- [ ] GitHub: confirm public + accessible
- [ ] Fix any failed steps immediately

### Final Testing
- [ ] Regression: all screens, all buttons (offline mode ON)
- [ ] Memory: 2GB RAM emulator — no crash
- [ ] APK on Ivory Coast contact's phone — final confirmation

### Submission Checklist
- [ ] `README.md`: problem + solution, how to setup/train, screenshots, license
- [ ] `PRIVACY_POLICY.md` + `LICENSE` (Apache 2.0)
- [ ] All dataset sources linked + attributed
- [ ] GitHub public URL + Kaggle notebook URL + demo video URL verified

### Submit
- [ ] Kaggle: fill form with GitHub/notebook/video URLs
- [ ] Paste write-up (problem-first, not tech-first)
- [ ] **Submit by May 17, 23:59 UTC**
- [ ] Screenshot confirmation + verify in "My Submissions"

---

## Daily Habits
- [ ] Push to GitHub end of day
- [ ] Update `DEVLOG.md`
- [ ] Check Kaggle forum for rule updates

---

## Red Flags (fix immediately if true by May 14)
- [ ] App crashes on emulator with model loaded
- [ ] Offline inference >20 seconds
- [ ] GitHub requires login
- [ ] Kaggle notebook errors on fresh run
- [ ] Demo video >3 minutes
- [ ] Write-up leads with tech, not farmer problem
- [ ] GGUF model not accessible

---

## Judging Checklist (what they verify)
- [ ] Problem is real? (Ivory Coast farm footage)
- [ ] Works offline? (Airplane mode in video)
- [ ] Gemma 4 used well? (Multimodal + fine-tune + Unsloth)
- [ ] Reproducible? (Public notebook + clear README)
- [ ] Reaches underserved people? (5M farmers, no internet, local languages)
- [ ] Right builder? (Ivorian, ground context, language fluency)

*Everything checked = everything within your control is done. Rest = judges.*

