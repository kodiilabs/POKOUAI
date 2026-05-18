# PokouAI demo video — narration script

A 62.5-second voiceover, scene-by-scene, with frame-accurate cues so a recorded MP3 lines up with the Remotion composition without re-cutting.

## Timing budget (30 fps)

| Scene | Range (s) | Frames | Words target (~150 wpm) |
|---|---|---|---|
| Title | 0.0–5.0 | 0–150 | ~12 |
| Problem | 5.0–12.0 | 150–360 | ~17 |
| Home reveal | 12.0–17.0 | 360–510 | ~12 |
| Skill demo | 17.0–39.5 | 510–1185 | ~55 |
| Architecture | 39.5–46.5 | 1185–1395 | ~17 |
| Diagnosis | 46.5–53.5 | 1395–1605 | ~17 |
| Outro | 53.5–62.5 | 1605–1875 | ~22 |
| **Total** | **62.5 s** | **1875** | **~150** |

## Script

> Voice direction: warm, calm, confident. Slight pace lift on numbers. Pause where the table says `(beat)`.

**[0:00 — Title]**
PokouAI. An offline AI advisor for cocoa farmers in Côte d'Ivoire. (beat)

**[0:05 — Problem]**
Cocoa farmers lose thirty to forty percent of their harvest to preventable diseases. Extension agents are scarce. The internet is unreliable. And most apps assume a phone the farmer doesn't have.

**[0:12 — Home reveal]**
PokouAI runs on a fifty-dollar Android. In the farmer's own language. Even in airplane mode.

**[0:17 — Skill demo]**
Behind every diagnosis is a Farmer Agent. (beat) Same disease. Same image. Three different farmers. The first is in her first season — she hears the full story and step-by-step treatment. The second has a few years of experience — she gets confirmation and money framing. The expert gets a one-line check and farmer-led discussion. The agent never says any of this out loud. It just adapts.

**[0:39.5 — Architecture]**
Three tiers. The phone, always available. A cooperative-hub laptop running Ollama, no internet needed. The cloud when it's there. The router picks the best one — automatically.

**[0:46.5 — Diagnosis]**
Point. Capture. Diagnosis in seconds, with confidence, tier, and a personalised badge. Then a seven-day scientific loop turns the field into a classroom.

**[0:53.5 — Outro]**
Honest build. Real next step. (beat) Partnering with Fair Trade Côte d'Ivoire. The first cooperative pilot starts next month. (beat) PokouAI.

## How to record

The script lives at [scripts/narration.txt](scripts/narration.txt) (plain text). Three paths to a voice file:

### 1. Kokoro neural TTS (default — free, offline, no API key)

```sh
cd video
pnpm install                       # one-time: pulls kokoro-js
pnpm run gen:voice                 # default voice: af_bella (American female)
VOICE=af_nicole pnpm run gen:voice # try a different voice
```

Voices to try: `af_bella`, `af_nicole`, `af_sarah`, `bf_emma` (British female), `am_michael`, `am_adam`, `bm_george` (British male). The script writes `public/audio/voice.mp3` and backs up the previous render as `voice.previous.mp3`. First run downloads a ~80 MB ONNX model into the `node_modules` cache.

### 2. macOS `say` (already done — backup file kept)

```sh
say -v Samantha -r 165 -f scripts/narration.txt -o voice.aiff
ffmpeg -y -i voice.aiff -b:a 192k public/audio/voice.mp3
```

This is what produced the original `voice.say-samantha.mp3` backup. Sounds robotic — Kokoro is the recommended path.

### 3. Self-record

Phone voice memo in a quiet room, export as `voice.m4a`, convert:

```sh
ffmpeg -y -i voice.m4a -b:a 192k public/audio/voice.mp3
```

Aim for a single take, ~77 s. If a take overruns by more than two seconds, re-record — silence-trim in post adds artefacts.

## Enable in the render

In [`src/compositions/PokouAIAutoVideo.tsx`](src/compositions/PokouAIAutoVideo.tsx) the flags are already on:

```ts
const VOICE_ENABLED = true;
const MUSIC_ENABLED = true;
```

`pnpm render` bakes the voice + music bed (12% volume) into the MP4.

## Music suggestions

Licence-clean, royalty-free, instrumental, calm, ~62 seconds:

- **Pixabay Music** (CC0): search "calm corporate" or "uplifting acoustic"
- **YouTube Audio Library**: filter Mood = Calm, Genre = Cinematic, Duration ≤ 1 min
- **Freesound.org** (CC-BY): credit the author in the YouTube description if you use a CC-BY track

Avoid anything with a drop or vocals — the voiceover is the focus.

## Quick sanity check

After install:

```sh
cd video
pnpm render
open out/pokouai.mp4
```

Watch the first ten seconds. Voice and image are in sync if "PokouAI" lands on the title card and "thirty to forty percent" lands on the problem scene's first stat.
