from app.core.database import execute_sp


def create_project(data: dict) -> dict:
    # Ensure client_name is passed as ClientName
    params = {
        "Name": data.get("name"),
        "ClientName": data.get("client_name"),
        "Description": data.get("description"),
    }
    results = execute_sp("CreateProject", params)
    return results[0] if results else {}


def get_all_projects() -> list[dict]:
    return execute_sp("GetAllProjects")


def update_project(project_id: int, data: dict) -> dict:
    params = {
        "ProjectId": project_id,
        "Name": data.get("name"),
        "ClientName": data.get("client_name"),
        "Description": data.get("description"),
        "IsActive": data.get("is_active"),
    }
    # Remove keys with None values
    params = {k: v for k, v in params.items() if v is not None}
    results = execute_sp("UpdateProject", params)
    return results[0] if results else {}


def assign_project(candidate_id: int, project_id: int) -> None:
    execute_sp("AssignProjectToCandidate", {
        "CandidateId": candidate_id,
        "ProjectId": project_id,
    })
