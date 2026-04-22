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
