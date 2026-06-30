cat > /mnt/user-data/outputs/ProjectAbhedya_Technical_Deep_Dive.md << 'HEREDOC_END'
# ProjectAbhedya / VeriTrust — Comprehensive Technical Deep-Dive

> **Platform**: AI Forensic Document Fraud Detection System for Canara Bank  
> **Codebase**: `/Users/macbook/Documents/ProjectAbhedya`  
> **Document Purpose**: Production-grade audit, architecture reference, and remediation blueprint  
> **Document Date**: June 30, 2026

---

## Table of Contents

- [ProjectAbhedya / VeriTrust — Comprehensive Technical Deep-Dive](#projectabhedya--veritrust--comprehensive-technical-deep-dive)
  - [Table of Contents](#table-of-contents)
  - [1. Executive Summary](#1-executive-summary)
  - [2. Repository Layout \& Module Map](#2-repository-layout--module-map)
  - [3. Technology Stack (Exact Versions)](#3-technology-stack-exact-versions)
    - [Backend Python](#backend-python)
    - [Frontend](#frontend)
    - [Infrastructure](#infrastructure)
  - [4. System Architecture Overview](#4-system-architecture-overview)
  - [5. Database Schema — Full Specification](#5-database-schema--full-specification)
    - [Table: `users`](#table-users)
    - [Table: `employee_accounts`](#table-employee_accounts)
    - [Table: `employee_audit_logs`](#table-employee_audit_logs)
    - [Table: `otp_verifications`](#table-otp_verifications)
    - [Table: `documents`](#table-documents)
    - [Table: `document_analyses`](#table-document_analyses)
  - [6. Alembic Migration Chain](#6-alembic-migration-chain)
  - [7. Backend Deep-Dive](#7-backend-deep-dive)
    - [7.1 Application Entry Point — `main.py`](#71-application-entry-point--mainpy)
    - [7.2 Configuration — `core/config.py`](#72-configuration--coreconfigpy)
    - [7.3 Security Primitives — `core/security.py`](#73-security-primitives--coresecuritypy)
    - [7.4 Database Session — `db/session.py`](#74-database-session--dbsessionpy)
    - [7.5 ORM Models — `db/models/__init__.py`](#75-orm-models--dbmodels__init__py)
    - [7.6 Repository Layer — `db/repositories/__init__.py`](#76-repository-layer--dbrepositories__init__py)
    - [7.7 Pydantic Schemas — `schemas/auth.py`](#77-pydantic-schemas--schemasauthpy)
  - [8. API Routes — Full Specification](#8-api-routes--full-specification)
    - [8.1 Customer Authentication Routes](#81-customer-authentication-routes)
    - [8.2 Employee Authentication Routes](#82-employee-authentication-routes)
    - [8.3 Document Upload Routes](#83-document-upload-routes)
    - [8.4 Analyst / Fraud Routes](#84-analyst--fraud-routes)
  - [9. Service Layer — Full Deep-Dive](#9-service-layer--full-deep-dive)
    - [9.1 AuthService](#91-authservice)
    - [9.2 OTPService (Email + SMS)](#92-otpservice-email--sms)
    - [9.3 FaceService (InsightFace)](#93-faceservice-insightface)
    - [9.4 CaptchaService](#94-captchaservice)
    - [9.5 OCRService (Tesseract)](#95-ocrservice-tesseract)
    - [9.6 ImageQualityService (IQA)](#96-imagequalityservice-iqa)
    - [9.7 ForgeryService (ELA + CMFD + EXIF)](#97-forgeryservice-ela--cmfd--exif)
    - [9.8 QRService (Aadhaar Secure QR)](#98-qrservice-aadhaar-secure-qr)
    - [9.9 DSCService (PDF Digital Signature)](#99-dscservice-pdf-digital-signature)
    - [9.10 LayoutLMService (LayoutLMv3)](#910-layoutlmservice-layoutlmv3)
    - [9.11 ViTService (Vision Transformer)](#911-vitservice-vision-transformer)
    - [9.12 RiskService (Random Forest + SHAP)](#912-riskservice-random-forest--shap)
    - [9.13 GNNService (Heterogeneous Graph Neural Network)](#913-gnnservice-heterogeneous-graph-neural-network)
    - [9.14 ValidationService (Business Rules)](#914-validationservice-business-rules)
  - [10. Document AI Pipeline — Exhaustive Walkthrough](#10-document-ai-pipeline--exhaustive-walkthrough)
  - [11. ML Models on Disk](#11-ml-models-on-disk)
    - [LayoutLMv3 Fine-tuned (`backend/models/layoutlmv3_finetuned/`)](#layoutlmv3-fine-tuned-backendmodelslayoutlmv3_finetuned)
    - [ViT Fine-tuned (`backend/models/vit_finetuned/`)](#vit-fine-tuned-backendmodelsvit_finetuned)
    - [PaddleOCR ONNX Models (`backend/app/models/ocr/`)](#paddleocr-onnx-models-backendappmodelsocr)
  - [12. Training Scripts](#12-training-scripts)
    - [`train_layoutlmv3.py`](#train_layoutlmv3py)
    - [`train_vit.py`](#train_vitpy)
    - [Dataset Preparation Scripts](#dataset-preparation-scripts)
    - [`seed_employees.py`](#seed_employeespy)
    - [Model Download Scripts](#model-download-scripts)
  - [13. Frontend Architecture](#13-frontend-architecture)
    - [13.1 Build \& Configuration](#131-build--configuration)
    - [13.2 Routing \& Auth Context](#132-routing--auth-context)
    - [13.3 API Layer](#133-api-layer)
    - [13.4 Key Pages](#134-key-pages)
    - [13.5 Dashboard Components](#135-dashboard-components)
  - [14. Docker \& Infrastructure](#14-docker--infrastructure)
    - [`docker-compose.yml` Services](#docker-composeyml-services)
    - [`backend/Dockerfile`](#backenddockerfile)
  - [15. Security Architecture — Current State](#15-security-architecture--current-state)
    - [Authentication Matrix](#authentication-matrix)
    - [Implemented Security Controls](#implemented-security-controls)
  - [16. Critical Bugs \& Security Vulnerabilities](#16-critical-bugs--security-vulnerabilities)
    - [CRITICAL — Authentication \& Access Control](#critical--authentication--access-control)
    - [HIGH — Data Integrity \& Business Logic](#high--data-integrity--business-logic)
    - [MEDIUM — Security Hardening](#medium--security-hardening)
  - [17. Production Readiness Gaps \& Remediation Roadmap](#17-production-readiness-gaps--remediation-roadmap)
    - [Phase 1: Critical Security Fixes (Week 1)](#phase-1-critical-security-fixes-week-1)
    - [Phase 2: Data Integrity \& Architecture (Week 2)](#phase-2-data-integrity--architecture-week-2)
    - [Phase 3: Storage \& Observability (Week 3)](#phase-3-storage--observability-week-3)
    - [Phase 4: ML Robustness (Week 4)](#phase-4-ml-robustness-week-4)
    - [Phase 5: Frontend Security (Week 5)](#phase-5-frontend-security-week-5)
    - [Phase 6: Production Infrastructure (Week 6)](#phase-6-production-infrastructure-week-6)
  - [18. Performance Bottlenecks](#18-performance-bottlenecks)
    - [ML Inference Latency](#ml-inference-latency)
    - [Concurrency Issues](#concurrency-issues)
    - [Database Query Issues](#database-query-issues)
    - [Memory Usage](#memory-usage)
  - [19. Testing State](#19-testing-state)
    - [Current Test Coverage](#current-test-coverage)
    - [Recommended Testing Strategy](#recommended-testing-strategy)

---

## 1. Executive Summary

**VeriTrust** (codebase codename: **ProjectAbhedya**) is a full-stack AI-powered document fraud detection platform designed for Canara Bank's digital KYC pipeline. The system ingests scanned government identity documents (Aadhaar, PAN, GSTIN, PDF e-documents), runs a multi-stage forensic AI pipeline, and surfaces fraud probability scores with explainable AI justifications to bank employees.

The platform currently covers:

**Authentication**: A dual-actor (customer + employee) JWT-based auth system with three customer registration paths (email OTP, mobile OTP via Twilio/Fast2SMS, Aadhaar-linked), and a multi-step employee authentication state machine (math CAPTCHA → credential verification → behavioral confidence scoring → OTP/face verification).

**Document Forensics**: A concurrent multi-engine forensic pipeline executing Image Quality Assessment, OCR (Tesseract), Error Level Analysis, EXIF metadata analysis, Copy-Move Forgery Detection (ORB), QR Code verification (Aadhaar XML), PDF Digital Signature validation (pyhanko), LayoutLMv3 layout entity extraction, ViT visual embeddings + forgery classification, Random Forest + SHAP risk scoring, and business rule validation.

**Network Fraud Analysis**: A Heterogeneous Graph Neural Network (HeteroConv/SAGEConv via PyTorch Geometric) that models users, documents, devices, IPs, mobile numbers, PAN/Aadhaar nodes, and text entities as graph nodes with typed edges to detect fraud rings through neighborhood message propagation.

**State**: The project is functional end-to-end for a hackathon demo. Multiple critical production blockers exist — documented in §16 and §17.

---

## 2. Repository Layout & Module Map

```
ProjectAbhedya/
├── backend/
│   ├── alembic/
│   │   ├── env.py                        # Alembic runtime configuration
│   │   ├── script.py.mako                # Migration template
│   │   └── versions/
│   │       ├── 001_initial_schema.py         # users, employee_accounts, otp_verifications
│   │       ├── 002_add_aadhaar_fields.py     # Aadhaar columns on users
│   │       ├── 003_add_employee_audit_logs.py # employee_audit_logs table
│   │       ├── 4555e6738a5c_*.py             # GNN tracking: last_ip_address, last_device_id
│   │       ├── 4fd7bce4a1a8_*.py             # Employee security: face_embedding, trusted_device_id
│   │       └── f612ce2e441b_*.py             # documents + document_analyses tables
│   ├── app/
│   │   ├── main.py                        # FastAPI app factory, router registration, CORS, static mount
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── router.py              # Aggregates customer + employee sub-routers
│   │   │   │   ├── customer.py            # Customer auth endpoints (email/mobile/Aadhaar/face)
│   │   │   │   └── employee.py            # Employee MFA endpoints + get_current_employee dep
│   │   │   ├── customer/
│   │   │   │   └── document.py            # Customer document upload + status polling
│   │   │   ├── documents/
│   │   │   │   └── router.py              # Generic document upload (dev/test endpoint)
│   │   │   └── analyst/
│   │   │       └── fraud.py               # Analyst: forensics list, GNN rings, manual verify
│   │   ├── core/
│   │   │   ├── config.py                  # Pydantic-settings: all env vars, validators, properties
│   │   │   └── security.py                # Passlib bcrypt, JWT encode/decode, PAN/mobile/email utils
│   │   ├── db/
│   │   │   ├── session.py                 # SQLAlchemy engine + SessionLocal + get_db generator
│   │   │   ├── models/__init__.py         # All ORM models (User, Employee, OTP, Document, Analysis)
│   │   │   └── repositories/__init__.py   # UserRepo, EmployeeRepo, OTPRepo, AuditRepo
│   │   ├── schemas/
│   │   │   ├── auth.py                    # All Pydantic request/response models for auth
│   │   │   └── document.py                # EMPTY — no document schemas
│   │   ├── services/
│   │   │   ├── auth_service.py            # Registration + login logic for both actor types
│   │   │   ├── otp_service.py             # OTP generation, Redis rate limit, email/SMS delivery
│   │   │   ├── face_service.py            # InsightFace embedding extraction + cosine similarity
│   │   │   ├── captcha_service.py         # Stateless HMAC-SHA256 math CAPTCHA
│   │   │   ├── email_service.py           # SMTP email delivery (Gmail App Password)
│   │   │   ├── sms_service.py             # Twilio + Fast2SMS OTP dispatch
│   │   │   ├── ocr_service.py             # Tesseract OCR with preprocessing pipeline
│   │   │   ├── iqa_service.py             # Image Quality Assessment (blur/glare/brightness)
│   │   │   ├── forgery_service.py         # ELA, EXIF metadata, ORB Copy-Move Detection
│   │   │   ├── qr_service.py              # QR code decode + Aadhaar XML parser
│   │   │   ├── dsc_service.py             # PDF digital signature verification (pyhanko)
│   │   │   ├── layoutlm_service.py        # LayoutLMv3 token + sequence classification
│   │   │   ├── vit_service.py             # ViT embedding extraction + forgery classification
│   │   │   ├── risk_service.py            # Random Forest + SHAP explainable risk score
│   │   │   ├── gnn_service.py             # Heterogeneous GNN fraud ring detection
│   │   │   ├── validation_service.py      # Business rule validation (7 rule checks)
│   │   │   └── document_pipeline.py       # Orchestrator: stages 0–6, concurrent execution
│   │   └── models/ocr/
│   │       ├── cls.onnx                   # PaddleOCR text-direction classifier
│   │       ├── det.onnx                   # PaddleOCR text detector
│   │       └── rec.onnx                   # PaddleOCR text recognizer
│   ├── models/
│   │   ├── layoutlmv3_finetuned/          # Fine-tuned LayoutLMv3 (safetensors + tokenizer artifacts)
│   │   └── vit_finetuned/                 # Fine-tuned ViT (safetensors + preprocessor)
│   ├── scripts/
│   │   ├── seed_employees.py              # Seeds ADMIN, FRAUD_ANALYST, LOAN_OFFICER accounts
│   │   ├── download_hf_models.py          # Pre-downloads LayoutLMv3 + ViT for offline Docker use
│   │   ├── download_face_models.py        # Pre-downloads InsightFace buffalo_l
│   │   ├── download_ocr_models.py         # Converts PaddleOCR models to ONNX
│   │   ├── prepare_layoutlm_dataset.py    # Prepares HuggingFace dataset for LayoutLMv3 training
│   │   ├── prepare_directory_dataset.py   # Prepares image directory datasets
│   │   ├── train_layoutlmv3.py            # Fine-tunes microsoft/layoutlmv3-base (5 epochs)
│   │   ├── train_vit.py                   # Fine-tunes google/vit-base-patch16-224-in21k
│   │   ├── test_gnn.py                    # Manual GNN smoke-test
│   │   └── test_shap.py                   # Manual SHAP smoke-test
│   ├── test_docs/
│   │   ├── aadhar.jpg                     # Genuine Aadhaar test image
│   │   └── aadhar_forged.jpg              # Forged Aadhaar test image
│   ├── uploads/
│   │   └── documents/                     # Uploaded files + ELA heatmaps (UUID-named)
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx                        # BrowserRouter + all route declarations
│   │   ├── main.tsx                       # React DOM root mount
│   │   ├── index.css                      # Tailwind + custom CSS variables
│   │   ├── api/
│   │   │   ├── client.ts                  # Axios instance + interceptors + shared types
│   │   │   └── auth.ts                    # authApi object (all auth HTTP calls)
│   │   ├── context/
│   │   │   └── AuthContext.tsx            # AuthProvider + useAuth hook (localStorage persistence)
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx         # actorType-gated route wrapper
│   │   │   ├── AuthLayout.tsx             # Centered card layout for auth pages
│   │   │   ├── DashboardLayout.tsx        # Customer dashboard shell
│   │   │   ├── CanaraHeader.tsx           # Public header (logo + nav)
│   │   │   ├── CanaraFooter.tsx           # Public footer
│   │   │   ├── CanaraLogo.tsx             # SVG/image logo component
│   │   │   ├── Alert.tsx                  # Reusable alert banner
│   │   │   ├── OTPInput.tsx               # 6-digit OTP segmented input
│   │   │   ├── ResendTimer.tsx            # Countdown for OTP resend
│   │   │   └── dashboard/                 # Employee dashboard panels
│   │   │       ├── DocumentForensics.tsx  # Forensics viewer + XAI SHAP translator
│   │   │       ├── FraudRings.tsx         # GNN fraud ring viewer
│   │   │       ├── DashboardOverview.tsx  # Summary stats panel
│   │   │       ├── AuditLogs.tsx          # Employee action audit log
│   │   │       ├── LiveDocumentScanner.tsx # Camera/file document scanner
│   │   │       ├── AuthenticationCenter.tsx, MFACenter.tsx, FaceVerification.tsx
│   │   │       ├── DeviceVerification.tsx, HumanPresence.tsx, BehavioralScore.tsx
│   │   │       ├── AccessControl.tsx, ProfileSection.tsx, SettingsSection.tsx
│   │   ├── lib/
│   │   │   └── validation.ts              # Frontend Zod validators
│   │   └── pages/
│   │       ├── LandingPage.tsx            # Public landing with auth entry points
│   │       ├── CustomerLoginPage.tsx
│   │       ├── CustomerRegisterPage.tsx   # Email-based registration
│   │       ├── CustomerOnboardingPage.tsx # 5-step Aadhaar onboarding (primary flow)
│   │       ├── AadhaarRegisterPage.tsx    # Legacy Aadhaar registration
│   │       ├── FaceEnrollPage.tsx         # Camera-based face enrollment
│   │       ├── EmployeeLoginPage.tsx      # Multi-step MFA login
│   │       ├── CustomerDashboard.tsx      # Document upload + status polling
│   │       └── EmployeeDashboard.tsx      # Sidebar shell + section router
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

---

## 3. Technology Stack (Exact Versions)

### Backend Python

| Package | Version | Role |
|---|---|---|
| `fastapi` | 0.115.6 | ASGI web framework |
| `uvicorn[standard]` | 0.32.1 | ASGI server (Uvicorn + watchfiles for --reload) |
| `sqlalchemy` | 2.0.36 | ORM (uses 2.0 typed `Mapped[]` style) |
| `alembic` | 1.14.0 | Database migrations |
| `psycopg2-binary` | 2.9.10 | PostgreSQL driver |
| `pydantic` | 2.10.3 | Request/response validation |
| `pydantic-settings` | 2.6.1 | Settings from env vars |
| `python-jose[cryptography]` | 3.3.0 | JWT encoding/decoding (HS256) |
| `passlib[bcrypt]` | 1.7.4 | Password hashing context |
| `bcrypt` | 4.2.1 | bcrypt implementation |
| `redis` | 5.2.1 | OTP rate limiting |
| `httpx` | 0.28.1 | Async HTTP client (email/Twilio calls) |
| `twilio` | 9.4.0 | SMS OTP via Twilio REST |
| `opencv-python` | 4.6.0.66 | Image I/O, CMFD, blur detection, QR decode |
| `numpy` | 1.26.4 | Array operations throughout |
| `pillow` | 12.2.0 | ELA, EXIF extraction, image format conversion |
| `pytesseract` | 0.3.10 | Tesseract OCR Python wrapper |
| `insightface` | 0.7.3 | Face detection + ArcFace embedding (buffalo_l) |
| `onnxruntime` | 1.22.1 | ONNX inference (PaddleOCR models + InsightFace) |
| `paddleocr` | 2.7.3 | PaddleOCR engine (text det/rec/cls) |
| `paddlepaddle` | 2.6.2 | PaddlePaddle deep learning framework |
| `paddle2onnx` | 1.3.1 | Exports PaddlePaddle models to ONNX |
| `transformers` | 4.53.0 | HuggingFace: LayoutLMv3, ViT, processors |
| `torch` | 2.7.1 | PyTorch (inference + GNN) |
| `torchvision` | 0.22.1 | Vision transforms |
| `tokenizers` | 0.21.2 | Fast tokenizers for LayoutLMv3 |
| `accelerate` | 1.8.1 | Mixed-precision / multi-device training utils |
| `datasets` | 3.2.0 | HuggingFace datasets (training) |
| `shap` | 0.48.0 | Shapley value explainability (TreeExplainer) |
| `torch-geometric` | 2.6.1 | PyTorch Geometric: HeteroConv, SAGEConv, HeteroData |
| `scikit-learn` | 1.7.0 | RandomForestClassifier for risk scoring |
| `pandas` | 2.3.0 | Dataset preparation |
| `scipy` | 1.16.0 | Statistical operations |
| `matplotlib` | 3.10.3 | Visualization in training scripts |
| `pyhanko` | (implicit) | PDF digital signature validation |
| `python-multipart` | 0.0.19 | Multipart file upload support |
| `email-validator` | 2.2.0 | Pydantic EmailStr validation backend |

### Frontend

| Package | Version | Role |
|---|---|---|
| `react` | Latest | UI framework |
| `react-dom` | Latest | DOM rendering |
| `react-router-dom` | Latest | Client-side routing |
| `typescript` | Latest | Type safety |
| `axios` | Latest | HTTP client with interceptors |
| `tailwindcss` | Latest | Utility CSS framework |
| `vite` | Latest | Build tool + HMR dev server |

### Infrastructure

| Component | Image | Role |
|---|---|---|
| PostgreSQL | `postgres:16-alpine` | Primary RDBMS (port 5433→5432) |
| Redis | `redis:7-alpine` | OTP rate-limit store (port 6379) |
| Backend | `python:3.11-slim` | FastAPI app (port 8000) |
| Frontend | Node.js-based | Vite dev server (port 5173) |

---

## 4. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                      │
│  React + TypeScript + Tailwind (Vite)                                        │
│  ┌────────────────┐  ┌─────────────────────────────────────────────────────┐ │
│  │  Public Pages  │  │          Employee Dashboard (SPA)                    │ │
│  │  Landing       │  │  DocumentForensics │ FraudRings (GNN)               │ │
│  │  CustomerLogin │  │  DashboardOverview │ AuditLogs                       │ │
│  │  EmployeeLogin │  │  MFACenter │ FaceVerification │ BehavioralScore      │ │
│  └────────────────┘  └─────────────────────────────────────────────────────┘ │
│                    ↕ Axios (Bearer JWT) + multipart/form-data                 │
└──────────────────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND  (port 8000)                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │   API Layer (Routers)                                                    │ │
│  │   /api/auth/customer/*  │ /api/auth/employee/*                          │ │
│  │   /api/documents/*      │ /api/customer/document/*                      │ │
│  │   /api/analyst/fraud/*  │ /api/health                                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │   Service Layer                                                          │ │
│  │   AuthService │ OTPService │ FaceService │ CaptchaService               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │   Document AI Pipeline (DocumentPipelineService)                         │ │
│  │   ┌──────────┐ ┌─────┐ ┌──────┐ ┌──────┐ ┌───────┐ ┌───────┐         │ │
│  │   │DSC/PDF   │ │IQA  │ │OCR   │ │QR    │ │ELA    │ │EXIF   │ Parallel │ │
│  │   │Signature │ │Check│ │(Tess)│ │Decode│ │CMFD   │ │Meta   │ Stage 1  │ │
│  │   └──────────┘ └─────┘ └──────┘ └──────┘ └───────┘ └───────┘         │ │
│  │   ┌───────────────────┐  ┌──────────────────────────────────────┐      │ │
│  │   │LayoutLMv3         │  │ViT Visual Embedding +                │ Stage 2 │
│  │   │Token + Sequence   │  │Forgery Classification                │      │ │
│  │   │Classification     │  │(768-dim embedding)                   │      │ │
│  │   └───────────────────┘  └──────────────────────────────────────┘      │ │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │   │Risk Scoring: Random Forest + SHAP TreeExplainer                  │  │ │
│  │   │Business Rule Validation (7 rules)                               │  │ │
│  │   └──────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │   GNN Service (Fraud Ring Detection) — on-demand                       │ │
│  │   HeteroFraudGCN: HeteroConv(SAGEConv) × 2 layers                     │ │
│  │   Nodes: user│device│ip│mobile│pan│aadhaar│email_domain│doc│text_entity│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
         │                        │                      │
         ▼                        ▼                      ▼
┌────────────────┐    ┌───────────────────┐   ┌────────────────────────┐
│  PostgreSQL 16 │    │    Redis 7         │   │  Local Filesystem       │
│  (port 5433)   │    │   (port 6379)      │   │  uploads/documents/     │
│                │    │  OTP rate-limit    │   │  (ELA heatmaps, docs)   │
│  users         │    │  keys: otp:{mobile}│   │  models/layoutlmv3_ft/  │
│  employee_accts│    │        otp:{email} │   │  models/vit_finetuned/  │
│  otp_verifs    │    │                    │   │  app/models/ocr/*.onnx  │
│  documents     │    └───────────────────┘   └────────────────────────┘
│  doc_analyses  │
│  emp_audit_logs│
└────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│         External Services                       │
│  Twilio REST API (SMS OTP)                     │
│  Fast2SMS API (SMS fallback)                   │
│  Gmail SMTP (email OTP)                        │
└────────────────────────────────────────────────┘
```

---

## 5. Database Schema — Full Specification

### Table: `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | Customer identifier |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Sanitized via `sanitize_string()` |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`, `INDEX` | Lowercase-sanitized |
| `mobile_number` | `VARCHAR(15)` | `UNIQUE`, `INDEX`, nullable | 10-digit normalized (India) |
| `pan_number` | `VARCHAR(10)` | `UNIQUE`, nullable | `ABCDE1234F` format |
| `aadhaar_number` | `VARCHAR(12)` | `UNIQUE`, `INDEX`, nullable | 12-digit string |
| `aadhaar_verified` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Set `true` after OTP flow |
| `face_embedding` | `TEXT` (String) | nullable | JSON-serialized `list[float]` (512-dim ArcFace vector) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt hash ($2b$12$…) |
| `role` | `ENUM(userrole)` | `NOT NULL`, `DEFAULT 'CUSTOMER'` | Only value: `CUSTOMER` |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Activated after OTP verification |
| `last_ip_address` | `VARCHAR(100)` | nullable | For GNN fraud ring graph |
| `last_device_id` | `VARCHAR(255)` | `INDEX`, nullable | For GNN + device rule check |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()`, `onupdate=NOW()` | |

**Missing**: No `ForeignKey` references from other tables at the DB level for `user_id` in `documents`. No `pgvector` for `face_embedding` (stored as JSON string).

### Table: `employee_accounts`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`, `INDEX` | |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt |
| `role` | `ENUM(employeerole)` | `NOT NULL` | `ADMIN` \| `FRAUD_ANALYST` \| `LOAN_OFFICER` |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | |
| `face_embedding` | `TEXT` | nullable | JSON-serialized 512-dim vector |
| `trusted_device_id` | `VARCHAR(255)` | nullable | Stored after first successful MFA |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()` | |

### Table: `employee_audit_logs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | |
| `employee_id` | `UUID` | `INDEX`, nullable | No FK constraint — soft reference |
| `action` | `VARCHAR(100)` | `NOT NULL` | e.g., `LOGIN`, `LOGIN_INIT`, `LOGIN_OTP`, `LOGIN_ENROLL` |
| `status` | `VARCHAR(50)` | `NOT NULL` | `SUCCESS` \| `FAILED` \| `PENDING` |
| `ip_address` | `VARCHAR(100)` | nullable | Not currently populated in most code paths |
| `device_id` | `VARCHAR(255)` | nullable | |
| `details` | `VARCHAR(500)` | nullable | Human-readable explanation |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()` | |

### Table: `otp_verifications`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | |
| `mobile_number` | `VARCHAR(15)` | `INDEX`, nullable | Populated for SMS OTPs |
| `email` | `VARCHAR(255)` | `INDEX`, nullable | Populated for email OTPs |
| `otp_code` | `VARCHAR(64)` | `NOT NULL` | **Stored as plaintext** — critical security issue |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW() + OTP_EXPIRE_MINUTES` |
| `verified` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Marked `true` on successful verification |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()` | |

**No cleanup**: Old OTP records accumulate indefinitely; no scheduled purge.

### Table: `documents`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | |
| `user_id` | `UUID` | `INDEX`, `NOT NULL` | **No ForeignKey constraint** in ORM or DB |
| `document_type` | `VARCHAR(50)` | `NOT NULL` | Free text: `"Aadhaar"`, `"PAN"`, `"Other"`, `"Aadhaar / PAN Verification"` |
| `file_path` | `VARCHAR(500)` | `NOT NULL` | Relative path on local filesystem |
| `status` | `ENUM(documentuploadstatus)` | `NOT NULL`, `DEFAULT 'PENDING'` | `PENDING` \| `PROCESSING` \| `COMPLETED` \| `FAILED` \| `VERIFIED` \| `NEEDS_REVIEW` \| `REJECTED` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()`, `onupdate=NOW()` | |

### Table: `document_analyses`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | |
| `document_id` | `UUID` | `UNIQUE`, `INDEX`, `NOT NULL` | One-to-one with `documents`. **No FK constraint** |
| `ocr_raw_text` | `TEXT` | nullable | Raw OCR output from Tesseract |
| `layout_entities` | `TEXT` | nullable | JSON array: `[{label, text, box: [x1,y1,x2,y2]}]` |
| `vit_embedding` | `TEXT` | nullable | JSON array of 768 floats (ViT `[CLS]` token) |
| `forgery_features` | `TEXT` | nullable | JSON blob — comprehensive analysis result (see §10) |
| `preliminary_fraud_score` | `FLOAT` | nullable | 0.0–1.0 from Random Forest probability |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `server_default=NOW()` | |

**Issue**: `vit_embedding` is a 768-float array stored as JSON string in a TEXT column. This blocks vector similarity queries. Should use `pgvector` extension (`VECTOR(768)`).

---

## 6. Alembic Migration Chain

```
001_initial_schema
      ↓
002_add_aadhaar_fields           (aadhaar_number, aadhaar_verified on users)
      ↓
003_add_employee_audit_logs      (employee_audit_logs table)
      ↓
4555e6738a5c                     (last_ip_address, last_device_id on users)
      ↓
4fd7bce4a1a8                     (face_embedding, trusted_device_id on employee_accounts)
      ↓
f612ce2e441b                     (documents table + document_analyses table)  ← HEAD
```

Run migration: `alembic upgrade head`  
Generate new: `alembic revision --autogenerate -m "description"`

**Known issue**: Alembic `env.py` does not reference `app.db.models` via `target_metadata` inspection — verify `env.py` correctly imports `Base.metadata` for autogenerate to work properly.

---

## 7. Backend Deep-Dive

### 7.1 Application Entry Point — `main.py`

```python
app = FastAPI(title=..., docs_url="/api/docs", redoc_url="/api/redoc")

app.add_middleware(CORSMiddleware, allow_origin_regex=r"^http://.*", ...)
```

**Router registration order**:
1. `auth_router` → prefix `/api` (expands to `/api/auth/customer/` and `/api/auth/employee/`)
2. `document_router` → prefix `/api` → `/api/documents/upload` (generic dev endpoint)
3. `customer_document_router` → prefix `/api/customer` → `/api/customer/document/upload`
4. `analyst_fraud_router` → prefix `/api/analyst/fraud` (hardcoded in router itself)

**Static files**: `app.mount("/uploads", StaticFiles(directory="uploads"))` — serves ELA heatmaps and original documents with zero access control. Any unauthenticated user can access `http://localhost:8000/uploads/documents/UUID.jpg`.

**CORS issue**: `allow_origin_regex=r"^http://.*"` matches ALL HTTP origins. Production must restrict to `https://yourdomain.com` only.

### 7.2 Configuration — `core/config.py`

`Settings` inherits `pydantic_settings.BaseSettings` with `env_file=".env"`. All settings are available via `get_settings()` (LRU-cached singleton).

**Key settings and defaults**:

| Setting | Default | Production Concern |
|---|---|---|
| `jwt_secret_key` | `"change-this-to-a-long-random-secret-in-production"` | **MUST change** |
| `access_token_expire_minutes` | `30` | Reasonable |
| `refresh_token_expire_days` | `7` | Reasonable |
| `otp_expire_minutes` | `5` | OK |
| `otp_rate_limit_seconds` | `5` | Too low (README says 60) — race condition risk |
| `debug` | `True` | **MUST be `false` in prod** |

**Validators**: SMTP, Fast2SMS, and Twilio fields have `strip()` validators to clean accidental whitespace from `.env` values. This is a good defensive pattern.

**`cors_origins_list` property**: Parses comma-delimited `CORS_ORIGINS` env var. Used nowhere in `main.py` (CORS uses regex instead) — dead code.

### 7.3 Security Primitives — `core/security.py`

**Password hashing**: `CryptContext(schemes=["bcrypt"])` with Passlib. bcrypt with default work factor (12 rounds). `hash_password()` and `verify_password()` wrappers.

**Password policy**: Regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$` — requires upper, lower, digit, special, minimum 8 chars.

**PAN validation**: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` — standard Indian PAN format.

**JWT**: HS256, signed with `jwt_secret_key`. Tokens contain:
```json
{
  "sub": "<user_id or employee_email>",
  "role": "CUSTOMER | ADMIN | FRAUD_ANALYST | LOAN_OFFICER",
  "type": "customer | employee",
  "token_type": "access | refresh",
  "exp": <unix_timestamp>
}
```

**No token blacklisting**: Logout only clears localStorage. Issued tokens remain valid until expiry. No revocation mechanism (Redis blacklist) exists.

**Sanitization functions**: `sanitize_email()` (strip+lower), `sanitize_mobile()` (strip non-digits, strip country code), `sanitize_string()` (strip).

### 7.4 Database Session — `db/session.py`

```python
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

`pool_pre_ping=True` — correct for long-lived connections (sends a `SELECT 1` before using a connection).

**Missing production settings**:
- `pool_size` (default 5) — for production with concurrent pipeline workers, this is too low
- `max_overflow` (default 10) — insufficient under ML pipeline load
- `pool_timeout` — not set; SQLAlchemy default is 30s
- `pool_recycle` — not set; recommend 3600 (1hr) to recycle stale connections

**`get_db()` generator**: Used as a FastAPI `Depends`. Correctly uses `try/finally` to close the session. Doesn't `rollback()` on exception — exception propagates naturally, and SQLAlchemy auto-rolls back on close if no commit.

### 7.5 ORM Models — `db/models/__init__.py`

Uses SQLAlchemy 2.0's `DeclarativeBase` + `Mapped[]` typing style. All PKs are UUID4.

**Enums**: `UserRole (CUSTOMER)`, `EmployeeRole (ADMIN, FRAUD_ANALYST, LOAN_OFFICER)`, `DocumentUploadStatus (PENDING, PROCESSING, COMPLETED, FAILED, VERIFIED, NEEDS_REVIEW, REJECTED)`.

**`DocumentAnalysis.layout_entities`**: Stores LayoutLMv3 token classification output as a JSON string (list of `{label, text, box}`). No indexable structure.

**`DocumentAnalysis.forgery_features`**: Master JSON blob storing: `ela_score`, `max_difference`, `heatmap_path`, `metadata_anomaly`, `software_signature`, `cmfd_score`, `cmfd_matches`, `layoutlm_forgery_prob`, `vit_forgery_prob`, `shap_explanation`, `extracted_entities`, `validation_rules`. Also `dsc_tampered`, `iqa_rejection`, `qr_mismatch` for early-exit cases.

### 7.6 Repository Layer — `db/repositories/__init__.py`

Implements Data Access Objects (DAOs) for each major entity:

**`UserRepository`**: `get_by_email()`, `get_by_mobile()`, `get_by_aadhaar()`, `get_by_id()`, `create()`, `activate()`, `update_face_embedding()`, `update_aadhaar_verification()`. All sanitize inputs before querying.

**`EmployeeRepository`**: `get_by_email()`, `create()`, `count()`.

**`EmployeeAuditRepository`**: `create_log()` (creates immutable audit entry), `get_logs(limit=100)`.

**`OTPRepository`**: `create()`, `get_latest_unverified()`, `mark_verified()`, `is_expired()`. The expiry check compares timezone-aware datetimes correctly by adding UTC tzinfo when missing.

**Issue**: `UserRepository` defines `update_face_embedding` twice (duplicate method — second definition shadows first). Not a functional bug since both do the same thing, but indicates copy-paste sloppiness.

### 7.7 Pydantic Schemas — `schemas/auth.py`

Comprehensive schema file with validators for all auth flows. Key patterns:

**`PasswordMixin`**: Mixin class with password + confirm_password fields, strength validator, and `@model_validator(mode="after")` to check match. Mixed into `EmailRegisterRequest`, `MobileCompleteRegistrationRequest`, `AadhaarCompleteRegistrationRequest`.

**Mobile normalization**: Multiple schemas repeat the same mobile validator (strip non-digits, remove `91` prefix if 12 digits). Should be extracted into a shared validator.

**`EmployeeLoginRequest`**: Includes behavioral fields (`typing_speed_ms`, `mouse_clicks`) for BCS.

**`EmployeeLoginStepResponse`**: Uses `Literal["REQUIRE_OTP", "REQUIRE_FACE", "SUCCESS"]` for type-safe state machine transitions.

**`schemas/document.py`**: Completely empty file. Document request/response schemas do not exist — inline dicts are returned from API endpoints instead.

---

## 8. API Routes — Full Specification

### 8.1 Customer Authentication Routes

**Prefix**: `/api/auth/customer` | **Tag**: `Customer Authentication`

| Method | Path | Request | Response | Description |
|---|---|---|---|---|
| `POST` | `/register/email` | `EmailRegisterRequest` | `EmailRegisterResponse` | Register user + send email OTP |
| `POST` | `/register/email/verify-otp` | `EmailVerifyOTPRequest` | `MessageResponse` | Verify email OTP, activate account |
| `POST` | `/register/mobile/send-otp` | `MobileSendOTPRequest` | `MobileSendOTPResponse` | Send SMS OTP. **Returns demo_otp in response — insecure!** |
| `POST` | `/register/mobile/verify-otp` | `MobileVerifyOTPRequest` | `MobileVerifyOTPResponse` | Verify SMS OTP |
| `POST` | `/register/mobile/complete` | `MobileCompleteRegistrationRequest` | `UserResponse` | Complete profile + create account |
| `POST` | `/aadhaar/send-otp` | `AadhaarRegistrationRequest` | `dict` | Aadhaar + mobile → send OTP. **Also returns demo_otp** |
| `POST` | `/aadhaar/verify-otp` | `AadhaarOTPVerifyRequest` | `dict` | Verify Aadhaar OTP |
| `POST` | `/aadhaar/complete-registration` | `AadhaarCompleteRegistrationRequest` | `UserResponse` | Create Aadhaar-linked account |
| `POST` | `/aadhaar/enroll-face` | `aadhaar_number: str` (query) + `file: UploadFile` | `dict` | Upload face photo → extract InsightFace embedding → store on user |
| `POST` | `/aadhaar/verify-face` | `aadhaar_number: str` (query) + `file: UploadFile` | `FaceVerificationResponse` | Compare uploaded face against stored embedding |
| `POST` | `/login` | `CustomerLoginRequest` | `TokenResponse` | Login with email or mobile + password |

### 8.2 Employee Authentication Routes

**Prefix**: `/api/auth/employee` | **Tag**: `Employee Authentication`

| Method | Path | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/captcha` | — | `{question: str, token: str}` | Generate HMAC-signed math CAPTCHA |
| `POST` | `/login` | `EmployeeLoginRequest` | `EmployeeLoginStepResponse` | Step 1: CAPTCHA → creds → BCS → `REQUIRE_OTP` or `REQUIRE_FACE` |
| `POST` | `/verify-otp` | `EmployeeOTPVerifyRequest` | `EmployeeLoginStepResponse` | Step 2a: Verify email OTP → `REQUIRE_FACE` |
| `POST` | `/verify-face` | `EmployeeFaceVerifyRequest` | `TokenResponse` | Step 2b: Verify face → issue JWT |
| `GET` | `/audit-logs` | — | `list[EmployeeAuditLogResponse]` | Last 100 employee audit events. **No auth required — security hole** |

### 8.3 Document Upload Routes

**Prefix**: `/api/documents` | **Tag**: `Documents`

| Method | Path | Request | Response | Description |
|---|---|---|---|---|
| `POST` | `/upload` | `file: UploadFile` | `dict` | Generic upload (dev endpoint). **Creates mock user if none exists.** Immediately triggers pipeline in background. |

**Prefix**: `/api/customer/document` | **Tag**: `Customer Document`

| Method | Path | Request | Response | Description |
|---|---|---|---|---|
| `POST` | `/upload` | `user_id: UUID, document_type: str, file: UploadFile` | `dict` | Customer upload. Sets `PENDING`. **Pipeline NOT triggered** — awaits employee action. |
| `GET` | `/status/{document_id}` | — | `dict` | Polls document status. Returns fraud score + features if `COMPLETED`. |

### 8.4 Analyst / Fraud Routes

**Prefix**: `/api/analyst/fraud` | **Tag**: `Fraud Analyst`

| Method | Path | Auth | Response | Description |
|---|---|---|---|---|
| `GET` | `/documents` | None (missing `Depends`) | `list[dict]` | All documents + analysis + cross-document conflicts. **Open to public.** |
| `GET` | `/rings/analyze` | None (missing `Depends`) | `{fraud_rings: list}` | Run GNN and return ranked user risk scores. **Open to public.** |
| `POST` | `/verify/{document_id}` | None (missing `Depends`) | `dict` | Trigger AI pipeline for a PENDING document. **Open to public.** |

**Critical**: `require_fraud_analyst` is defined in `fraud.py` but never used as a `Depends` on any route. All three endpoints are completely unauthenticated.

---

## 9. Service Layer — Full Deep-Dive

### 9.1 AuthService

`AuthService(db)` is instantiated per-request (not a singleton). Coordinates `UserRepository`, `EmployeeRepository`, `EmployeeAuditRepository`, and `OTPService`.

**Customer Registration Flows**:

*Email Flow*:
1. Check email uniqueness via `UserRepository.get_by_email()`
2. Create inactive user (`is_active=False`)
3. `OTPService.send_email_otp()` → generates OTP, stores in DB, sends via SMTP
4. On verify: `OTPService.verify_email_otp()` → marks OTP verified, calls `UserRepository.activate()`

*Mobile Flow*:
1. Check mobile uniqueness
2. `OTPService.send_mobile_otp()` → Redis rate-limit check → generate OTP → Twilio/Fast2SMS
3. On verify: `OTPService.verify_mobile_otp()` → mark verified, set `is_mobile_verified()` flag in Redis
4. `complete_mobile_registration()`: Checks `is_mobile_verified()`, then checks email/mobile/PAN uniqueness, creates active user

*Aadhaar Flow*:
1. Check Aadhaar uniqueness
2. Send SMS OTP to mobile number (same `send_mobile_otp`)
3. Verify OTP
4. `complete_aadhaar_registration()`: Creates user with `aadhaar_number`, `aadhaar_verified=True`, `is_active=True`

**Employee Login State Machine** (`initiate_employee_login`):
```
[Client] → POST /login (email, password, device_id, captcha_token, captcha_answer, typing_speed_ms)
              │
              ▼
         CaptchaService.verify_captcha(token, answer)
              │ FAIL → 401
              │ PASS ↓
         verify_password(plain, hash)
              │ FAIL → 401 + audit log
              │ PASS ↓
         Behavioral Confidence Scoring:
           bcs_score = 100
           if typing_speed_ms < 500: bcs_score -= 50  (bot detection)
           if device_id != trusted_device_id: bcs_score -= 30
              │
              ├─ bcs_score < 80 → send OTP → return {next_step: "REQUIRE_OTP"}
              └─ bcs_score >= 80 → return {next_step: "REQUIRE_FACE"}

[Client] → POST /verify-otp (email, otp_code, device_id)
              │
              ▼
         verify_email_otp() → return {next_step: "REQUIRE_FACE"}

[Client] → POST /verify-face (email, image_base64, device_id)
              │
              ▼
         decode base64 → extract embedding
         if no stored embedding: auto-enroll (first time) → auto-pass
         else: cosine_similarity(stored, current) >= 0.5 → issue JWT
         store device_id as trusted_device_id
```

### 9.2 OTPService (Email + SMS)

Generates 6-digit OTP codes. Redis is used for rate limiting — key `otp:{mobile}` or `otp:{email}` with TTL `otp_rate_limit_seconds`.

OTP stored in `otp_verifications` table as **plaintext** string in `otp_code VARCHAR(64)`. The column is sized for a potential hash but currently unused.

**Expiry logic**: `expires_at = datetime.now(UTC) + timedelta(minutes=otp_expire_minutes)`. `OTPRepository.is_expired()` correctly handles timezone-naive vs timezone-aware comparison.

**`is_mobile_verified()`**: Checks Redis for a `verified:{mobile}` flag set after successful OTP verification. Used by `complete_mobile_registration()` to enforce that OTP was verified before completing profile.

**Email delivery**: `email_service.py` uses SMTP via `smtplib` + Gmail App Password. Synchronous — will block the API thread.

**SMS delivery**: `sms_service.py` tries Twilio first, falls back to Fast2SMS. Returns the OTP code for demo (logged to `offline_otps.log` as well).

### 9.3 FaceService (InsightFace)

Uses InsightFace's `buffalo_l` model (ArcFace ResNet50 backbone) to extract 512-dimensional face embeddings. Similarity is cosine distance: `dot(a,b) / (||a|| * ||b||)`.

**macOS guard**: On `sys.platform == "darwin"`, InsightFace is replaced with a `MockApp` that returns a `MockFace` with `embedding = np.zeros(512)`. The similarity check guards against zero-norm vectors and auto-returns `1.0`. This means **face verification is completely disabled on macOS** — the developer's machine. All face verifications pass automatically.

**Threshold**: 0.50 for employees. 0.50 for customers. `buffalo_l` ArcFace cosine similarity of ≥0.5 indicates same person.

**`extract_embedding_from_bytes()`**: Writes bytes to a named temp file (no `delete=True` on macOS due to platform restrictions), runs `extract_embedding()`, returns list of floats. The temp file is not cleaned up (missing `os.unlink(temp_path)`).

### 9.4 CaptchaService

Stateless offline math CAPTCHA. No DB or Redis required.

**Token format**: `"{answer}:{unix_timestamp}:{HMAC-SHA256}"` — signed with `jwt_secret_key`.

**Verification**: Checks HMAC integrity + 5-minute expiry window + string equality of answer (case-insensitive via `.strip()`).

**Issue**: Uses `hmac.new()` — this is incorrect Python. The correct API is `hmac.new(key, msg, digestmod)`. The code actually uses `hmac.new(key.encode(), data.encode(), hashlib.sha256).hexdigest()`. `hmac.new` is not a standard Python function — `hmac.new` doesn't exist. The correct call is `hmac.new(key, msg, digestmod)` which is actually `hmac.HMAC(key, msg, digestmod)`. In CPython, `hmac.new(key, msg, digestmod)` exists as an alias — verify this works in the target Python version.

### 9.5 OCRService (Tesseract)

Tesseract 5 via `pytesseract`. Language: `eng+hin+mar` (English + Hindi + Marathi — important for Indian documents).

**Preprocessing pipeline**:
1. Read file with `np.fromfile()` + `cv2.imdecode()` (handles non-ASCII paths)
2. Convert BGR → Grayscale
3. Scale: if width < 1000px → upscale to 1000px (cubic); if width > 4096px → downscale (area)
4. Adaptive Gaussian thresholding: `blockSize=31, C=10` — binarizes to clean black-on-white
5. Set `OMP_THREAD_LIMIT=1` — prevents Tesseract from spawning excessive CPU threads

**Output parsing**: `pytesseract.image_to_data()` with `Output.DICT`. Groups words by `(page_num, block_num, par_num, line_num)` key. For each line group:
- Concatenates words with spaces
- Computes confidence as weighted average (by word length)
- Builds 4-point bounding box `[[xmin,ymin],[xmax,ymin],[xmax,ymax],[xmin,ymax]]`

**Returns**: `{text: str, lines: list[{text, confidence, bbox}], line_count: int}`

**Fallback**: If multi-language fails, retries with English only.

**Note**: PaddleOCR models are present on disk (`cls.onnx`, `det.onnx`, `rec.onnx`) but PaddleOCR is imported nowhere in the current pipeline — the OCR service exclusively uses Tesseract. PaddleOCR is listed in `requirements.txt` and was likely an earlier implementation.

### 9.6 ImageQualityService (IQA)

Pre-flight quality gate before expensive ML inference.

| Check | Method | Threshold | Rejection Reason |
|---|---|---|---|
| Blur | `cv2.Laplacian(gray, CV_64F).var()` | < 10.0 | "Image is too blurry" |
| Glare | Pixels > 245 intensity as % of total | > 95.0% | "Image has intense glare" |
| Resolution | Width × Height | < 500×500 | "Resolution too low" |
| Darkness | `np.mean(gray)` | < 40.0 | "Image is too dark" |
| Cropping | Text bbox within 5px of edge | any hit | "Document appears cropped" |

**PDF override**: If the document is a PDF-converted-to-image, the glare check is overridden (white PDF backgrounds naturally trigger >5% saturated pixels). Checked in pipeline by examining `is_pdf` flag.

**Cropping heuristic** (`check_cropping_heuristic`): Checks if any OCR bounding box falls within 5px of the image edge. Supports both 4-point `[[x,y],...]` and simple `[x,y,w,h]` bbox formats.

### 9.7 ForgeryService (ELA + CMFD + EXIF)

**Error Level Analysis (ELA)**:
- Re-saves the image at JPEG quality=90 to a BytesIO buffer
- Computes absolute pixel difference: `original - resaved`
- Applies colormap `COLORMAP_JET` for visualization
- `ela_score = np.var(diff_array) / 255.0`
- Genuine documents: low variance (uniform compression). Tampered regions: high local variance
- Saves heatmap as `ela_{original_filename}.jpg` in the same directory
- **Issue**: ELA is unreliable on PNG files (lossless). Only meaningful for JPEG. No format check exists.

**EXIF Metadata Extraction**:
- Reads EXIF tag 305 (`Software`) from PIL EXIF data
- Checks for substrings: `adobe`, `photoshop`, `gimp`, `canva`, `illustrator`, `coreldraw`
- `metadata_anomaly_score = 1.0` if any detected, `0.0` otherwise
- **Limitation**: Only checks the `Software` tag. Doesn't check `Make`, `Model`, `DateTime` consistency, GPS spoofing, etc.

**Copy-Move Forgery Detection (CMFD)**:
- ORB feature detector (`nfeatures=1000`) on grayscale image
- BF Matcher (Hamming distance, `crossCheck=False`)
- Lowe's ratio test: `m.distance < 0.75 * n.distance`
- Physical distance filter: `sqrt((pt1.x-pt2.x)^2 + (pt1.y-pt2.y)^2) > 50px`
- `cmfd_score = min(1.0, suspicious_matches / 20.0)`
- **Entity-aware tamper detection**: For each suspicious match pair, checks if either keypoint falls inside the bounding box of an extracted entity (PAN, Aadhaar, DOB, Name). If yes, adds the field name to `tampered_fields`. Triggers 95% fraud score override in RiskService.

### 9.8 QRService (Aadhaar Secure QR)

Uses `cv2.QRCodeDetector()` to detect and decode QR codes.

**Aadhaar Offline XML format**: Modern Aadhaar cards embed an XML-formatted QR code with `PrintLetterBarcodeData` root element. Key attribute `n` contains the cardholder's name.

**Cross-verification in pipeline**: After QR decode, the pipeline checks if `qr_data.get('n', '')` appears in the OCR-extracted text. If the name from the cryptographically-signed QR code is NOT present in the OCR text, the document is immediately rejected with fraud score 1.0 (mathematically certain fraud — someone photoshopped a different name onto a real card).

**Zlib decompression**: Older Aadhaar QR formats use gzip-compressed XML. Attempted via `zlib.decompress(compressed_bytes, 16 + zlib.MAX_WBITS)`.

### 9.9 DSCService (PDF Digital Signature)

Uses `pyhanko` library's `PdfFileReader` and `validation.validate_pdf_signature()`.

**Logic**:
- Opens PDF, checks `reader.embedded_signatures`
- Validates the last signature (most recent / full-document signature)
- `status.intact = True` → document bytes match the mathematical signature
- If `is_signed` and `is_tampered` → reject immediately with `fraud_score = 1.0`
- Extracts signer certificate subject (`status.signer_info.signer_cert.subject.human_friendly`)

**Coverage**: Only checks PDFs. Images have no DSC path. Correct early exit before expensive OCR/ML.

### 9.10 LayoutLMService (LayoutLMv3)

Manages two models simultaneously:
- `self.model`: `LayoutLMv3ForTokenClassification` — labels document tokens as HEADER, QUESTION, ANSWER
- `self.seq_model`: `LayoutLMv3ForSequenceClassification` — binary classification (GENUINE=0, FORGED=1)

Both loaded from `backend/models/layoutlmv3_finetuned/` with `local_files_only=True` (no network calls).

**Device**: `torch.device("cuda" if CUDA else "cpu")`. MPS explicitly disabled (comment notes "macOS OpenCV threading bugs").

**`_initialize()`**: Thread-safe double-check locking via `threading.Lock()`. Loads models lazily on first inference call.

**`extract_layout_fields(image, words, boxes)`**:
- `words` and `boxes` come from OCR (Tesseract line groups)
- `boxes` are `[xmin, ymin, xmax, ymax]` normalized to 0–1000 range
- Processor encodes image + words + boxes into input tensors (max_length=512)
- Token classification: maps predictions back to original words via `word_ids()`
- Assembles BIO spans: B-HEADER/I-HEADER, B-QUESTION/I-QUESTION, B-ANSWER/I-ANSWER
- Returns: `[{label: "HEADER"|"QUESTION"|"ANSWER", text: str, box: [x1,y1,x2,y2]}]`

**`predict_forgery(image, words, boxes)`**:
- Uses `seq_model` to get logit for class 1 (FORGED)
- Applies softmax → `fraud_prob = probs[0][1].item()`
- **Normalization**: `score = (fraud_prob - 0.70) * 10.0` clamped to `[-1.0, 1.0]`
- Baseline bias of 0.70 means the model predicts ~70% fraud probability for genuine documents → normalization centers the scale around 0
- **Issue**: This calibration is dataset-specific and may not generalize to real Canara Bank documents

### 9.11 ViTService (Vision Transformer)

Manages two models:
- `self.model` (`ViTModel.vit`): Base ViT encoder for 768-dim embedding extraction
- `self.classification_model` (`ViTForImageClassification`): Binary classifier (GENUINE/FORGED)

Both from `backend/models/vit_finetuned/` with `local_files_only=True`.

**`extract_visual_embedding(image)`**:
- `processor(images=image, return_tensors="pt")` → pixel values tensor
- `outputs.last_hidden_state[:, 0, :]` → takes the `[CLS]` token representation
- Returns `list[float]` of length 768

**`predict_forgery(image)`**:
- Uses `classification_model`
- Normalization: `score = (fraud_prob - 0.65) * 10.0` — baseline 0.65 for this model
- Returns `float` in `[-1.0, 1.0]`

**Note**: Both LayoutLMv3 and ViT are initialized in `__init__.py` as module-level singletons (`layoutlm_service = LayoutLMService()`, `vit_service = ViTService()`). The models are NOT loaded at import time (lazy via `_initialize()`). This means the first document takes significantly longer.

### 9.12 RiskService (Random Forest + SHAP)

**Training data (synthetic, 9 samples)**:

```
Features: [ela_score, layout_entities_count, metadata_anomaly, cmfd_score, layoutlm_forgery_prob, vit_forgery_prob]

Sample 0: [1.0,  10, 0.0, 0.0, 0.0,  0.0]  → GENUINE
Sample 1: [2.5,  12, 0.0, 0.0, 0.1,  0.05] → GENUINE
Sample 2: [15.0, 10, 0.0, 0.0, 0.9,  0.8]  → FORGED
Sample 3: [20.0, 11, 0.0, 0.2, 0.8,  0.9]  → FORGED
Sample 4: [1.2,  0,  0.0, 0.0, 0.6,  0.7]  → FORGED (0 layout entities)
Sample 5: [0.5,  20, 0.0, 0.0, 0.05, 0.1]  → GENUINE
Sample 6: [12.0, 2,  0.0, 0.0, 0.7,  0.9]  → FORGED
Sample 7: [0.5,  10, 1.0, 0.0, 0.8,  0.6]  → FORGED (Adobe metadata)
Sample 8: [1.0,  10, 0.0, 0.8, 0.9,  0.8]  → FORGED (CMFD)
```

**SHAP explainability**: `shap.TreeExplainer(model)` computes Shapley values for class 1. Contributions for each feature explain the fraud score increase/decrease from the base rate.

**Critical override**: If `tampered_fields` is non-empty (CMFD found copies over specific document fields), `fraud_score` is forced to `max(fraud_score, 0.95)`.

**Production issue**: 9 synthetic training samples is wildly insufficient for a production system. SHAP values from a 9-sample RF will be meaningless on real data.

### 9.13 GNNService (Heterogeneous Graph Neural Network)

**Graph schema**:

```
Node types:
  user          - 1-dim feature (ones)
  document      - 768-dim ViT embedding OR 1-dim fraud score (in analyze_fraud_rings)
  device        - 1-dim (ones)
  ip            - 1-dim (ones)
  mobile        - 1-dim (ones)
  pan           - 1-dim (ones)
  aadhaar       - 1-dim (ones)
  email_domain  - 1-dim (ones)
  text_entity   - 1-dim (ones) [format: "fieldtype:value", e.g. "pan:ABCDE1234F"]

Edge types (11 forward + 10 reverse = 21 total):
  user   --[logs_in_from]--> device
  user   --[logs_in_from]--> ip
  user   --[uses]-----------› mobile
  user   --[uses]-----------› email_domain
  user   --[has]------------› pan
  user   --[has]------------› aadhaar
  user   --[uploads]--------› document
  document --[similar_to]---> document      (cosine sim > 0.95 on ViT embeddings)
  document --[conflicts_with]-> document    (entity mismatch between docs for same user)
  document --[has_entity]---> text_entity
  user   --[similar_face]---> user          (cosine sim > 0.95 on face embeddings)
```

**HeteroFraudGCN** architecture:
- 2-layer HeteroConv (GraphSAGE)
- Layer 1: All edge types → `hidden_channels=16`
- ReLU activation
- Layer 2: All edge types → `out_channels=1`
- Output: User risk scores (GCN propagates document fraud signals to neighboring users through shared devices/IPs)

**`analyze_fraud_rings()`**:
- Builds graph from DB
- Overrides `document.x` with `[[fraud_score], ...]` 1-dim features (ignores 768-dim embeddings from `build_fraud_graph()`)
- Runs GCN forward pass
- Returns sorted user risk scores

**Critical issue**: `HeteroFraudGCN` is initialized fresh with random weights on every `/rings/analyze` call. There is no `load_state_dict()` call. The model is never trained. Outputs are meaningless random numbers propagated through the graph structure. The only signal present is from the graph connectivity (does SAGEConv aggregate zero vs non-zero neighbors).

### 9.14 ValidationService (Business Rules)

Runs 7 sequential checks. All results stored in `validation_rules` inside `forgery_features` JSON.

| Rule # | Check | Method | Failure Action |
|---|---|---|---|
| 1 | OCR Confidence | Avg line confidence ≥ 0.85 | `passed=False` |
| 2 | Mandatory Fields | Aadhaar: aadhaar#, DOB, gender present. PAN: pan#, DOB present | `passed=False` |
| 3 | Format Validation | Aadhaar: 12 digits. PAN: `^[A-Z]{5}[0-9]{4}[A-Z]$` | `passed=False` |
| 4 | Date Validation | DOB: age 18–120 years | `passed=False` |
| 5 | Cross-Field Consistency | DOB on current doc vs DOB on previous docs for same user | `passed=False, needs_review=True` |
| 6 | Duplicate Detection | Aadhaar/PAN already registered to another user account | `passed=False, needs_review=True` |
| 7 | Device Rule | Same device used for >50 accounts | `passed=False, needs_review=True` |

If `validation_results["needs_review"]` or `not validation_results["passed"]`: fraud score is forced to `max(fraud_score, 0.85)`.

Additionally, `iqa_service.check_cropping_heuristic()` result is added to `details.cropping_heuristic`.

---

## 10. Document AI Pipeline — Exhaustive Walkthrough

`DocumentPipelineService.process_document(document_id: str)` is called as a `BackgroundTask` (Starlette in-process thread).

```
INPUT: document_id (UUID string)

STAGE -1: PDF Digital Signature Check (PDFs only)
  ├── dsc_service.verify_pdf_signature(file_path)
  ├── If is_signed AND is_tampered:
  │     Write DocumentAnalysis(fraud_score=1.0, forgery_features={dsc_tampered:True})
  │     Set document.status = REJECTED
  │     RETURN (pipeline exits)
  └── Continue to Stage 0

STAGE 0a: PDF → Image Conversion (PDFs only)
  ├── fitz.open(file_path) [PyMuPDF]
  ├── page.get_pixmap(matrix=fitz.Matrix(2, 2))  [2x zoom for OCR quality]
  └── Save to {file_path}.jpg → use this for all remaining stages

STAGE 0b: Image Quality Assessment
  ├── iqa_service.assess_quality(file_path)
  ├── PDF glare override: if is_pdf and glare caused rejection → force is_acceptable=True
  ├── If not is_acceptable:
  │     Write DocumentAnalysis(fraud_score=0.0, forgery_features={iqa_rejection:True, reason:...})
  │     Set document.status = REJECTED
  │     RETURN
  └── Continue to Stage 1

STAGE 1: Open Image + Concurrent Independent Tasks
  ├── image = Image.open(file_path).convert("RGB")
  ├── width, height = image.size
  └── ThreadPoolExecutor(max_workers=5):
        PARALLEL:
        ├── future_ocr  = ocr_service.extract(file_path)       [Tesseract]
        ├── future_qr   = qr_service.extract_qr_data(file_path) [OpenCV QR]
        ├── future_vit_emb = vit_service.extract_visual_embedding(image) [768-dim]
        ├── future_vit_prob = vit_service.predict_forgery(image)  [ViT classifier]
        ├── future_ela = forgery_service.perform_ela(file_path)   [PIL ELA]
        └── future_meta = forgery_service.extract_metadata(file_path) [EXIF]

        WAIT for OCR + QR:
        ├── ocr_results = future_ocr.result()
        │     raw_text = ocr_results["text"]
        │     lines    = ocr_results["lines"]
        │
        ├── qr_data = future_qr.result()
        │     If qr_data and qr_name NOT in raw_text:
        │       Write DocumentAnalysis(fraud_score=1.0, {qr_mismatch:True})
        │       Set document.status = REJECTED
        │       RETURN
        │
        ├── Extract words + boxes from OCR lines
        │   Normalize boxes: _normalize_box(bbox, width, height) → [xmin,ymin,xmax,ymax] 0–1000
        │
STAGE 2: Dependent Tasks (need OCR output)
  ├── PARALLEL (still inside executor):
  │   ├── future_layout = layoutlm_service.extract_layout_fields(image, words, boxes)
  │   ├── future_layout_prob = layoutlm_service.predict_forgery(image, words, boxes)
  │   ├── extracted_entities = _extract_document_entities(lines)  [regex: PAN, Aadhaar, DOB, GSTIN, Name]
  │   └── future_cmfd = forgery_service.detect_copy_move(file_path, extracted_entities)
  │
  ├── WAIT for all futures:
  │   ├── vit_embedding      = future_vit_emb.result()    [list[float] 768]
  │   ├── vit_forgery_prob   = future_vit_prob.result()   [float in -1..1]
  │   ├── forgery_data       = future_ela.result()        [{ela_score, max_difference, heatmap_path}]
  │   ├── meta_data          = future_meta.result()       [{metadata_anomaly_score, software_signature}]
  │   ├── layout_entities    = future_layout.result()     [list[{label, text, box}]]
  │   ├── layoutlm_forgery_prob = future_layout_prob.result() [float in -1..1]
  │   └── cmfd_data          = future_cmfd.result()       [{cmfd_score, suspicious_matches, tampered_fields}]

STAGE 3: Risk Scoring + Business Rules
  ├── risk_data = risk_service.calculate_risk(
  │     ela_score, layout_entities_count, metadata_anomaly,
  │     cmfd_score, tampered_fields, layoutlm_forgery_prob, vit_forgery_prob
  │   )
  ├── preliminary_fraud_score = risk_data["preliminary_fraud_score"]
  ├── shap_explanation = risk_data["shap_explanation"]
  │
  ├── is_cropped = iqa_service.check_cropping_heuristic(width, height, raw_boxes)
  │
  ├── validation_results = validation_service.run_all_rules(
  │     db, document.user_id, ocr_results, extracted_entities, raw_text
  │   )
  │
  └── If validation failed or needs_review:
        preliminary_fraud_score = max(preliminary_fraud_score, 0.85)

STAGE 4: Persist to Database
  ├── DocumentAnalysis(
  │     document_id, ocr_raw_text, layout_entities (JSON),
  │     vit_embedding (JSON), forgery_features (JSON), preliminary_fraud_score
  │   )
  ├── If fraud_score > 0.70: document.status = NEEDS_REVIEW
  └── Else: document.status = COMPLETED

ERROR HANDLING:
  ├── Any exception → rollback → re-fetch document → set status = FAILED
  └── Uses separate DB session (SessionLocal()) not the request session
```

**Concurrency Architecture**: `ThreadPoolExecutor(max_workers=5)` within a background task thread. Total threads: 1 (BackgroundTask) + 5 (executor workers) = 6 threads per active document. Under load, this can exhaust the OS thread pool. The Python GIL limits true parallelism for CPU-bound ML inference.

---

## 11. ML Models on Disk

### LayoutLMv3 Fine-tuned (`backend/models/layoutlmv3_finetuned/`)

| File | Purpose |
|---|---|
| `config.json` | Model architecture config (num_labels=2, id2label, label2id) |
| `model.safetensors` | Model weights in HuggingFace SafeTensors format |
| `tokenizer.json` | BPE tokenizer vocabulary + merge rules |
| `tokenizer_config.json` | Tokenizer class + special tokens config |
| `merges.txt` | BPE merge rules for RoBERTa-style tokenizer |
| `vocab.json` | Token → ID mapping |
| `special_tokens_map.json` | CLS, SEP, PAD, UNK token mappings |
| `preprocessor_config.json` | Image preprocessor config (resize 224×224, normalize) |
| `training_args.bin` | Serialized TrainingArguments from last run |

**Base model**: `microsoft/layoutlmv3-base`  
**Task**: `LayoutLMv3ForSequenceClassification` (num_labels=2: GENUINE/FORGED)  
**Also used for**: `LayoutLMv3ForTokenClassification` (FUNSD labels: HEADER/QUESTION/ANSWER)  
**Training**: 5 epochs, LR=1e-5, batch=4, gradient_accumulation=2 (effective batch=8), weight_decay=0.05

### ViT Fine-tuned (`backend/models/vit_finetuned/`)

| File | Purpose |
|---|---|
| `config.json` | Model config (num_labels=2) |
| `model.safetensors` | ViT weights |
| `preprocessor_config.json` | Image normalization (ImageNet mean/std) |
| `training_args.bin` | Training configuration |

**Base model**: `google/vit-base-patch16-224-in21k`  
**Task**: `ViTForImageClassification` (num_labels=2: GENUINE/FORGED)  
**Also used for**: Visual embedding extraction (768-dim `[CLS]` token from `vit.last_hidden_state`)

### PaddleOCR ONNX Models (`backend/app/models/ocr/`)

| File | Role |
|---|---|
| `det.onnx` | Text detection (finds text regions) |
| `rec.onnx` | Text recognition (reads characters) |
| `cls.onnx` | Text direction classification (0°/180°) |

**Status**: Present on disk, imported in `requirements.txt`, but **not used** in the current OCR service. The active implementation uses Tesseract. These were from a previous PaddleOCR implementation phase.

---

## 12. Training Scripts

### `train_layoutlmv3.py`

Trains `LayoutLMv3ForSequenceClassification` on a locally-prepared dataset.

**Dataset paths**: `datasets/layoutlm_dataset/` and `datasets/layoutlm_dataset_part2/` (HuggingFace `load_from_disk()` format). These directories are not in the repo (gitignored).

**Training configuration**:
- LR: `1e-5`
- Batch: `4` per device, gradient accumulation `2` → effective batch `8`
- Epochs: `5` (full) or `1` (subset mode, `TRAIN_FULL_DATASET=False`)
- Workers: `cpu_count() - 1`
- `remove_unused_columns=False` — critical: prevents HF Trainer from dropping image columns
- `pin_memory=False` — MPS doesn't support pinned memory
- Best model saved by F1 score
- `resume_from_checkpoint=True` — allows interrupted training to resume

**Dataset format** (from `prepare_layoutlm_dataset.py` implied): HuggingFace Dataset with columns `{image, words, bboxes, label}` where `label ∈ {0, 1}` (GENUINE/FORGED).

### `train_vit.py`

Trains `ViTForImageClassification`. Structure similar to LayoutLMv3 training.

### Dataset Preparation Scripts

**`prepare_layoutlm_dataset.py`**: Reads genuine + forged document images from directories, runs OCR to extract words + bboxes, creates HuggingFace Dataset.

**`prepare_directory_dataset.py`**: Generic image directory → HuggingFace Dataset conversion.

### `seed_employees.py`

Creates three default employee accounts if they don't exist:

| Email | Password | Role |
|---|---|---|
| `admin@veritrust.in` | `Admin@12345` | `ADMIN` |
| `analyst@veritrust.in` | `Analyst@12345` | `FRAUD_ANALYST` |
| `officer@veritrust.in` | `Officer@12345` | `LOAN_OFFICER` |

Passwords stored as bcrypt hashes. Uses `EmployeeRepository.count()` to check for existing records before seeding.

### Model Download Scripts

**`download_hf_models.py`**: Pre-downloads `microsoft/layoutlmv3-base` and `google/vit-base-patch16-224-in21k` to `models/hf/` for offline Docker builds.

**`download_face_models.py`**: Triggers InsightFace `buffalo_l` download to `~/.insightface/models/`.

**`download_ocr_models.py`**: Downloads PaddleOCR PP-OCRv4 models and converts to ONNX via `paddle2onnx`.

---

## 13. Frontend Architecture

### 13.1 Build & Configuration

**Build tool**: Vite (`vite.config.ts`). Dev server port 5173, HMR enabled.

**TypeScript**: Strict mode via `tsconfig.json`.

**Tailwind**: Configured in `tailwind.config.js`. Custom color tokens:
- `canara-blue` — primary Canara Bank navy blue
- `canara-gold` — primary Canara Bank gold/yellow accent
- `canara-blue-dark`, `canara-blue-light` — variants
- `canara-gray` — background gray

**Custom CSS classes** (in `index.css`): `dashboard-shell`, `dashboard-topbar`, `dashboard-sidebar`, `dashboard-main`, `dashboard-body`, `sidebar-nav-item`, `dash-card`, `dash-card-header`, `section-heading`, `btn-primary`, `btn-sm-secondary`, `badge-verified`, `badge-danger`.

**Docker**: Vite dev server inside Docker with `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true` for file-watch compatibility on Windows/Docker mounts.

### 13.2 Routing & Auth Context

**`App.tsx` routes**:
```
/                          → LandingPage
/aadhaar/register          → CustomerOnboardingPage (primary Aadhaar flow, 5 steps)
/aadhaar/register/legacy   → AadhaarRegisterPage (legacy)
/aadhaar/face-enroll       → FaceEnrollPage
/customer/register         → CustomerRegisterPage (email flow)
/customer/login            → CustomerLoginPage
/employee/login            → EmployeeLoginPage
/customer/dashboard        → ProtectedRoute(actorType="customer") → CustomerDashboard
/employee/dashboard        → ProtectedRoute(actorType="employee") → EmployeeDashboard
```

**`ProtectedRoute`**: Reads `actorType` from `AuthContext`. Redirects to `/customer/login` or `/employee/login` if not authenticated or wrong actor type.

**`AuthContext`**:
- State: `{accessToken, refreshToken, role, actorType}` — initialized from `localStorage` on mount
- `login(tokens)`: Saves all 4 values to `localStorage` + state
- `logout()`: Clears localStorage + state
- **Security issue**: Storing JWTs in `localStorage` exposes them to XSS attacks. Production should use `HttpOnly` cookies.

### 13.3 API Layer

**`api/client.ts`**:
```typescript
export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" }
});

// Request interceptor: adds Authorization: Bearer <token>
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

`getBaseUrl()`: Reads `VITE_API_URL` env var, falls back to `{protocol}//{hostname}:8000`.

**No response interceptor**: No `401` → token refresh logic. Expired tokens result in unauthenticated API errors with no automatic retry.

**`api/auth.ts`**: Typed API functions for all auth endpoints + document upload. `getErrorMessage()` extracts `detail` from Axios error responses (handles both string and Pydantic validation error array formats).

### 13.4 Key Pages

**`CustomerOnboardingPage`** (5-step Aadhaar flow):
1. Aadhaar number + mobile number input → `POST /auth/customer/aadhaar/send-otp`
2. 6-digit OTP input (`OTPInput` component) → `POST /auth/customer/aadhaar/verify-otp`
3. Full profile form (name, email, PAN, password, confirm password) → `POST /auth/customer/aadhaar/complete-registration`
4. Face enrollment → camera capture → `POST /auth/customer/aadhaar/enroll-face`
5. Success screen + dashboard redirect

**`EmployeeLoginPage`** (multi-step MFA):
1. Load CAPTCHA from `GET /auth/employee/captcha` → display math question + answer input
2. Enter email, password, CAPTCHA answer → track `typing_start_ms` → `POST /auth/employee/login`
3. If `next_step == "REQUIRE_OTP"`: Show OTP input → `POST /auth/employee/verify-otp`
4. Show camera for face verification → capture base64 frame → `POST /auth/employee/verify-face`
5. On `TokenResponse` → `auth.login(tokens)` → redirect to `/employee/dashboard`

**`CustomerDashboard`**: 
- Decodes JWT to extract `sub` (user_id) for document upload form
- `POST /api/customer/document/upload` with `FormData(file, document_type, user_id)`
- Status polling via `GET /api/customer/document/status/{id}` on manual button click
- No auto-polling/WebSocket — purely manual refresh

### 13.5 Dashboard Components

**`DocumentForensics.tsx`**:
- Fetches `GET /api/analyst/fraud/documents` on mount
- Left panel: scrollable list of documents with fraud score badge
- Right panel: selected document detail view
- States: PENDING (trigger button), PROCESSING (spinner), COMPLETED/NEEDS_REVIEW (full forensics view)
- **SHAP translation** (`getShapTranslation()`): Converts raw SHAP contributions into human-readable English sentences:
  - ELA contribution > 0.05 → "pixel compression mismatch" warning
  - Metadata anomaly → "EXIF proves Adobe manipulation"
  - CMFD score → "N cloned pixel patches detected"
  - ViT contribution → "Vision Transformer detected manipulation artifacts"
  - LayoutLMv3 contribution → "Multimodal AI found text-layout misalignment"
  - Cross-document conflicts → "Identity mismatch on another document"
- Visual evidence: Side-by-side original image + ELA heatmap via `<img src={API_URL}/{file_path}>` (no access control)
- Manual trigger: `POST /api/analyst/fraud/verify/{doc_id}` fires the AI pipeline

**`FraudRings.tsx`**:
- Fetches `GET /api/analyst/fraud/rings/analyze` on mount
- Splits users into high-risk (score > 0.5) and low-risk panels
- No network graph visualization — purely tabular risk score display
- "Re-Analyze Graph" button re-triggers GNN inference

---

## 14. Docker & Infrastructure

### `docker-compose.yml` Services

**`postgres`**:
```yaml
image: postgres:16-alpine
container_name: veritrust_postgres
ports: ["5433:5432"]  # Note: external port 5433 (not 5432 — avoids conflicts with local installs)
volumes: [postgres_data:/var/lib/postgresql/data]
healthcheck: pg_isready -U veritrust -d veritrust_db (every 5s, 5 retries)
```

**`redis`**:
```yaml
image: redis:7-alpine
container_name: veritrust_redis
ports: ["6379:6379"]
healthcheck: redis-cli ping (every 5s, 5 retries)
```

**`backend`**:
```yaml
build: ./backend/Dockerfile
env_file: ./backend/.env
environment:
  DATABASE_URL: postgresql://veritrust:veritrust_secret@postgres:5432/veritrust_db
  REDIS_URL: redis://redis:6379/0
ports: ["8000:8000"]
depends_on: {postgres: {condition: service_healthy}, redis: {condition: service_healthy}}
volumes: [./backend:/app]  # Live reload
CMD: alembic upgrade head && python scripts/seed_employees.py && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**`frontend`**:
```yaml
ports: ["5173:5173"]
environment: {CHOKIDAR_USEPOLLING: "true", WATCHPACK_POLLING: "true"}
volumes: [./frontend:/app, /app/node_modules]  # node_modules anonymous volume to avoid host mount shadowing
```

### `backend/Dockerfile`

Base: `python:3.11-slim`

**System dependencies** installed: `gcc`, `g++`, `cmake`, `libpq-dev`, `libglib2.0-0`, `libgl1`, `libsm6`, `libxext6`, `libxrender1`, `libgomp1` (for OpenCV, InsightFace, PostgreSQL).

**Build steps**:
1. `pip install -r requirements.txt`
2. `python scripts/download_ocr_models.py` — downloads + converts PaddleOCR models
3. `python scripts/download_hf_models.py` — downloads LayoutLMv3 + ViT
4. `python scripts/download_face_models.py` — downloads InsightFace buffalo_l

**Issues**:
- Model downloads during build mean network connectivity required at build time
- Models are baked into the image layer → very large Docker image
- No multi-stage build to minimize final image size
- No `.dockerignore` mentioned — build context may include `uploads/`, `test_docs/`, `datasets/`

---

## 15. Security Architecture — Current State

### Authentication Matrix

| Actor | Login Method | MFA | Session |
|---|---|---|---|
| Customer | Email/Mobile/Aadhaar + Password | Email OTP (first registration) | JWT (access 30m + refresh 7d) |
| Employee | Email + Password | CAPTCHA → BCS → OTP or Face | JWT (access 30m + refresh 7d) |

### Implemented Security Controls

- bcrypt password hashing (cost factor 12)
- JWT HS256 with configurable expiry
- Redis OTP rate limiting
- OTP expiry (5 minutes)
- PAN format validation
- Aadhaar format validation (12 digits)
- Password strength policy (upper+lower+digit+special, min 8 chars)
- Employee audit logging (actions, status, device_id)
- Behavioral confidence scoring (typing speed heuristic)
- Trusted device tracking
- Math CAPTCHA (HMAC-signed, stateless, 5-min expiry)
- Face verification for employees (InsightFace cosine similarity)
- Document status state machine (prevents re-verification)

---

## 16. Critical Bugs & Security Vulnerabilities

This section documents every confirmed security issue and functional bug discovered in the audit.

### CRITICAL — Authentication & Access Control

**BUG-001: Analyst routes completely unauthenticated**  
File: `app/api/analyst/fraud.py`  
```python
# require_fraud_analyst is defined but NEVER used
def require_fraud_analyst(current_employee: EmployeeAccount = Depends(get_current_employee)):
    ...
# The actual routes have no Depends:
@router.get("/documents")
def get_analyzed_documents(db: Session = Depends(get_db)):  # ← no auth!
```
Any unauthenticated request to `/api/analyst/fraud/documents`, `/api/analyst/fraud/rings/analyze`, or `POST /api/analyst/fraud/verify/{id}` succeeds. A malicious actor can trigger the AI pipeline on any document, read all forensic analysis results, or run the GNN against the entire user database without logging in.

**FIX**: Add `current_employee: EmployeeAccount = Depends(require_fraud_analyst)` to all three route functions.

---

**BUG-002: Employee audit log endpoint unauthenticated**  
File: `app/api/auth/employee.py`  
```python
@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):  # ← no auth dep
```
Audit logs reveal employee IDs, login attempts, BCS scores, and device IDs to unauthenticated callers.

**FIX**: Add `Depends(get_current_employee)`.

---

**BUG-003: OTP returned in API response (demo/dev hack in production)**  
File: `app/api/auth/customer.py`  
```python
return MobileSendOTPResponse(
    message=f"OTP sent successfully. Demo OTP: {otp_code}",  # ← plaintext OTP in response!
    ...
)
```
The OTP is embedded in the success message. A man-in-the-middle or log reader gets the OTP without needing the SMS.

**FIX**: Remove `otp_code` from response. Return only `{"message": "OTP sent successfully."}`.

---

**BUG-004: OTP stored as plaintext in database**  
File: `app/db/models/__init__.py`  
`otp_code: Mapped[str] = mapped_column(String(64), ...)` — The column is 64 chars (sized for a hash) but OTP codes are stored raw. A database breach exposes all pending OTPs.

**FIX**: Hash OTP before storage: `otp_code = hashlib.sha256(otp_code.encode()).hexdigest()`. Compare hash on verification.

---

**BUG-005: Face verification auto-passes on macOS (and first login everywhere)**  
File: `app/services/face_service.py`  
On macOS, `MockApp` returns zero-vector embeddings. `compare_embeddings()` returns `1.0` for zero-norm vectors. Employee face verification always passes on the developer's machine.

First-time employee login (no stored embedding) auto-enrolls from the current image and immediately passes with `similarity = 1.0`. No separate enrollment step is required.

**FIX**: Remove macOS stub for production deployments. Require explicit face enrollment before enabling face authentication.

---

**BUG-006: CORS allows all HTTP origins**  
File: `app/main.py`  
```python
allow_origin_regex=r"^http://.*"
```
This allows any HTTP origin including `http://evil.example.com` to make credentialed CORS requests.

**FIX**: `allow_origins=["https://your-production-domain.com"]` in production.

---

**BUG-007: JWT secret key has insecure default**  
Default: `"change-this-to-a-long-random-secret-in-production"`. If `.env` is not set up properly (common in Docker deployments), the known default enables JWT forgery.

**FIX**: Validate in `Settings` startup: `if settings.jwt_secret_key.startswith("change-this"): raise RuntimeError(...)`.

---

### HIGH — Data Integrity & Business Logic

**BUG-008: Test endpoint creates mock user with plaintext password hash**  
File: `app/api/documents/router.py`  
```python
user = User(full_name="System Tester", email="tester@veritrust.in", password_hash="mock")
```
Creates a DB user with `password_hash="mock"` — not a valid bcrypt hash. The `verify_password()` function would fail but the account exists with effectively no password. Additionally, this endpoint triggers the full AI pipeline without any authentication.

**FIX**: Remove or authentication-gate this endpoint. Do not create users from endpoints.

---

**BUG-009: No database-level foreign key constraints**  
`Document.user_id`, `DocumentAnalysis.document_id` have no SQLAlchemy `ForeignKey()` declarations. The DB has no referential integrity. Orphaned records are possible.

**FIX**: Add `ForeignKey("users.id")` and `ForeignKey("documents.id")` in ORM models and a new Alembic migration to add DB constraints.

---

**BUG-010: `customer/document/upload` accepts `user_id` from form data**  
File: `app/api/customer/document.py`  
```python
user_id: uuid.UUID = Form(...)
```
Any authenticated user can upload a document attributed to any `user_id` by supplying someone else's UUID. There is no check that `user_id == current_user.id`.

**FIX**: Extract `user_id` from the JWT claim (`sub`) instead of the form.

---

**BUG-011: `GNNService` uses untrained model — outputs are random**  
`HeteroFraudGCN` is instantiated with random weights in `analyze_fraud_rings()` on every call. There is no trained model file and no `load_state_dict()`. The "fraud risk scores" displayed in the FraudRings UI are meaningless.

**FIX**: Either train the GNN and save weights (`torch.save(model.state_dict(), path)`), or clearly mark the output as "demo/experimental."

---

**BUG-012: Risk scoring Random Forest trained on 9 synthetic samples**  
`RiskService.__init__()` trains a `RandomForestClassifier` on 9 hard-coded synthetic feature vectors. SHAP explanations derived from this model are unreliable.

**FIX**: Replace with a model trained on real historical data. At minimum, document this limitation prominently.

---

**BUG-013: `document.schema.py` is empty**  
File: `app/schemas/document.py` — completely empty. API endpoints return raw `dict` objects instead of validated Pydantic response models. No type safety, no OpenAPI schema for document endpoints.

**FIX**: Define `DocumentUploadResponse`, `DocumentStatusResponse`, `DocumentAnalysisResponse` Pydantic models.

---

### MEDIUM — Security Hardening

**BUG-014: JWT stored in localStorage (XSS exposure)**  
Frontend stores `access_token` and `refresh_token` in `localStorage`. Any XSS vulnerability in the React app can steal both tokens.

**FIX**: Implement `HttpOnly` + `Secure` + `SameSite=Strict` cookie-based token storage. Requires API changes.

---

**BUG-015: Static files served without access control**  
```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```
ELA heatmaps, original uploaded ID documents, and converted PDFs are served publicly at `http://localhost:8000/uploads/documents/UUID.jpg`. No authentication.

**FIX**: Remove static file mount. Serve document images through an authenticated endpoint that validates JWT + checks `user_id` matches.

---

**BUG-016: No rate limiting on API endpoints (outside OTP)**  
Authentication endpoints, document upload, and GNN analysis have no rate limiting. Redis is available but only used for OTP cooldown.

**FIX**: Integrate `slowapi` (FastAPI rate limiter) with Redis backend. Apply per-IP limits to auth endpoints.

---

**BUG-017: No token refresh mechanism**  
`refresh_token` is issued but there is no `/auth/refresh` endpoint. When `access_token` expires (30 minutes), the user is silently logged out on the next API call.

**FIX**: Implement `POST /auth/refresh` that validates refresh token and issues new access token. Add Axios 401 interceptor on frontend.

---

**BUG-018: No request body size limit**  
FastAPI/Starlette has no default file size limit. Uploading a 10GB file would exhaust server memory during `await file.read()`.

**FIX**: Set `MAX_UPLOAD_SIZE = 10 * 1024 * 1024` (10MB) and validate `Content-Length` header before reading.

---

**BUG-019: `otp_rate_limit_seconds = 5` (too permissive)**  
Config default is `5` seconds. README says `60` seconds. Five seconds allows 12 OTP requests per minute per number — insufficient rate limiting.

**FIX**: Set to `60` in `.env.example` and config default.

---

**BUG-020: Temp files not cleaned up in FaceService**  
```python
with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
    temp_file.write(image_bytes)
    temp_path = temp_file.name
# temp_path is never deleted
return self.extract_embedding(temp_path)
```
Every face verification/enrollment creates a temp file that persists. Under load, this fills `/tmp`.

**FIX**: Add `finally: os.unlink(temp_path)` after `extract_embedding()`.

---

**BUG-021: `hmac.new()` may not be portable Python**  
`captcha_service.py` uses `hmac.new(...)` which is a CPython internal (not part of the documented `hmac` module API). The correct public API is `hmac.HMAC(key, msg, digestmod)` or `hmac.new(key, msg, digestmod)` which is documented as equivalent. Verify this works on PyPy or other runtimes.

---

**BUG-022: Employee name hardcoded in frontend**  
`EmployeeDashboard.tsx`:
```typescript
<p className="text-sm font-bold text-white">John Doe</p>
<p className="text-xs text-canara-gold">EMP001245 · {displayRole}</p>
```
Employee identity is hardcoded. The name/ID should be decoded from the JWT or fetched from a `/api/auth/employee/me` endpoint.

---

**BUG-023: Duplicate `update_face_embedding` method**  
`UserRepository` defines `update_face_embedding` twice. Second definition shadows first. Harmless but indicates code quality issues.

---

**BUG-024: No input validation on `document_type` form field**  
`document_type: str = Form(...)` — accepts any string. Could be `"<script>alert(1)</script>"`. Should be validated against an enum.

---

**BUG-025: ELA unreliable on PNG files**  
`ForgeryService.perform_ela()` re-saves the image as JPEG regardless of original format. PNG is lossless; re-saving as JPEG creates compression artifacts that generate false ELA signals even on genuine documents.

**FIX**: Skip ELA or apply PNG-specific algorithm for PNG inputs.

---

**BUG-026: `BackgroundTasks` not durable**  
Starlette `BackgroundTasks` run in the same process. If the Uvicorn worker crashes mid-pipeline (e.g., OOM kill during ViT inference), the background task dies silently and the document stays in `PROCESSING` state forever.

**FIX**: Migrate to Celery + Redis for durable async task execution.

---

## 17. Production Readiness Gaps & Remediation Roadmap

### Phase 1: Critical Security Fixes (Week 1)

1. **Apply auth guards to all analyst routes** (BUG-001, BUG-002) — 2 lines of code
2. **Remove OTP from API response** (BUG-003) — 1 line change
3. **Hash OTPs before DB storage** (BUG-004) — sha256 in OTPService
4. **Remove/secure the mock test endpoint** (BUG-008)
5. **Add CORS restriction** (BUG-006) — one env var change
6. **Validate JWT secret at startup** (BUG-007)
7. **Fix user_id in customer document upload** (BUG-010) — extract from JWT

### Phase 2: Data Integrity & Architecture (Week 2)

1. **Add FK constraints** (BUG-009) — new Alembic migration
2. **Create document Pydantic schemas** (BUG-013) — `schemas/document.py`
3. **Add file size validation** (BUG-018) — middleware
4. **Add rate limiting** (BUG-016) — `slowapi` integration
5. **Implement token refresh** (BUG-017) — `/auth/refresh` endpoint + Axios interceptor
6. **Migrate to task queue** (BUG-026) — Celery + Redis broker
7. **Fix OTP rate limit to 60s** (BUG-019)
8. **Fix temp file cleanup** (BUG-020)

### Phase 3: Storage & Observability (Week 3)

1. **Replace local file storage with S3** — `boto3` + presigned URLs for serving
2. **Remove static file mount** (BUG-015) — authenticated document serving endpoint
3. **Add pgvector for embeddings** — `CREATE EXTENSION vector`, migrate `vit_embedding` column
4. **Structured logging** — `structlog` + ELK/CloudWatch
5. **Sentry error tracking** — capture pipeline failures
6. **Health check endpoint** — check DB, Redis, model loading status
7. **Connection pool tuning** — `pool_size=20, max_overflow=10, pool_recycle=3600`

### Phase 4: ML Robustness (Week 4)

1. **Train GNN with real data** (BUG-011) — or mark outputs as experimental
2. **Replace synthetic RF** (BUG-012) — real training data for risk scoring
3. **ELA format check** (BUG-025) — skip for PNG files
4. **Model versioning** — MLflow or DVC to track model versions
5. **Model warm-up on startup** — call `_initialize()` at startup to avoid cold-start latency
6. **SHAP value calibration** — collect ground truth labels and retrain RF

### Phase 5: Frontend Security (Week 5)

1. **HttpOnly cookies for JWT** (BUG-014) — backend `Set-Cookie` + frontend `withCredentials`
2. **Fix hardcoded employee identity** (BUG-022) — `/auth/employee/me` endpoint
3. **Add document_type enum validation** (BUG-024)
4. **WebSocket status polling** — replace manual refresh with `ws://` for document status
5. **CSP headers** — `Content-Security-Policy` to mitigate XSS
6. **HTTPS enforcement** — redirect HTTP→HTTPS + HSTS header

### Phase 6: Production Infrastructure (Week 6)

1. **Multi-stage Dockerfile** — separate build stage to reduce image size
2. **`.dockerignore`** — exclude `uploads/`, `datasets/`, `test_docs/`
3. **Kubernetes deployment manifests** — HPA for backend, PVC for model files
4. **Redis Sentinel / ElastiCache** — HA Redis for OTP and Celery broker
5. **RDS PostgreSQL** — managed DB with automated backups, read replicas
6. **CDN for frontend assets** — CloudFront or Cloudflare
7. **Secrets management** — AWS Secrets Manager / HashiCorp Vault (remove `.env` files)
8. **OTP record cleanup** — cron job to purge expired `otp_verifications`

---

## 18. Performance Bottlenecks

### ML Inference Latency

| Operation | Estimated Time | Notes |
|---|---|---|
| Tesseract OCR | 2–8s | Preprocessing + multi-language |
| ELA | 0.2–0.5s | Fast PIL operations |
| ORB CMFD | 0.5–2s | Depends on image resolution |
| LayoutLMv3 Token Classification | 1–4s | CPU-only (no CUDA/MPS) |
| LayoutLMv3 Sequence Classification | 0.5–2s | Same model, second forward pass |
| ViT Embedding + Classification | 0.5–2s | CPU-only |
| SHAP RF scoring | 0.01–0.1s | Fast (9-sample RF) |
| GNN (on-demand) | 2–15s | Depends on graph size, rebuilds every call |
| **Total Pipeline** | **~10–30s** | Concurrent Stage 1 saves significant time |

### Concurrency Issues

- `ThreadPoolExecutor(max_workers=5)` runs inside a background thread inside Uvicorn. If 10 documents are submitted simultaneously: 10 background threads × 5 executor workers = 50 threads minimum
- PyTorch is not fully thread-safe in CPU mode. Multiple threads calling `.forward()` simultaneously on the same model can cause memory corruption or deadlocks
- `threading.Lock()` in `_initialize()` protects model loading but not inference

**Recommended architecture**: Move document processing to Celery workers (separate processes), one worker per CPU/GPU, with Celery's `prefetch_multiplier=1` to prevent concurrent model inference in a single process.

### Database Query Issues

- No eager loading: `DocumentAnalysis` + `Document` + `User` joined in `GET /analyst/fraud/documents` using `db.query(Document, DocumentAnalysis, User).join(...)` — fine for small datasets, but no pagination
- GNN graph construction queries all users and all document analyses in a single batch — O(N²) face similarity computation without indexing
- No indexes on `document_analyses.preliminary_fraud_score` or `documents.status` — full table scans for filtering

### Memory Usage

- LayoutLMv3 base model: ~450MB RAM in float32 (CPU)
- ViT base model: ~330MB RAM in float32 (CPU)
- InsightFace buffalo_l: ~500MB RAM (ONNX)
- PaddleOCR ONNX models: ~200MB combined
- **Total model memory**: ~1.5GB (all loaded simultaneously)

Under concurrent pipeline execution, multiple copies of tensors can double this. Minimum 8GB RAM recommended; 16GB for production.

---

## 19. Testing State

### Current Test Coverage

The codebase contains the following test files at the root level of `backend/`:
- `test_import.py` — import smoke tests
- `test_ocr.py` — manual OCR test runner
- `test_paddle.py` — PaddleOCR smoke test
- `test_workflow.py` — end-to-end workflow manual test

**`scripts/test_gnn.py`** — GNN graph construction smoke test  
**`scripts/test_shap.py`** — SHAP explainability smoke test

**What does NOT exist**:
- No `pytest` configuration (`pytest.ini`, `conftest.py`)
- No unit tests for any service class
- No API integration tests
- No database fixture setup/teardown
- No CI pipeline (GitHub Actions, etc.)
- No load tests
- No model regression tests

### Recommended Testing Strategy

**Unit Tests** (pytest + unittest.mock):
- `OTPService`: Mock Redis + DB, test rate limiting, expiry, verification logic
- `AuthService`: Mock repositories, test all registration + login flows
- `ForgeryService`: Test ELA with known clean/tampered images
- `ValidationService`: Test all 7 business rules in isolation
- `RiskService`: Test feature vector → score mapping
- `DocumentPipelineService`: Mock all services, test stage orchestration logic

**Integration Tests** (pytest + testcontainers):
- DB integration: Spin up real PostgreSQL, run migrations, test repositories
- Redis integration: Spin up real Redis, test OTP rate limiting
- API integration: `TestClient(app)` from FastAPI's test helpers

**End-to-End Tests**:
- Customer registration → login → document upload → status poll
- Employee login MFA flow
- Full document pipeline: upload → pipeline → analyst view

**Model Tests**:
- LayoutLMv3: Accuracy/F1 on a held-out test set
- ViT: Accuracy/F1 on a held-out test set
- Regression: Score on known genuine/forged test images in `test_docs/`
