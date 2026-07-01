from app.core.security import create_access_token, create_refresh_token
from app.db.models import EmployeeAccount, User
from app.schemas.auth import TokenResponse


def build_customer_token(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(
            str(user.id),
            user.role.value,
            "customer",
        ),
        refresh_token=create_refresh_token(
            str(user.id),
            "customer",
        ),
        role=user.role.value,
        actor_type="customer",
    )


def build_employee_token(employee: EmployeeAccount) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(
            str(employee.id),
            employee.role.value,
            "employee",
        ),
        refresh_token=create_refresh_token(
            str(employee.id),
            "employee",
        ),
        role=employee.role.value,
        actor_type="employee",
    )
