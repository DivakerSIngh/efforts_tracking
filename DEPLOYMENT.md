# EffortTracking Application - Windows Server Deployment Guide

## Table of Contents
1. [Quick Start - Python API](#quick-start---python-api) ⭐ **START HERE**
2. [Prerequisites](#prerequisites)
3. [Backend Deployment (FastAPI)](#backend-deployment-fastapi)
4. [Frontend Deployment (Angular)](#frontend-deployment-angular)
5. [Database Setup](#database-setup)
6. [Windows Services Configuration](#windows-services-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Firewall Configuration](#firewall-configuration)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start - Python API

### The Simplest Way to Deploy Your Python API

**Goal**: Run your Python API and have it start automatically when your PC boots up.

#### Step 1: Install Python Only
```powershell
# Download Python 3.11 from: https://www.python.org/downloads/
# 1. Go to https://www.python.org/downloads/
# 2. Click "Download Python 3.11"
# 3. Run the installer
# 4. ✅ IMPORTANT: Check the box "Add Python to PATH"
# 5. Click "Install Now"
```

#### Step 2: Install Dependencies
```powershell
# Open Command Prompt (Press Windows key + R, type 'cmd')
cd D:\AI Assistant\EffortTracking\src\backend

# Create virtual environment (one time only)
python -m venv venv

# Activate it
venv\Scripts\activate.bat

# Install required packages
pip install fastapi uvicorn pyodbc passlib python-jose python-multipart pydantic python-dotenv
```

#### Step 3: Create .env File
**Create file**: `D:\AI Assistant\EffortTracking\src\backend\.env`

```ini
DATABASE_URL=Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=Efforts_Tracking;Trusted_Connection=yes;
SECRET_KEY=your-secret-key-12345-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=["http://localhost:4200", "http://localhost:8000"]
ENVIRONMENT=development
DEBUG=False
```

#### Step 4: Test the API Works
```powershell
# In Command Prompt (in backend folder with venv activated):
python -m uvicorn main:app --reload --port 8000

# You should see:
# INFO:     Started server process [1234]
# INFO:     Application startup complete
# INFO:     Uvicorn running on http://0.0.0.0:8000

# To test: Open browser → http://localhost:8000/health
# You should see: {"status": "ok"}

# Stop with: Ctrl + C
```

#### Step 5: Make API Start Automatically on PC Boot

**Option A: Using Task Scheduler (Recommended)**

1. Open Task Scheduler (Press Windows key, type "Task Scheduler", press Enter)
2. Click "Create Basic Task"
3. Fill in:
   - **Name**: `EffortTracking API`
   - **Description**: `Starts the Python API on PC boot`
4. Click "Next"
5. Select: `At startup` → Click "Next"
6. Select: `Start a program` → Click "Next"
7. Fill in:
   - **Program/script**: `D:\AI Assistant\EffortTracking\src\backend\start_api.bat`
8. Click "Next" → "Finish"

✅ **Done!** Your API will now start automatically when your PC boots.

**Option B: Using Startup Folder (Simple Alternative)**

1. Press `Windows + R`
2. Type: `shell:startup`
3. Drag and drop `start_api.bat` into this folder

✅ **Done!** API will start when you log in.

#### Step 6: Verify It Works
```powershell
# Restart your PC
# After restart, open Command Prompt and run:
curl http://localhost:8000/health

# You should see: {"status": "ok"}
```

**That's it! Your API is now always running.** 🎉

---

## Prerequisites

### System Requirements
- **OS**: Windows Server 2019 or later
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB free space
- **Port Availability**: 80, 443 (HTTPS), 8000 (Backend), 4200 (Frontend optional)

### Software to Install

#### 1. Install Python 3.9+
```powershell
# Download and install from: https://www.python.org/downloads/
# 1. Go to https://www.python.org/downloads/
# 2. Download Python 3.11+ installer
# 3. Run the installer
# 4. IMPORTANT: Check "Add Python to PATH" during installation
```

**Verify Installation:**
```powershell
python --version
pip --version
```

#### 2. Install Node.js & NPM
```powershell
# Download and install from: https://nodejs.org/
# 1. Go to https://nodejs.org/ (LTS version recommended)
# 2. Download the Windows Installer (.msi)
# 3. Run the installer
# 4. Complete the installation wizard
```

**Verify Installation:**
```powershell
node --version
npm --version
```

#### 3. Install Git
```powershell
# Download and install from: https://git-scm.com/download/win
# 1. Go to https://git-scm.com/download/win
# 2. Download the Windows installer
# 3. Run the installer with default settings
```

**Verify Installation:**
```powershell
git --version
```

#### 4. Install SQL Server LocalDB or SQL Server Express
```powershell
# Download and install from: https://www.microsoft.com/en-us/sql-server/
# Option A: SQL Server Express (FREE - recommended for production)
#   1. Go to https://www.microsoft.com/en-us/sql-server/sql-server-editions-express
#   2. Download and run the installer
#   3. Choose "Express" installation type
# Option B: SQL Server LocalDB (FREE - for development)
#   1. Install Visual Studio or SQL Server Express with LocalDB
#   2. LocalDB is included with some developer tools
```

**Verify Installation:**
```powershell
# Test connection (for LocalDB)
sqlcmd -S (localdb)\MSSQLLocalDB -Q "SELECT @@version"
# Or for SQL Server Express:
sqlcmd -S .\SQLEXPRESS -Q "SELECT @@version"
```

---

## Backend Deployment (FastAPI)

### Step 1: Clone/Copy Application
```powershell
# Copy entire application to deployment folder
$deployPath = "C:\EffortTracking"
mkdir $deployPath -Force
# Copy all files to $deployPath
```

### Step 2: Create Python Virtual Environment
```powershell
cd C:\EffortTracking\src\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If activation fails, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 3: Install Python Dependencies
```powershell
# Ensure venv is activated
pip install --upgrade pip setuptools wheel

# Install requirements
pip install -r requirements.txt
```

**Expected packages:**
```
fastapi>=0.104.0
uvicorn>=0.24.0
pyodbc>=5.0.0
passlib>=1.7.4
python-jose>=3.3.0
python-multipart>=0.0.6
pydantic>=2.0.0
python-dotenv>=1.0.0
```

### Step 4: Create Production Configuration

**Create `.env` file** at `C:\EffortTracking\src\backend\.env`:
```ini
# Database
DATABASE_URL=Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=Efforts_Tracking;Trusted_Connection=yes;

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS=["http://localhost:4200", "http://your-domain.com", "https://your-domain.com"]

# Environment
ENVIRONMENT=production
DEBUG=False

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Step 5: Initialize Database
```powershell
cd C:\EffortTracking\src\backend

# Activate venv
.\venv\Scripts\Activate.ps1

# Run schema setup script
sqlcmd -S (localdb)\MSSQLLocalDB -i ..\database\schema.sql

# Verify database created
sqlcmd -S (localdb)\MSSQLLocalDB -Q "SELECT name FROM sys.databases WHERE name='Efforts_Tracking'"
```

### Step 6: Test Backend Locally
```powershell
# Navigate to backend directory
cd C:\EffortTracking\src\backend

# Activate venv
.\venv\Scripts\Activate.ps1

# Run uvicorn server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Test API (in another PowerShell window)
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "ok", "app": "Candidate Effort Tracker"}
```

### Step 7: Create Windows Service for Backend

**Create `C:\EffortTracking\run_backend.bat`:**
```batch
@echo off
cd C:\EffortTracking\src\backend
call venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info
```

**Install NSSM** (Non-Sucking Service Manager):
```powershell
# Download from: https://nssm.cc/download
# 1. Go to https://nssm.cc/download
# 2. Download the latest release (nssm-[version]-win64.zip)
# 3. Extract to C:\nssm
# 4. Add to PATH:
$env:Path += ';C:\nssm\win64'
# Or add C:\nssm\win64 to System Environment Variables permanently
```

**Create Windows Service:**
```powershell
# Run as Administrator
cd "C:\Program Files\nssm\win64"

# Install service
.\nssm install EffortTrackingAPI "C:\EffortTracking\run_backend.bat"

# Configure service
.\nssm set EffortTrackingAPI AppDirectory "C:\EffortTracking\src\backend"
.\nssm set EffortTrackingAPI AppStdout "C:\EffortTracking\logs\backend.log"
.\nssm set EffortTrackingAPI AppStderr "C:\EffortTracking\logs\backend-error.log"
.\nssm set EffortTrackingAPI Start SERVICE_AUTO_START

# Start service
net start EffortTrackingAPI

# Verify service is running
Get-Service EffortTrackingAPI
```

**View service logs:**
```powershell
Get-Content "C:\EffortTracking\logs\backend.log" -Tail 50
```

---

## Frontend Deployment (Angular)

### Step 1: Build Angular Application for Production
```powershell
cd C:\EffortTracking\src\frontend

# Install dependencies
npm install --legacy-peer-deps

# Build for production
ng build --configuration production --output-path dist

# Output will be in: C:\EffortTracking\src\frontend\dist\effort-tracking
```

**Build Output** should create:
- `dist/index.html` - Main application file
- `dist/main-*.js` - Application bundle
- `dist/styles-*.css` - Styles bundle
- `dist/assets/` - Static assets

### Step 2: Install IIS (Internet Information Services)

```powershell
# Run as Administrator
Enable-WindowsOptionalFeature -FeatureName IIS-WebServerRole -Online
Enable-WindowsOptionalFeature -FeatureName IIS-WebServerManagementTools -Online
Enable-WindowsOptionalFeature -FeatureName IIS-ApplicationDevelopment -Online
Enable-WindowsOptionalFeature -FeatureName IIS-StaticContent -Online
```

### Step 3: Configure IIS for Angular

**Create IIS Application Pool:**
```powershell
# Run as Administrator
cd C:\inetpub\wwwroot

# Create folder for frontend
mkdir effort-tracking-frontend

# Copy dist files
Copy-Item "C:\EffortTracking\src\frontend\dist\*" -Destination "C:\inetpub\wwwroot\effort-tracking-frontend\" -Recurse -Force
```

**Create IIS Website (via IIS Manager GUI or PowerShell):**
```powershell
Import-Module WebAdministration

# Create application pool
New-WebAppPool -Name "EffortTrackingPool"
Set-ItemProperty IIS:\AppPools\EffortTrackingPool -Name managedRuntimeVersion -Value "v4.0"

# Create website
New-WebSite -Name "EffortTracking" `
  -PhysicalPath "C:\inetpub\wwwroot\effort-tracking-frontend" `
  -Port 80 `
  -HostHeader "your-domain.com"

# Assign to app pool
Set-ItemProperty "IIS:\Sites\EffortTracking" -Name applicationPool -Value "EffortTrackingPool"
```

### Step 4: Configure web.config for Angular Routing

**Create `C:\inetpub\wwwroot\effort-tracking-frontend\web.config`:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".js" mimeType="application/javascript; charset=utf-8" />
      <mimeMap fileExtension=".json" mimeType="application/json; charset=utf-8" />
    </staticContent>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="app_data" />
          <add segment="bin" />
          <add segment="src" />
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

### Step 5: Configure CORS Backend URL

**Update `src/app/core/auth.ts`** (or create environment file):
```typescript
// In your interceptor or service, update the API URL:
const API_URL = 'https://your-server-domain.com:8000';
// or
const API_URL = 'http://your-server-name:8000';
```

**Or use environment files:**

Create `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com:8000'
};
```

Update services to use:
```typescript
import { environment } from '../../environments/environment';

constructor(private http: HttpClient) {
  this.baseUrl = environment.apiUrl;
}
```

### Step 6: Rebuild with Updated URLs

```powershell
cd C:\EffortTracking\src\frontend

# Rebuild with production config
ng build --configuration production

# Copy to IIS
Copy-Item "dist\*" -Destination "C:\inetpub\wwwroot\effort-tracking-frontend\" -Recurse -Force
```

### Step 7: Test Frontend

Open browser and navigate to:
```
http://localhost:80
# or
http://your-domain.com
```

---

## Database Setup

### Step 1: Create Database

```powershell
# Connect to SQL Server
sqlcmd -S (localdb)\MSSQLLocalDB

# Run SQL commands:
# 1> USE master;
# 2> GO
# 3> CREATE DATABASE Efforts_Tracking;
# 4> GO
# 5> exit
```

### Step 2: Initialize Schema

```powershell
cd C:\EffortTracking\src\database

# Run schema script
sqlcmd -S (localdb)\MSSQLLocalDB -i schema.sql -d Efforts_Tracking

# Verify tables created
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking `
  -Q "SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')"
```

### Step 3: Backup Database

```powershell
# Create backup
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking `
  -Q "BACKUP DATABASE Efforts_Tracking TO DISK='C:\EffortTracking\backups\Efforts_Tracking.bak'"

# Verify backup
Get-Item "C:\EffortTracking\backups\Efforts_Tracking.bak"
```

---

## Windows Services Configuration

### Step 1: Set Service Startup Type

```powershell
# Run as Administrator

# Set API service to auto-start
Set-Service -Name EffortTrackingAPI -StartupType Automatic

# Start service
Start-Service -Name EffortTrackingAPI

# Check status
Get-Service EffortTrackingAPI
```

### Step 2: Monitor Services

```powershell
# View running services
Get-Service | Where-Object { $_.Name -like "*Effort*" }

# View service details
Get-WmiObject win32_service | Where-Object { $_.Name -eq "EffortTrackingAPI" } | Select-Object Name, State, StartMode
```

### Step 3: Create Log Collection

```powershell
# Create logs folder
mkdir C:\EffortTracking\logs -Force

# Set permissions
$logPath = "C:\EffortTracking\logs"
$acl = Get-Acl $logPath
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.AddAccessRule($rule)
Set-Acl $logPath $acl
```

---

## SSL/TLS Setup

### Step 1: Obtain SSL Certificate

**Option A: Self-Signed Certificate (Development)**
```powershell
$cert = New-SelfSignedCertificate -DnsName "your-domain.com" -CertStoreLocation "cert:\LocalMachine\My" -FriendlyName "EffortTracking"
$cert.Thumbprint
```

**Option B: Let's Encrypt (Production)**
```powershell
# Use Certbot:
# Download from: https://certbot.eff.org/
# Follow installation wizard
```

### Step 2: Configure IIS for HTTPS

```powershell
Import-Module WebAdministration

# Get certificate thumbprint
$thumbprint = "YOUR_CERTIFICATE_THUMBPRINT"

# Add HTTPS binding
New-WebBinding -Name "EffortTracking" -Protocol https -Port 443 -HostHeader "your-domain.com" -SslFlags 1

# Assign certificate to binding
Get-WebBinding -Name "EffortTracking" -Protocol https | Set-WebBinding -AddSslCertificate $thumbprint
```

### Step 3: Configure Backend for HTTPS

**Update `.env`:**
```ini
# For HTTPS
ALLOWED_ORIGINS=["https://your-domain.com"]

# SSL only
SECURE_COOKIES=true
```

---

## Firewall Configuration

### Step 1: Allow Required Ports

```powershell
# Run as Administrator

# Allow port 80 (HTTP)
New-NetFirewallRule -DisplayName "Allow HTTP" `
  -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow port 443 (HTTPS)
New-NetFirewallRule -DisplayName "Allow HTTPS" `
  -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# Allow port 8000 (Backend API - optional, for internal use)
New-NetFirewallRule -DisplayName "Allow Backend API" `
  -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -RemoteAddress LocalSubnet

# Allow port 3306 (Database)
New-NetFirewallRule -DisplayName "Allow SQL Server" `
  -Direction Inbound -LocalPort 1433 -Protocol TCP -Action Allow -RemoteAddress LocalSubnet
```

### Step 2: Verify Firewall Rules

```powershell
Get-NetFirewallRule -DisplayName "Allow*" | Get-NetFirewallPortFilter
```

---

## Post-Deployment Verification

### Step 1: Test Backend API

```powershell
# Test health endpoint
Invoke-WebRequest http://localhost:8000/health

# Test API documentation
# Navigate to: http://localhost:8000/api/docs
```

### Step 2: Test Frontend

```powershell
# Test main page loads
Invoke-WebRequest http://localhost:80

# Check in browser:
# 1. Navigate to http://your-domain.com
# 2. Login with test credentials:
#    Email: admin@efforttracker.dev
#    Password: Admin@123
```

### Step 3: Verify Database Connections

```powershell
# Check if database is accessible
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking -Q "SELECT COUNT(*) as TableCount FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')"

# Should return approximately 6 tables
```

### Step 4: Check Service Status

```powershell
# Verify backend service is running
Get-Service EffortTrackingAPI | Select-Object Status, StartType

# Check IIS Application Pool
Get-WebAppPoolState -Name "EffortTrackingPool"
```

### Step 5: Monitor Performance

```powershell
# Monitor CPU and Memory
Get-Process | Where-Object { $_.ProcessName -like "*python*" -or $_.ProcessName -like "*w3wp*" } | Select-Object ProcessName, CPU, WorkingSet

# Clear temp files
Remove-Item "C:\EffortTracking\temp\*" -Recurse -Force
```

---

## Troubleshooting

### Issue 1: Backend Service Won't Start

**Error:** Service fails to start

**Solution:**
```powershell
# Check service logs
Get-Content "C:\EffortTracking\logs\backend-error.log" -Tail 50

# Check Python path
python --version

# Verify virtual environment
C:\EffortTracking\src\backend\venv\Scripts\python.exe --version

# Restart service
Restart-Service EffortTrackingAPI

# View event logs
Get-EventLog -LogName Application -Source "NSSM" -Newest 10
```

### Issue 2: Frontend Shows Blank Page

**Error:** Page loads but shows nothing

**Solution:**
```powershell
# Check browser console for errors (F12)
# Verify API URL is correct

# Check IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 20

# Clear browser cache and rebuild
rm C:\EffortTracking\src\frontend\dist -Recurse -Force
ng build --configuration production

# Copy new build
Copy-Item "C:\EffortTracking\src\frontend\dist\*" -Destination "C:\inetpub\wwwroot\effort-tracking-frontend\" -Recurse -Force
```

### Issue 3: CORS Errors

**Error:** Browser console shows CORS errors

**Solution:**
```powershell
# Update .env ALLOWED_ORIGINS
# Edit: C:\EffortTracking\src\backend\.env
# ALLOWED_ORIGINS=["https://your-frontend-domain.com"]

# Restart backend service
Restart-Service EffortTrackingAPI
```

### Issue 4: Database Connection Failed

**Error:** "Cannot open database 'Efforts_Tracking'"

**Solution:**
```powershell
# Check database exists
sqlcmd -S (localdb)\MSSQLLocalDB -Q "SELECT name FROM sys.databases"

# Recreate if necessary
sqlcmd -S (localdb)\MSSQLLocalDB -i C:\EffortTracking\src\database\schema.sql

# Check connection string in .env
# Should be: Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=Efforts_Tracking;Trusted_Connection=yes;

# Verify ODBC driver installed
Get-OdbcDriver
```

### Issue 5: Port Already in Use

**Error:** "Port 8000 (or 80) already in use"

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :8000

# Kill process
taskkill /PID <PID> /F

# Or use different port
# Update in backend (.env) and frontend (environment.ts)
```

---

## Maintenance Tasks

### Daily Tasks
```powershell
# Monitor services
Get-Service EffortTrackingAPI | Select-Object Status

# Check database size
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking `
  -Q "EXEC sp_helpdb Efforts_Tracking"
```

### Weekly Tasks
```powershell
# Backup database
sqlcmd -S (localdb)\MSSQLLocalDB -d Efforts_Tracking `
  -Q "BACKUP DATABASE Efforts_Tracking TO DISK='C:\EffortTracking\backups\Efforts_Tracking_$(Get-Date -Format yyyyMMdd).bak'"

# Clear old logs
Get-ChildItem "C:\EffortTracking\logs\*.log" -OlderThan (Get-Date).AddDays(-30) | Remove-Item
```

### Monthly Tasks
```powershell
# Update dependencies
npm update --prefix "C:\EffortTracking\src\frontend"

# Check for Python package updates
pip list --outdated --prefix "C:\EffortTracking\src\backend\venv"

# Review security logs
Get-EventLog -LogName Security -Newest 100
```

---

## Deployment Checklist

- [ ] Python 3.9+ installed and verified
- [ ] Node.js & NPM installed and verified
- [ ] SQL Server/LocalDB installed and verified
- [ ] Git installed
- [ ] Application cloned/copied to C:\EffortTracking
- [ ] Virtual environment created and activated
- [ ] Python dependencies installed
- [ ] .env file configured with production settings
- [ ] Database schema initialized
- [ ] Backend tested locally
- [ ] Backend Windows service created and running
- [ ] Angular build successful
- [ ] IIS configured with application pool
- [ ] Frontend deployed to IIS
- [ ] web.config created for Angular routing
- [ ] API URL configured in frontend
- [ ] CORS settings verified
- [ ] SSL/TLS certificate configured
- [ ] Firewall rules created
- [ ] Health checks passing
- [ ] Login test successful
- [ ] Database backups ensured

---

## Support & Resources

- **Backend Issues**: Check `C:\EffortTracking\logs\backend.log`
- **Frontend Issues**: Check browser console (F12)
- **Database Issues**: Use SQL Server Management Studio
- **Service Status**: Use Services.msc or PowerShell

## Additional References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Angular Production Build](https://angular.io/guide/build)
- [IIS Configuration](https://learn.microsoft.com/en-us/iis/)
- [SQL Server LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/local-database/)

---

**Last Updated**: March 25, 2026
**Version**: 1.0
