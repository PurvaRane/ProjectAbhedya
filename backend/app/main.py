import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from sqlalchemy import text
import redis
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.middleware.base import BaseHTTPMiddleware
class LimitUploadSize(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int) -> None:
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            if "content-length" in request.headers:
                content_length = int(request.headers.get("content-length"))
                if content_length > self.max_upload_size:
                    from fastapi.responses import JSONResponse
                    return JSONResponse(status_code=413, content={"detail": "Payload too large. Maximum size is 10MB."})
        return await call_next(request)

app.add_middleware(LimitUploadSize, max_upload_size=10 * 1024 * 1024)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth_router, prefix="/api")

app.include_router(customer_document_router, prefix="/api/customer")
app.include_router(analyst_fraud_router)

# Ensure uploads directory exists
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/faces", exist_ok=True)

@app.get("/uploads/{file_path:path}")
def serve_upload(file_path: str, request: Request):
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    from app.core.security import decode_token
    
    token = request.cookies.get("access_token")
    if not token:
        # Check Authorization header as fallback
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    actor_type = payload.get("type")
    if not actor_type:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    full_path = os.path.join("uploads", file_path)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    # Security: Prevent path traversal
    if ".." in full_path or not os.path.abspath(full_path).startswith(os.path.abspath("uploads")):
        raise HTTPException(status_code=403, detail="Access denied")
        
    # In a fully strict system, we would do a DB lookup for customers to verify ownership.
    # For now, we enforce authentication. Employees can view all, Customers can theoretically view any if they guess the UUID.
    return FileResponse(full_path)

@app.get("/api/health")
@limiter.limit("60/minute")
def health_check(request: Request):
    from app.db.session import engine
    health = {"status": "healthy", "service": settings.app_name, "db": "unknown", "redis": "unknown"}
    
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health["db"] = "connected"
    except Exception as e:
        health["db"] = "disconnected"
        health["status"] = "unhealthy"
        
    try:
        r = redis.from_url(settings.redis_url)
        r.ping()
        health["redis"] = "connected"
    except Exception as e:
        health["redis"] = "disconnected"
        health["status"] = "unhealthy"
        
    return health
