Create a full-stack web application with the following tech stack:
Phase 1: Project Setup & Database Design
Backend:
- Python FastAPI
- SQL Server database
- Use ADO.NET-like approach (pyodbc or sqlalchemy core) but ALL business logic must be in SQL Stored Procedures
- Follow clean architecture (Controller -> Service -> Repository -> DB)

Frontend:
- Angular (latest version)
- Use Angular Material for modern UI
- Use reactive forms and modular architecture

Project Name: Candidate Effort Tracker

Requirements:
- Setup backend FastAPI project structure with modules:
  - auth
  - candidate
  - project
  - timesheet
  - report

- Setup Angular project with modules:
  - auth
  - dashboard
  - timesheet
  - report
  - admin

- Implement JWT authentication
- Create base layout (sidebar + header UI)

Output:
- Folder structure
- Initial working boilerplate code for backend & frontend



Phase 2: Database Schema Design & Stored Procedures

Design SQL Server database schema for Candidate Effort Tracker.

Tables:
1. Users (Admin & Candidate)
2. Candidates (extra details)
3. Projects
4. CandidateProjectMapping
5. TimesheetEntries
6. Payments

Requirements:
- Each table must have proper primary keys, foreign keys
- Include audit fields (CreatedDate, UpdatedDate, IsActive)

Stored Procedures:
- CreateUser
- AuthenticateUser
- CreateProject
- AssignProjectToCandidate
- InsertTimesheetEntry
- GetTimesheetByMonth
- GetCandidateMonthlyReport
- GetAdminProjectReport
- GetAllCandidatesReport

IMPORTANT:
- ALL calculations (total hours, billing, sums) must be done in stored procedures
- Include sample data

Output:
- Full SQL script (tables + stored procedures)








Phase 3: Authentication Module

Build authentication module using FastAPI and Angular.

Backend:
- Login API using stored procedure AuthenticateUser
- Generate JWT token
- Role-based access (Admin, Candidate)

Frontend:
- Login page using Angular Material
- Store JWT in local storage
- Create auth guard for routes

Features:
- Admin login
- Candidate login
- Secure APIs with JWT middleware

Output:
- API endpoints
- Angular login UI
- Route protection implementation









Phase 4: Candidate Timesheet Module
Build Candidate Timesheet Module.

Backend:
- API to get assigned projects for candidate
- API to insert timesheet entries (date-wise)
- API to fetch monthly timesheet

Frontend (IMPORTANT UI):
- Single-page timesheet entry UI

UI Requirements:
- Month filter (only current month editable, past months read-only)
- Dynamic columns based on assigned projects

Table Format:
Date | Project1 | Project2 | Project3 | Remarks

- Multiple rows per day allowed
- Auto calculate totals:
  - Project-wise totals
  - Daily totals
  - Monthly totals

Features:
- Inline editing
- Add multiple entries per day
- Save button

Backend:
- Call stored procedure InsertTimesheetEntry

Output:
- Angular dynamic table UI
- APIs integrated
- Validation implemented







Phase 5: Candidate Dashboard Module


Build Candidate Dashboard.

Features:
1. Monthly Billing View
   - Total hours
   - Hourly rate
   - Fixed amount (optional)
   - Total payment

2. Reports:
   - Month-wise hours
   - Project-wise hours

Backend:
- Use stored procedure GetCandidateMonthlyReport

Frontend:
- Dashboard cards:
  - Total Hours
  - Total Earnings
- Charts (optional)

Output:
- Dashboard UI
- API integration






Phase 6: Admin Module

Build Admin Module.

Features:
1. Manage Projects (CRUD)
2. Manage Candidates:
   - Create candidate
   - Send email with login credentials
   - Set hourly rate and fixed amount

3. Assign Projects to Candidates
4. Activate/Deactivate Candidate

Backend:
- Use stored procedures:
  - CreateProject
  - CreateUser
  - AssignProjectToCandidate

Frontend:
- Angular forms with validation
- Data tables with pagination

Output:
- Full admin UI + APIs












Build Admin Reporting Module.

Features:
1. Candidate-wise Report
2. Project-wise Report
3. All Candidates Summary

Report Format:
Candidate Name | Project1 | Project2 | Total Hours | Fixed Amount | Total Amount

Backend:
- Stored procedure GetAllCandidatesReport

Frontend:
- Table view
- Filters (month, candidate, project)

Excel Export:
- Export report to Excel

Backend:
- Generate Excel file using Python (pandas or openpyxl)

Output:
- Report UI
- Excel download feature










Implement Email Notification System.

Features:
- Send email on candidate creation
- Send credentials (email/password)

Backend:
- Use SMTP
- Create reusable email service

Optional:
- Monthly summary email

Output:
- Email service implementation











Prepare application for deployment.

Backend:
- Dockerize FastAPI app
- Environment variables

Frontend:
- Build Angular production bundle

Deployment:
- Use free hosting:
  - Backend: Render / Railway
  - Frontend: Netlify / Vercel
  - Database: Azure SQL / Free tier

Output:
- Dockerfile
- Deployment steps