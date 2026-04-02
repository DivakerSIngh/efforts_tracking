# 🚀 Firebase Migration - QUICK START GUIDE

## ⏱️ Time Required: ~30 minutes

---

## 📋 STEP 1: Create Firebase Project (5 min)

### 1.1 Go to Firebase Console
```
https://firebase.google.com
```

### 1.2 Create New Project
```
1. Click "Add Project"
2. Enter project name: effort-tracking
3. Accept terms
4. Click "Create project"
5. Wait for setup (1-2 minutes)
```

---

## 🔑 STEP 2: Get Firebase Credentials (5 min)

### 2.1 Get Web Config
```
1. Firebase Console → Your Project
2. Settings ⚙️ (top left)
3. Scroll to "Your apps" section
4. Copy the entire config object:
{
  "apiKey": "AIzaSy...",
  "authDomain": "effort-tracking-xxx.firebaseapp.com",
  "projectId": "effort-tracking-xxx",
  "storageBucket": "effort-tracking-xxx.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123def456"
}
```

### 2.2 Update Firebase Config File
```
Edit: src/frontend/src/environments/firebase.config.ts

Replace values:
- apiKey: paste your apiKey
- authDomain: paste your authDomain
- projectId: paste your projectId
- storageBucket: paste your storageBucket
- messagingSenderId: paste your messagingSenderId
- appId: paste your appId
```

---

## 🔐 STEP 3: Get Service Account Key (5 min)

### 3.1 Generate Private Key
```
1. Firebase Console → Project Settings ⚙️
2. Click "Service Accounts" tab
3. Click "Generate New Private Key"
4. Save file as: firebase-key.json
5. Move to project root:
   D:\AI Assistant\EffortTracking\firebase-key.json
```

### 3.2 Add to .gitignore
```
Edit: .gitignore

Add line:
firebase-key.json
```

---

## ✅ STEP 4: Enable Firestore & Auth (3 min)

### 4.1 Enable Firestore
```
1. Firebase Console → Your Project
2. Click "Firestore Database" (left menu)
3. Click "Create Database"
4. Select location (closest to you)
5. Select "Start in Test mode"
6. Click "Create"
```

### 4.2 Enable Authentication
```
1. Firebase Console → Your Project
2. Click "Authentication" (left menu)
3. Click "Get Started"
4. Click "Email/Password"
5. Toggle ON "Email/Password"
6. Click "Save"
```

---

## 📦 STEP 5: Install Dependencies (10 min)

### 5.1 Install Firebase SDK in Angular
```bash
cd d:\AI Assistant\EffortTracking\src\frontend
npm install firebase
```

**Expected output:**
```
added XX packages
```

### 5.2 Install Python Dependencies
```bash
cd d:\AI Assistant\EffortTracking\src\backend
pip install firebase-admin pyodbc python-dotenv
```

**Expected output:**
```
Successfully installed firebase-admin pyodbc python-dotenv
```

**Verify with:**
```bash
pip list | findstr firebase
```

---

## 🗂️ STEP 6: Run Data Migration (2 min)

### 6.1 Start Migration
```bash
cd d:\AI Assistant\EffortTracking\src\backend

# Make sure venv is activated
.venv\Scripts\activate

# Run migration
python migrate_to_firebase.py
```

### 6.2 Expected Output
```
🚀 Firebase Data Migration - Starting
============================================================
🗑️  Clearing existing Firestore data...
   ✅ Deleted 10 documents from 'users'
   ✅ Deleted 5 documents from 'candidates'
   ✅ Deleted 20 documents from 'projects'
   ✅ Deleted 150 documents from 'timesheets'
   ✅ Deleted 30 documents from 'assignments'

📥 Migrating Users...
   ✅ Migrated 10 users
📥 Migrating Candidates...
   ✅ Migrated 5 candidates
📥 Migrating Projects...
   ✅ Migrated 20 projects
📥 Migrating Timesheet Entries...
   ✅ Migrated 150 timesheet entries
📥 Migrating Project Assignments...
   ✅ Migrated 30 project assignments

============================================================
✅ Migration Complete!
============================================================
```

### 6.3 Verify in Firebase Console
```
1. Firebase Console → Firestore Database
2. You should see 5 collections:
   - users (10 documents)
   - candidates (5 documents)
   - projects (20 documents)
   - timesheets (150 documents)
   - assignments (30 documents)
```

---

## 🔒 STEP 7: Set Firestore Security Rules (2 min)

### 7.1 Open Firestore Rules
```
1. Firebase Console → Firestore Database
2. Click "Rules" tab
```

### 7.2 Replace with Security Rules
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - own profile only
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Candidates - own or admin
    match /candidates/{candidateId} {
      allow read: if request.auth.uid == candidateId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == candidateId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Projects - all read, admin write
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Timesheets - own or admin
    match /timesheets/{timesheetId} {
      allow read: if request.auth.uid == resource.data.candidate_id || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == resource.data.candidate_id || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Assignments - admin only
    match /assignments/{assignmentId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 7.3 Click "Publish"

---

## 🧪 STEP 8: Test Login (Optional)

### 8.1 Create Test User in Firebase
```
1. Firebase Console → Authentication
2. Click "Users" tab
3. Click "Add User"
4. Email: test@example.com
5. Password: Test@123
6. Click "Add User"
```

### 8.2 Run Angular App
```bash
cd d:\AI Assistant\EffortTracking\src\frontend
ng serve
```

### 8.3 Test Login
```
1. Open browser: http://localhost:4200
2. Try login with: test@example.com / Test@123
3. Should log in successfully ✅
```

---

## ✅ CHECKLIST - You're Done When All Are ✅

- [ ] Firebase project created
- [ ] firebase.config.ts updated with credentials
- [ ] firebase-key.json downloaded and in project root
- [ ] firebase-key.json added to .gitignore
- [ ] npm install firebase (completed)
- [ ] pip install firebase-admin pyodbc python-dotenv (completed)
- [ ] Firestore database created
- [ ] Firebase Auth enabled (Email/Password)
- [ ] Data migration completed successfully
- [ ] Collections visible in Firestore Console
- [ ] Security rules published
- [ ] (Optional) Test user created and login tested

---

## 🚀 NEXT PHASE - Build & Deploy

### Once setup complete, run:

```bash
# Frontend
cd src/frontend
npm install firebase
ng build --configuration production

# Output: dist/frontend/ (ready to deploy)
```

```bash
# No backend needed anymore!
# Upload dist/frontend to your web server
```

---

## ⚠️ TROUBLESHOOTING

### "Permission denied" errors
```
→ Check security rules are published
→ Verify user ID in token matches Firestore document
```

### Migration script fails
```
→ Check firebase-key.json exists in project root
→ Verify SQL Server connection in .env
→ Check Python packages installed: pip list
```

### Firebase SDK not found
```
→ Run: npm install firebase
→ Check node_modules exists: ls node_modules/firebase
```

### "No database selected" error
```
→ Make sure Firestore Database is created (not Realtime Database)
→ Select correct region
```

---

## 📚 Resources

- Firebase Console: https://firebase.google.com
- Firestore Docs: https://firebase.google.com/docs/firestore
- Firebase Auth Docs: https://firebase.google.com/docs/auth

---

## 🎯 Summary

You now have:
✅ Angular app connected to Firebase
✅ All SQL data migrated to Firestore
✅ User authentication via Firebase Auth
✅ Security rules preventing unauthorized access
✅ No backend API needed
✅ Ready to deploy!

**Ready to proceed? Reply with your Firebase Project ID when complete!** 🚀
