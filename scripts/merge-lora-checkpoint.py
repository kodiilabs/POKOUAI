#!/usr/bin/env python3
"""merge-lora-checkpoint.py

Merge a LoRA checkpoint from notebook 03 into base Gemma 4 E2B and save the
merged model in HuggingFace format. Output lands in `data/results/<name>/`.

This step is what notebook 03 cell 18 does on Kaggle. We're doing it on the
Mac because the user has the checkpoint locally and wants to skip the Kaggle
round-trip. M2 Air 16 GB is right at the memory limit — the script aborts
loudly if there isn't enough free RAM rather than dying mid-load.

Usage:
    python3 scripts/merge-lora-checkpoint.py
"""

import os
import subprocess
import sys
import time
from pathlib import Path

# ── Config ───────────────────────────────────────────────────────────────
BASE_MODEL = 'google/gemma-4-e2b-it'
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHECKPOINT_DIR = PROJECT_ROOT / 'data' / 'results' / 'cocoa_v1_e2b' / 'checkpoint-4600'
OUTPUT_DIR = PROJECT_ROOT / 'data' / 'results' / 'cocoa_v1_e2b_merged_v2'

# Mac merge needs ~12 GB peak. Bail loudly under 11 GB free.
MIN_FREE_GB = 11.0

# ── Memory pre-flight ────────────────────────────────────────────────────
def free_memory_gb() -> float:
    """Parse `top -l 1 -s 0` for the 'unused' field on macOS."""
    try:
        out = subprocess.check_output(['top', '-l', '1', '-s', '0'], text=True)
        for line in out.splitlines():
            if 'PhysMem' in line:
                # PhysMem: 4567M used (...), 11432M unused.
                parts = line.split(',')[-1].strip()
                num_str = parts.split()[0]  # e.g. '11432M' or '11G'
                num = float(''.join(c for c in num_str if c.isdigit() or c == '.'))
                if num_str.endswith('G'):
                    return num
                if num_str.endswith('M'):
                    return num / 1024
        raise ValueError('PhysMem line not found in top output')
    except Exception as e:
        print(f'⚠ could not read free memory: {e}', file=sys.stderr)
        return 0.0


free = free_memory_gb()
print(f'free memory: {free:.1f} GB (need ≥ {MIN_FREE_GB} GB)')
if free < MIN_FREE_GB:
    print(f'❌ insufficient free memory ({free:.1f} GB). Reboot, close everything, retry.')
    print('   Or run on Kaggle — see notebook 03 cell 14 Mode 3.')
    sys.exit(1)
print('✓ memory check passed\n')

# ── Sanity-check inputs ──────────────────────────────────────────────────
if not CHECKPOINT_DIR.exists():
    print(f'❌ missing checkpoint: {CHECKPOINT_DIR}')
    sys.exit(1)

adapter_safe = CHECKPOINT_DIR / 'adapter_model.safetensors'
adapter_bin = CHECKPOINT_DIR / 'adapter_model.bin'
if not adapter_safe.exists() and not adapter_bin.exists():
    print(f'❌ no adapter_model.{{safetensors,bin}} in {CHECKPOINT_DIR}')
    sys.exit(1)

if OUTPUT_DIR.exists() and any(OUTPUT_DIR.iterdir()):
    print(f'⚠ {OUTPUT_DIR} already exists and is non-empty. Aborting to avoid overwrite.')
    print(f'   Delete it manually if you want to re-merge: rm -rf {OUTPUT_DIR}')
    sys.exit(1)

# ── Heavy imports (after pre-flight, so the script bails fast on bad state) ──
print('importing transformers + peft (this takes ~10 s)...')
import torch
from transformers import AutoModelForImageTextToText
from peft import PeftModel
print('✓ imports done\n')

# ── Load base model ──────────────────────────────────────────────────────
t0 = time.time()
print(f'loading base model: {BASE_MODEL}')
print('  (first run downloads ~10 GB from HF; subsequent runs use the cache)')
base = AutoModelForImageTextToText.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.float16,
    device_map='cpu',
    low_cpu_mem_usage=True,
)
print(f'✓ base loaded ({time.time() - t0:.0f}s, free now: {free_memory_gb():.1f} GB)\n')

# ── Attach LoRA ──────────────────────────────────────────────────────────
print(f'attaching LoRA from: {CHECKPOINT_DIR}')
m = PeftModel.from_pretrained(base, str(CHECKPOINT_DIR))
print(f'✓ LoRA attached (free now: {free_memory_gb():.1f} GB)\n')

# ── Merge + save ─────────────────────────────────────────────────────────
print('merging LoRA into base weights (in-place)...')
m = m.merge_and_unload()
print(f'✓ merged (free now: {free_memory_gb():.1f} GB)\n')

print(f'saving merged model to: {OUTPUT_DIR}')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
m.save_pretrained(str(OUTPUT_DIR), safe_serialization=True)

# Save tokenizer/processor too — needed for the GGUF conversion step
from transformers import AutoProcessor
processor = AutoProcessor.from_pretrained(BASE_MODEL)
processor.save_pretrained(str(OUTPUT_DIR))

elapsed = (time.time() - t0) / 60
out_size = subprocess.check_output(['du', '-sh', str(OUTPUT_DIR)]).decode().split()[0]
print(f'\n✓ done in {elapsed:.1f} min  ({out_size} on disk)')
print(f'  next: pass {OUTPUT_DIR} to llama.cpp convert_hf_to_gguf.py + llama-quantize')
print('  (or upload to Kaggle and run notebook 04 cell 6+ to quantize)')
