"""Organize downloaded datasets into uniform folder structure.

Input structure (2 datasets):
  - data/download/cacao_diseases/cacao_photos/{black_pod_rot,healthy,pod_borer}/*.jpg
  - data/download/Amini Cocoa/dataset/{images,labels}/{train,test}/*

Output structure (ready for prepare_training_data.py):
  - data/raw/{black_pod,healthy,frosty_pod_rot,swollen_shoot,vascular_streak_dieback,other_damage}/*.jpg

Usage:
    python organize_raw_data.py \
      --cacao-source data/download/cacao_diseases/cacao_photos \
      --amini-source "data/download/Amini Cocoa/dataset" \
      --output data/raw

Class mapping:
  cacao_diseases:
    - black_pod_rot → black_pod
    - healthy → healthy
    - pod_borer → other_damage

  Amini Cocoa (YOLO format, class IDs extracted from labels):
    Class ID mapping is inferred from filename patterns or set to "other_damage"
"""

import argparse
import logging
from pathlib import Path
from shutil import copy2
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

# Mapping from source class names to target class names
CACAO_DISEASES_MAPPING = {
    "black_pod_rot": "black_pod",
    "healthy": "healthy",
    "pod_borer": "other_damage",
}

# Expected output classes
EXPECTED_CLASSES = {
    "black_pod",
    "frosty_pod_rot",
    "swollen_shoot",
    "vascular_streak_dieback",
    "healthy",
    "other_damage",
}


