# Auth + Analytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Google Analytics 4 visitor tracking and Firebase Google OAuth login gate to protect the Groq API key from abuse.

**Architecture:** GA4 script tag in index.html tracks all visitors. Firebase Auth gates the entire app — unauthenticated users see a landing page. Every frontend fetch passes the Firebase ID token in `Authorization: Bearer` header. The FastAPI backend validates the token via `firebase-admin` before hitting Groq.

**Tech Stack:** Firebase JS SDK (frontend), firebase-admin Python package (backend), GA4 gtag script

---

## Pre-Work: Manual Firebase + GA4 Setup (do this BEFORE writing any code)

These steps require browser access — do them in the Firebase and Google Analytics consoles.

### Firebase Setup
1. Go to https://console.firebase.google.com → "Create a project" → name it `design-iq`
2. In the project dashboard: "Build" → "Authentication" → "Get started" → "Google" → Enable → Save
3. Click the gear icon → "Project settings" → "Your apps" → "Add app" → Web (`</>`)
4. Register app name `DesignIQ` → copy the `firebaseConfig` object (you'll need these values)
5. Still in Project settings → "Service accounts" → "Generate new private key" → download the JSON file

### GA4 Setup
1. Go to https://analytics.google.com → "Start measuring" → create account `DesignIQ`
2. Create a property → choose "Web" → enter your future Vercel URL (can use a placeholder)
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

---

## Task 1: Add GA4 Script to index.html

**Files:**
- Modify: `frontend/index.html`

**Step 1: Add gtag script**

Replace `REPLACE_WITH_YOUR_G_ID` with your actual Measurement ID after you get it from GA4.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DesignIQ — System Design Interview Prep</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=REPLACE_WITH_YOUR_G_ID"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'REPLACE_WITH_YOUR_G_ID');
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 2: Verify**

Open the app locally and check browser DevTools → Network tab. You should see a request to `googletagmanager.com`. GA4 Measurement ID can be safely hardcoded — it is a public identifier visible in every site's HTML.

**Step 3: Commit**

```bash
cd frontend
git add index.html
git commit -m "feat: add Google Analytics 4 tracking"
```

---

## Task 2: Install Firebase JS SDK

**Files:**
- Modify: `frontend/package.json` (via npm install)

**Step 1: Install**

```bash
cd frontend
npm install firebase
```

**Step 2: Verify**

```bash
cat package.json | grep firebase
# Expected: "firebase": "^11.x.x"
```

---

## Task 3: Create Firebase Config File

**Files:**
- Create: `frontend/src/firebase.js`

**Step 1: Create the file**

Fill in values from the Firebase console `firebaseConfig` object you copied in Pre-Work.

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

**Step 2: Create frontend/.env.local**

```
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id-here
```

Verify `.env.local` is in `.gitignore` (it is by default with Vite). Never commit this file.

**Step 3: Commit**

```bash
git add src/firebase.js
git commit -m "feat: add Firebase app initialization"
```

---

## Task 4: Create AuthContext

**Files:**
- Create: `frontend/src/AuthContext.jsx`

**Step 1: Create the file**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from './firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = () => signInWithPopup(auth, new GoogleAuthProvider())
  const signOut = () => firebaseSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

**Step 2: Commit**

```bash
git add src/AuthContext.jsx
git commit -m "feat: add Firebase auth context"
```

---

## Task 5: Create LoginPage

**Files:**
- Create: `frontend/src/LoginPage.jsx`

**Step 1: Create the file**

Matches the existing dark theme (`#0a0a0f` background, cyan accents, JetBrains Mono font).

```jsx
import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signIn()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #0099cc, #00d4ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          boxShadow: '0 4px 24px rgba(0,212,255,0.35)',
        }}>
          ⬡
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#f0f4ff',
            letterSpacing: '-0.03em',
            fontFamily: "'JetBrains Mono', monospace",
            margin: 0,
          }}>
            DesignIQ
          </h1>
          <p style={{ fontSize: 14, color: '#3d4466', margin: '6px 0 0', fontWeight: 500 }}>
            System Design Interview Prep
          </p>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        minWidth: 320,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f4ff', margin: 0 }}>
            Sign in to continue
          </p>
          <p style={{ fontSize: 12.5, color: '#3d4466', margin: '6px 0 0', lineHeight: 1.6 }}>
            Practice system design with AI coaching
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: loading ? 'rgba(255,255,255,0.04)' : '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: loading ? '#3d4466' : '#1a1a2e',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            justifyContent: 'center',
            transition: 'all 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Google G icon */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <p style={{ fontSize: 12, color: '#fca5a5', margin: 0, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>

      <p style={{ fontSize: 11.5, color: '#3d4466', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        By signing in you agree to use this tool for interview prep only.
        Powered by Groq + LLaMA 3.3 70B.
      </p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/LoginPage.jsx
git commit -m "feat: add Google sign-in landing page"
```

---

## Task 6: Update main.jsx — wrap with AuthProvider

**Files:**
- Modify: `frontend/src/main.jsx`

**Step 1: Edit the file**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './AuthContext'
import App from './App.jsx'
import 'reactflow/dist/style.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

**Step 2: Commit**

```bash
git add src/main.jsx
git commit -m "feat: wrap app in AuthProvider"
```

---

## Task 7: Update App.jsx — auth gate + token injection

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Edit the file**

Key changes:
- Import `useAuth` and `LoginPage`
- Show loading spinner while Firebase resolves auth state
- Show `LoginPage` if not signed in
- Create `getToken` callback for all child fetch calls
- Inject `Authorization` header into `handleGenerate`
- Pass `getToken` to `ChatPanel`

```jsx
import { useState, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import PromptBar from './components/PromptBar'
import DiagramPanel from './components/DiagramPanel'
import ChatPanel from './components/ChatPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'
const DEFAULT_CHAT_WIDTH = 340
const MIN_CHAT_WIDTH = 280
const MAX_CHAT_WIDTH = 600

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [design, setDesign] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const [selectedNode, setSelectedNode] = useState(null)

  // Resize logic
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_CHAT_WIDTH)

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      const newWidth = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, startWidth.current + delta))
      requestAnimationFrame(() => setChatWidth(newWidth))
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [chatWidth])

  const handleDragHandleDoubleClick = useCallback(() => {
    setChatWidth(DEFAULT_CHAT_WIDTH)
  }, [])

  // Returns a fresh Firebase ID token for every request
  const getToken = useCallback(async () => {
    if (!user) throw new Error('Not authenticated')
    return user.getIdToken()
  }, [user])

  const handleGenerate = async (prompt) => {
    setLoading(true)
    setError(null)
    setDesign(null)
    setSelectedNode(null)

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/generate-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to generate design')
      }

      const data = await res.json()
      setDesign(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Show blank screen while Firebase resolves session (< 1 second)
  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#00d4ff',
          boxShadow: '0 0 12px rgba(0,212,255,0.6)',
          animation: 'blink 0.9s ease-in-out infinite',
        }} />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f' }}>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: 48,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #0099cc, #00d4ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            boxShadow: '0 2px 12px rgba(0,212,255,0.35)',
          }}>
            ⬡
          </div>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#f0f4ff',
            letterSpacing: '-0.03em',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            DesignIQ
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

        {/* Subtitle */}
        <span style={{ fontSize: 12, color: '#3d4466', fontWeight: 500 }}>
          System Design Interview Prep
        </span>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {design && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'fadeIn 0.4s ease' }}>
              <span style={{
                fontSize: 11,
                color: '#00d4ff',
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.18)',
                borderRadius: 6,
                padding: '2px 9px',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {design.nodes.length} nodes
              </span>
              <span style={{
                fontSize: 11,
                color: '#8892b0',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '2px 9px',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {design.edges.length} connections
              </span>
            </div>
          )}

          {/* Signed-in user + sign out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="avatar"
                style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.2)' }}
              />
            )}
            <button
              onClick={signOut}
              style={{
                fontSize: 11,
                color: '#3d4466',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#8892b0'}
              onMouseLeave={e => e.currentTarget.style.color = '#3d4466'}
            >
              Sign out
            </button>
          </div>

          <a
            href="https://groq.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: '#3d4466',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#8892b0'}
            onMouseLeave={e => e.currentTarget.style.color = '#3d4466'}
          >
            Powered by Groq
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </a>
        </div>
      </header>

      {/* Prompt Bar */}
      <PromptBar onGenerate={handleGenerate} loading={loading} />

      {/* Error */}
      {error && (
        <div style={{
          margin: '0 16px',
          padding: '10px 16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
          color: '#fca5a5',
          fontSize: 13,
          flexShrink: 0,
          animation: 'fadeUp 0.3s ease',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <DiagramPanel
          design={design}
          loading={loading}
          selectedNode={selectedNode}
          onNodeClick={setSelectedNode}
          onPaneClick={() => setSelectedNode(null)}
        />

        {/* Drag handle */}
        <div
          className="drag-handle"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDragHandleDoubleClick}
          title="Drag to resize · Double-click to reset"
        >
          <div className="drag-handle-dots">
            <div className="drag-handle-dot" />
            <div className="drag-handle-dot" />
            <div className="drag-handle-dot" />
          </div>
        </div>

        <ChatPanel
          design={design}
          onDiagramUpdate={setDesign}
          width={chatWidth}
          getToken={getToken}
        />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add auth gate and token injection to all API calls"
```

---

## Task 8: Update ChatPanel.jsx — inject auth token into fetches

**Files:**
- Modify: `frontend/src/components/ChatPanel.jsx`

**Step 1: Accept getToken prop and update all 3 fetch calls**

Change the function signature at line 205:
```jsx
// OLD:
export default function ChatPanel({ design, onDiagramUpdate, width = 340 }) {

// NEW:
export default function ChatPanel({ design, onDiagramUpdate, width = 340, getToken }) {
```

Update the `send` function (around line 274) — add token to the two fetches:
```javascript
// In send(), replace the chatPromise and refinePromise lines:
const token = await getToken()

const chatPromise = fetch(`${API_URL}/${isDrill ? 'drill' : 'chat'}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: msg,
    diagram_context: formatDiagramContext(design),
    history: messages.slice(-10),
  }),
})

