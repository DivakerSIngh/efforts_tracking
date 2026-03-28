# Production Deployment Checklist

## ✅ Completed Tasks

### Angular Frontend (src/frontend/)
- [x] Created environment files:
  - `src/environments/environment.ts` (local dev)
  - `src/environments/environment.prod.ts` (production)
  
- [x] Updated all services to use `environment.apiUrl`:
  - `src/app/core/auth.ts`
  - `src/app/core/candidate.service.ts`
  - `src/app/core/auth-interceptor.ts`
  - `src/app/report/report.ts`
  - `src/app/timesheet/timesheet.ts`
  - `src/app/admin/admin.ts`
  - `src/app/dashboard/dashboard.ts`

### Python Backend (src/backend/)
- [x] Updated `src/backend/.env`:
  - Added production server IP to ALLOWED_ORIGINS
  - Updated APP_URL to production domain

---

## 🚀 Deployment Steps

### Step 1: Build Angular for Production
```bash
cd src/frontend

# Build with production environment
ng build --configuration production

# Output will be in: dist/frontend/
```

### Step 2: Deploy to Web Server

**Option A: Nginx (Recommended)**
1. Copy `dist/frontend/` contents to `/usr/share/nginx/html/`
2. Nginx already configured to proxy `/api` to backend ✅
3. Restart Nginx: `nginx -s reload`

**Option B: Simple HTTP Server**
```bash
# On the UI server, copy dist/frontend/ to a folder
# Serve with any HTTP server (Python, Node, Nginx, IIS, etc.)
```

### Step 3: Verify Configuration

**Test API endpoint in production:**
```bash
# From UI server, test CORS is working
curl -H "Origin: http://103.35.121.152" \
     -H "Access-Control-Request-Method: POST" \
     http://103.35.121.152:8084/api/auth/login

# You should see CORS headers in response
```

**Test from browser:**
1. Open: `http://103.35.121.152` (or your domain)
2. Open DevTools → Network tab
3. Try to login
4. Check API requests are hitting `http://103.35.121.152:8084/api/...`

---

## 📋 Architecture After Deployment

```
┌─────────────────┐
│  Browser        │
│ (UI Server IP)  │
└────────┬────────┘
         │
         │ Direct requests to:
         │ - http://103.35.121.152:8084/api/...
         │
    ┌────▼──────────┐
    │ Python API    │
    │ Port 8084     │
    │ Accepts CORS  │
    │ from UI       │
    └───────────────┘
```

---

## 🔒 CORS Configuration Summary

**Python Backend (.env):**
```ini
ALLOWED_ORIGINS=["http://localhost:4200", "http://localhost:8000", "http://103.35.121.152", "https://103.35.121.152"]
```

**What this allows:**
- ✅ Local dev on port 4200
- ✅ Direct API calls from UI at 103.35.121.152
- ✅ HTTPS connections (when available)

---

## 🧪 Local Dev Still Works

When running locally with `ng serve`:
1. Angular on: `http://localhost:4200`
2. Proxy redirects `/api` → `http://localhost:8000` (from proxy.conf.json)
3. No CORS needed ✅

---

## ⚠️ Troubleshooting

### API calls still showing 404 in production
- Check `environment.prod.ts` has correct API URL
- Verify `ng build --configuration production` was used
- Check Python API is running on port 8084

### CORS errors in browser console
1. Python API might not be accepting the UI origin
2. Check `.env` ALLOWED_ORIGINS includes your UI domain
3. Restart Python API after .env change

### Mixed content warning (HTTPS → HTTP)
- Use HTTPS for both UI and API in production
- Update environment.prod.ts: `apiUrl: 'https://...'`

---

## 📚 Files Modified

| File | Change |
|------|--------|
| `src/environments/environment.ts` | Created - local dev |
| `src/environments/environment.prod.ts` | Created - production |
| `src/app/core/auth.ts` | Updated to use environment |
| `src/app/core/candidate.service.ts` | Updated to use environment |
| `src/app/core/auth-interceptor.ts` | Updated to use environment |
| `src/app/report/report.ts` | Updated to use environment |
| `src/app/timesheet/timesheet.ts` | Updated to use environment |
| `src/app/admin/admin.ts` | Updated to use environment |
| `src/app/dashboard/dashboard.ts` | Updated to use environment |
| `src/backend/.env` | Added CORS origins + APP_URL |

---

## ✨ Summary

Your Angular app now:
1. **Local dev**: Uses proxy.conf.json to route `/api` → localhost:8000
2. **Production**: Uses environment.prod.ts to call direct API URL

Your Python API now:
1. Accepts CORS requests from production UI server
2. Works with both HTTP and HTTPS URLs

**Next: Build and deploy!** 🚀
