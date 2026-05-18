#!/usr/bin/env node
// Generate public/audio/voice.mp3 from a *timed* narration script using
// Kokoro-82M (Transformers.js / ONNX). Free, offline, local.
//
// Each segment is generated separately at speed=1.0 (natural pace) and
// positioned at its target start time. The final track length matches
// the video composition (77.5 s).
//
// Usage:
//   pnpm run gen:voice                # default voice (af_bella)
//   VOICE=am_michael pnpm run gen:voice
//   VOICE=bf_emma pnpm run gen:voice
//
// On success the previous voice.mp3 is rotated to voice.previous.mp3.

import { KokoroTTS } from 'kokoro-js';
import {
  writeFileSync,
  existsSync,
  renameSync,
  mkdirSync,
  statSync,
  unlinkSync,
  rmSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC_AUDIO = resolve(ROOT, 'public/audio');
const SEGMENTS_DIR = resolve(PUBLIC_AUDIO, '_segments');
const FINAL_WAV = resolve(PUBLIC_AUDIO, 'voice.wav');
const MP3_PATH = resolve(PUBLIC_AUDIO, 'voice.mp3');
const STAGING_MP3 = resolve(PUBLIC_AUDIO, 'voice.new.mp3');
const PREV_MP3 = resolve(PUBLIC_AUDIO, 'voice.previous.mp3');

const VOICE = process.env.VOICE ?? 'af_bella';
const SPEED = Number(process.env.SPEED ?? 1.0);
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const DTYPE = process.env.KOKORO_DTYPE ?? 'q8';

// Total video runtime in seconds — must match TOTAL_FRAMES / fps in the
// Remotion composition (see src/compositions/PokouAIAutoVideo.tsx).
const TOTAL_SECONDS = 77.5;

// Each segment lands at startSec in the final track. Segment durations are
// determined by Kokoro at runtime; gaps between segments become silence.
// Start times chosen to leave a ~0.4s gap after each segment's natural end
// (durations measured empirically across runs). The script logs an
// overlap warning when any segment runs into the next.
const SEGMENTS = [
  { id: 'title', startSec: 0.5, text: "PokouAI. An offline AI advisor for cocoa farmers in Côte d'Ivoire." },
  { id: 'problem', startSec: 7.2, text: "Cocoa farmers lose thirty to forty percent of their harvest to preventable diseases. Extension agents are scarce, and most apps assume a phone the farmer doesn't have." },
  { id: 'home', startSec: 19.1, text: "PokouAI runs on a fifty dollar Android, in the farmer's own language, even in airplane mode." },
  { id: 'agent_intro', startSec: 26.8, text: "Behind every diagnosis is a Farmer Agent." },
  { id: 'skill_demo', startSec: 31.4, text: "Same disease, same image, three farmers. The novice hears the full story and step by step treatment. The practitioner gets confirmation and money framing. The expert gets a one line check. The agent just adapts." },
  { id: 'arch', startSec: 47.1, text: "Three tiers: the phone, the cooperative hub on Ollama, and the cloud. The router picks the best, automatically." },
  { id: 'diagnosis', startSec: 55.6, text: "Point. Capture. Diagnosis in seconds, with a personalised badge. A seven day loop turns the field into a classroom." },
  { id: 'honest', startSec: 64.9, text: "Honest build. Real next step." },
  { id: 'partnership', startSec: 68.3, text: "Partnering with Fair Trade Côte d'Ivoire. The first cooperative pilot starts next month." },
  { id: 'closing', startSec: 75.0, text: "PokouAI." },
];

function log(msg) {
  console.log(`[gen-voice] ${msg}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} → exit ${r.status}`);
  }
  return r;
}

