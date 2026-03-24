# Candidate Effort Tracker

Full-stack web application for tracking candidate work hours and billing.

**Stack:** Python FastAPI · SQL Server LocalDB · Angular 20 · Angular Material 20

---

## Project Structure

```
EffortTracking/
├── src/
│   ├── backend/        ← FastAPI application
│   ├── frontend/       ← Angular application
│   └── database/       ← SQL scripts
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 22+
- SQL Server LocalDB (included with Visual Studio) **or** SQL Server Express
- ODBC Driver 17 for SQL Server → [Download](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)

---

### 1 – Database Setup

Open **SQL Server Management Studio (SSMS)** or **sqlcmd**, connect to `(localdb)\MSSQLLocalDB` with Windows Authentication, and run:

```sql
-- from root of repo
src/database/schema.sql
```

Then generate real bcrypt hashes for sample data (one-time):

```powershell
cd src/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed_admin.py    # prints UPDATE statements → run them in SSMS
```

---

### 2 – Backend

```powershell
cd src/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# .env is already created — verify the connection string
cat .env

uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

---

### 3 – Frontend

```powershell
cd src/frontend
npm install --legacy-peer-deps
ng serve                   # http://localhost:4200
```

---

## Default Credentials (after running seed_admin.py)

| Role      | Email                      | Password       |
|-----------|----------------------------|----------------|
| Admin     | admin@efforttracker.dev    | Admin@123      |
| Admin     | manager@efforttracker.dev  | Admin@123      |
| Candidate | alice@efforttracker.dev    | Candidate@123  |
| Candidate | bob@efforttracker.dev      | Candidate@123  |
| Candidate | carol@efforttracker.dev    | Candidate@123  |

---

## Feature Summary

| Phase | Feature                        | Status |
|-------|-------------------------------|--------|
| 1     | Project scaffold               | ✅     |
| 2     | SQL Server schema + SPs        | ✅     |
| 3     | JWT Authentication             | ✅     |
| 4     | Candidate Timesheet UI         | ✅     |
| 5     | Candidate Dashboard            | ✅     |
| 6     | Admin Module (projects, candidates, assignments) | ✅ |
| 7     | Admin Reports + Excel export  | ✅     |
| 8     | Email credentials on signup   | ✅     |
| 9     | Docker & nginx                | ✅     |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (JWT) |
| GET  | `/api/auth/me` | Current user |
| GET  | `/api/candidates` | List candidates (admin) |
| POST | `/api/candidates` | Create candidate (admin) |
| PATCH| `/api/candidates/{id}/status` | Activate/deactivate |
| GET  | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (admin) |
| POST | `/api/projects/assign` | Assign project to candidate |
| GET  | `/api/timesheet/projects` | Candidate's assigned projects |
| GET  | `/api/timesheet?month=&year=` | Monthly timesheet |
| POST | `/api/timesheet` | Add timesheet entry |
| PUT  | `/api/timesheet/{id}` | Update entry |
| DELETE | `/api/timesheet/{id}` | Delete entry |
| GET  | `/api/dashboard/summary?month=&year=` | Monthly billing summary |
| GET  | `/api/dashboard/trend?months=6` | Hours trend |
| GET  | `/api/report/admin/all-candidates?month=&year=` | Full report |
| GET  | `/api/report/admin/all-candidates/export?month=&year=` | Excel export |

---

## Docker Deployment

```powershell
# From repo root
docker compose up --build
```

Frontend: http://localhost  
Backend API: http://localhost/api/docs  

> **Note:** The Docker backend requires a SQL Server instance accessible from the container. Update `DB_CONNECTION_STRING` in `.env` to use SQL Authentication for Docker deployments.

---

## Environment Variables (`src/backend/.env`)

| Variable | Description |
|----------|-------------|
| `DB_CONNECTION_STRING` | pyodbc connection string |
| `JWT_SECRET_KEY` | Secret key for JWT signing (min 32 chars) |
| `JWT_EXPIRY_MINUTES` | Token lifetime (default: 480 = 8h) |
| `ALLOWED_ORIGINS` | JSON array of allowed CORS origins |
| `SMTP_HOST/PORT/USER/PASSWORD` | Email settings (optional) |
| `EMAIL_FROM` | Sender address for credential emails |
| `APP_URL` | Public URL included in credential emails |

---

## Architecture

```
Angular SPA
  └── authInterceptor (JWT Bearer)
  └── authGuard / roleGuard

FastAPI Backend
  └── Router → Service → Repository → execute_sp()
                                        └── pyodbc → SQL Server SPs
                                                      (all calculations in DB)
```
