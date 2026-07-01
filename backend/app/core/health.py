import importlib.util
import os
from typing import Any

import redis
from sqlalchemy import text

from app.core.config import get_settings


def _backend_root() -> str:
  return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _model_status(path: str, label: str) -> dict[str, str]:
  if os.path.isdir(path):
    has_weights = any(
      name.endswith((".bin", ".safetensors", ".onnx", ".pdparams"))
      for name in os.listdir(path)
    )
    if has_weights or os.path.isfile(os.path.join(path, "config.json")):
      return {"status": "ready", "path": path}
    return {"status": "partial", "path": path, "detail": f"{label} directory exists but weights may be missing"}
  return {"status": "missing", "path": path}


def check_models() -> dict[str, Any]:
  root = _backend_root()
  models: dict[str, Any] = {}

  torch_spec = importlib.util.find_spec("torch")
  models["torch"] = "available" if torch_spec else "unavailable"

  models["layoutlmv3_finetuned"] = _model_status(
    os.path.join(root, "models", "layoutlmv3_finetuned"),
    "LayoutLMv3 fine-tuned",
  )
  models["vit_finetuned"] = _model_status(
    os.path.join(root, "models", "vit_finetuned"),
    "ViT fine-tuned",
  )
  models["layoutlmv3_hf"] = _model_status(
    os.path.join(root, "models", "hf", "layoutlmv3"),
    "LayoutLMv3 HF cache",
  )
  models["vit_hf"] = _model_status(
    os.path.join(root, "models", "hf", "vit-base"),
    "ViT HF cache",
  )
  models["ocr_onnx"] = _model_status(
    os.path.join(root, "app", "models", "ocr"),
    "OCR ONNX",
  )

  if models["torch"] == "unavailable":
    models["ml_pipeline"] = "unavailable"
  else:
    finetuned_ready = any(
      models[key].get("status") == "ready"
      for key in ("layoutlmv3_finetuned", "vit_finetuned", "layoutlmv3_hf", "vit_hf")
    )
    models["ml_pipeline"] = "ready" if finetuned_ready else "fallback"

  return models


def build_health_report() -> dict[str, Any]:
  settings = get_settings()
  health: dict[str, Any] = {
    "status": "healthy",
    "service": settings.app_name,
    "db": "unknown",
    "redis": "unknown",
    "models": {},
  }

  from app.db.session import engine

  try:
    with engine.connect() as conn:
      conn.execute(text("SELECT 1"))
    health["db"] = "connected"
  except Exception as exc:
    health["db"] = "disconnected"
    health["db_error"] = str(exc)
    health["status"] = "unhealthy"

  try:
    client = redis.from_url(settings.redis_url)
    client.ping()
    health["redis"] = "connected"
  except Exception as exc:
    health["redis"] = "disconnected"
    health["redis_error"] = str(exc)
    health["status"] = "unhealthy"

  try:
    health["models"] = check_models()
    ml = health["models"].get("ml_pipeline")
    if health["status"] == "healthy" and ml in ("unavailable", "fallback"):
      health["status"] = "degraded"
  except Exception as exc:
    health["models"] = {"ml_pipeline": "unknown", "error": str(exc)}
    if health["status"] == "healthy":
      health["status"] = "degraded"

  return health
