# QUICK PYTHON API DEPLOYMENT GUIDE

## 3 Simple Steps to Deploy Python API

### Step 1: Install Python
- Download: https://www.python.org/downloads/
- Run installer
- ⭐ CHECK "Add Python to PATH"
- Restart your computer

### Step 2: Setup API Dependencies
Open Command Prompt and paste these commands one by one:

```
cd D:\AI Assistant\EffortTracking\src\backend
python -m venv venv
venv\Scripts\activate.bat
pip install fastapi uvicorn pyodbc passlib python-jose python-multipart pydantic python-dotenv
```

### Step 3: Make API Auto-Start on PC Boot

**The "start_api.bat" file has already been created for you at:**
```
D:\AI Assistant\EffortTracking\src\backend\start_api.bat
```

**Now add it to auto-start using Task Scheduler:**

1. Press `Windows + R`
2. Type: `taskschd.msc`
3. Click "Create Basic Task"
4. Name it: `EffortTracking API`
5. Select "At startup"
6. Select "Start a program"
7. Browse to: `D:\AI Assistant\EffortTracking\src\backend\start_api.bat`
8. Click "Finish"

✅ DONE! Your API will start every time your PC boots.

---

## 🧪 Test It

Open Command Prompt and run:
```
curl http://localhost:8000/health
```

You should see: `{"status":"ok"}`

---

## 📄 Database Setup (IMPORTANT!)

Before the API works, you need to create the database:

```powershell
# Run these SQL commands in SQL Server Management Studio:
CREATE DATABASE Efforts_Tracking;
```

Then run the schema script:
```
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking -i D:\AI Assistant\EffortTracking\src\database\schema.sql
```

---

## ❌ Troubleshooting

### API won't start?
- Check Python is installed: `python --version`
- Check virtual environment: `venv\Scripts\activate.bat`
- Check dependencies: `pip install -r requirements.txt`

### API starts but stops immediately?
- Check database connection in `.env` file
- Check `.env` file exists in backend folder
- Check SQL Server is running

### Can't connect to API?
- Check firewall allows port 8000
- Test with: `curl http://localhost:8000/health`

---
