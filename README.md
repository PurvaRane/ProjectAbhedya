<div align="center">
  <h1>🛡️ VeriTrust</h1>
  <h3>Real-Time AI Forensic Engine for Document Fraud Detection in Indian Banking</h3>
  
  ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
  ![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
</div>

<br/>

**VeriTrust** is a production-grade, end-to-end AI forensic platform purpose-built for **Canara Bank**. It automates document fraud detection in **real-time** using a massive **10-stage AI security pipeline**, Heterogeneous Graph Neural Networks (GNN) for fraud ring detection, and Explainable AI (SHAP) to provide human-readable risk assessments.

---

## 📑 Table of Contents
- [📑 Table of Contents](#-table-of-contents)
- [🎯 Problem Statement](#-problem-statement)
- [💡 Our Solution \& Business Impact](#-our-solution--business-impact)
  - [🏆 Why VeriTrust is a Tier-1 Solution](#-why-veritrust-is-a-tier-1-solution)
- [🔬 The 10-Stage AI Security Pipeline](#-the-10-stage-ai-security-pipeline)
- [🕸️ Fraud Ring Detection (GNN)](#️-fraud-ring-detection-gnn)
- [🧑 Biometric \& Business Validation](#-biometric--business-validation)
  - [Facial Verification](#facial-verification)
  - [Business Logic Layer](#business-logic-layer)
- [🏗️ System Architecture](#️-system-architecture)
- [🔐 Authentication \& Security Flows](#-authentication--security-flows)
  - [Employee Login State Machine](#employee-login-state-machine)
  - [Customer Registration Flow](#customer-registration-flow)
- [🗄️ Database Schema \& API](#️-database-schema--api)
  - [Core API Endpoints](#core-api-endpoints)
- [⚡ Quick Start in 5 Minutes (No ML Build)](#-quick-start-in-5-minutes-no-ml-build)
- [🚀 Getting Started (Installation)](#-getting-started-installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Start All Services via Docker](#3-start-all-services-via-docker)
  - [4. Run Migrations \& Seed Data](#4-run-migrations--seed-data)
  - [5. Access the Platform](#5-access-the-platform)
- [⚙️ Environment Configuration](#️-environment-configuration)
  - [Backend (`backend/.env`)](#backend-backendenv)
- [📊 Capability Matrix](#-capability-matrix)
- [🧪 Complete Testing Workflow](#-complete-testing-workflow)
  - [Step-by-Step Judging Guide:](#step-by-step-judging-guide)
- [🛠️ Troubleshooting](#️-troubleshooting)
  - [Windows-Specific Issues](#windows-specific-issues)
- [🧑‍💻 Local Development (Without Full Docker)](#-local-development-without-full-docker)

---

## 🎯 Problem Statement

Document fraud is the single largest enabler of financial crime in Indian banking. According to RBI data, Indian banks reported **₹65,017 crore** in fraud losses in FY2023–24. A significant share of this is attributed to forged identity documents (Aadhaar, PAN, GSTIN) used during KYC onboarding, loan applications, and account openings. 

Current verification systems rely heavily on manual review by bank employees — a process that is:
- **Slow**: Takes 2–5 days per document.
- **Subjective & Error-Prone**: Human eyes cannot detect pixel-level manipulation.
- **Unscalable**: Bottlenecks digital banking adoption across India.

Modern forgeries use AI-generated documents, pixel-level copy-move manipulation, metadata scrubbing, and tampered digital signatures — techniques that are virtually invisible to the human eye.

---

## 💡 Our Solution & Business Impact

**VeriTrust** replaces the manual verification bottleneck with an asynchronous AI pipeline that processes documents in **under 10 seconds**. Instead of replacing the human analyst, VeriTrust empowers them. Every AI decision is fully explainable in plain English using **SHAP (SHapley Additive exPlanations)**, ensuring RBI compliance and clear audit trails.

### 🏆 Why VeriTrust is a Tier-1 Solution
1. **Offline-First AI**: Models (LayoutLMv3, ViT) run locally via ONNX/PyTorch. Zero dependency on external APIs ensures strict data privacy for PII.
2. **Asynchronous Processing**: Heavy ML workloads are offloaded to **Celery** background workers backed by **Redis**, ensuring the FastAPI server never blocks.
3. **Cryptographic Proofs**: Mathematical validation of UIDAI Secure QR codes and embedded PKCS#7 digital signatures.
4. **Network-Level Security**: GNNs catch organized fraud rings that traditional 1-to-1 document checks completely miss.

---

## 🔬 The 10-Stage AI Security Pipeline

Every document uploaded to VeriTrust passes through sequential and parallel analysis stages:

| Stage                                 | Technology              | What It Does                                                                                                                             |
| ------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Digital Signature Verification** | `PyHanko` (PKCS#7)      | Cryptographically validates signatures in government e-PDFs. A mismatch is a mathematical proof of tampering (instant 100% fraud score). |
| **2. Image Quality Assessment**       | `OpenCV`                | Rejects blurry or glare-affected uploads *before* running expensive AI models, saving GPU compute.                                       |
| **3. OCR Text Extraction**            | `Tesseract v5`          | Extracts text (eng+hin+mar) with per-line bounding boxes, adaptive thresholding, and DPI upscaling.                                      |
| **4. Secure QR Cryptography**         | `OpenCV` + `zlib`       | Decodes Aadhaar Secure QR codes and cross-validates the embedded name against OCR text.                                                  |
| **5. Error Level Analysis (ELA)**     | `PIL` + `NumPy`         | Detects pixel splicing by computing JPEG compression differences. Generates a JET colormap heatmap indicating forged regions.            |
| **6. EXIF Metadata Forensics**        | `PIL` EXIF Parser       | Scans hidden metadata for manipulation software signatures (e.g., Photoshop, Canva, Illustrator).                                        |
| **7. Copy-Move Forgery Detection**    | `OpenCV` ORB            | Detects cloned pixels using 1000 ORB keypoints and Lowe's ratio test, mapping clones to OCR bounding boxes.                              |
| **8. LayoutLMv3 Multimodal AI**       | `Transformers`          | Fine-tuned transformer that jointly understands text *and* its spatial geometry to detect tampered document templates.                   |
| **9. Vision Transformer (ViT)**       | `ViT-Base`              | Extracts 768-dimensional embeddings to predict forgery probabilities from purely visual anomalies.                                       |
| **10. SHAP Explainable AI**           | `scikit-learn` + `SHAP` | Aggregates all signals into a unified risk score. SHAP decomposes the score into plain-English explanations for the analyst.             |

---

## 🕸️ Fraud Ring Detection (GNN)

Traditional systems look at documents in isolation. VeriTrust detects **organized fraud rings** using a **Heterogeneous Graph Neural Network (HeteroGNN)** built with `PyTorch Geometric`.

- **11 Node Types**: User, Document, Device, IP, Mobile, Email Domain, PAN, Aadhaar, Text Entity.
- **11 Edge Types**: `user → logs_in_from → device`, `document → similar_to → document` (ViT Cosine > 0.95), `document → conflicts_with → document` (identity contradiction).
- **GraphSAGE Convolutions**: Allows inductive risk propagation. If User A uploads a forged document, risk automatically propagates to User B if they share the same Device ID or IP address.

---

## 🧑 Biometric & Business Validation

### Facial Verification
Powered by **InsightFace (Buffalo_L)** and ONNX Runtime. Extracts 512-dimensional face embeddings for cosine similarity matching, preventing fraudsters from opening multiple accounts under different names.

### Business Logic Layer
7 deterministic rules ensure data integrity:
1. Average OCR confidence must be > 60%.
2. Mandatory field validation (Aadhaar needs Number + DOB + Gender).
3. Strict Regex enforcement for PAN (`[A-Z]{5}[0-9]{4}[A-Z]{1}`).
4. Cross-document DOB consistency checks.
5. Device fingerprinting (flags if >50 accounts share a device).

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[React Frontend Dashboard] -->|REST API + JWT| API[FastAPI Gateway]
    API -->|Read/Write| DB[(PostgreSQL 16)]
    API -->|Enqueue ML Task| RedisQueue[(Redis Broker)]
    RedisQueue --> Celery[Celery ML Worker]
    
    subgraph "Celery Worker (Background AI)"
        Celery --> IQA[IQA & Cryptography]
        Celery --> OCR[Tesseract OCR]
        Celery --> CNN[ELA & CMFD Forensics]
        Celery --> Transformers[LayoutLMv3 & ViT]
        Transformers --> SHAP[SHAP Risk Engine]
    end
    
    SHAP -->|Update Status| DB
    Celery -->|GNN Edges| GNN[PyTorch Geometric GNN]
    GNN --> DB
```

---

## 🔐 Authentication & Security Flows

VeriTrust incorporates strict, enterprise-grade banking security:

- **Passwords**: Hashed via `bcrypt` (Passlib).
- **Sessions**: Stateless `JWT` Access (30m) & Refresh (7d) tokens.
- **OTP**: Redis-backed Twilio SMS & Gmail SMTP OTPs with 60-second cooldowns and 5-minute expiries.
- **Rate Limiting**: `SlowAPI` enforces 60 requests/minute to prevent brute-force attacks.
- **Middleware**: Injects HSTS, CSP, X-Frame-Options, and X-XSS-Protection headers.
- **File Security**: Strict 10MB limits, Path Traversal protection, and authenticated route guards for document viewing.

### Employee Login State Machine

Bank staff login uses a multi-step MFA flow: offline CAPTCHA → credentials → Behavioral Confidence Score (BCS) → optional email OTP → face verification → JWT.

```mermaid
stateDiagram-v2
    [*] --> Captcha: GET /api/auth/employee/captcha
    Captcha --> LoginInit: POST /api/auth/employee/login\n(captcha + email + password + device_id)
    LoginInit --> Failed: CAPTCHA or credentials invalid
    Failed --> [*]
    LoginInit --> BCS: Credentials verified
    BCS --> RequireOTP: BCS below 80\n(untrusted device or fast typing)
    BCS --> RequireFace: BCS >= 80\nand trusted device
    RequireOTP --> RequireFace: POST /api/auth/employee/verify-otp
    RequireOTP --> Failed: Invalid or expired OTP
    RequireFace --> JWT: POST /api/auth/employee/verify-face\n(demo: 5s delay + bypass)
    RequireFace --> Failed: Face processing error
    JWT --> [*]: access_token + refresh_token issued
```

| Step | API | What happens |
| ---- | --- | ------------ |
| 1 | `GET /api/auth/employee/captcha` | Stateless math CAPTCHA (offline, no external API). |
| 2 | `POST /api/auth/employee/login` | Verifies CAPTCHA + password; computes BCS from typing speed and device trust. |
| 3a | `POST /api/auth/employee/verify-otp` | *(If required)* Email OTP check via Redis; OTP prints to logs if SMTP is blank. |
| 3b | Skip OTP | Trusted device + human-like typing skips straight to face step. |
| 4 | `POST /api/auth/employee/verify-face` | Face match (demo uses hardcoded bypass); marks device as trusted. |
| 5 | JWT cookies | `access_token` (30m) + `refresh_token` (7d) set for dashboard access. |

### Customer Registration Flow
1. Enter Mobile → OTP sent via Twilio SMS.
2. Verify OTP → Enter Full Name, PAN, Email, Password.
3. Alternative: Email-based registration with SMTP OTP.

---

## 🗄️ Database Schema & API

| Table                 | Purpose                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `users`               | Customer profiles (Email, Mobile, PAN, Aadhaar, password hash, Face Embedding).                        |
| `employee_accounts`   | Pre-seeded Bank Staff (Admins, Fraud Analysts, Loan Officers).                                         |
| `documents`           | Upload metadata, path, and real-time processing status (`PENDING`, `PROCESSING`, `COMPLETED`).         |
| `document_analyses`   | Stores OCR text, ViT embeddings, SHAP features, and final Risk Score.                                  |
| `otp_verifications`   | Temporary storage for SMS/Email OTP validation state.                                                  |
| `employee_audit_logs` | Immutable audit trail for bank staff actions (login success/failures, document verification triggers). |

### Core API Endpoints
- **POST** `/api/auth/customer/register/mobile/send-otp` (Twilio SMS)
- **POST** `/api/auth/customer/login` (JWT Issuance)
- **POST** `/api/customer/document/upload` (Enqueues Document)
- **GET** `/api/analyst/fraud/documents` (Returns Aggregated Analytics)
- **POST** `/api/analyst/fraud/verify/{id}` (Manual AI Trigger)
- **GET** `/api/analyst/fraud/rings/analyze` (Triggers HeteroGNN)

---

## ⚡ Quick Start in 5 Minutes (No ML Build)

Use this path to demo **auth, registration, and the analyst dashboard** without waiting for the full Docker ML image build (OCR model download + PyTorch can take 30+ minutes and often fails on first build).

**You get:** customer/employee login, OTP flows, dashboard UI, document upload listing.  
**You skip:** Celery worker, GPU, HuggingFace model download, full `docker-compose up --build`.

### Steps (Windows PowerShell)

```powershell
git clone https://github.com/PurvaRane/ProjectAbhedya.git
cd ProjectAbhedya

copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Edit `backend/.env` — minimum for local Docker:

```env
DATABASE_URL=postgresql://veritrust:veritrust_secret@localhost:5433/veritrust_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=change-me-to-a-long-random-string
# Leave SMTP/Twilio blank — OTPs print in backend logs
```

Start **only** Postgres, Redis, API, and frontend (no Celery, no `--build`):

```powershell
docker-compose up postgres redis backend frontend -d
```

Migrate and seed test accounts:

```powershell
docker exec veritrust_backend alembic upgrade head
docker exec veritrust_backend python scripts/seed_employees.py
```

Open [http://localhost:5173](http://localhost:5173) and log in as **Fraud Analyst**: `analyst@veritrust.in` / `Analyst@12345`.

When registering a customer, watch the backend container logs for OTP codes:

```powershell
docker logs -f veritrust_backend
```

### When you need document AI later

Start Celery inside the existing backend container (avoids rebuilding the `celery_worker` image):

```powershell
docker exec -d veritrust_backend python -m celery -A app.worker.celery_app worker --loglevel=info
```

Then use **Verify Document (Run AI)** on the analyst dashboard. First run may be slow on CPU.

### Auth-only local backend (no Docker API)

If you prefer `uvicorn` on Windows without installing PyTorch:

```powershell
docker-compose up postgres redis -d
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# If torch install fails, auth still works — ML routes lazy-load on first use
$env:DATABASE_URL="postgresql://veritrust:veritrust_secret@localhost:5433/veritrust_db"
$env:REDIS_URL="redis://localhost:6379/0"
alembic upgrade head
python scripts/seed_employees.py
uvicorn app.main:app --reload --port 8000
```

Stop the Docker `backend` service first if port `8000` is already taken.

---

## 🚀 Getting Started (Installation)

**Prerequisites:** 
- Docker Desktop installed and running.
- Git installed.
- **8GB+ RAM** available (Transformers and PyTorch require significant memory).
- Ports `5173`, `8000`, `5433`, and `6379` free.

### 1. Clone the Repository
```bash
git clone https://github.com/PurvaRane/ProjectAbhedya.git
cd ProjectAbhedya
```

### 2. Configure Environment Variables

**Important:** Only `*.env.example` files belong in git. Never commit `backend/.env` or `frontend/.env`.

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

On Windows (PowerShell):

```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Then edit `backend/.env` locally with your SMTP/Twilio keys if needed.

**Optional — block accidental .env commits:**

```powershell
.\scripts\install-git-hooks.ps1
```

*(Leave SMTP/Twilio blank in `.env` for offline mode — OTPs print to the backend terminal.)*

### 3. Start All Services via Docker
```bash
docker-compose up --build
```
This spawns 5 containers: `postgres`, `redis`, `backend` (FastAPI), `celery_worker`, and `frontend` (Vite).

### 4. Run Migrations & Seed Data
In a **new terminal window**, run:
```bash
docker exec veritrust_backend alembic upgrade head
docker exec veritrust_backend python scripts/seed_employees.py
```

### 5. Access the Platform
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Swagger Documentation**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
| Variable              | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string.                      |
| `REDIS_URL`           | Redis broker and cache string.                     |
| `JWT_SECRET_KEY`      | High-entropy secret for signing tokens.            |
| `TWILIO_ACCOUNT_SID`  | *(Optional)* Twilio Account SID for Live SMS.      |
| `TWILIO_AUTH_TOKEN`   | *(Optional)* Twilio Auth Token.                    |
| `TWILIO_PHONE_NUMBER` | *(Optional)* E.164 formatted Twilio sender number. |
| `SMTP_USER`           | *(Optional)* Gmail address for OTPs.               |
| `SMTP_PASSWORD`       | *(Optional)* Gmail 16-character App Password.      |

*If Twilio/SMTP are left blank, VeriTrust falls back to `[OFFLINE SIMULATION]` mode and prints OTPs directly to the terminal logs.*

### Secrets safety

| File | Commit to git? | Purpose |
| ---- | -------------- | ------- |
| `backend/.env.example` | Yes | Template with empty placeholders |
| `frontend/.env.example` | Yes | Template with safe defaults |
| `backend/.env` | **Never** | Your real DB URL, JWT secret, SMTP, Twilio |
| `frontend/.env` | **Never** | Local API URL overrides |

If credentials were ever pushed to GitHub, **rotate them immediately** (Gmail App Password, Twilio Auth Token, JWT secret).

---

## 📊 Capability Matrix

What works in each setup — use this to choose between the [5-minute quick start](#-quick-start-in-5-minutes-no-ml-build) and the full ML stack.

| Feature | Redis required? | Celery required? | GPU required? | Twilio / SMTP required? | 5-min setup | Full Docker build |
| ------- | --------------- | ---------------- | ------------- | ----------------------- | ----------- | ----------------- |
| Customer email/mobile registration | Yes (OTP state) | No | No | No — OTPs in logs | Yes | Yes |
| Customer login (JWT) | No | No | No | No | Yes | Yes |
| Employee MFA login (CAPTCHA → OTP → Face) | Yes | No | No — face is demo bypass | No — email OTP in logs | Yes | Yes |
| Employee audit logs | No | No | No | No | Yes | Yes |
| Document upload & metadata | No | No | No | No | Yes (stays `PENDING`) | Yes |
| 10-stage document AI pipeline | Yes (broker) | **Yes** | No — CPU works, GPU faster | No | No — start worker manually | Yes |
| ELA heatmaps, ViT, LayoutLM, SHAP | Yes | **Yes** | No — CPU works, GPU faster | No | No | Yes |
| Fraud ring GNN analysis | No | No | No — CPU inference | No | Limited without `torch` locally | Yes |
| Live SMS / email delivery | Yes | No | No | **Yes** (Twilio + SMTP) | Optional | Optional |

**Notes**

- **Without Redis:** OTP cooldowns and employee login fail — always run `redis` (Docker or local).
- **Without Celery:** uploads succeed but documents never move past `PENDING` / `PROCESSING`.
- **Without GPU:** all ML stages run on CPU; expect multi-minute first inference.
- **Without Twilio/SMTP:** set those env vars to empty strings; codes appear in `docker logs veritrust_backend` or `backend/offline_otps.log`.

---

## 🧪 Complete Testing Workflow

We have pre-seeded employee accounts to evaluate the Analyst Dashboard immediately.

| Role              | Email                | Password      |
| ----------------- | -------------------- | ------------- |
| **Administrator** | admin@veritrust.in   | Admin@12345   |
| **Fraud Analyst** | analyst@veritrust.in | Analyst@12345 |
| **Loan Officer**  | officer@veritrust.in | Officer@12345 |

### Step-by-Step Judging Guide:
1. **Open Employee Dashboard**: Go to `http://localhost:5173/employee/login`. Login as Fraud Analyst. *(Note: Behavioral/Face auth is bypassed in demo mode)*.
2. **Open Customer Portal**: Open an **Incognito/Private Window** and go to `http://localhost:5173/customer/register`.
3. **Register Customer**: Complete email or mobile registration. (Check the backend terminal output for the 6-digit OTP code).
4. **Upload Document**: Upload a test document (e.g., an Aadhaar or PAN card image).
5. **Trigger AI Pipeline**: Switch back to the Employee Dashboard. Go to **Document Forensics**. You will see the document listed as `PENDING`. Click **Verify Document (Run AI)**.
6. **Watch the Background Worker**: In your terminal running `docker-compose`, watch the `celery_worker` logs. You will see models loading, ELA generation, and ViT extraction happening asynchronously.
7. **Review Explainable AI**: Refresh the Employee dashboard. Observe the final Risk Score, the SHAP plain-English explanations, and the generated ELA manipulation heatmap.
8. **Analyze Graph Rings**: Navigate to **Fraud Rings (GNN)** and click **Analyze Fraud Rings** to view cross-user correlations.

---

## 🛠️ Troubleshooting

| Problem                                   | Cause & Solution                                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dockerDesktopLinuxEngine pipe error`     | Docker daemon is not running. Start Docker Desktop first.                                                                                                                       |
| Frontend changes not reflecting           | Vite polling is active. Press `Ctrl+F5` for a hard refresh.                                                                                                                     |
| Database Migration Errors                 | Ensure `docker-compose up` is fully running before executing `alembic upgrade head`.                                                                                            |
| Port 5433 / 5173 / 8000 already in use    | Postgres is mapped to **5433** (not 5432). Run `docker-compose down`, kill conflicting processes, and retry.                                                                    |
| Email OTP fails with `535 BadCredentials` | You used your standard Gmail password. You must generate a Google **App Password**.                                                                                             |
| SMS OTP fails                             | Ensure the recipient number is verified on your Twilio Trial account, and Geo-permissions for India are enabled. Leave Twilio blank to use offline OTP logs instead.            |
| AI Models not loading                     | Ensure the machine has sufficient RAM. If running natively without Docker, ensure `/backend/models/` contains the necessary HuggingFace weights or fallback logic is triggered. |
| `docker-compose up --build` fails on OCR  | Paddle2ONNX / model download step failed. Use the [5-minute quick start](#-quick-start-in-5-minutes-no-ml-build) without `--build`, or start Celery manually in the backend container. |
| Documents stuck on `PENDING`              | Celery worker is not running. Start with `docker exec -d veritrust_backend python -m celery -A app.worker.celery_app worker --loglevel=info`.                                 |
| Employee login `500` / unexpected error   | Often Redis down or bcrypt mismatch — see [Windows-specific issues](#windows-specific-issues) below.                                                                            |

### Windows-Specific Issues

| Problem | Cause & Solution |
| ------- | ---------------- |
| **`fatal: Unable to create '.git/index.lock'`** (OneDrive) | OneDrive sync locks `.git` while Cursor/Git writes. Close Cursor, delete `ProjectAbhedya\.git\index.lock`, pause OneDrive sync for the project folder, or move the repo outside OneDrive (e.g. `C:\dev\ProjectAbhedya`). |
| **Employee login `500` — bcrypt / passlib** | `bcrypt` 4.x breaks `passlib` 1.7.4. Pin versions from `requirements.txt`: `bcrypt==3.2.2`, `passlib[bcrypt]==1.7.4`. In venv: `pip install --force-reinstall bcrypt==3.2.2 "passlib[bcrypt]==1.7.4"`. Restart `uvicorn`. |
| **Celery: `executable file not found in $PATH`** | Older backend image has no Celery on PATH. Run: `docker exec -d veritrust_backend python -m celery -A app.worker.celery_app worker --loglevel=info` (note `python -m celery`, not bare `celery`). |
| **`ModuleNotFoundError: No module named 'torch'`** (local) | Expected on Windows without CUDA. Auth and dashboard work via lazy ML imports. Install full `requirements.txt` only when you need GNN/document AI locally. |
| **PowerShell `&&` not valid** | Use `;` or run commands on separate lines. Example: `cd backend; .\venv\Scripts\Activate.ps1` |
| **Wrong Postgres port locally** | Docker maps Postgres to **5433**. Set `DATABASE_URL=...@localhost:5433/veritrust_db` in `backend/.env`, not `5432`. |
| **Redis connection refused (local uvicorn)** | Start Redis: `docker-compose up redis -d`. Use `REDIS_URL=redis://localhost:6379/0` (not `redis://redis:6379` — that hostname only works inside Docker). |
| **venv activation blocked** | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, then `.\venv\Scripts\Activate.ps1`. |

---

## 🧑‍💻 Local Development (Without Full Docker)

If you prefer to run services natively for faster Hot Module Replacement (HMR):

1. **Start Infrastructure**:
   ```bash
   docker-compose up postgres redis -d
   ```
2. **Start Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate          # Windows: .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   alembic upgrade head
   python scripts/seed_employees.py
   uvicorn app.main:app --reload --port 8000
   ```
3. **Start Celery Worker** (optional — only for document AI):
   ```bash
   cd backend
   source venv/bin/activate          # Windows: .\venv\Scripts\Activate.ps1
   python -m celery -A app.worker.celery_app worker --loglevel=info
   ```
4. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

See the [Capability Matrix](#-capability-matrix) for what works without Celery, GPU, or Twilio.

---

<div align="center">
  <b>Canara Bank — VeriTrust Digital Platform</b> <br/>
  <i>Built for the Prototype Phase Hackathon.</i>
</div>
