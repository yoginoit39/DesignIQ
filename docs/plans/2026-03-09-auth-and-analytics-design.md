# Auth + Analytics Design
Date: 2026-03-09

## Goal
Make system-design-prep publicly deployable with:
1. Google Analytics 4 for visitor tracking
2. Google (Gmail) OAuth login gate — only signed-in users access the app
3. Full backend protection — all FastAPI endpoints require a valid Firebase ID token

## Architecture

```
Visitor arrives
    ├── GA4 fires (tracks everyone, even before login)
    ├── Not signed in → Landing page with "Sign in with Google" button
    └── Signed in → Full app
                        └── Every API call sends Firebase ID token in Authorization header
                                └── Backend validates token before hitting Groq
```

## Components

### Google Analytics 4
- 4-line gtag script tag in `frontend/index.html`
- Tracks all visits automatically, including pre-login traffic
- Free, no npm dependency needed

### Firebase Auth (Frontend)
- `src/AuthContext.jsx` — React context wrapping Firebase auth state; exposes `user`, `signIn`, `signOut`, `loading`
- `src/LoginPage.jsx` — public landing page shown to unauthenticated users; has Google sign-in button
- `App.jsx` — checks auth state; renders `<LoginPage />` or full app; passes ID token to all fetch calls
- Every `fetch` to the backend includes `Authorization: Bearer <firebase-id-token>` header

### Firebase Admin (Backend)
- `firebase-admin` Python package validates ID tokens server-side
- `verify_token` FastAPI dependency function — calls `firebase_admin.auth.verify_id_token()`
- Applied to all 5 endpoints: `/generate-design`, `/refine-design`, `/chat`, `/drill`, `/concept`
- `/health` remains public
- Unauthenticated or invalid token → `401 Unauthorized`

## Environment Variables

### Frontend (Vite)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_GA_MEASUREMENT_ID
```

### Backend
```
FIREBASE_SERVICE_ACCOUNT_JSON   # full JSON string of Firebase service account key
```

## Security Properties
- Groq API key lives only in backend `.env`, never exposed to frontend
- All backend endpoints require a valid, non-expired Firebase ID token
- Firebase validates tokens are signed by Google — cannot be forged
- CORS on backend still restricts origins to known frontend domains
- Even if someone finds the backend URL, they cannot call it without a valid Google login

## Out of Scope
- Per-user saved designs (ephemeral session only)
- Role-based access or email whitelist
- Sign-up flow (Google OAuth handles it automatically)

## Setup Steps (one-time, manual)
1. Create Firebase project at console.firebase.google.com
2. Enable Authentication → Google provider
3. Register web app → copy config values to frontend `.env`
4. Generate service account key → paste JSON as `FIREBASE_SERVICE_ACCOUNT_JSON` in backend `.env`
5. Create GA4 property → copy Measurement ID to frontend `.env`
