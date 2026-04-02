# Angular → Firebase Migration Plan

## ✅ Current Architecture (What We're Replacing)
```
Angular Frontend (port 4200)
        ↓
Python FastAPI Backend (port 8084)
        ↓
SQL Server Database (103.35.121.152:5023)
```

**Backend provides these endpoints:**
- `/api/auth/login` - User authentication
- `/api/auth/refresh` - Token refresh
- `/api/candidates/*` - Candidate CRUD
- `/api/projects/*` - Project management
- `/api/timesheet/*` - Timesheet entries
- `/api/report/*` - Reports & Analytics
- `/api/dashboard/*` - Dashboard data

---

## 🎯 Target Architecture (What We're Building)
```
Angular Frontend (port 4200)
        ↓
Firebase SDKFirestore (Database)
Firebase Auth (Authentication)
Firebase Cloud Functions (Business Logic)
```

---

## 📋 Phase-by-Phase Migration Plan

### Phase 1: Setup Firebase Project ⭐ (Days 1-2)
**Tasks:**
1. Create Firebase project on console.firebase.google.com
2. Enable Firestore Database
3. Enable Firebase Authentication (Email/Password)
4. Get Firebase config credentials
5. Install Firebase SDK in Angular

**Files to create:**
- `src/environments/firebase.config.ts`
- `src/app/core/firebase.service.ts`

**No frontend code changes yet** ✅

---

### Phase 2: Migrate Authentication (Days 2-3)
**Current Flow:**
```
Login Form → AuthService.login() → POST /api/auth/login → Store JWT token
```

**New Flow:**
```
Login Form → AuthService.login() → Firebase Auth → Store Firebase token
```

**What changes:**
- `auth.service.ts` - Replace HTTP login with Firebase Auth
- `token-storage.service.ts` - Store Firebase tokens instead of JWT
- `auth-interceptor.ts` - Use Firebase tokens instead of JWT
- Add Firebase Auth Guard

**Frontend impact:** ❌ NONE (Login UI stays identical)
**Status:** Services only, no component changes

---

### Phase 3: Migrate Data Services (Days 3-5)
Target: Replace all HTTP calls with Firestore operations

**Services to migrate:**

#### 3.1 Candidate Service
**Current:** `GET/POST/PUT /api/candidates`
**New:** Read/Write to `Firestore /candidates` collection

```typescript
// Before
getCandidates(): Observable<Candidate[]> {
  return this.http.get<Candidate[]>(`${this.apiUrl}/candidates`);
}

// After
getCandidates(): Observable<Candidate[]> {
  return this.afs.collection('candidates').valueChanges({ idField: 'user_id' });
}
```

#### 3.2 Project Service
**Current:** `GET/POST/PUT /api/projects`
**New:** Read/Write to `Firestore /projects` collection

#### 3.3 Timesheet Service
**Current:** `GET/POST/PUT /api/timesheet`
**New:** Read/Write to `Firestore /timesheets` collection

#### 3.4 Report Service
**Current:** `GET /api/report/*` (aggregations)
**New:** Firestore aggregations + Cloud Functions

#### 3.5 Dashboard Service
**Current:** `GET /api/dashboard/*` (analytics)
**New:** Cloud Functions for complex queries

---

### Phase 4: Data Migration Strategy (Day 5-6)
**Task:** Migrate data from SQL Server → Firestore

**Options:**
1. **Manual Export** (fastest for demo)
   - Export SQL data to JSON
   - Upload to Firestore via Admin SDK

2. **Automated Script**
   - Create Python script to read SQL → Write to Firebase

3. **One-time Cloud Function**
   - Deploy function to migrate data in batches

**Recommended:** Option 1 or 2 (we can provide scripts)

---

### Phase 5: Firebase Security & Performance (Day 6-7)

**Security Rules:** Set up Firestore security
```
- Authenticated users only
- Users can only read/write their own data
- Admin users have full access
- Role-based access control (RBAC)
```

**Optimization:**
- Index creation for queries
- Caching strategies
- Lazy loading

---

### Phase 6: Testing & Deployment (Day 7-8)

**Testing:**
- ✅ Login/Logout works
- ✅ CRUD operations work
- ✅ Reports generate correctly
- ✅ Dashboard displays data
- ✅ Role-based access works

**Deployment:**
- Build Angular: `ng build --configuration production`
- No backend needed anymore
- Deploy to static hosting (Firebase Hosting, Nginx, etc.)

---

## 📊 Migration Impact Matrix

