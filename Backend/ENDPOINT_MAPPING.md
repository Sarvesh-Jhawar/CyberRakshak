# 🔗 CyberRakshak Frontend-Backend Endpoint Mapping

## 📊 Overview
This document maps all API endpoints between the frontend and backend, identifying matches, mismatches, and missing implementations.

---

## ✅ **MATCHED ENDPOINTS** (Frontend ↔ Backend)

### 🔐 Authentication Endpoints
| Frontend Call | Backend Endpoint | Status | Method |
|---------------|------------------|--------|---------|
| `http://localhost:8000/auth/login` | `/api/v1/auth/login` | ✅ **MATCH** | POST |
| `http://localhost:8000/auth/register` | `/api/v1/auth/register` | ✅ **MATCH** | POST |

### 📊 Analytics Endpoints
| Frontend Call | Backend Endpoint | Status | Method |
|---------------|------------------|--------|---------|
| `/api/analytics/monthly` | `/api/analytics/monthly` | ✅ **MATCH** | GET |
| `/api/analytics/threat-types` | `/api/analytics/threat-types` | ✅ **MATCH** | GET |
| `/api/analytics/department-risk` | `/api/analytics/department-risk` | ✅ **MATCH** | GET |
| `/api/analytics/response-times` | `/api/analytics/response-times` | ✅ **MATCH** | GET |

### 🛠️ System & Admin Endpoints
| Frontend Call | Backend Endpoint | Status | Method |
|---------------|------------------|--------|---------|
| `/api/system/status` | `/api/system/status` | ✅ **MATCH** | GET |
| `/api/system/action` | `/api/system/action` | ✅ **MATCH** | POST |
| `/api/admin/actions` | `/api/v1/admin/actions` | ✅ **MATCH** | GET |
| `/api/admin/summary` | `/api/v1/admin/summary` | ✅ **MATCH** | GET |
| `/api/notifications/bulk` | `/api/v1/admin/notifications/bulk` | ✅ **MATCH** | POST |

### 👤 User Profile Endpoints
| Frontend Call | Backend Endpoint | Status | Method |
|---------------|------------------|--------|---------|
| `/api/user/profile` | `/api/user/profile` | ✅ **MATCH** | GET |
| `/api/user/logout` | `/api/user/logout` | ✅ **MATCH** | POST |
| `/api/dashboard/status` | `/api/dashboard/status` | ✅ **MATCH** | GET |

### 🚨 Incident Endpoints
| Frontend Call | Backend Endpoint | Status | Method |
|---------------|------------------|--------|---------|
| `${API_BASE}/incidents` | `/api/v1/incidents` | ✅ **MATCH** | GET |

---

## ❌ **MISMATCHED ENDPOINTS** (Need Fixing)

### 🔧 URL Path Mismatches
| Frontend Call | Backend Endpoint | Issue | Fix Required |
|---------------|------------------|-------|--------------|
| `/api/admin/profile` | `/api/v1/auth/me` | Different path | Update frontend or backend |
| `/api/admin/dashboard/stats` | `/api/v1/admin/summary` | Different path | Update frontend or backend |
| `/api/admin/dashboard/alerts` | ❌ **MISSING** | Endpoint not implemented | Create backend endpoint |
| `/api/admin/stats` | `/api/v1/admin/summary` | Different path | Update frontend or backend |
| `/api/admin/incidents/trends` | ❌ **MISSING** | Endpoint not implemented | Create backend endpoint |
| `/api/admin/incidents/risk` | ❌ **MISSING** | Endpoint not implemented | Create backend endpoint |
| `/api/admin/incidents/priority` | ❌ **MISSING** | Endpoint not implemented | Create backend endpoint |
| `/api/admin/incidents/heatmap` | ❌ **MISSING** | Endpoint not implemented | Create backend endpoint |
| `/api/notifications` | ❌ **MISSING** | Endpoint not implemented | Create backend endpoint |

---

