import sys
print('1')
from fastapi import FastAPI
print('2')
from app.api.customer.document import router as customer_document_router
print('3')
from app.api.auth.router import router as auth_router
print('4')
from app.api.analyst.fraud import router as analyst_fraud_router
print('5')