const refinePromise = !isDrill && updateDiagram
  ? fetch(`${API_URL}/refine-design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ current_design: design, modification: msg }),
    })
  : null
```

Update `startDrill` (around line 361) — add token:
```javascript
// In startDrill(), replace the fetch call:
const token = await getToken()
const res = await fetch(`${API_URL}/drill`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: '',
    diagram_context: formatDiagramContext(design),
    history: [],
  }),
})
```

Pass `getToken` to ConceptsPanel (around line 525):
```jsx
// OLD:
<ConceptsPanel
  design={design}
  openConcept={openConcept}
  onConceptHandled={() => setOpenConcept(null)}
/>

// NEW:
<ConceptsPanel
  design={design}
  openConcept={openConcept}
  onConceptHandled={() => setOpenConcept(null)}
  getToken={getToken}
/>
```

**Step 2: Commit**

```bash
git add src/components/ChatPanel.jsx
git commit -m "feat: add auth token to all ChatPanel API calls"
```

---

## Task 9: Update ConceptsPanel.jsx — inject auth token

**Files:**
- Modify: `frontend/src/components/ConceptsPanel.jsx`

**Step 1: Accept getToken prop and update fetch call**

Change the function signature at line 34:
```jsx
// OLD:
export default function ConceptsPanel({ design, openConcept, onConceptHandled }) {

// NEW:
export default function ConceptsPanel({ design, openConcept, onConceptHandled, getToken }) {
```

Update `fetchConcept` (around line 59) — add token:
```javascript
const fetchConcept = async (concept) => {
  setActiveConcept(concept)
  setContent('')
  setLoading(true)
  try {
    const token = await getToken()
    const res = await fetch(`${API_URL}/concept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        concept,
        diagram_context: formatDesignContext(design),
      }),
    })
    // ... rest unchanged
