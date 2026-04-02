"""
Firebase Data Migration Script
Migrates all SQL Server data to Firebase Firestore

Usage:
    python migrate_to_firebase.py

Requirements:
    pip install firebase-admin pyodbc python-dotenv
"""

import firebase_admin
from firebase_admin import credentials, firestore
import pyodbc
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Dict, Any

# Load environment variables
load_dotenv()

# Firebase Configuration
# Get path to project root (two levels up from this script)
FIREBASE_CREDENTIALS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'firebase-key.json')
# Steps to get this file:
# 1. Go to https://console.firebase.google.com
# 2. Go to Project Settings → Service Accounts
# 3. Click "Generate New Private Key"
# 4. Save as firebase-key.json in project root

# SQL Server Configuration
DB_CONNECTION = os.getenv('DB_CONNECTION_STRING', '')

class FirebaseDataMigration:
    def __init__(self):
        self.db_conn = None
        self.db_cursor = None
        self.firebase_db = None
        self.initialize_firebase()
        self.initialize_database()

    def initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            if not os.path.exists(FIREBASE_CREDENTIALS):
                raise FileNotFoundError(
                    f"Firebase credentials file not found: {FIREBASE_CREDENTIALS}\n"
                    "Steps to get it:\n"
                    "1. Go to https://console.firebase.google.com\n"
                    "2. Click your project → Settings ⚙️\n"
                    "3. Service Accounts tab\n"
                    "4. Generate New Private Key\n"
                    "5. Save as firebase-key.json in project root"
                )
            
            cred = credentials.Certificate(FIREBASE_CREDENTIALS)
            firebase_admin.initialize_app(cred)
            self.firebase_db = firestore.client()
            print("✅ Firebase initialized successfully")
        except Exception as e:
            print(f"❌ Firebase initialization failed: {str(e)}")
            raise

    def initialize_database(self):
        """Initialize SQL Server connection"""
        try:
            self.db_conn = pyodbc.connect(DB_CONNECTION)
            self.db_cursor = self.db_conn.cursor()
            print("✅ SQL Server connection established")
        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")
            raise

    def clear_firestore(self):
        """Delete all existing data from Firestore"""
        print("\n🗑️  Clearing existing Firestore data...")
        collections = ['users', 'candidates', 'projects', 'timesheets', 'assignments']
        
        for collection in collections:
            try:
                docs = self.firebase_db.collection(collection).stream()
                count = 0
                for doc in docs:
                    doc.reference.delete()
                    count += 1
                print(f"   ✅ Deleted {count} documents from '{collection}'")
            except Exception as e:
                print(f"   ⚠️  Error clearing '{collection}': {str(e)}")

    def migrate_users(self):
        """Migrate users from SQL to Firestore"""
        print("\n📥 Migrating Users...")
        try:
            # Get all users (admin + candidates)
            query = """
            SELECT UserId, Email, FullName, Role, IsActive, CreatedDate
            FROM dbo.Users
            """
            self.db_cursor.execute(query)
            rows = self.db_cursor.fetchall()
            
            batch = self.firebase_db.batch()
            count = 0
            
            for row in rows:
                user_id, email, full_name, role, is_active, created_date = row
                
                user_data = {
                    'user_id': user_id,
                    'email': email,
                    'full_name': full_name,
                    'role': role,  # 'admin' or 'candidate'
                    'is_active': is_active,
                    'created_date': created_date.isoformat() if created_date else None,
                    'migrated_at': datetime.now().isoformat()
                }
                
                doc_ref = self.firebase_db.collection('users').document(str(user_id))
                batch.set(doc_ref, user_data)
                count += 1
                
                if count % 500 == 0:
                    batch.commit()
                    batch = self.firebase_db.batch()
            
            if count > 0:
                batch.commit()
            
            print(f"   ✅ Migrated {count} users")
            return count
        except Exception as e:
            print(f"   ❌ Error migrating users: {str(e)}")
            return 0

    def migrate_candidates(self):
        """Migrate candidate details from SQL to Firestore"""
        print("\n📥 Migrating Candidates...")
        try:
            query = """
            SELECT UserId, Phone, HourlyRate, FixedAmount, AccountNo, IFSCCode
            FROM dbo.Candidates
            """
            self.db_cursor.execute(query)
            rows = self.db_cursor.fetchall()
            
            batch = self.firebase_db.batch()
            count = 0
            
            for row in rows:
                user_id, phone, hourly_rate, fixed_amount, account_no, ifsc_code = row
                
                candidate_data = {
                    'user_id': user_id,
                    'phone': phone or '',
                    'hourly_rate': float(hourly_rate) if hourly_rate else 0.0,
                    'fixed_amount': float(fixed_amount) if fixed_amount else 0.0,
                    'account_no': account_no or '',
                    'ifsc_code': ifsc_code or '',
                    'migrated_at': datetime.now().isoformat()
                }
                
                doc_ref = self.firebase_db.collection('candidates').document(str(user_id))
                batch.set(doc_ref, candidate_data)
                count += 1
                
                if count % 500 == 0:
                    batch.commit()
                    batch = self.firebase_db.batch()
            
            if count > 0:
                batch.commit()
            
            print(f"   ✅ Migrated {count} candidates")
            return count
        except Exception as e:
            print(f"   ❌ Error migrating candidates: {str(e)}")
            return 0

    def migrate_projects(self):
        """Migrate projects from SQL to Firestore"""
        print("\n📥 Migrating Projects...")
        try:
            query = """
            SELECT ProjectId, Name, ClientName, Description, IsActive, CreatedDate
            FROM dbo.Projects
            """
            self.db_cursor.execute(query)
            rows = self.db_cursor.fetchall()
            
            batch = self.firebase_db.batch()
            count = 0
            
            for row in rows:
                project_id, name, client_name, description, is_active, created_date = row
                
                project_data = {
                    'project_id': project_id,
                    'name': name,
                    'client_name': client_name or '',
                    'description': description or '',
                    'is_active': is_active,
                    'created_date': created_date.isoformat() if created_date else None,
                    'migrated_at': datetime.now().isoformat()
                }
                
                doc_ref = self.firebase_db.collection('projects').document(str(project_id))
                batch.set(doc_ref, project_data)
                count += 1
                
                if count % 500 == 0:
                    batch.commit()
                    batch = self.firebase_db.batch()
            
            if count > 0:
                batch.commit()
            
            print(f"   ✅ Migrated {count} projects")
            return count
        except Exception as e:
            print(f"   ❌ Error migrating projects: {str(e)}")
            return 0

    def migrate_timesheets(self):
        """Migrate timesheet entries from SQL to Firestore"""
        print("\n📥 Migrating Timesheet Entries...")
        try:
            query = """
            SELECT EntryId, CandidateId, ProjectId, EntryDate, Hours, Remarks
            FROM dbo.TimesheetEntries
            """
            self.db_cursor.execute(query)
            rows = self.db_cursor.fetchall()
            
            batch = self.firebase_db.batch()
            count = 0
            
            for row in rows:
                entry_id, candidate_id, project_id, entry_date, hours, remarks = row
                
                timesheet_data = {
                    'entry_id': entry_id,
                    'candidate_id': candidate_id,
                    'project_id': project_id,
                    'entry_date': entry_date.isoformat() if entry_date else None,
                    'hours': float(hours) if hours else 0.0,
                    'remarks': remarks or '',
                    'migrated_at': datetime.now().isoformat()
                }
                
                doc_ref = self.firebase_db.collection('timesheets').document(str(entry_id))
                batch.set(doc_ref, timesheet_data)
                count += 1
                
                if count % 500 == 0:
                    batch.commit()
                    batch = self.firebase_db.batch()
            
            if count > 0:
                batch.commit()
            
            print(f"   ✅ Migrated {count} timesheet entries")
            return count
        except Exception as e:
            print(f"   ❌ Error migrating timesheets: {str(e)}")
            return 0

    def migrate_project_assignments(self):
        """Migrate project assignments from SQL to Firestore"""
        print("\n📥 Migrating Project Assignments...")
        try:
            query = """
            SELECT MappingId, CandidateId, ProjectId, AssignedDate
            FROM dbo.CandidateProjectMapping
            """
            self.db_cursor.execute(query)
            rows = self.db_cursor.fetchall()
            
            batch = self.firebase_db.batch()
            count = 0
            
            for row in rows:
                mapping_id, candidate_id, project_id, assigned_date = row
                
                assignment_data = {
                    'assignment_id': mapping_id,
                    'candidate_id': candidate_id,
                    'project_id': project_id,
                    'assigned_date': assigned_date.isoformat() if assigned_date else None,
                    'migrated_at': datetime.now().isoformat()
                }
                
                doc_ref = self.firebase_db.collection('assignments').document(str(mapping_id))
                batch.set(doc_ref, assignment_data)
                count += 1
                
                if count % 500 == 0:
                    batch.commit()
                    batch = self.firebase_db.batch()
            
            if count > 0:
                batch.commit()
            
            print(f"   ✅ Migrated {count} project assignments")
            return count
        except Exception as e:
            print(f"   ❌ Error migrating project assignments: {str(e)}")
            return 0

    def run_migration(self):
        """Run complete migration"""
        print("=" * 60)
        print("🚀 Firebase Data Migration - Starting")
        print("=" * 60)
        
        try:
            self.clear_firestore()
            
            users = self.migrate_users()
            candidates = self.migrate_candidates()
            projects = self.migrate_projects()
            timesheets = self.migrate_timesheets()
            assignments = self.migrate_project_assignments()
            
            print("\n" + "=" * 60)
            print("✅ Migration Complete!")
            print("=" * 60)
            print(f"   Users: {users}")
            print(f"   Candidates: {candidates}")
            print(f"   Projects: {projects}")
            print(f"   Timesheet Entries: {timesheets}")
            print(f"   Project Assignments: {assignments}")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Migration failed: {str(e)}")
        finally:
            if self.db_cursor:
                self.db_cursor.close()
            if self.db_conn:
                self.db_conn.close()

if __name__ == '__main__':
    migration = FirebaseDataMigration()
    migration.run_migration()
