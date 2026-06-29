from insightface.app import FaceAnalysis

def download_models():
    print("Downloading InsightFace models (buffalo_l)...")
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    # Calling prepare triggers the download if not present in ~/.insightface/models/
    app.prepare(ctx_id=0, det_size=(640, 640))
    print("InsightFace models cached successfully.")

if __name__ == "__main__":
    download_models()
