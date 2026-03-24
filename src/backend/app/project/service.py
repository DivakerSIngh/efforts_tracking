from app.project import repository
from app.project.schemas import ProjectCreate, ProjectUpdate, AssignProjectRequest


def create_project(data: ProjectCreate) -> dict:
    return repository.create_project(data.model_dump())


def get_all_projects() -> list[dict]:
    return repository.get_all_projects()


def update_project(project_id: int, data: ProjectUpdate) -> dict:
    return repository.update_project(project_id, data.model_dump(exclude_unset=True))


def assign_project(request: AssignProjectRequest) -> None:
    repository.assign_project(request.candidate_id, request.project_id)
