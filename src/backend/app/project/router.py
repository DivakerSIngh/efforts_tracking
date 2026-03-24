from fastapi import APIRouter, Depends, HTTPException, status
from app.project.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, AssignProjectRequest
from app.project import service
from app.dependencies import get_current_user, require_admin

router = APIRouter()


@router.get("", response_model=list[ProjectResponse])
def list_projects(_: dict = Depends(get_current_user)):
    """All authenticated users: list active projects."""
    return service.get_all_projects()


@router.post("", response_model=dict, status_code=201)
def create_project(data: ProjectCreate, _: dict = Depends(require_admin)):
    """Admin: create a project (calls CreateProject SP)."""
    return service.create_project(data)


# NOTE: /assign must be declared BEFORE /{project_id} so the static segment
# is matched first (prevents potential routing ambiguity).
@router.post("/assign")
def assign_project(data: AssignProjectRequest, _: dict = Depends(require_admin)):
    """Admin: assign a project to a candidate (calls AssignProjectToCandidate SP)."""
    service.assign_project(data)
    return {"detail": "Project assigned"}


@router.put("/{project_id}", response_model=dict)
def update_project(project_id: int, data: ProjectUpdate, _: dict = Depends(require_admin)):
    """Admin: update a project (calls UpdateProject SP)."""
    result = service.update_project(project_id, data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )
    return result
