import os
import subprocess
from pathlib import Path
from paddleocr import PaddleOCR

def convert_to_onnx(model_dir: str, save_path: str):
    """Convert a downloaded Paddle model to ONNX using paddle2onnx."""
    print(f"Converting {model_dir} to ONNX...")
    # PaddleOCR models have inference.pdmodel and inference.pdiparams
    cmd = [
        "paddle2onnx",
        "--model_dir", model_dir,
        "--model_filename", "inference.pdmodel",
        "--params_filename", "inference.pdiparams",
        "--save_file", save_path,
        "--opset_version", "11",
        "--enable_onnx_checker", "True"
    ]
    subprocess.run(cmd, check=True)
    print(f"Saved ONNX model to {save_path}")

def main():
    print("Initializing PaddleOCR to trigger model downloads...")
    # This triggers the download of the default English PP-OCRv4 models
    ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=True, use_gpu=False)
    
    # PaddleOCR stores models in ~/.paddleocr/whl/ by default
    home = str(Path.home())
    det_src = os.path.join(home, ".paddleocr", "whl", "det", "en", "en_PP-OCRv3_det_infer")
    cls_src = os.path.join(home, ".paddleocr", "whl", "cls", "ch_ppocr_mobile_v2.0_cls_infer")
    rec_src = os.path.join(home, ".paddleocr", "whl", "rec", "en", "en_PP-OCRv4_rec_infer")
    
    # We will save the ONNX models into the app/models/ocr directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dest_dir = os.path.join(base_dir, "app", "models", "ocr")
    os.makedirs(dest_dir, exist_ok=True)
    
    det_dest = os.path.join(dest_dir, "det.onnx")
    cls_dest = os.path.join(dest_dir, "cls.onnx")
    rec_dest = os.path.join(dest_dir, "rec.onnx")
    
    # Convert models
    convert_to_onnx(det_src, det_dest)
    convert_to_onnx(cls_src, cls_dest)
    convert_to_onnx(rec_src, rec_dest)
    
    print("\nAll models downloaded and converted to ONNX successfully!")

if __name__ == "__main__":
    main()
