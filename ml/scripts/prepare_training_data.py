"""Normalize cocoa images for training.

Reads raw images organized by disease folder, outputs standardized JPEGs:
  - Max dimension 1024px (preserves aspect ratio)
  - RGB (drops alpha, converts grayscale)
  - Quality 90 JPEG

Usage:
    python prepare_training_data.py --input data/raw --output data/processed
"""
from __future__ import annotations

import argparse
import logging
from pathlib import Path

from PIL import Image, ImageOps
from tqdm import tqdm

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
EXPECTED_CLASSES = {
    "black_pod",
    "frosty_pod_rot",
    "swollen_shoot",
    "vascular_streak_dieback",
    "healthy",
    "other_damage",
}
MAX_DIM = 1024
JPEG_QUALITY = 90

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)


def normalize_image(src: Path, dst: Path) -> bool:
    try:
        with Image.open(src) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
            dst.parent.mkdir(parents=True, exist_ok=True)
            img.save(dst, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return True
    except Exception as e:
        log.warning("skip %s: %s", src.name, e)
        return False


def walk_classes(input_dir: Path, output_dir: Path) -> dict[str, int]:
    stats: dict[str, int] = {}
    present_classes = {p.name for p in input_dir.iterdir() if p.is_dir()}
    missing = EXPECTED_CLASSES - present_classes
    if missing:
        log.warning("missing class folders (ok if intentional): %s", sorted(missing))

    for class_dir in sorted(p for p in input_dir.iterdir() if p.is_dir()):
        class_name = class_dir.name
        out_class = output_dir / class_name
        images = [p for p in class_dir.rglob("*") if p.suffix.lower() in SUPPORTED_EXTS]
        log.info("%s: %d source images", class_name, len(images))

        ok = 0
        for idx, img_path in enumerate(tqdm(images, desc=class_name, unit="img")):
            dst = out_class / f"{class_name}_{idx:06d}.jpg"
            if normalize_image(img_path, dst):
                ok += 1
        stats[class_name] = ok
    return stats


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", required=True, type=Path, help="Raw images root")
    ap.add_argument("--output", required=True, type=Path, help="Processed output root")
    args = ap.parse_args()

    if not args.input.exists():
        raise SystemExit(f"input not found: {args.input}")
    args.output.mkdir(parents=True, exist_ok=True)

    stats = walk_classes(args.input, args.output)
    total = sum(stats.values())
    log.info("done — %d images across %d classes", total, len(stats))
    for k, v in sorted(stats.items()):
        log.info("  %-30s %6d", k, v)


if __name__ == "__main__":
    main()
