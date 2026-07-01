import logging
from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from redis.exceptions import RedisError
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


def employee_login_error_response(exc: Exception) -> HTTPException:
  """Map infrastructure failures during employee login to clear API errors."""
  if isinstance(exc, RedisError):
    logger.warning("Employee login Redis failure: %s", exc)
    return HTTPException(
      status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
      detail="OTP service is temporarily unavailable. Check Redis and try again.",
      headers={"X-Error-Code": "redis_unavailable"},
    )

  if isinstance(exc, SQLAlchemyError):
    logger.exception("Employee login database failure")
    return HTTPException(
      status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
      detail="Database error during login. Please try again shortly.",
      headers={"X-Error-Code": "database_error"},
    )

  exc_module = type(exc).__module__.lower()
  exc_name = type(exc).__name__.lower()
  if "bcrypt" in exc_module or "passlib" in exc_module or "bcrypt" in exc_name:
    logger.exception("Employee login password verification failure")
    return HTTPException(
      status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
      detail="Password verification is misconfigured on the server (bcrypt/passlib).",
      headers={"X-Error-Code": "auth_crypto_error"},
    )

  if isinstance(exc, ValueError):
    return HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail=str(exc),
    )

  logger.exception("Unexpected employee login failure")
  return HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Login failed due to an unexpected server error. Please try again.",
    headers={"X-Error-Code": "login_internal_error"},
  )


def register_exception_handlers(app) -> None:
  @app.exception_handler(HTTPException)
  async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code >= 500:
      logger.error(
        "HTTP %s %s — %s",
        exc.status_code,
        request.url.path,
        exc.detail,
      )
    return JSONResponse(
      status_code=exc.status_code,
      content={"detail": exc.detail, "code": exc.headers.get("X-Error-Code") if exc.headers else None},
      headers={k: v for k, v in (exc.headers or {}).items() if k != "X-Error-Code"},
    )

  @app.exception_handler(RequestValidationError)
  async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
      status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
      content={"detail": exc.errors(), "code": "validation_error"},
    )

  @app.exception_handler(Exception)
  async def unhandled_exception_handler(request: Request, exc: Exception):
    from app.core.config import get_settings

    settings = get_settings()
    logger.exception(
      "Unhandled server error on %s %s",
      request.method,
      request.url.path,
      extra={
        "path": request.url.path,
        "method": request.method,
        "error_type": type(exc).__name__,
      },
    )
    detail = str(exc) if settings.debug else "An internal server error occurred."
    payload: dict[str, Any] = {
      "detail": detail,
      "code": "internal_server_error",
    }
    return JSONResponse(status_code=500, content=payload)
