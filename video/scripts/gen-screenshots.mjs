#!/usr/bin/env node
// Render the four screenshot compositions (Home, Result, two Farmer Agent
// stages) as 1080×1920 PNGs into ../docs/screenshots/.
//
// Usage:
//   pnpm run gen:screenshots
//
// Output goes to the repo's docs/screenshots/ folder so README and SUBMISSION
// can reference them with relative paths.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIDEO_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(VIDEO_ROOT, '..');
const OUT_DIR = resolve(REPO_ROOT, 'docs/screenshots');

const SHOTS = [
  { id: 'Screenshot-Home', file: '01-home.png' },
  { id: 'Screenshot-Result', file: '02-result.png' },
  { id: 'Screenshot-SkillDemo-Diagnose', file: '03-skill-demo-novice.png' },
  { id: 'Screenshot-SkillDemo-Lesson', file: '04-skill-demo-expert.png' },
];

function log(msg) {
  console.log(`[gen-screenshots] ${msg}`);
}

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  log(`Output → ${OUT_DIR}`);

  for (const shot of SHOTS) {
    const outPath = resolve(OUT_DIR, shot.file);
    const start = Date.now();
    log(`Rendering ${shot.id} → ${shot.file}`);
    const r = spawnSync(
      'npx',
      ['remotion', 'still', '--log=warn', shot.id, outPath],
      { stdio: 'inherit', cwd: VIDEO_ROOT },
    );
    if (r.status !== 0) {
      throw new Error(`remotion still failed for ${shot.id} (exit ${r.status})`);
    }
    if (!existsSync(outPath)) {
      throw new Error(`Expected ${outPath} but it wasn't created`);
    }
    const kb = (statSync(outPath).size / 1024).toFixed(0);
    log(`  ✓ ${shot.file} (${kb} KB, ${((Date.now() - start) / 1000).toFixed(1)}s)`);
  }

  log(`Done. ${SHOTS.length} PNGs in ${OUT_DIR}`);
}

try {
  main();
} catch (err) {
  console.error('[gen-screenshots] failed:', err);
  process.exit(1);
}