```

**Step 2: Commit**

```bash
git add src/components/ConceptsPanel.jsx
git commit -m "feat: add auth token to ConceptsPanel API calls"
```

---

## Task 10: Backend — Add firebase-admin dependency

**Files:**
- Modify: `backend/requirements.txt`

**Step 1: Edit requirements.txt**

```
fastapi
uvicorn
groq
python-dotenv
pydantic
firebase-admin
```

**Step 2: Install in venv**

```bash
cd backend
venv/bin/pip install firebase-admin
```

Expected output: Successfully installed firebase-admin and its dependencies (google-auth, cachecontrol, etc.)

**Step 3: Commit**

```bash
git add requirements.txt
git commit -m "feat: add firebase-admin dependency"
```

---

## Task 11: Backend — Add token verification to main.py

**Files:**
- Modify: `backend/main.py`

**Step 1: Add imports at the top (after existing imports)**

```python
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
```

**Step 2: Initialize Firebase Admin after `load_dotenv()`**

```python
load_dotenv()

# Initialize Firebase Admin SDK
_service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
if _service_account_json:
    _cred = credentials.Certificate(json.loads(_service_account_json))
    firebase_admin.initialize_app(_cred)

app = FastAPI()
```

**Step 3: Add the dependency function after the app/CORS setup**

```python
_security = HTTPBearer()

