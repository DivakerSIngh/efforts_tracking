# Firebase Migration - Setup & Implementation Guide

## 📋 Prerequisites

Before starting the migration, you need:

1. ✅ Firebase Account (free tier available)
2. ✅ Firebase Project created
3. ✅ Firestore Database enabled
4. ✅ Firebase Authentication enabled (Email/Password)
5. ✅ Service Account JSON file for data migration

---

## 🔑 Step 1: Setup Firebase Project

### 1.1 Create Firebase Project
1. Go to [firebase.google.com](https://firebase.google.com)
2. Click "Go to Console"
3. Click "Add project"
4. Enter project name (e.g., "effort-tracking")
5. Create project

### 1.2 Get Firebase Config
1. In Firebase Console, click "Project Settings" ⚙️
2. Scroll to "Your apps" section
3. Click "Web" icon
4. Copy the config object
5. Update `src/frontend/src/environments/firebase.config.ts`:

```typescript
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY_HERE',           // ← paste
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',  // ← paste
  projectId: 'your-project-id',          // ← paste
  storageBucket: 'your-project-id.appspot.com',   // ← paste
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',  // ← paste
  appId: 'YOUR_APP_ID'                   // ← paste
};
```

### 1.3 Enable Firestore Database
1. In Firebase Console, click "Firestore Database"
2. Click "Create Database"
3. Select region (closest to your users)
4. Start in **Test mode** (for now)
5. Create

### 1.4 Enable Firebase Auth
1. In Firebase Console, click "Authentication"
2. Click "Sign-in method"
3. Enable "Email/Password"

### 1.5 Get Service Account Key (for data migration)
1. Firebase Console → Project Settings ⚙️ → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase-key.json` in project root:
   ```
   D:\AI Assistant\EffortTracking\firebase-key.json
   ```

⚠️ **IMPORTANT:** Never commit this file to Git! Add to `.gitignore`:
```
firebase-key.json
```

---

## 📦 Step 2: Install Dependencies

### 2.1 Install Firebase SDK in Angular
```bash
cd src/frontend
npm install firebase
```

### 2.2 Install Python Migration Dependencies
```bash
cd src/backend
pip install firebase-admin pyodbc python-dotenv
```

---

## 🚀 Step 3: Run Data Migration

### 3.1 Prepare Migration Script
The migration script is ready at:
```
src/backend/migrate_to_firebase.py
```

### 3.2 Run Migration
```bash
cd src/backend

# Activate virtual environment if needed
.venv\Scripts\activate

# Run migration
python migrate_to_firebase.py
```

**Output should look like:**
```
🚀 Firebase Data Migration - Starting
============================================================
🗑️  Clearing existing Firestore data...
   ✅ Deleted X documents from 'users'
   ✅ Deleted Y documents from 'projects'
...
✅ Migration Complete!
============================================================
   Users: 10
   Candidates: 5
   Projects: 20
   Timesheet Entries: 150
   Project Assignments: 30
============================================================
```

---

## 🔧 Step 4: Update Angular Services

### 4.1 Replace Auth Service

**Current: `src/app/core/auth.ts`**
```typescript
// OLD - HTTP based
login(credentials: LoginRequest): Observable<TokenResponse> {
  return this.http.post<TokenResponse>(`${API}/login`, credentials);
}
```

**New: Use `FirebaseAuthService`**
```typescript
import { FirebaseAuthService } from './firebase-auth.service';

// In component or service
constructor(private firebaseAuth: FirebaseAuthService) {}

login(credentials: LoginRequest): Observable<TokenResponse> {
  return this.firebaseAuth.login(credentials.email, credentials.password);
}
```

### 4.2 Replace Data Services

**Services to update:**
- ✏️ `src/app/core/candidate.service.ts` → Use `FirebaseCandidateService`
- ✏️ `src/app/timesheet/timesheet.ts` → Use `FirebaseTimesheetService`
- ✏️ `src/app/admin/admin.ts` → Use `FirebaseAdminService` (TODO)
- ✏️ `src/app/report/report.ts` → Use `FirebaseReportService` (TODO)
- ✏️ `src/app/dashboard/dashboard.ts` → Use `FirebaseDashboardService` (TODO)

---

## 📝 Firestore Security Rules

### 4.3 Set Security Rules

In Firebase Console → Firestore Database → Rules, replace with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - Own profile read/write only
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Candidates collection
    match /candidates/{candidateId} {
      allow read: if request.auth.uid == candidateId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == candidateId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Projects collection - Admins full access, candidates read-only
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Timesheets - Own entries only
    match /timesheets/{timesheetId} {
      allow read: if request.auth.uid == resource.data.candidate_id || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == resource.data.candidate_id || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Assignments - Admins only
    match /assignments/{assignmentId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🔐 Important Security Notes

### Authentication

Instead of JWT parsing, Firebase handles auth:

```typescript
// OLD - Manually verify JWT
const token = this.tokenStorage.getToken();

// NEW - Firebase automatically validates
const user = this.auth.currentUser;
```

### Token Refresh

Firebase handles token refresh automatically:

```typescript
// OLD - Manual refresh endpoint
POST /api/auth/refresh

// NEW - Automatic (Firebase SDK handles it)
const token = await user.getIdToken(true); // Force refresh
```

---

## 📊 Phase-by-Phase Completion

### Phase 1: Firebase Setup ✅
- [x] Create Firebase project
- [x] Enable Firestore
- [x] Enable Authentication
- [x] Get credentials
- [x] Create config file

### Phase 2: Migration
- [ ] Install dependencies
- [ ] Run data migration script
- [ ] Verify data in Firestore Console

### Phase 3: Update Services (NEXT)
- [ ] Update `AuthService` to use `FirebaseAuthService`
- [ ] Update `CandidateService` to use `FirebaseCandidateService`
- [ ] Update `TimesheetService`
- [ ] Update `AdminService`
- [ ] Create `FirebaseDashboardService`
- [ ] Create `FirebaseReportService`

### Phase 4: Testing & Deploy
- [ ] Test login/logout
- [ ] Test CRUD operations
- [ ] Test reports
- [ ] Build production bundle
- [ ] Deploy to Firebase Hosting (or your server)

---

## 🎯 Next Steps

1. ✅ Create Firebase project and get credentials
2. ✅ Update `firebase.config.ts` with your credentials
3. ✅ Get service account key and save as `firebase-key.json`
4. ✅ Install dependencies
5. ✅ Run migration script
6. ⏭️ **NEXT: Update all services to use Firebase** (we'll do this together)

---

## 🐛 Troubleshooting

### "Firebase credentials file not found"
- Download `firebase-key.json` from Firebase Console
- Save in project root: `D:\AI Assistant\EffortTracking\`

### "Firestore permission denied"
- Check Security Rules are set correctly
- Check user is authenticated
- Check user UID in token

### "Migration script fails to connect to SQL"
- Verify `DB_CONNECTION_STRING` in `.env`
- Check SQL Server is running
- Check network connectivity

### "No data appears in Firestore"
- Check migration script ran successfully
- Check Firestore Collections in Console
- Try manual data addition in Console first

---

## 📚 Resources

- Firebase Documentation: https://firebase.google.com/docs
- Firestore Best Practices: https://firebase.google.com/docs/firestore/best-practices
- Firebase Auth: https://firebase.google.com/docs/auth
- Angular Firebase: https://github.com/angular/fire

---

## ⚡ Quick Reference

| Task | Location |
|------|----------|
| Firebase Config | `src/environments/firebase.config.ts` |
| Firebase Service | `src/app/core/firebase.service.ts` |
| Firebase Auth | `src/app/core/firebase-auth.service.ts` |
| Migration Script | `src/backend/migrate_to_firebase.py` |
| Firestore Rules | Firebase Console → Firestore Database → Rules |

---

**Ready to proceed? Reply "yes" to start Phase 2: Dependencies & Migration** 🚀
