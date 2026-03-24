from contextlib import contextmanager
from typing import Any
import pyodbc
from app.core.config import settings


@contextmanager
def get_db_connection():
    """Context manager that yields a pyodbc connection and ensures it is closed."""
    conn = pyodbc.connect(settings.DB_CONNECTION_STRING, autocommit=False)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def execute_sp(sp_name: str, params: dict[str, Any] | None = None) -> list[dict]:
    """
    Execute a stored procedure and return all rows as a list of dicts.

    Usage:
        rows = execute_sp("GetTimesheetByMonth", {"CandidateId": 1, "Month": 3, "Year": 2026})
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if params:
            placeholders = ", ".join([f"@{k}=?" for k in params.keys()])
            sql = f"EXEC {sp_name} {placeholders}"
            cursor.execute(sql, list(params.values()))
        else:
            cursor.execute(f"EXEC {sp_name}")

        if cursor.description:
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        return []
