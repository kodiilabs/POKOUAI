"""Augment cocoa images for training robustness.

For each input image, produces N augmented variants simulating real field conditions:
  - Horizontal flip
  - Brightness / contrast shift (sun, shade)
  - JPEG compression artifacts (low-end phone camera)
  - Gaussian blur (motion, focus issues)
  - Random crop (90-100% of original)

Usage:
    python augment_images.py --input data/processed --output data/processed_aug --n-per-image 3
"""
from __future__ import annotations

import argparse
import logging
import random
from pathlib import Path

import albumentations as A
import cv2
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)


def build_pipeline() -> A.Compose:
    return A.Compose(
        [
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(brightness_limit=0.25, contrast_limit=0.25, p=0.7),
            A.ImageCompression(quality_range=(55, 95), p=0.5),
            A.GaussianBlur(blur_limit=(3, 5), p=0.25),
            A.RandomResizedCrop(size=(896, 896), scale=(0.85, 1.0), p=0.5),
            A.HueSaturationValue(hue_shift_limit=8, sat_shift_limit=15, val_shift_limit=10, p=0.4),
        ]
    )


def augment_class(class_dir: Path, out_dir: Path, n_per_image: int, pipe: A.Compose) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    images = sorted(class_dir.glob("*.jpg"))
    written = 0
    for img_path in tqdm(images, desc=class_dir.name, unit="img"):
        img = cv2.imread(str(img_path))
        if img is None:
            log.warning("unreadable: %s", img_path)
            continue
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Keep the original
        orig_out = out_dir / img_path.name
        cv2.imwrite(str(orig_out), cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
        written += 1

        for i in range(n_per_image):
            aug = pipe(image=img)["image"]
            aug_out = out_dir / f"{img_path.stem}_aug{i}.jpg"
            cv2.imwrite(str(aug_out), cv2.cvtColor(aug, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
            written += 1
    return written


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", required=True, type=Path)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--n-per-image", type=int, default=3, help="Augmented copies per source image")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    random.seed(args.seed)
    pipe = build_pipeline()

    class_dirs = [p for p in args.input.iterdir() if p.is_dir()]
    if not class_dirs:
        raise SystemExit(f"no class folders in {args.input}")

    total = 0
    for class_dir in sorted(class_dirs):
        out_class = args.output / class_dir.name
        total += augment_class(class_dir, out_class, args.n_per_image, pipe)
    log.info("done — %d images written to %s", total, args.output)


if __name__ == "__main__":
    main()
