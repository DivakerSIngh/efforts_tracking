@echo off
REM ===============================================
REM EffortTracking API - Auto-Start Script
REM Improved version with error handling and diagnostics
REM ===============================================

setlocal enabledelayedexpansion

REM Set colors for output
color 0A

title EffortTracking API Server

REM Navigate to backend directory
cd /d "D:\AI Assistant\EffortTracking\src\backend"

echo.
echo ===============================================
echo EffortTracking API Server - Startup Diagnostics
echo ===============================================
echo.

REM Check if Python is installed
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
python --version
echo.

REM Check if virtual environment exists
echo [2/5] Checking virtual environment...
if not exist "venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating...
    python -m venv venv
    if !errorlevel! neq 0 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
) else (
    echo Virtual environment found
)
echo.

REM Activate virtual environment
echo [3/5] Activating virtual environment...
call venv\Scripts\activate.bat
if !errorlevel! neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)
echo Virtual environment activated
echo.

REM Check and install requirements
echo [4/5] Installing/updating Python dependencies...
pip install --upgrade pip setuptools wheel >nul 2>&1
if exist "requirements.txt" (
    echo Installing from requirements.txt...
    pip install -r requirements.txt
) else (
    echo Installing individual packages...
    pip install fastapi uvicorn pyodbc passlib python-jose python-multipart pydantic python-dotenv
)
if !errorlevel! neq 0 (
    echo WARNING: Some dependencies may have failed to install
    echo But continuing with startup attempt...
)
echo.

REM Check if .env file exists
echo [5/5] Checking configuration...
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Create .env file with database connection settings
    echo Example:
    echo   DATABASE_URL=Driver={ODBC Driver 17 for SQL Server};Server=^(localdb^)\MSSQLLocalDB;Database=Efforts_Tracking;Trusted_Connection=yes;
    echo   SECRET_KEY=your-secret-key
    echo.
    echo ATTENTION: API will start but may fail to connect to database
)
echo.

REM Start the API
echo ===============================================
echo Starting EffortTracking API...
echo ===============================================
echo.
echo API will be available at:
echo   Local:    http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo If errors appear below, check:
echo   1. Database connection in .env file
echo   2. SQL Server is running
echo   3. Database schema is initialized
echo.
echo Press Ctrl+C to stop the server
echo ===============================================
echo.

REM Start uvicorn with better error handling
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info

REM If we get here, API has stopped
echo.
echo ===============================================
echo API Server Stopped
echo ===============================================
echo.
pause


