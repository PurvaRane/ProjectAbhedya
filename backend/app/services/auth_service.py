"""Backward-compatible re-export. Prefer app.services.auth package."""

from app.services.auth import AuthService

__all__ = ["AuthService"]
