@echo off
REM Firebase Setup Helper Script for Windows
REM Run this to validate your Firebase setup

echo.
echo Firebase Setup Checker
echo ===============================================
echo.

REM Check if firebase.config.ts exists
if exist "src\frontend\src\environments\firebase.config.ts" (
    echo [OK] firebase.config.ts found
) else (
    echo [FAIL] firebase.config.ts not found
)

REM Check if firebase-key.json exists
if exist "firebase-key.json" (
    echo [OK] firebase-key.json found
) else (
    echo [WARN] firebase-key.json not found (needed for data migration^)
)

REM Check if package.json exists
if exist "src\frontend\package.json" (
    findstr /M "firebase" "src\frontend\package.json" >nul
    if !errorlevel! equ 0 (
        echo [OK] Firebase SDK in package.json
    ) else (
        echo [WARN] Firebase SDK not in package.json. Run: npm install firebase
    )
)

echo.
echo ===============================================
echo.
echo Next Steps:
echo 1. Create Firebase Project: https://firebase.google.com
echo 2. Update firebase.config.ts with credentials
echo 3. Download firebase-key.json for migration
echo 4. Run: npm install firebase
echo 5. Run: python migrate_to_firebase.py
echo.
pause
