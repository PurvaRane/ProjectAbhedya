import argparse
import logging
import os
import zipfile
import concurrent.futures
import multiprocessing

from PIL import Image
from datasets import Dataset, Features, Sequence, Value, Image as DatasetsImage

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

worker_ocr_service = None

def init_worker():
    """Initializes the OCRService once per worker process to avoid massive memory duplication issues."""
    global worker_ocr_service
    from app.services.ocr_service import OCRService
    worker_ocr_service = OCRService()

def normalize_box(bbox: list[list[float]], width: int, height: int) -> list[int]:
    xs = [pt[0] for pt in bbox]
    ys = [pt[1] for pt in bbox]
    xmin, xmax = min(xs), max(xs)
    ymin, ymax = min(ys), max(ys)
    
    return [
        max(0, min(1000, int(1000 * (xmin / width)))),
        max(0, min(1000, int(1000 * (ymin / height)))),
        max(0, min(1000, int(1000 * (xmax / width)))),
        max(0, min(1000, int(1000 * (ymax / height)))),
    ]

def process_single_image(args):
    """Processes a single image document. Runs inside a worker process."""
    idx, img_path = args
    
    # Heuristics for label based on path
    path_lower = img_path.lower()
    label_int = 1 if "forged" in path_lower else 0
    forgery_type = "directory_classification" # Fallback type for this dataset
    
    try:
        img = Image.open(img_path).convert("RGB")
        width, height = img.size
    except Exception as e:
        return {"error": f"Failed to load image {img_path}: {e}"}
        
    try:
        # Run OCR using the worker's global instance
        ocr_results = worker_ocr_service.extract(img_path)
        lines = ocr_results["lines"]
        
        words = []
        bboxes = []
        
        for line in lines:
            words.append(line["text"])
            bboxes.append(normalize_box(line["bbox"], width, height))
            
        return {
            "success": True,
            "id": str(idx),
            "image": img_path,
            "words": words,
            "bboxes": bboxes,
            "label": label_int,
            "forgery_type": forgery_type
        }
    except Exception as e:
        return {"error": f"OCR failed for {img_path}: {e}"}

def prepare_dataset(zip_path: str, extract_dir: str, output_dir: str):
    logger.info(f"Extracting all files from {zip_path} to {extract_dir} (This avoids ZIP thread-locking)...")
    
    os.makedirs(extract_dir, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(path=extract_dir)

    # Walk through the extracted directory to find all images
    image_paths = []
    for root, _, files in os.walk(extract_dir):
        # Ignore macOS hidden folders
        if "__MACOSX" in root:
            continue
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_paths.append(os.path.join(root, file))

    logger.info(f"Successfully extracted and found {len(image_paths)} images. Starting Multiprocessing OCR...")
    
    if len(image_paths) == 0:
        logger.error("No images found! Halting.")
        return

    data = {
        "id": [],
        "image": [],
        "words": [],
        "bboxes": [],
        "label": [],
        "forgery_type": []
    }
    
    # Prepare arguments for multiprocessing
    tasks = [(i, img_path) for i, img_path in enumerate(image_paths)]
    
    # Use max cores but cap at 8 to prevent memory explosion from PaddleOCR models
    num_cores = min(multiprocessing.cpu_count() // 2 or 1, 8)
    logger.info(f"Spinning up {num_cores} independent AI workers...")

    successful_count = 0
    with concurrent.futures.ProcessPoolExecutor(max_workers=num_cores, initializer=init_worker) as executor:
        for result in executor.map(process_single_image, tasks):
            if result.get("success"):
                data["id"].append(result["id"])
                data["image"].append(result["image"])
                data["words"].append(result["words"])
                data["bboxes"].append(result["bboxes"])
                data["label"].append(result["label"])
                data["forgery_type"].append(result["forgery_type"])
                successful_count += 1
                if successful_count % 100 == 0:
                    logger.info(f"Processed {successful_count} / {len(tasks)} documents...")
            else:
                logger.error(result.get("error"))

    logger.info(f"Finished OCR extraction. Creating HuggingFace Dataset from {successful_count} valid documents...")
    features = Features({
        "id": Value(dtype="string"),
        "image": DatasetsImage(),
        "words": Sequence(Value(dtype="string")),
        "bboxes": Sequence(Sequence(Value(dtype="int64"))),
        "label": Value(dtype="int64"),
        "forgery_type": Value(dtype="string")
    })
    
    dataset = Dataset.from_dict(data, features=features)
    
    logger.info(f"Saving parallelized directory dataset to {output_dir}...")
    dataset.save_to_disk(output_dir)
    logger.info("Done! The dataset is ready for LayoutLMv3 Training.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare Directory-Based Dataset using Multiprocessing")
    parser.add_argument("--zip-path", type=str, default="datasets/datasetpart2.zip", help="Path to the directory-based zip")
    parser.add_argument("--extract-dir", type=str, default="datasets/extracted_part2", help="Temp dir for extraction")
    parser.add_argument("--output-dir", type=str, default="datasets/layoutlm_dataset_part2", help="Output HF dataset dir")
    
    args = parser.parse_args()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(base_dir, args.zip_path)
    extract_dir = os.path.join(base_dir, args.extract_dir)
    output_dir = os.path.join(base_dir, args.output_dir)
    
    prepare_dataset(zip_path, extract_dir, output_dir)
