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
