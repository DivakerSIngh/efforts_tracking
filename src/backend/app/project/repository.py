from app.core.database import execute_sp


def create_project(data: dict) -> dict:
    results = execute_sp("CreateProject", data)
    return results[0] if results else {}


def get_all_projects() -> list[dict]:
    return execute_sp("GetAllProjects")


def update_project(project_id: int, data: dict) -> dict:
    params = {k: v for k, v in data.items() if v is not None}
    params["ProjectId"] = project_id
    results = execute_sp("UpdateProject", params)
    return results[0] if results else {}


def assign_project(candidate_id: int, project_id: int) -> None:
    execute_sp("AssignProjectToCandidate", {
        "CandidateId": candidate_id,
        "ProjectId": project_id,
    })
