# VeriTrust — Canara Bank Digital Platform

**VeriTrust** is an AI forensic document fraud detection platform for **Canara Bank**. This repository contains the enterprise authentication module with customer and employee portals, OTP verification, and JWT-based access control.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI, PostgreSQL, SQLAlchemy, Alembic, Pydantic, JWT, Passlib (bcrypt), Redis, Twilio |
| Frontend | React, TypeScript, Tailwind CSS, React Hook Form, Zod, Axios, React Router, Vite |
| DevOps | Docker, Docker Compose |

---

## Project Structure

```
ProjectAbhedya/
├── backend/
│   ├── app/
│   │   ├── api/auth/          # Customer & employee auth routes
│   │   ├── core/              # Config, security, JWT
│   │   ├── db/models/         # SQLAlchemy models
│   │   ├── db/repositories/   # Data access layer
│   │   ├── services/          # Auth, OTP, email, SMS services
│   │   └── schemas/           # Pydantic request/response models
│   ├── alembic/               # Database migrations
│   ├── scripts/               # Seed scripts
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # CanaraHeader, CanaraFooter, layouts
│   │   ├── pages/             # Landing, login, register, dashboards
│   │   └── api/               # Axios client & auth API
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Quick Start (Docker)

**Prerequisites:** Docker Desktop installed and running.

```powershell
cd ProjectAbhedya
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |

Run in background:

```powershell
docker-compose up --build -d
```

Stop all services:

```powershell
docker-compose down
```

---

## Hot Reload (No Restart Needed for Code Changes)

Both frontend and backend are configured for **live reload inside Docker**. You do **not** need to run `docker-compose up -d --force-recreate frontend` after every code change.

| Change type | Auto reload? | Action required |
|-------------|--------------|-----------------|
| Frontend `.tsx` / `.css` files | Yes (Vite HMR) | Save file — browser updates automatically |
| Backend `.py` files | Yes (uvicorn `--reload`) | Save file — API reloads automatically |
| `backend/.env` | No | `docker-compose up -d --force-recreate backend` |
| `frontend/.env` | No | `docker-compose up -d --force-recreate frontend` |
| `requirements.txt` | No | `docker-compose up -d --build backend` |
| `package.json` | No | `docker-compose up -d --build frontend` |
| `docker-compose.yml` | No | `docker-compose up -d --force-recreate` |

**Tip (Windows + Docker):** File watching uses polling so changes are detected reliably. If the browser does not update, hard-refresh with `Ctrl+F5`.

**Fastest local dev (optional):** Run only DB/Redis in Docker and start frontend/backend natively for instant HMR:

```powershell
docker-compose up postgres redis -d
# Terminal 1: backend with uvicorn --reload
# Terminal 2: frontend with npm run dev
```

---

## Local Development (Without Full Docker)

### 1. Configure environment

```powershell
cd backend
copy .env.example .env
# Edit .env with your secrets

cd ../frontend
copy .env.example .env
```

### 2. Start PostgreSQL & Redis

```powershell
cd ProjectAbhedya
docker-compose up postgres redis -d
```

### 3. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python scripts/seed_employees.py
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend (new terminal)

```powershell
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`.

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens |
| `OTP_EXPIRE_MINUTES` | OTP validity (default: 5) |
| `SMTP_*` | Gmail SMTP for email OTP (App Password required) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio number in E.164 format e.g. `+14155552671` |
| `FAST2SMS_API_KEY` | Optional SMS fallback (paid) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## Mobile SMS OTP (Twilio)

1. Sign up at https://www.twilio.com/try-twilio
2. Copy **Account SID** and **Auth Token** from Twilio Console
3. Buy/get a Twilio phone number: **Phone Numbers → Manage → Active numbers**
4. **Trial accounts:** Verify recipient numbers at **Verified Caller IDs**
5. Enable **India** in **Messaging → Geo permissions** if sending to Indian numbers
6. Add to `backend/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+14155552671
```

7. Reload backend env only (not needed for code changes):

```powershell
docker-compose up -d --force-recreate backend
```

> `TWILIO_PHONE_NUMBER` must be your **Twilio-purchased number**, not your personal mobile.

---

## Email OTP (Gmail SMTP)

1. Enable 2-Step Verification on your Google account
2. Create an App Password at https://myaccount.google.com/apppasswords
3. Add to `backend/.env` (no spaces in App Password):

```env
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your16charapppassword
SMTP_FROM=your@gmail.com
```

4. Recreate backend after `.env` change:

```powershell
docker-compose up -d --force-recreate backend
```

---

## API Endpoints

### Customer Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/customer/register/email` | Register with email (sends OTP) |
| POST | `/api/auth/customer/register/email/verify-otp` | Verify email OTP & activate account |
| POST | `/api/auth/customer/register/mobile/send-otp` | Send mobile OTP via SMS |
| POST | `/api/auth/customer/register/mobile/verify-otp` | Verify mobile OTP |
| POST | `/api/auth/customer/register/mobile/complete` | Complete mobile registration |
| POST | `/api/auth/customer/login` | Login with email or mobile + password |

### Employee Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/employee/login` | Employee login (pre-seeded accounts only) |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |

---

## Default Employee Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@veritrust.in | Admin@12345 | ADMIN |
| analyst@veritrust.in | Analyst@12345 | FRAUD_ANALYST |
| officer@veritrust.in | Officer@12345 | LOAN_OFFICER |

> **Warning:** These credentials are for development and demonstration only and must be changed before production deployment.

---

## Authentication Flows

### Customer — Email Registration
1. Submit full name, email, password
2. OTP sent to email via Gmail SMTP
3. Verify OTP → account activated
4. Login with email + password

### Customer — Mobile Registration
1. Enter mobile number → OTP sent via Twilio SMS
2. Verify OTP
3. Enter full name, PAN, email, password
4. Account created and activated

### Customer Login
- Email + Password **OR** Mobile + Password
- Returns JWT access & refresh tokens

### Employee Login
- Pre-seeded accounts only (no self-registration)
- Email + Password → JWT tokens → Staff dashboard

---

## Security Features

- bcrypt password hashing via Passlib
- JWT access & refresh tokens
- Redis OTP rate limiting (60s cooldown)
- OTP expiry (5 minutes)
- Duplicate email/mobile registration prevention
- PAN format validation (`ABCDE1234F`)
- Input sanitization
- Environment-based secrets (never committed to git)

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Customer accounts (email, mobile, PAN, password hash) |
| `employee_accounts` | Pre-seeded staff accounts |
| `otp_verifications` | Email and mobile OTP records with expiry |

Run migrations:

```powershell
docker exec veritrust_backend alembic upgrade head
# or locally:
cd backend && alembic upgrade head
```

Seed employees:

```powershell
docker exec veritrust_backend python scripts/seed_employees.py
# or locally:
cd backend && python scripts/seed_employees.py
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `dockerDesktopLinuxEngine` pipe error | Start Docker Desktop first |
| Frontend changes not showing | Save file, wait 1–2s, then `Ctrl+F5`. Vite polling is enabled for Docker on Windows |
| Backend not picking up `.env` | `docker-compose up -d --force-recreate backend` |
| Email OTP fails (535 BadCredentials) | Use Gmail **App Password**, not regular password |
| SMS fails (Twilio) | Use E.164 Twilio number as `TWILIO_PHONE_NUMBER`; verify recipient on trial |
| Port already in use | `docker-compose down` then retry |

---

## License

Canara Bank — VeriTrust Digital Platform.
