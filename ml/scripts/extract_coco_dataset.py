"""Extract images from COCO dataset and organize by disease class.

Reads a COCO JSON annotation file and copies/links images to class-specific folders.
This prepares the data for prepare_training_data.py.

Usage:
    python extract_coco_dataset.py \
      --coco-json "path/to/_annotations.coco.json" \
      --images-dir "path/to/images" \
      --output data/raw
"""

import argparse
import json
import logging
from collections import defaultdict
from pathlib import Path
from shutil import copy2
from tqdm import tqdm

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

# Map COCO category names to standardized class names
CLASS_MAPPING = {
    "BLACKPOD": "black_pod",
    "FROSTYPOD": "frosty_pod_rot",
    "HEALTHY": "healthy",
    "MIRID": "other_damage",
    "busukbuah-monilia": "swollen_shoot",
}

EXPECTED_CLASSES = {
    "black_pod",
    "frosty_pod_rot",
    "swollen_shoot",
    "vascular_streak_dieback",
    "healthy",
    "other_damage",
}


def load_coco_json(json_path: Path) -> dict:
    """Load and parse COCO JSON file."""
    with open(json_path) as f:
        return json.load(f)


def build_image_to_class_map(coco_data: dict) -> dict:
    """Map image_id -> list of category names from annotations.
    
    Returns:
        {image_id: [category_name1, category_name2, ...], ...}
        (Multiple categories per image if multiple objects detected)
    """
    image_to_classes = defaultdict(set)
    
    # Build category id -> name mapping
    cat_id_to_name = {}
    for cat in coco_data.get("categories", []):
        cat_id_to_name[cat["id"]] = cat["name"]
    
    # Map annotations to images
    for ann in coco_data.get("annotations", []):
        image_id = ann.get("image_id")
        category_id = ann.get("category_id")
        if image_id is not None and category_id in cat_id_to_name:
            class_name = cat_id_to_name[category_id]
            image_to_classes[image_id].add(class_name)
    
    return {img_id: list(classes) for img_id, classes in image_to_classes.items()}


def extract_images(
    coco_data: dict,
    images_dir: Path,
    output_dir: Path,
    image_to_classes: dict,
) -> dict:
    """Copy images to class subdirectories.
    
    Returns:
        {class_name: count}
    """
    stats = defaultdict(int)
    
    # Build image id -> filename mapping
    image_id_to_filename = {}
    for img in coco_data.get("images", []):
        image_id_to_filename[img["id"]] = img["file_name"]
    
    # Process each image
    for image_id, class_names in image_to_classes.items():
        if image_id not in image_id_to_filename:
            continue
        
        filename = image_id_to_filename[image_id]
        src_path = images_dir / filename
        
        if not src_path.exists():
            log.warning("image not found: %s", src_path)
            continue
        
        # Map class names and copy to output folders
        for coco_class_name in class_names:
            if coco_class_name not in CLASS_MAPPING:
                log.warning("unknown class: %s", coco_class_name)
                continue
            
            target_class = CLASS_MAPPING[coco_class_name]
            dst_dir = output_dir / target_class
            dst_dir.mkdir(parents=True, exist_ok=True)
            
            dst_path = dst_dir / filename
            
            try:
                copy2(src_path, dst_path)
                stats[target_class] += 1
            except Exception as e:
                log.warning("failed to copy %s: %s", filename, e)
    
    return dict(stats)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--coco-json",
        required=True,
        type=Path,
        help="Path to COCO _annotations.coco.json file",
    )
    ap.add_argument(
        "--images-dir",
        required=True,
        type=Path,
        help="Path to directory containing images",
    )
    ap.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Output root directory for class folders",
    )
    args = ap.parse_args()
    
    # Validate inputs
    if not args.coco_json.exists():
        raise SystemExit(f"coco json not found: {args.coco_json}")
    if not args.images_dir.exists():
        raise SystemExit(f"images dir not found: {args.images_dir}")
    
    args.output.mkdir(parents=True, exist_ok=True)
    
    # Load and process
    log.info("loading coco annotations from %s", args.coco_json)
    coco_data = load_coco_json(args.coco_json)
    
    log.info("building image-to-class mapping")
    image_to_classes = build_image_to_class_map(coco_data)
    log.info("found %d images with annotations", len(image_to_classes))
    
    log.info("extracting images to %s", args.output)
    stats = extract_images(coco_data, args.images_dir, args.output, image_to_classes)
    
    total = sum(stats.values())
    log.info("done — %d images across %d classes", total, len(stats))
    for class_name in sorted(stats.keys()):
        log.info("  %-30s %6d", class_name, stats[class_name])
    
    # Show missing classes
    processed_classes = set(stats.keys())
    missing = EXPECTED_CLASSES - processed_classes
    if missing:
        log.warning("missing classes (empty): %s", sorted(missing))


if __name__ == "__main__":
    main()
