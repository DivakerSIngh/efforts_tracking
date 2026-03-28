# EffortTracking API - Startup Troubleshooting Guide

## Common Errors & Solutions

### Error 1: "ModuleNotFoundError" or Import Errors
**Problem**: The API can't find required Python packages

**Solution**:
```powershell
# Go to backend folder
cd D:\AI Assistant\EffortTracking\src\backend

# Activate virtual environment
venv\Scripts\activate.bat

# Reinstall all dependencies fresh
pip uninstall -y fastapi uvicorn pyodbc passlib python-jose python-multipart pydantic python-dotenv

# Install again
pip install -r requirement.txt
```

---

### Error 2: Database Connection Error
**Problem**: "Cannot connect to database" or "Login failed"

**Solution**:

1. **Check SQL Server is running**:
```powershell
# For LocalDB:
sqlcmd -S (localdb)\MSSQLLocalDB -Q "SELECT @@version"

# For SQL Server Express:
sqlcmd -S .\SQLEXPRESS -Q "SELECT @@version"
```

2. **If command not found, install SQL Server tools**:
```powershell
# Download from: https://learn.microsoft.com/en-us/sql/tools/sqlcmd/sqlcmd-utility
# Or install SQL Server Management Studio
```

3. **Check .env file has correct connection string**:
   - File: `D:\AI Assistant\EffortTracking\src\backend\.env`
   - Should contain:
```ini
DATABASE_URL=Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\MSSQLLocalDB;Database=Efforts_Tracking;Trusted_Connection=yes;
```

4. **Verify database exists**:
```powershell
sqlcmd -S (localdb)\MSSQLLocalDB -Q "SELECT name FROM sys.databases WHERE name='Efforts_Tracking'"

# If empty, create it:
sqlcmd -S (localdb)\MSSQLLocalDB -Q "CREATE DATABASE Efforts_Tracking"
```

---

### Error 3: ".env file not found"
**Problem**: API says .env is missing

**Solution**:

Create file: `D:\AI Assistant\EffortTracking\src\backend\.env`

Copy this content:
```ini
# Database Connection
DATABASE_URL=Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\MSSQLLocalDB;Database=Efforts_Tracking;Trusted_Connection=yes;

# Security
SECRET_KEY=your-super-secret-key-change-this-123456
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS=["http://localhost:4200","http://localhost:8000"]

# Environment
ENVIRONMENT=production
DEBUG=False
```

---

### Error 4: Port 8000 Already in Use
**Problem**: "Address already in use" or "Port 8000 is in use"

**Solution**:

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port - edit start_api.bat:
# Change: python -m uvicorn main:app --host 0.0.0.0 --port 8000
# To:     python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

---

### Error 5: "ODBC Driver 17 for SQL Server" Not Found
**Problem**: Can't find ODBC driver

**Solution**:

1. **Download ODBC Driver**:
   - Go to: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
   - Download "ODBC Driver 17 for SQL Server"
   - Run installer

2. **Or use different connection string** (if using Windows auth):
```ini
DATABASE_URL=Driver={SQL Server};Server=(localdb)\MSSQLLocalDB;Database=Efforts_Tracking;
```

---

### Error 6: "main:app" Cannot Be Imported
**Problem**: "No module named 'main'" or "Cannot find app"

**Solution**:

1. **Check main.py exists**:
```powershell
# In backend folder, should see:
ls main.py
```

2. **Check main.py has FastAPI app**:
```python
# main.py should contain:
from fastapi import FastAPI
app = FastAPI(title="EffortTracking")
```

3. **Run from correct directory**:
```powershell
# Make sure you're in: D:\AI Assistant\EffortTracking\src\backend
# Before running the bat file
```

---

### Error 7: pip Install Fails
**Problem**: Error installing packages with pip

**Solution**:

```powershell
# Upgrade pip first
python -m pip install --upgrade pip

# Then try again
pip install fastapi uvicorn pyodbc passlib python-jose python-multipart pydantic python-dotenv

# If still fails, try with specific versions
pip install -r requirements.txt
```

---

## Step-by-Step Verification

Run these commands to verify everything is working:

```powershell
# 1. Check Python
python --version

# 2. Check virtual env location
which python  # Should show path to venv

# 3. Check packages installed
pip list | grep -E "fastapi|uvicorn|pyodbc"

# 4. Test database connection
python -c "import pyodbc; print('ODBC OK')"

# 5. Check main.py loads
python -c "from main import app; print('App found')"

# 6. Try startingAPI manually
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# If it works, press Ctrl+C to stop
```

---

## Database Initialization

Before API will work, initialize the database:

```powershell
# Create database (if doesn't exist)
sqlcmd -S (localdb)\MSSQLLocalDB -Q "CREATE DATABASE Efforts_Tracking"

# Run schema script
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking -i D:\AI Assistant\EffortTracking\src\database\schema.sql

# Verify tables created
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking -Q "SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')"
```

---

## Still Getting Errors?

1. **Take a screenshot** of the error message
2. **Copy all text** from the command window before it closes
3. **Check log files** at: `D:\AI Assistant\EffortTracking\logs\`
4. **Run manually** instead of batch file to see live errors:
```powershell
cd D:\AI Assistant\EffortTracking\src\backend
venv\Scripts\activate.bat
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Quick Diagnostic Commands

```powershell
# Test all at once:
cd D:\AI Assistant\EffortTracking\src\backend && ^
venv\Scripts\activate.bat && ^
python --version && ^
pip list | find "fastapi" && ^
python -c "from main import app; print('SUCCESS: App loaded')" && ^
echo "All checks passed!"
```

---

## File Checklist

Verify these files exist:

- [ ] `D:\AI Assistant\EffortTracking\src\backend\main.py`
- [ ] `D:\AI Assistant\EffortTracking\src\backend\.env`
- [ ] `D:\AI Assistant\EffortTracking\src\backend\venv\Scripts\activate.bat`
- [ ] `D:\AI Assistant\EffortTracking\src\database\schema.sql`
- [ ] `D:\AI Assistant\EffortTracking\src\backend\app\core\database.py`

---

## Still Stuck?

1. Restart your computer
2. Delete venv folder: `rd /s venv`
3. Recreate it: `python -m venv venv`
4. Run start_api.bat again

---
