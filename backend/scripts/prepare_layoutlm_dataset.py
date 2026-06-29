import argparse
import json
import logging
import os
import zipfile
from pathlib import Path
import concurrent.futures
import multiprocessing

from PIL import Image
from datasets import Dataset, Features, Sequence, Value, Image as DatasetsImage

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global OCR service for the worker process
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

def process_single_document(args):
    """Processes a single document. Runs inside a worker process."""
    idx, json_filename, extract_dir, all_files_set = args
    
    json_path = os.path.join(extract_dir, json_filename)
    
    try:
        with open(json_path, 'r') as f:
            meta = json.load(f)
    except Exception as e:
        return {"error": f"Failed to load JSON {json_path}: {e}"}
        
    img_filename = json_filename.replace('.json', '.png')
    if img_filename not in all_files_set:
        img_filename = json_filename.replace('.json', '.jpg')
        
    if img_filename not in all_files_set:
        return {"error": f"Image not found for {json_filename}"}

    img_path = os.path.join(extract_dir, img_filename)
    
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
            
        label_str = meta.get("label", "genuine").lower()
        label_int = 1 if label_str == "forged" else 0
        forgery_type = meta.get("forgery_type", "")
        
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

def prepare_dataset(zip_path: str, extract_dir: str, output_dir: str, sample_size: int = None):
    logger.info(f"Extracting all files from {zip_path} to {extract_dir} (This avoids ZIP thread-locking)...")
    
    os.makedirs(extract_dir, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        all_files = zip_ref.namelist()
        json_files = [f for f in all_files if f.endswith('.json')]
        
        if sample_size:
            json_files = json_files[:sample_size]
            
        # Extract only the needed files in bulk to avoid disk I/O bottlenecks later
        needed_files = set()
        for jf in json_files:
            needed_files.add(jf)
            needed_files.add(jf.replace('.json', '.png'))
            needed_files.add(jf.replace('.json', '.jpg'))
            
        files_to_extract = [f for f in all_files if f in needed_files]
        zip_ref.extractall(path=extract_dir, members=files_to_extract)
        
        all_files_set = set(files_to_extract)

    logger.info(f"Successfully extracted {len(files_to_extract)} files. Starting Multiprocessing OCR...")
    
    data = {
        "id": [],
        "image": [],
        "words": [],
        "bboxes": [],
        "label": [],
        "forgery_type": []
    }
    
    # Prepare arguments for multiprocessing
    tasks = [(i, jf, extract_dir, all_files_set) for i, jf in enumerate(json_files)]
    
    # Use max cores but cap at 8 to prevent memory explosion from PaddleOCR models
    num_cores = min(multiprocessing.cpu_count() // 2 or 1, 8)
    logger.info(f"Spinning up {num_cores} independent AI workers...")

    successful_count = 0
    with concurrent.futures.ProcessPoolExecutor(max_workers=num_cores, initializer=init_worker) as executor:
        for result in executor.map(process_single_document, tasks):
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
    
    logger.info(f"Saving parallelized dataset to {output_dir}...")
    dataset.save_to_disk(output_dir)
    logger.info("Done! The dataset is ready for LayoutLMv3 Training.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare LayoutLMv3 Dataset using Multiprocessing")
    parser.add_argument("--zip-path", type=str, default="datasets/output.zip", help="Path to output.zip")
    parser.add_argument("--extract-dir", type=str, default="datasets/extracted", help="Temp dir for extraction")
    parser.add_argument("--output-dir", type=str, default="datasets/layoutlm_dataset", help="Output HF dataset dir")
    parser.add_argument("--sample-size", type=int, default=None, help="Number of files to process")
    
    args = parser.parse_args()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(base_dir, args.zip_path)
    extract_dir = os.path.join(base_dir, args.extract_dir)
    output_dir = os.path.join(base_dir, args.output_dir)
    
    prepare_dataset(zip_path, extract_dir, output_dir, args.sample_size)
