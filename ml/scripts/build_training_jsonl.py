"""Convert (image, disease) pairs into Gemma 4 multimodal conversation JSONL.

Output format (one JSON object per line):
  {
    "messages": [
      {"role": "user", "content": [
          {"type": "image", "path": "<abs or rel path>"},
          {"type": "text", "text": "<prompt in target language>"}
        ]},
      {"role": "assistant", "content": [
          {"type": "text", "text": "<structured response>"}
        ]}
    ],
    "lang": "fr",
    "disease": "black_pod"
  }

Each image generates one training example per language.
Split into train/val/test (80/10/10) deterministically.

Usage:
    python build_training_jsonl.py \
      --images data/processed_aug \
      --diseases data/cocoa_diseases.json \
      --out-dir data/train
"""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import random
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

USER_PROMPTS = {
    "fr": "Regarde cette photo de cabosse de cacao. Quelle maladie est-ce, et que dois-je faire ?",
    "en": "Look at this cocoa pod photo. What disease is this, and what should I do?",
    "dyu": "[FR→DYU à valider] Regarde cette photo de cabosse de cacao. Quelle maladie est-ce ?",
    "bci": "[FR→BCI à valider] Regarde cette photo de cabosse de cacao. Quelle maladie est-ce ?",
}


def format_response(disease_entry: dict, lang: str) -> str:
    name = disease_entry["names"][lang]
    symptoms = disease_entry["symptoms"][lang]
    treatment = disease_entry["treatment"][lang]
    prevention = disease_entry["prevention"][lang]
    agronomist = disease_entry["when_to_call_agronomist"][lang]

    return (
        f"MALADIE: {name}\n\n"
        f"SYMPTOMES:\n- " + "\n- ".join(symptoms) + "\n\n"
        f"TRAITEMENT:\n- " + "\n- ".join(treatment) + "\n\n"
        f"PREVENTION:\n- " + "\n- ".join(prevention) + "\n\n"
        f"AGRONOME: {agronomist}"
    )


def deterministic_split(path: Path, seed: str = "pokouai-v1") -> str:
    digest = hashlib.sha1(f"{seed}:{path.name}".encode()).hexdigest()
    bucket = int(digest[:4], 16) % 100
    if bucket < 80:
        return "train"
    if bucket < 90:
        return "val"
    return "test"


def build(images_root: Path, diseases_path: Path, out_dir: Path, langs: list[str]) -> None:
    diseases = json.loads(diseases_path.read_text(encoding="utf-8"))["diseases"]
    out_dir.mkdir(parents=True, exist_ok=True)

    writers: dict[str, object] = {
        split: (out_dir / f"{split}.jsonl").open("w", encoding="utf-8")
        for split in ("train", "val", "test")
    }
    counts = {"train": 0, "val": 0, "test": 0}

    try:
        for class_dir in sorted(p for p in images_root.iterdir() if p.is_dir()):
            disease_id = class_dir.name
            if disease_id not in diseases:
                log.warning("unknown disease folder: %s (skipped)", disease_id)
                continue
            entry = diseases[disease_id]
            images = sorted(class_dir.glob("*.jpg"))
            log.info("%s: %d images × %d langs = %d examples", disease_id, len(images), len(langs), len(images) * len(langs))

            for img_path in images:
                split = deterministic_split(img_path)
                for lang in langs:
                    example = {
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "image", "path": str(img_path.resolve())},
                                    {"type": "text", "text": USER_PROMPTS[lang]},
                                ],
                            },
                            {
                                "role": "assistant",
                                "content": [{"type": "text", "text": format_response(entry, lang)}],
                            },
                        ],
                        "lang": lang,
                        "disease": disease_id,
                    }
                    writers[split].write(json.dumps(example, ensure_ascii=False) + "\n")
                    counts[split] += 1
    finally:
        for w in writers.values():
            w.close()

    log.info("done — train=%d val=%d test=%d", counts["train"], counts["val"], counts["test"])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--images", required=True, type=Path, help="Augmented images root (one subfolder per disease)")
    ap.add_argument("--diseases", required=True, type=Path, help="cocoa_diseases.json")
    ap.add_argument("--out-dir", required=True, type=Path)
    ap.add_argument("--langs", nargs="+", default=["fr", "en", "dyu", "bci"])
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    random.seed(args.seed)
    build(args.images, args.diseases, args.out_dir, args.langs)


if __name__ == "__main__":
    main()
