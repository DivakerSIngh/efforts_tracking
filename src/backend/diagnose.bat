@echo off
REM ===============================================
REM EffortTracking API - Diagnostic Tool
REM Checks all requirements before starting API
REM ===============================================

setlocal enabledelayedexpansion
color 0A
title EffortTracking API - System Diagnostics

cd /d "D:\AI Assistant\EffortTracking\src\backend"

echo.
echo ===============================================
echo EffortTracking API - Pre-Flight Check
echo ===============================================
echo.

REM Test 1: Python
echo [TEST 1] Checking Python...
python --version >nul 2>&1
if !errorlevel! equ 0 (
    python --version
    echo Status: PASS ✓
) else (
    echo Status: FAIL ✗
    echo Fix: Install Python from https://www.python.org/downloads/
)
echo.

REM Test 2: Virtual Environment
echo [TEST 2] Checking Virtual Environment...
if exist "venv\Scripts\activate.bat" (
    echo Status: PASS ✓
) else (
    echo Status: FAIL ✗
    echo Fix: Create venv with: python -m venv venv
)
echo.

REM Test 3: .env File
echo [TEST 3] Checking .env Configuration File...
if exist ".env" (
    echo Status: PASS ✓
    echo Found .env file
) else (
    echo Status: FAIL ✗
    echo Fix: Create .env file with database connection
)
echo.

REM Test 4: main.py
echo [TEST 4] Checking main.py...
if exist "main.py" (
    echo Status: PASS ✓
    echo Found main.py
) else (
    echo Status: FAIL ✗
    echo Fix: main.py not found in backend folder
)
echo.

REM Test 5: Activate and check packages
echo [TEST 5] Checking Python Packages...
call venv\Scripts\activate.bat
if !errorlevel! equ 0 (
    echo Status: PASS ✓ - Virtual environment activated
    
    echo.
    echo Checking installed packages:
    pip list | find "fastapi" >nul 2>&1
    if !errorlevel! equ 0 (
        echo   - fastapi: OK ✓
    ) else (
        echo   - fastapi: MISSING ✗
    )
    
    pip list | find "uvicorn" >nul 2>&1
    if !errorlevel! equ 0 (
        echo   - uvicorn: OK ✓
    ) else (
        echo   - uvicorn: MISSING ✗
    )
    
    pip list | find "pyodbc" >nul 2>&1
    if !errorlevel! equ 0 (
        echo   - pyodbc: OK ✓
    ) else (
        echo   - pyodbc: MISSING ✗
    )
    
    pip list | find "pydantic" >nul 2>&1
    if !errorlevel! equ 0 (
        echo   - pydantic: OK ✓
    ) else (
        echo   - pydantic: MISSING ✗
    )
) else (
    echo Status: FAIL ✗
    echo Fix: Cannot activate virtual environment
)
echo.

REM Test 6: Database Connection
echo [TEST 6] Checking Database Connection...
sqlcmd -S (localdb)\MSSQLLocalDB -Q "SELECT @@version" >nul 2>&1
if !errorlevel! equ 0 (
    echo Status: PASS ✓
    echo SQL Server LocalDB is running
) else (
    sqlcmd -S .\SQLEXPRESS -Q "SELECT @@version" >nul 2>&1
    if !errorlevel! equ 0 (
        echo Status: PASS ✓
        echo SQL Server Express is running
    ) else (
        echo Status: FAIL ✗
        echo Fix: SQL Server not running or not installed
    )
)
echo.

REM Test 7: Database Exists
echo [TEST 7] Checking Database Schema...
sqlcmd -S (localdb)\MSSQLLocalDB -Q "USE Efforts_Tracking; SELECT TOP 1 name FROM sys.tables" >nul 2>&1
if !errorlevel! equ 0 (
    echo Status: PASS ✓
    echo Database 'Efforts_Tracking' exists with tables
) else (
    echo Status: FAIL ✗
    echo Fix: Database not initialized. Run:
    echo   sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking -i D:\AI Assistant\EffortTracking\src\database\schema.sql
)
echo.

REM Test 8: App can be imported
echo [TEST 8] Testing Python Application Import...
python -c "from main import app; print('FastAPI app loaded')" >nul 2>&1
if !errorlevel! equ 0 (
    echo Status: PASS ✓
    echo FastAPI application imported successfully
) else (
    echo Status: FAIL ✗
    echo Fix: Check main.py file and imports
    python -c "from main import app; print('FastAPI app loaded')"
    echo.
)
echo.

REM Summary
echo ===============================================
echo Summary
echo ===============================================
echo.
echo If all tests show PASS ✓, your API should start correctly.
echo.
echo If any tests show FAIL ✗, follow the "Fix" instructions.
echo.
echo To start the API, run: start_api.bat
echo.
pause
