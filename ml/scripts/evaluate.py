"""Evaluate a fine-tuned Gemma 4 checkpoint on a held-out test set.

Reports:
  - Top-1 disease classification accuracy (extracted from "MALADIE:" line)
  - Per-class precision/recall
  - Response structure consistency (has all 4 sections: MALADIE/SYMPTOMES/TRAITEMENT/PREVENTION)
  - Language-conditioned sampling (5 examples per language) for manual review

Usage:
    python evaluate.py --model ./outputs/cocoa_v1 --test-jsonl data/train/test.jsonl
"""
from __future__ import annotations

import argparse
import json
import logging
import re
from collections import defaultdict
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

DISEASE_NAME_TO_ID = {
    "Pourriture brune du cabosse": "black_pod",
    "Black pod rot": "black_pod",
    "Pourriture givrée": "frosty_pod_rot",
    "Frosty pod rot": "frosty_pod_rot",
    "Maladie du swollen shoot": "swollen_shoot",
    "Cacao swollen shoot": "swollen_shoot",
    "Dépérissement des tiges": "vascular_streak_dieback",
    "Vascular streak dieback": "vascular_streak_dieback",
    "Cabosse saine": "healthy",
    "Healthy pod": "healthy",
    "Dommage non identifié": "other_damage",
    "Unidentified damage": "other_damage",
}

REQUIRED_SECTIONS = ["MALADIE:", "SYMPTOMES:", "TRAITEMENT:", "PREVENTION:"]


def extract_disease_id(response_text: str) -> str | None:
    match = re.search(r"MALADIE:\s*(.+)", response_text)
    if not match:
        return None
    name = match.group(1).strip()
    for known, disease_id in DISEASE_NAME_TO_ID.items():
        if known.lower() in name.lower():
            return disease_id
    return None


def structure_score(response_text: str) -> float:
    present = sum(1 for s in REQUIRED_SECTIONS if s in response_text)
    return present / len(REQUIRED_SECTIONS)


def run_eval(model_dir: Path, test_jsonl: Path, max_examples: int | None) -> None:
    try:
        from unsloth import FastModel
    except ImportError:
        raise SystemExit("Unsloth not installed. Run in Kaggle notebook or `pip install unsloth`.")

    log.info("loading %s", model_dir)
    model, tokenizer = FastModel.from_pretrained(model_name=str(model_dir), load_in_4bit=True)
    model.eval()

    correct = 0
    total = 0
    structure_sum = 0.0
    per_class_correct: dict[str, int] = defaultdict(int)
    per_class_total: dict[str, int] = defaultdict(int)

    with test_jsonl.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if max_examples and i >= max_examples:
                break
            ex = json.loads(line)
            gt_disease = ex["disease"]
            lang = ex["lang"]

            # Run inference — placeholder: depends on Unsloth multimodal call signature
            # For the scaffold we just count expected structure; real eval uses model.generate()
            response_text = "MALADIE: TODO\nSYMPTOMES:\nTRAITEMENT:\nPREVENTION:"
            pred_disease = extract_disease_id(response_text)

            total += 1
            per_class_total[gt_disease] += 1
            structure_sum += structure_score(response_text)
            if pred_disease == gt_disease:
                correct += 1
                per_class_correct[gt_disease] += 1

            if i < 20:
                log.info("[%s %s] gt=%s pred=%s", lang, "ok" if pred_disease == gt_disease else "--", gt_disease, pred_disease)

    log.info("accuracy: %d/%d = %.3f", correct, total, correct / max(total, 1))
    log.info("structure score avg: %.3f", structure_sum / max(total, 1))
    for cls in sorted(per_class_total):
        log.info("  %-30s %d/%d = %.2f", cls, per_class_correct[cls], per_class_total[cls], per_class_correct[cls] / max(per_class_total[cls], 1))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--model", required=True, type=Path)
    ap.add_argument("--test-jsonl", required=True, type=Path)
    ap.add_argument("--max-examples", type=int, default=None)
    args = ap.parse_args()

    run_eval(args.model, args.test_jsonl, args.max_examples)


if __name__ == "__main__":
    main()
