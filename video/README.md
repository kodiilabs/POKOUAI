# PokouAI — Video (100% programmatic)

This Remotion project renders the **entire submission video from React components** — phone bezel, mock screens, transitions, captions, intro, outro. **No iOS Simulator recording, no manual clips.** Run `pnpm render` → get an MP4.

## Setup

```sh
cd video
pnpm install      # first install pulls Chromium (~250 MB)
```

## Render

```sh
# Live preview (recommended while iterating)
pnpm dev

# Final 1080×1920 portrait MP4 → video/out/pokouai.mp4
pnpm render

# Draft (faster, slightly lower quality, single-thread)
pnpm render:fast
```

Output lands in [`out/`](out/) (gitignored).

## What the video contains

| Section | Duration | What's on screen |
|---|---|---|
| Title | 5 s | PokouAI brand mark, problem framing |
| Problem | 7 s | Three stat callouts (30–40% loss, 1-per-1000 extension agents, $50 Android) |
| Home reveal | 5 s | Animated phone frame springs in, Home screen with Farmer Agent tile highlighted |
| Skill-level adaptation | 22.5 s | The phone cycles through **5 stages × 3 skill levels** (15 frames in sequence). Same image, same disease, three farmers, every section adapts. |
| Architecture | 7 s | Three-tier diagram: Phone → Hub → Cloud, with engine + RAM notes per tier |
| Diagnosis (Result screen) | 7 s | Live Result-screen mockup with confidence band, tier badge, and the "Adapted for X" badge cycling through levels |
| Field photos | 15 s | Four CC BY-SA Wikimedia photographs of Ivorian cocoa farmers with Ken Burns crossfade — see [ATTRIBUTIONS.md](ATTRIBUTIONS.md) |
| Outro | 9 s | Fair Trade Côte d'Ivoire partnership, first cooperative pilot next month, what comes next |
| **Total** | **~77.5 s** | |

## Audio (voiceover + music)

The composition ships with two audio tracks already wired in:

- `public/audio/voice.mp3` — neural TTS narration generated locally with Kokoro-82M via [kokoro-js](https://github.com/hexgrad/kokoro) (Transformers.js / ONNX). Free, offline, no API key. Script in [scripts/narration.txt](scripts/narration.txt) — see [NARRATION.md](NARRATION.md) for timing and recording notes.
- `public/audio/voice.say-samantha.mp3` — fallback narration generated with macOS `say -v Samantha`. Kept as a backup if Kokoro fails to load.
- `public/audio/music.mp3` — 78 s ambient drone synthesised with ffmpeg (E-minor sine layers + tremolo + low-pass). Mixed at 12% volume so it sits well under voice.

### Regenerate the voice (Kokoro neural TTS)

```sh
cd video
pnpm install                       # adds kokoro-js (one-time)
pnpm run gen:voice                 # default voice: af_bella
VOICE=af_nicole pnpm run gen:voice # try other voices
VOICE=bf_emma   pnpm run gen:voice # British female
VOICE=am_michael pnpm run gen:voice # American male
```

First run downloads the ~80 MB ONNX model into `node_modules` cache. The script writes `public/audio/voice.mp3` (backing up the previous run as `voice.previous.mp3`).

### Enable / disable audio in the render

Both are enabled via flags in [`src/compositions/PokouAIAutoVideo.tsx`](src/compositions/PokouAIAutoVideo.tsx):

```ts
const VOICE_ENABLED = true;
const MUSIC_ENABLED = true;
const MUSIC_VOLUME = 0.12;
```

Flip them to `false` for a silent draft render.

## What's *not* in this project (and why)

- **No iOS Simulator clips.** The phone-frame component renders the screens directly from React. No external `.mov` files, no `OffthreadVideo`, no clip-management overhead.
- **No real model inference.** The phone screens are *mocks* of the real app's screens, driven by the same [`skill_demo.json`](src/data/skill_demo.json) data file the live app uses. This keeps the video deterministic and frame-perfect.

## Where the visual content lives

| File | What it does |
|---|---|
| [src/phone/PhoneFrame.tsx](src/phone/PhoneFrame.tsx) | iPhone-style bezel + Dynamic Island + status bar; takes any children as the "screen" |
| [src/phone/MockHomeScreen.tsx](src/phone/MockHomeScreen.tsx) | Visual twin of the app's Home screen (Farmer Agent tile pulses when highlighted) |
| [src/phone/MockSkillDemoScreen.tsx](src/phone/MockSkillDemoScreen.tsx) | Visual twin of `SkillDemoScreen` — takes `stageId` + `level` props, reads same `skill_demo.json` |
| [src/phone/MockResultScreen.tsx](src/phone/MockResultScreen.tsx) | Visual twin of the Result screen with the "Adapted for X" badge |
| [src/scenes/*.tsx](src/scenes/) | Seven scenes: Title, Problem, HomeReveal, SkillDemo (auto-cycles), Architecture, Diagnosis, Outro |
| [src/compositions/PokouAIAutoVideo.tsx](src/compositions/PokouAIAutoVideo.tsx) | Master composition that sequences all scenes — adjust durations here |
| [src/data/skill_demo.json](src/data/skill_demo.json) | Same content the live app uses, copied into the video project for self-containment |

## Customising

- **Change a duration:** edit the `s(N)` calls at the top of `PokouAIAutoVideo.tsx`.
- **Change a caption:** edit the scene file directly. Captions are inline.
- **Add a scene:** create a new `scenes/*.tsx`, import in `PokouAIAutoVideo.tsx`, add a `<Sequence>` block and bump `TOTAL_FRAMES`.
- **Add voiceover:** see the "Audio" section above and [`NARRATION.md`](NARRATION.md). The composition already imports `<Audio />` — just drop the file and flip the flag.

## Sharing

After `pnpm render`, upload `video/out/pokouai.mp4` to YouTube (unlisted is fine for hackathon submissions) and paste the URL into [`docs/SUBMISSION.md`](../docs/SUBMISSION.md).
