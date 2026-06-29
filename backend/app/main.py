import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api.documents.router import router as document_router
from app.api.customer.document import router as customer_document_router
from app.api.auth.router import router as auth_router
from app.api.analyst.fraud import router as analyst_fraud_router
from app.core.config import get_settings

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="VeriTrust - AI Forensic Document Fraud Detection Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(document_router, prefix="/api")
app.include_router(customer_document_router, prefix="/api/customer")
app.include_router(analyst_fraud_router)

# Ensure uploads directory exists and mount it for static file serving
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": settings.app_name}