## 🚫 **MISSING ENDPOINTS** (Need Implementation)

### 📝 Complaint/Incident Submission
| Frontend Expectation | Backend Status | Required Implementation |
|---------------------|----------------|------------------------|
| **Complaint Form Submission** | ❌ **MISSING** | POST `/api/v1/incidents` (exists but frontend doesn't use it) |
| **File Upload for Evidence** | ❌ **MISSING** | POST `/api/v1/incidents/upload` |

### 📊 Admin Dashboard Analytics
| Frontend Expectation | Backend Status | Required Implementation |
|---------------------|----------------|------------------------|
| **Dashboard Statistics** | ❌ **MISSING** | GET `/api/admin/dashboard/stats` |
| **Alert System** | ❌ **MISSING** | GET `/api/admin/dashboard/alerts` |
| **Incident Trends** | ❌ **MISSING** | GET `/api/admin/incidents/trends` |
| **Risk Analysis** | ❌ **MISSING** | GET `/api/admin/incidents/risk` |
| **Priority Distribution** | ❌ **MISSING** | GET `/api/admin/incidents/priority` |
| **Heatmap Data** | ❌ **MISSING** | GET `/api/admin/incidents/heatmap` |

### 🔔 Notification System
| Frontend Expectation | Backend Status | Required Implementation |
|---------------------|----------------|------------------------|
| **Get Notifications** | ❌ **MISSING** | GET `/api/notifications` |
| **Mark as Read** | ❌ **MISSING** | PUT `/api/notifications/{id}/read` |
| **Delete Notification** | ❌ **MISSING** | DELETE `/api/notifications/{id}` |

---

## 🔧 **REQUIRED FIXES**

### 1. **Frontend URL Updates Needed**
```typescript
// Update these in frontend files:
"/api/admin/profile" → "/api/v1/auth/me"
"/api/admin/dashboard/stats" → "/api/v1/admin/summary"
"/api/admin/stats" → "/api/v1/admin/summary"
```

### 2. **Backend Endpoints to Create**
```python
# Add these to Backend/app/routes/admin.py:
@router.get("/dashboard/stats")
@router.get("/dashboard/alerts") 
@router.get("/incidents/trends")
@router.get("/incidents/risk")
@router.get("/incidents/priority")
@router.get("/incidents/heatmap")

# Add these to Backend/app/routes/notifications.py (new file):
@router.get("/notifications")
@router.put("/notifications/{id}/read")
@router.delete("/notifications/{id}")
```

### 3. **Complaint Form Integration**
```typescript
// Update Frontend/cyberaksha/app/user-dashboard/complaint/page.tsx
// Replace mock submission with actual API call:
const response = await fetch(`${API_BASE}/api/v1/incidents`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  },
  body: JSON.stringify(formData)
});
```

---

## 📋 **IMPLEMENTATION PRIORITY**

### 🔥 **High Priority** (Critical for basic functionality)
1. Fix complaint form submission
2. Create missing admin dashboard endpoints
3. Fix URL mismatches

### 🟡 **Medium Priority** (Important for full functionality)
1. Implement notification system
2. Add file upload for evidence
3. Create incident analytics endpoints

### 🟢 **Low Priority** (Nice to have)
1. Add advanced filtering
2. Implement real-time updates
3. Add export functionality

---

## 🎯 **NEXT STEPS**

1. **Update Frontend URLs** to match backend endpoints
2. **Create missing backend endpoints** for admin dashboard
3. **Implement complaint form submission** with real API calls
4. **Add notification system** endpoints
5. **Test all endpoint integrations**

---

## 📊 **Summary Statistics**
- **Total Frontend API Calls**: 20
- **Matched Endpoints**: 11 (55%)
- **Mismatched Endpoints**: 9 (45%)
- **Missing Backend Endpoints**: 8
- **Missing Frontend Implementations**: 1 (complaint submission)

**Status**: 🟡 **Partially Implemented** - Core functionality works, but several features need completion.