| Feature | Current | New | Frontend Change |
|---------|---------|-----|-----------------|
| Authentication | JWT Tokens | Firebase Auth | ❌ NONE |
| Data CRUD | REST API | Firestore | ❌ NONE |
| Real-time Updates | Polling | Firestore Listeners | ❌ NONE |
| Authorization | Backend logic | Firestore Rules | ❌ NONE |
| Role Management | SQL tables | Firestore docs | ❌ NONE |
| Reports | SQL queries | Cloud Functions | ✅ Same UI |
| Dashboard | SQL aggregations | Cloud Functions | ✅ Same UI |

---

## 🔄 Firestore Data Structure

```
Firebase Project
├── users/
│   ├── user_id_1
│   │   ├── email: "admin@example.com"
│   │   ├── full_name: "Admin User"
│   │   ├── role: "admin"
│   │   └── created_date: timestamp
│   └── user_id_2
│       └── ...
│
├── candidates/
│   ├── candidate_1
│   │   ├── email: "candidate@example.com"
│   │   ├── full_name: "John Doe"
│   │   ├── role: "candidate"
│   │   └── is_active: true
│   └── ...
│
├── projects/
│   ├── project_1
│   │   ├── name: "Project A"
│   │   ├── client_name: "Client X"
│   │   ├── description: "..."
│   │   └── is_active: true
│   └── ...
│
├── timesheets/
│   ├── timesheet_1
│   │   ├── candidate_id: "candidate_1"
│   │   ├── project_id: "project_1"
│   │   ├── hours: 8
│   │   ├── date: "2026-03-28"
│   │   └── notes: "..."
│   └── ...
│
├── project_assignments/
│   ├── assignment_1
│   │   ├── candidate_id: "candidate_1"
│   │   ├── project_id: "project_1"
│   │   └── assigned_date: timestamp
│   └── ...
│
└── reports/ (optional - can compute on-the-fly)
    └── monthly_summaries (Cloud Function output)
```

---

## 📦 Angular Files to Modify

### Must Change (Service Layer)
- ✏️ `src/app/core/auth.ts` → Firebase Auth
- ✏️ `src/app/core/candidate.service.ts` → Firestore
- ✏️ `src/app/core/auth-interceptor.ts` → Firebase tokens
- ✏️ `src/app/admin/admin.ts` → Firestore
- ✏️ `src/app/timesheet/timesheet.ts` → Firestore
- ✏️ `src/app/report/report.ts` → Cloud Functions
- ✏️ `src/app/dashboard/dashboard.ts` → Cloud Functions

### No Change (UI Components)
- ✅ All `.html` files
- ✅ All `.scss` files
- ✅ Component logic (if abstracted well)

---

## ⚡ Implementation Strategy

### Strategy A: Service Abstraction (RECOMMENDED)
```typescript
// Create adapter pattern
FirebaseDataService {
  getCandidates(): Observable<Candidate[]> {
    // Firestore logic
  }
}

// Components still use same interface
AdminComponent {
  constructor(dataService: AdminService) {}
  // No changes needed
}
```

**Benefits:**
- ✅ Components unchanged
- ✅ Easy to test
- ✅ Easy to rollback

---

## ⚠️ Important Considerations

### 1. Offline vs Online
- **Current:** API-only (online required)
- **New:** Firestore has offline support built-in! 🎉

### 2. Complex Queries/Reports
- **Current:** SQL queries
- **New:** Cloud Functions for complex logic

### 3. Data Volume
- **Firestore pricing:** Pay per read/write/delete
- Recommend implementing caching/batching

### 4. Performance
- **SQL:** Optimized for complex joins
- **Firestore:** NoSQL - denormalization recommended

---

## 📅 Timeline

| Phase | Duration | Days |
|-------|----------|------|
| Firebase Setup | 1-2 days | 1-2 |
| Auth Migration | 1-2 days | 2-3 |
| Data Services | 2-3 days | 3-5 |
| Data Migration | 1-2 days | 5-6 |
| Security & Perf | 1-2 days | 6-7 |
| Testing & Deploy | 1-2 days | 7-8 |
| **Total** | **8-14 days** | |

---

## 🎯 Success Criteria

✅ All frontend pages work identically
✅ Login/Logout works
✅ All CRUD operations work
✅ Reports generate correctly
✅ Dashboard displays data
✅ Role-based access control works
✅ No API backend required
✅ App runs on static hosting

---

## 🚀 Phase 1: Next Steps

**If you approve this plan, we proceed with:**

1. **Firebase Setup** (Day 1)
   - Create Firebase project
   - Get config credentials
   - Install Firebase SDK in Angular

2. **Create Firebase Service** (Day 1-2)
   - `firebase.service.ts` with initialization
   - `firebase-auth.service.ts` for auth logic

3. **Database Design** (Day 2)
   - Finalize Firestore schema mapping
   - Create Firestore collections
   - Set up security rules (draft)

**Does this plan work for you? Any modifications needed?**
