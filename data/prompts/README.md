# PokouAI — Prompts & Knowledge Config

> Pattern borrowed from WorkbenchIQ's [`prompts/`](https://github.com/microsoft/WorkbenchIQ) directory: keep all model-facing strings and curated knowledge in versioned JSON files outside the source code, so prompt iteration doesn't require recompiling the app.

## Files

| File | Purpose | Consumed by |
|---|---|---|
| `diagnosis.json` | System + user prompts for the single-image disease diagnosis call (Day 0). Multilingual user prompt. | [`promptBuilder.buildPrompt`](../../app/src/services/promptBuilder.ts) |
| `comparison.json` | System + user prompts for the Day-7 follow-up. Two variants: `user_two_image_by_lang` (hub + cloud receive both images) and `user_single_image_by_lang` (local llama.cpp falls back to single image). `{disease}` placeholder is filled at call time. | [`promptBuilder.buildComparisonPrompt`](../../app/src/services/promptBuilder.ts) and `buildComparisonPromptSingle` |
| `quiz.json` | Spaced-repetition quiz bank, keyed by disease ID with per-language question lists. `keywords[]` are matched (substring, lowercased) against the farmer's free-text answer. `fallback` is used when no question is available for the current disease. | [`knowledge.pickQuizQuestion`](../../app/src/services/knowledge.ts) |
| `calendar.json` | Seasonal preventive-action calendar by crop. Surfaced in `PreventionCalendarScreen`. | [`knowledge.getCalendar`](../../app/src/services/knowledge.ts) |
| `../cocoa_diseases.json` | Disease knowledge base (symptoms, treatment, prevention, when-to-call-agronomist). Referenced by `knowledge.getCauses`. **Multilingual content here drives the structured-response training data and the cause/learn screen.** | [`knowledge.getCauses`](../../app/src/services/knowledge.ts), training pipeline |

## Editing rules

1. **Edit JSON, not code.** If you find yourself modifying a string in `promptBuilder.ts` or `knowledge.ts`, stop — it should live here.
2. **Schema version bumps.** When the structure of a file changes (new field, removed field), bump `$schema_version` and update the consumer to handle both shapes. Don't break old reads silently.
3. **Multilingual.** All farmer-facing strings ship in fr / en / dyu / bci. dyu and bci entries are currently `[FR→DYU à valider]` / `[FR→BCI à valider]` placeholders pending native-speaker review — the marker keeps untranslated content visible, never silently shipped.
4. **Mirror to app bundle.** A copy of these files lives at `app/src/data/prompts/`. Run `make sync-prompts` (or copy by hand) after editing here so the app picks up the change. Until that script exists, the app imports the mirrored copy.

## Why this lives here, not in code

Three reasons:
- **Prompt iteration is a non-developer workflow.** A native Dioula speaker editing `dyu` strings shouldn't need to install Node.
- **Same content drives training and runtime.** The training pipeline reads `cocoa_diseases.json` to build `train.jsonl`; the app reads the prompt bundle at runtime. If they both pulled from code, drift would be invisible.
- **Versioned per-environment override.** A future PR can read `process.env.POKOUAI_PROMPTS_ROOT` to swap prompt sets without code changes — useful for A/B testing or per-region tuning.
