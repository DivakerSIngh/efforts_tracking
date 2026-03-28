# API Configuration for Deployment

## Problem
When you deploy Angular to a server, the app needs to know where the Python API is located. The hardcoded `/api` relative path won't work if the API is on a different server.

## Solution
Use Angular environment files to configure the API URL based on the build configuration.

---

## How It Works

### Local Development
```bash
# When you run: ng serve
# Uses: src/frontend/src/environments/environment.ts
# API URL: http://localhost:8000/api
# Browser makes request: /api/auth → proxy.conf.json → http://localhost:8000/api/auth
```

### Production Build
```bash
# When you run: ng build --configuration production
# Uses: src/frontend/src/environments/environment.prod.ts
# API URL: http://103.35.121.152:8084/api
# Browser makes direct request: http://103.35.121.152:8084/api/auth
```

---

## Setup Steps

### 1. Environment Files ✅ (Already Created)

**`src/environments/environment.ts`** (Local Dev)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

**`src/environments/environment.prod.ts`** (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://103.35.121.152:8084/api'  // Your actual API server
};
```

### 2. Update All Services ✅ (Partially Done)

Import environment and use the apiUrl:

```typescript
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class YourService {
  private apiUrl = `${environment.apiUrl}/endpoint`;
  
  constructor(private http: HttpClient) {}
  
  getData(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }
}
```

### 3. Update Angular Build Configuration

In `angular.json`, the production configuration references the prod environment:

```json
"production": {
  "budgets": [...],
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    }
  ]
}
```

---

## Deployment Steps

### Build for Production
```bash
cd src/frontend

# Build with production environment
ng build --configuration production

# Output: dist/frontend/
```

### Deploy to Server
- Copy `dist/frontend/` contents to your web server
- The app will now use `http://103.35.121.152:8084/api` for API calls

---

## CORS Configuration (Important!)

If your API is on a different server, you must enable CORS in Python:

**In `src/backend/main.py`:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",           # Local dev
        "http://localhost:8000",           # Local dev
        "http://your-ui-server.com",       # Production UI server
        "https://your-ui-server.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## HTTPS Consideration

For production, use HTTPS:

**`src/environments/environment.prod.ts`:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://103.35.121.152:8084/api'  // Use HTTPS
};
```

And update Python's `.env`:
```ini
ALLOWED_ORIGINS=["https://your-ui-server.com"]
```

---

## Three Deployment Options

### Option 1: Nginx Reverse Proxy (Recommended)
```
Client → Nginx (UI + API proxy) → FastAPI
All same domain: no CORS issues
```

### Option 2: Separate Servers (Your Current Setup)
```
Client → UI Server (103.35.121.152:80) → API Server (103.35.121.152:8084)
Requires CORS headers on API
```

### Option 3: Docker Compose
```
Docker network handles communication
Services: nginx, angular, fastapi
All communicate via container names
```

---

## Summary

| Scenario | API URL | How It Works |
|----------|---------|-------------|
| Local dev `ng serve` | `http://localhost:8000/api` | proxy.conf.json redirects |
| Production built | `environment.prod.ts` URL | Direct CORS requests |
| Docker Nginx | `http://backend:8000/api/` | Nginx reverse proxy |

**Next Steps:**
1. ✅ Environment files created
2. ✅ Services updated (continue updating all other services)
3. Update all remaining services to import and use `environment.apiUrl`
4. Build: `ng build --configuration production`
5. Update Python CORS configuration
6. Deploy to server
