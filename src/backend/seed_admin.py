"""
One-time helper: generate real bcrypt hashes for sample users and print UPDATE statements.
Run ONCE after executing schema.sql to fix the placeholder hashes.

Usage (from src/backend):
    python seed_admin.py
"""
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

users = [
    ("admin@efforttracker.dev",   "Admin@123"),
    ("manager@efforttracker.dev", "Admin@123"),
    ("alice@efforttracker.dev",   "Candidate@123"),
    ("bob@efforttracker.dev",     "Candidate@123"),
    ("carol@efforttracker.dev",   "Candidate@123"),
]

print("-- Run these UPDATE statements in SQL Server after executing schema.sql:\n")
for email, password in users:
    hashed = pwd.hash(password)
    print(f"UPDATE dbo.Users SET PasswordHash = '{hashed}' WHERE Email = '{email}';")
