FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    cmake \
    libpq-dev \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Download and convert PaddleOCR models to ONNX
RUN python scripts/download_ocr_models.py

# Download HuggingFace Models for LayoutLMv3 and ViT offline usage
RUN python scripts/download_hf_models.py

# Download InsightFace models for offline face verification
RUN python scripts/download_face_models.py

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python scripts/seed_employees.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]