from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.auth.router import router as auth_router
from app.candidate.router import router as candidate_router
from app.project.router import router as project_router
from app.timesheet.router import router as timesheet_router
from app.report.router import router as report_router
from app.dashboard.router import router as dashboard_router

app = FastAPI(
    title="Candidate Effort Tracker API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(candidate_router, prefix="/api/candidates", tags=["Candidates"])
app.include_router(project_router,   prefix="/api/projects",   tags=["Projects"])
app.include_router(timesheet_router, prefix="/api/timesheet",  tags=["Timesheet"])
app.include_router(report_router,    prefix="/api/report",     tags=["Reports"])
app.include_router(dashboard_router, prefix="/api/dashboard",  tags=["Dashboard"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Candidate Effort Tracker"}
