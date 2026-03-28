from io import BytesIO
import openpyxl
from app.report import repository


def get_candidate_summary(candidate_id: int, month: int, year: int) -> list[dict]:
    return repository.get_all_candidates_report(month, year, candidate_id=candidate_id)


def get_all_candidates_report(month: int, year: int) -> list[dict]:
    return repository.get_all_candidates_report(month, year)


def export_all_candidates_report_excel(month: int, year: int) -> BytesIO:
    rows = repository.get_all_candidates_report(month, year)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Candidates Report"

    if rows:
        ws.append(list(rows[0].keys()))
        for row in rows:
            ws.append(list(row.values()))

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def get_admin_project_report(month: int, year: int) -> list[dict]:
    """Admin: get project-wise report with hours and amounts."""
    return repository.get_admin_project_report(month, year)
