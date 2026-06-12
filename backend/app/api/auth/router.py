from fastapi import APIRouter

from app.api.auth.customer import router as customer_router
from app.api.auth.employee import router as employee_router

router = APIRouter(prefix="/auth")
router.include_router(customer_router)
router.include_router(employee_router)
