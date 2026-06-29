import os
import shutil
from pathlib import Path
from huggingface_hub import snapshot_download

# Determine paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "app", "models", "hf")

def download_model(repo_id: str, dest_name: str):
    print(f"Downloading {repo_id}...")
    
    # Download to HF cache
    cache_dir = snapshot_download(
        repo_id=repo_id,
        ignore_patterns=["*.msgpack", "*.h5", "*.ot", "*.ckpt", "*rust_model*"]
    )
    
    # Copy from cache to our designated local directory
    dest_path = os.path.join(MODELS_DIR, dest_name)
    if os.path.exists(dest_path):
        shutil.rmtree(dest_path)
    
    shutil.copytree(cache_dir, dest_path)
    print(f"Saved {repo_id} to {dest_path}")

def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Download LayoutLMv3
    download_model("nielsr/layoutlmv3-finetuned-funsd", "layoutlmv3")
    
    # Download ViT
    download_model("google/vit-base-patch16-224-in21k", "vit-base")
    
    print("\nAll HuggingFace models downloaded and localized successfully!")

if __name__ == "__main__":
    main()