async def verify_token(
    creds: HTTPAuthorizationCredentials = Depends(_security),
) -> dict:
    try:
        return firebase_auth.verify_id_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
```

**Step 4: Add `_user: dict = Depends(verify_token)` to all 5 protected endpoints**

```python
@app.post("/generate-design")
async def generate_design(request: DesignRequest, _user: dict = Depends(verify_token)):
    ...

@app.post("/refine-design")
async def refine_design(request: RefineRequest, _user: dict = Depends(verify_token)):
    ...

@app.post("/chat")
async def chat(request: ChatRequest, _user: dict = Depends(verify_token)):
    ...

@app.post("/drill")
async def drill(request: DrillRequest, _user: dict = Depends(verify_token)):
    ...

@app.post("/concept")
async def concept(request: ConceptRequest, _user: dict = Depends(verify_token)):
    ...
```

`/health` remains public — no dependency added.

**Step 5: Commit**

```bash
git add main.py
git commit -m "feat: protect all API endpoints with Firebase token verification"
```

---

## Task 12: Set Up Backend .env

**Files:**
- Modify: `backend/.env` (gitignored — never commit)

**Step 1: Add FIREBASE_SERVICE_ACCOUNT_JSON**

Open the service account JSON file you downloaded from Firebase console. Convert it to a single-line string and add to `.env`:

```bash
# In backend/.env, add:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN RSA PRIVATE KEY-----\n...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

The easiest way: copy the file contents, replace all real newlines with `\n` in the private_key field, and paste as a single line. Or use this command:
```bash
python3 -c "import json; data=json.load(open('path/to/serviceAccountKey.json')); print(json.dumps(data))"
```
Then paste the output as the value.

**Step 2: Restart the backend and test**

```bash
venv/bin/uvicorn main:app --reload --port 8004
```

Test that unauthenticated requests are rejected:
```bash
curl -X POST http://localhost:8004/generate-design \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Design Twitter"}' \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: HTTP Status: 403 (HTTPBearer returns 403 when no token present)
```

---

## Task 13: Local End-to-End Test

**Step 1: Start both servers**

```bash
# Terminal 1 — backend
cd backend
venv/bin/uvicorn main:app --reload --port 8004

# Terminal 2 — frontend
cd frontend
npm run dev -- --port 5176
```

**Step 2: Verify the full flow**

1. Open http://localhost:5176
2. You should see the LoginPage (not the app)
3. Click "Sign in with Google" → a popup appears → sign in with any Google account
4. Popup closes → you're redirected to the full app automatically
5. Generate a design — verify it works (Groq API call goes through)
6. Open browser DevTools → Network tab → click on a `/generate-design` request → check headers → you should see `Authorization: Bearer eyJ...`
7. Chat and concepts should also work
8. Click "Sign out" → you're back on the login page

---

## Task 14: Deploy

### Vercel (frontend)

In Vercel dashboard for this project → Settings → Environment Variables, add:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_API_URL=https://your-render-backend-url.onrender.com
```

In Firebase console → Authentication → Settings → Authorized domains → add your Vercel domain (e.g. `design-iq.vercel.app`).

Redeploy frontend.

### Render (backend)

In Render dashboard → your backend service → Environment → add:
```
FIREBASE_SERVICE_ACCOUNT_JSON=<paste the JSON string>
GROQ_API_KEY=<your existing key>
```

Redeploy backend.

### Verify production

1. Visit your Vercel URL → see login page
2. Sign in with Google → see full app
3. Generate a design → works
4. Visit Google Analytics → Real-time → see yourself as an active user