def organize_cacao_diseases(source_dir: Path, output_dir: Path) -> dict:
    """Copy cacao_diseases images with class remapping."""
    stats = {}
    
    for src_class, dst_class in CACAO_DISEASES_MAPPING.items():
        src_path = source_dir / src_class
        if not src_path.exists():
            log.warning("source class not found: %s", src_path)
            continue
        
        dst_path = output_dir / dst_class
        dst_path.mkdir(parents=True, exist_ok=True)
        
        images = [p for p in src_path.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
        log.info("cacao_diseases/%s: %d images → %s", src_class, len(images), dst_class)
        
        copied = 0
        for img_path in tqdm(images, desc=f"cacao_diseases/{src_class}", unit="img"):
            try:
                dst_file = dst_path / img_path.name
                copy2(img_path, dst_file)
                copied += 1
            except Exception as e:
                log.warning("failed to copy %s: %s", img_path.name, e)
        
        stats[dst_class] = stats.get(dst_class, 0) + copied
    
    return stats


def extract_yolo_disease_from_labels(labels_dir: Path) -> dict:
    """Count disease class IDs in YOLO label files.
    
    Returns: {class_id: count}
    """
    class_counts = {}
    
    for label_file in labels_dir.iterdir():
        if not label_file.suffix == ".txt":
            continue
        
        try:
            with open(label_file) as f:
                for line in f:
                    parts = line.strip().split()
                    if parts:
                        class_id = int(parts[0])
                        class_counts[class_id] = class_counts.get(class_id, 0) + 1
        except Exception as e:
            log.warning("failed to read %s: %s", label_file.name, e)
    
    return class_counts


def map_yolo_class_id_to_disease(class_id: int) -> str:
    """Simple heuristic to map YOLO class ID to disease name.
    
    Without official metadata, we map conservatively:
    - Class 0 is often 'background' or 'healthy' in detection datasets
    - Classes 1+ are diseases
    - When uncertain, map to 'other_damage'
    
    This is a placeholder; update after verifying with dataset documentation.
    """
    # Placeholder mapping - adjust based on actual Amini dataset docs
    # Class 0 may be 'healthy' or a disease; Class 1,2 are likely disease variants
    mapping = {
        0: "healthy",      # Most common - likely healthy or background
        1: "other_damage",  # Disease variant 1 (frosty_pod_rot?)
        2: "other_damage",  # Disease variant 2 (swollen_shoot?)
    }
    return mapping.get(class_id, "other_damage")


def organize_amini_cocoa(source_dir: Path, output_dir: Path) -> dict:
    """Copy Amini Cocoa images, grouped by YOLO class ID."""
    stats = {}
    
    # Extract class distribution from labels
    train_labels = source_dir / "labels" / "train"
    test_labels = source_dir / "labels" / "test"
    
    train_classes = extract_yolo_disease_from_labels(train_labels)
    test_classes = extract_yolo_disease_from_labels(test_labels) if test_labels.exists() else {}
    
    log.info("amini cocoa class distribution (train): %s", train_classes)
    if test_classes:
        log.info("amini cocoa class distribution (test): %s", test_classes)
    
    # Process train images
    train_images_dir = source_dir / "images" / "train"
    train_labels_dir = source_dir / "labels" / "train"
    
    if train_images_dir.exists():
        log.info("processing amini cocoa train split...")
        for img_path in tqdm(train_images_dir.iterdir(), desc="amini_cocoa/train", unit="img"):
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            
            # Find corresponding label
            label_path = train_labels_dir / f"{img_path.stem}.txt"
            if not label_path.exists():
                log.warning("no label for %s", img_path.name)
                disease = "other_damage"
            else:
                try:
                    with open(label_path) as f:
                        first_line = f.readline().strip()
                        if first_line:
                            class_id = int(first_line.split()[0])
                            disease = map_yolo_class_id_to_disease(class_id)
                        else:
                            disease = "other_damage"
                except Exception as e:
                    log.warning("failed to read label for %s: %s", img_path.name, e)
                    disease = "other_damage"
            
            dst_path = output_dir / disease
            dst_path.mkdir(parents=True, exist_ok=True)
            
            try:
                copy2(img_path, dst_path / img_path.name)
                stats[disease] = stats.get(disease, 0) + 1
            except Exception as e:
                log.warning("failed to copy %s: %s", img_path.name, e)
    
    # Process test images (all as 'other_damage' for now - no labels for evaluation)
    test_images_dir = source_dir / "images" / "test"
    if test_images_dir.exists():
        log.info("processing amini cocoa test split (unlabeled) → other_damage...")
        disease = "other_damage"
        dst_path = output_dir / disease
        dst_path.mkdir(parents=True, exist_ok=True)
        
        for img_path in tqdm(test_images_dir.iterdir(), desc="amini_cocoa/test", unit="img"):
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            
            try:
                copy2(img_path, dst_path / img_path.name)
                stats[disease] = stats.get(disease, 0) + 1
            except Exception as e:
                log.warning("failed to copy %s: %s", img_path.name, e)
    
    return stats


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--cacao-source", required=True, type=Path,
                    help="cacao_diseases source directory")
    ap.add_argument("--amini-source", required=True, type=Path,
                    help="Amini Cocoa dataset directory")
    ap.add_argument("--output", required=True, type=Path,
                    help="Output directory (data/raw)")
    args = ap.parse_args()
    
    if not args.cacao_source.exists():
        raise SystemExit(f"cacao_source not found: {args.cacao_source}")
    if not args.amini_source.exists():
        raise SystemExit(f"amini_source not found: {args.amini_source}")
    
    args.output.mkdir(parents=True, exist_ok=True)
    
    log.info("organizing datasets into %s", args.output)
    
    # Process both datasets
    stats_cacao = organize_cacao_diseases(args.cacao_source, args.output)
    stats_amini = organize_amini_cocoa(args.amini_source, args.output)
    
    # Merge stats
    stats = {**stats_cacao}
    for k, v in stats_amini.items():
        stats[k] = stats.get(k, 0) + v
    
    # Summary
    log.info("\n" + "="*60)
    log.info("DATA ORGANIZATION COMPLETE")
    log.info("="*60)
    total = sum(stats.values())
    log.info("Total images: %d", total)
    for class_name in sorted(EXPECTED_CLASSES):
        count = stats.get(class_name, 0)
        log.info("  %-30s %6d", class_name, count)
    
    missing = EXPECTED_CLASSES - set(stats.keys())
    if missing:
        log.warning("\nMissing classes (will be empty): %s", sorted(missing))
    
    log.info("\nNext step: run prepare_training_data.py")
    log.info("  python prepare_training_data.py --input %s --output data/processed",
             args.output)


if __name__ == "__main__":
    main()
