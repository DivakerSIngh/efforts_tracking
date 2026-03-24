---
title: Copilot Instructions
summary: Custom instructions for GitHub Copilot in this repository.
applyTo:
  - "**/*"
---

# Copilot Instructions

## Purpose
This file provides custom instructions and preferences for GitHub Copilot to follow when generating code or suggestions in this repository.

## Guidelines
- Follow project-specific conventions and folder structure.
- Prefer existing patterns and libraries used in the codebase.
- Write clear, maintainable, and well-documented code.
- When in doubt, refer to the README.md or existing modules for examples.

## Special Notes
- For backend (Python/FastAPI): Follow the structure in `src/backend/app/` and use Pydantic schemas and dependency injection as seen in the project.
- For frontend (Angular): Use the structure in `src/frontend/src/app/` and follow Angular best practices for modules, components, and services.

## Restrictions
- Do not introduce new frameworks or libraries without explicit approval.
- Avoid duplicating code that already exists in the project.
- Please ensure both backend and frontend services are up or restarted after any code changes to reflect the updates.

## Review
- All generated code should be reviewed for security, performance, and maintainability.

---