async function main() {
  log(`Voice: ${VOICE} · speed: ${SPEED} · target runtime: ${TOTAL_SECONDS}s · segments: ${SEGMENTS.length}`);
  mkdirSync(PUBLIC_AUDIO, { recursive: true });
  if (existsSync(SEGMENTS_DIR)) rmSync(SEGMENTS_DIR, { recursive: true });
  mkdirSync(SEGMENTS_DIR, { recursive: true });

  log('Loading Kokoro model (first run downloads ~80 MB to node_modules cache)…');
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: DTYPE });

  // 1) Generate each segment as a WAV at its natural length.
  const segmentFiles = [];
  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    const start = Date.now();
    const audio = await tts.generate(seg.text, { voice: VOICE, speed: SPEED });
    if (!audio || !audio.audio) {
      throw new Error(`Segment "${seg.id}" produced no audio`);
    }
    const wavPath = join(SEGMENTS_DIR, `${String(i).padStart(2, '0')}-${seg.id}.wav`);
    writeFileSync(wavPath, Buffer.from(audio.toWav()));
    const dur = audio.audio.length / audio.sampling_rate;
    log(`  [${i + 1}/${SEGMENTS.length}] ${seg.id.padEnd(12)} start=${seg.startSec.toFixed(1)}s len=${dur.toFixed(2)}s gen=${((Date.now() - start) / 1000).toFixed(1)}s`);
    segmentFiles.push({ path: wavPath, startSec: seg.startSec, id: seg.id, durSec: dur });
  }

  // 2) Validate timeline — segments shouldn't overlap.
  for (let i = 1; i < segmentFiles.length; i++) {
    const prev = segmentFiles[i - 1];
    const cur = segmentFiles[i];
    const prevEnd = prev.startSec + prev.durSec;
    if (prevEnd > cur.startSec + 0.05) {
      log(`  ⚠ overlap: "${prev.id}" ends at ${prevEnd.toFixed(2)}s but "${cur.id}" starts at ${cur.startSec.toFixed(2)}s`);
    }
  }
  const lastSeg = segmentFiles[segmentFiles.length - 1];
  log(`Last segment "${lastSeg.id}" ends at ${(lastSeg.startSec + lastSeg.durSec).toFixed(2)}s (target ${TOTAL_SECONDS}s)`);

  // 3) Stitch with ffmpeg — each input is delayed to its start time, all are mixed.
  log('Stitching segments with ffmpeg (adelay + amix)…');
  const inputs = segmentFiles.flatMap((s) => ['-i', s.path]);
  const delayFilters = segmentFiles
    .map((s, i) => `[${i}:a]adelay=${Math.round(s.startSec * 1000)}|${Math.round(s.startSec * 1000)}[d${i}]`)
    .join(';');
  const mixInputs = segmentFiles.map((_, i) => `[d${i}]`).join('');
  const filter = `${delayFilters};${mixInputs}amix=inputs=${segmentFiles.length}:duration=longest:normalize=0,apad=whole_dur=${TOTAL_SECONDS},atrim=0:${TOTAL_SECONDS}`;

  run('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex',
    filter,
    '-ar',
    '24000',
    FINAL_WAV,
  ]);

  if (!existsSync(FINAL_WAV)) {
    throw new Error(`Final WAV was not produced at ${FINAL_WAV}`);
  }
  const wavSize = statSync(FINAL_WAV).size;
  log(`Stitched WAV: ${(wavSize / 1024).toFixed(0)} KB`);

  // 4) Encode WAV → staging MP3, then promote.
  log('Encoding WAV → MP3 (192 kbps)…');
  run('ffmpeg', ['-y', '-i', FINAL_WAV, '-b:a', '192k', '-ar', '44100', STAGING_MP3]);
  if (!existsSync(STAGING_MP3)) {
    throw new Error(`ffmpeg did not produce ${STAGING_MP3}`);
  }
  if (existsSync(MP3_PATH)) {
    log('Rotating previous voice.mp3 → voice.previous.mp3');
    renameSync(MP3_PATH, PREV_MP3);
  }
  renameSync(STAGING_MP3, MP3_PATH);

  // 5) Clean up intermediates.
  try {
    unlinkSync(FINAL_WAV);
  } catch {
    /* ignore */
  }
  try {
    rmSync(SEGMENTS_DIR, { recursive: true });
  } catch {
    /* ignore */
  }

  const mp3Size = statSync(MP3_PATH).size;
  log(`Done. New voice at ${MP3_PATH} (${(mp3Size / 1024).toFixed(0)} KB)`);
  log(
    'Tip: try other voices via VOICE=… ' +
      '(af_bella, af_nicole, af_sarah, bf_emma, am_michael, am_adam, bm_george)',
  );
}

main().catch((err) => {
  console.error('[gen-voice] failed:', err);
  process.exit(1);
});
