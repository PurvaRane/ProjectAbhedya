import re

from app.core.security import sanitize_mobile, verify_password
from app.db.models import User
from app.db.repositories import UserRepository
from app.schemas.auth import CustomerLoginRequest, TokenResponse
from app.services.auth.token_service import build_customer_token


class CustomerLoginService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def _resolve_user(self, identifier: str) -> User | None:
        identifier = identifier.strip()

        if "@" in identifier:
            return self.user_repo.get_by_email(identifier)

        mobile = sanitize_mobile(identifier)
        if re.fullmatch(r"\d{10}", mobile):
            return self.user_repo.get_by_mobile(mobile)

        return self.user_repo.get_by_email(identifier)

    def login(self, data: CustomerLoginRequest) -> TokenResponse:
        user = self._resolve_user(data.identifier)

        if not user or not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("Account is not activated")

        return build_customer_token(user)
