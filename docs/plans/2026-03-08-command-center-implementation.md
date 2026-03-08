# Command Center Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign DesignIQ's frontend with the "Command Center" aesthetic — JetBrains Mono + DM Sans fonts, cyan/teal accent replacing indigo-violet, resizable chat panel, hover tooltips on nodes, node click explanation pane, and polished chat with avatars/timestamps/typing indicator/scroll pill.

**Architecture:** All changes are purely frontend (React + Vite). No backend changes needed. State for chat panel width lives in App.jsx; node explanation pane state also lives in App.jsx and is passed down via props.

**Tech Stack:** React 18, Vite, React Flow 11, Lucide React, React Markdown, Tailwind CSS (minimal — mostly inline styles)

---

### Task 1: Update Design System (index.css)

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Replace CSS variables and font imports**

Replace the entire `index.css` with the following content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg:        #0a0a0f;
  --surface:   #0f0f1a;
  --surface-2: #161625;
  --surface-3: #1e1e32;
  --border:    rgba(255, 255, 255, 0.05);
  --border-2:  rgba(255, 255, 255, 0.10);
  --cyan:      #00d4ff;
  --cyan-dim:  rgba(0, 212, 255, 0.13);
  --amber:     #f59e0b;
  --red:       #ef4444;
  --green:     #22c55e;
  --text-1:    #f0f4ff;
  --text-2:    #8892b0;
  --text-3:    #3d4466;
}

html, body, #root {
  height: 100%;
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text-1);
  overflow: hidden;
}

/* ---------- Animations ---------- */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50%       { opacity: 1;   transform: scale(1.1); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@keyframes typing-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%           { transform: translateY(-4px); opacity: 1; }
}

@keyframes gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes placeholder-fade {
  0%, 100% { opacity: 0; transform: translateY(4px); }
  15%, 85% { opacity: 1; transform: translateY(0); }
}

/* ---------- React Flow overrides ---------- */
.react-flow__background {
  background: var(--bg);
}

.react-flow__controls {
  background: var(--surface);
  border: 1px solid var(--border-2);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

.react-flow__controls-button {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text-2);
  fill: var(--text-2);
  transition: all 0.15s;
}

.react-flow__controls-button:hover {
  background: var(--surface-2);
  fill: var(--text-1);
}

.react-flow__controls-button:last-child {
  border-bottom: none;
}

.react-flow__minimap {
  background: var(--surface);
  border: 1px solid var(--border-2);
  border-radius: 10px;
  overflow: hidden;
}

.react-flow__edge-path {
  stroke: rgba(0, 212, 255, 0.2);
  stroke-width: 1.5;
}

.react-flow__edge-textbg {
  fill: var(--surface);
}

.react-flow__edge-text {
  fill: var(--text-2);
  font-size: 10px;
}

.react-flow__attribution {
  opacity: 0.3;
}

/* ---------- Chat markdown ---------- */
.chat-md p { margin-bottom: 6px; }
.chat-md p:last-child { margin-bottom: 0; }
.chat-md ul, .chat-md ol { padding-left: 16px; margin: 4px 0 8px; }
.chat-md li { margin-bottom: 3px; line-height: 1.6; }
.chat-md strong { color: #c7eeff; font-weight: 600; }
.chat-md code {
  background: rgba(0, 212, 255, 0.1);
  color: #00d4ff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  font-family: 'JetBrains Mono', monospace;
}

/* ---------- Scrollbar ---------- */
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

/* ---------- Utilities ---------- */
.fade-up { animation: fadeUp 0.3s ease forwards; }
.fade-in { animation: fadeIn 0.4s ease forwards; }

.gradient-text {
  background: linear-gradient(135deg, #00d4ff, #0099ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.generate-btn {
  background: linear-gradient(135deg, #0099cc, #00d4ff);
  background-size: 200% 200%;
  transition: all 0.25s;
}

.generate-btn:hover:not(:disabled) {
  background-position: right center;
  box-shadow: 0 0 24px rgba(0, 212, 255, 0.4);
  transform: translateY(-1px);
}

.generate-btn:active:not(:disabled) {
  transform: translateY(0);
}

/* ---------- Drag handle ---------- */
.drag-handle {
  width: 8px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  position: relative;
}

.drag-handle:hover {
  background: rgba(0, 212, 255, 0.06);
}

.drag-handle-dots {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.drag-handle-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-3);
  transition: background 0.15s;
}

.drag-handle:hover .drag-handle-dot {
  background: var(--cyan);
}

/* ---------- Node tooltip ---------- */
.node-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-2);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
  width: 220px;
  z-index: 1000;
  pointer-events: none;
  animation: fadeUp 0.15s ease;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.1);
}

/* ---------- Node explanation pane ---------- */
.explanation-pane {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: var(--surface);
  border-top: 1px solid rgba(0, 212, 255, 0.15);
  z-index: 10;
  animation: slideUp 0.25s ease;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ---------- Scroll pill ---------- */
.scroll-pill {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-2);
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 11px;
  color: var(--cyan);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  animation: fadeUp 0.2s ease;
  z-index: 5;
  white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}

.scroll-pill:hover {
  background: rgba(0, 212, 255, 0.1);
}

/* ---------- Starter question cards ---------- */
.starter-card {
  background: var(--surface-2);
  border: 1px solid var(--border-2);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  text-align: left;
  transition: all 0.15s;
  width: 100%;
}

.starter-card:hover {
  background: var(--surface-3);
  border-color: rgba(0, 212, 255, 0.25);
  color: var(--cyan);
}

/* ---------- Typing indicator ---------- */
.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--cyan);
  animation: typing-bounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
```

**Step 2: Verify fonts load**

Run the dev server: `cd frontend && npm run dev -- --port 5176`

Open browser at `http://localhost:5176`. Confirm body text renders in DM Sans (smooth, rounded letters) and that the background is darker (`#0a0a0f`).

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: update design system to Command Center theme — cyan accent, DM Sans + JetBrains Mono"
```

---

### Task 2: Update App.jsx — Resizable Chat Panel + Explanation Pane State

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Replace App.jsx**

```jsx
import { useState, useRef, useCallback } from 'react'
import PromptBar from './components/PromptBar'
import DiagramPanel from './components/DiagramPanel'
import ChatPanel from './components/ChatPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'
const DEFAULT_CHAT_WIDTH = 340
const MIN_CHAT_WIDTH = 280
const MAX_CHAT_WIDTH = 600

export default function App() {
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
      const delta = startX.current - e.clientX // dragging left = bigger chat
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

  const handleGenerate = async (prompt) => {
    setLoading(true)
    setError(null)
    setDesign(null)
    setSelectedNode(null)

    try {
      const res = await fetch(`${API_URL}/generate-design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        />
      </div>
    </div>
  )
}
```

**Step 2: Verify resize works**

Open `http://localhost:5176`. Hover over the divider between canvas and chat — it should glow cyan. Drag left/right to resize. Double-click to reset to 340px.

**Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: resizable chat panel with drag handle, node explanation pane state"
```

---

### Task 3: Update PromptBar — Cycling Placeholder + Difficulty Badges

**Files:**
- Modify: `frontend/src/components/PromptBar.jsx`

**Step 1: Replace PromptBar.jsx**

```jsx
import { useState, useRef, useEffect } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  { label: "Instagram's like feature",   difficulty: 'beginner' },
  { label: "URL shortener like Bitly",   difficulty: 'beginner' },
  { label: "Twitter's news feed",        difficulty: 'advanced' },
  { label: "Uber's ride matching",       difficulty: 'advanced' },
  { label: "YouTube video upload",       difficulty: 'advanced' },
  { label: "Google search index",        difficulty: 'expert'   },
]

const PLACEHOLDERS = [
  "Design Instagram's like feature...",
  "Design a URL shortener like Bitly...",
  "Design Twitter's news feed...",
  "Design Uber's surge pricing system...",
  "Design a distributed cache...",
  "Design Google's search index...",
]

const DIFFICULTY_CONFIG = {
  beginner: { dot: '●', color: '#f59e0b', label: 'Beginner' },
  advanced: { dot: '◆', color: '#ef4444', label: 'Advanced' },
  expert:   { dot: '■', color: '#00d4ff', label: 'Expert'   },
}

export default function PromptBar({ onGenerate, loading }) {
  const [prompt, setPrompt] = useState('')
  const [focused, setFocused] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
        setPlaceholderVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (prompt.trim() && !loading) onGenerate(prompt.trim())
  }

  const handleSuggestion = (s) => {
    if (loading) return
    const full = `Design ${s.label}`
    setPrompt(full)
    onGenerate(full)
  }

  const activePlaceholder = prompt ? '' : PLACEHOLDERS[placeholderIdx]

  return (
    <div style={{
      padding: '12px 16px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(10,10,15,0.9)',
      flexShrink: 0,
    }}>
      {/* Input row */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 9 }}>
        <div style={{
          flex: 1,
          position: 'relative',
          borderRadius: 12,
          padding: 1,
          background: focused
            ? 'linear-gradient(135deg, rgba(0,153,204,0.6), rgba(0,212,255,0.5))'
            : 'rgba(255,255,255,0.06)',
          transition: 'background 0.2s',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0f0f1a',
            borderRadius: 11,
            paddingLeft: 14,
            gap: 10,
          }}>
            <Sparkles
              size={15}
              color={focused ? '#00d4ff' : '#3d4466'}
              style={{ flexShrink: 0, transition: 'color 0.2s' }}
            />
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={activePlaceholder}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f0f4ff',
                  fontSize: 13.5,
                  padding: '11px 0',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.01em',
                  transition: 'opacity 0.3s',
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          className="generate-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 18px',
            borderRadius: 12,
            border: 'none',
            color: 'white',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !prompt.trim() ? 0.45 : 1,
            whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: '-0.01em',
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Building...
            </>
          ) : (
            <>
              Generate
              <ArrowRight size={14} strokeWidth={2.5} />
            </>
          )}
        </button>
      </form>

      {/* Suggestion chips with difficulty badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#3d4466', marginRight: 2, flexShrink: 0 }}>Try:</span>
        {SUGGESTIONS.map((s) => {
          const diff = DIFFICULTY_CONFIG[s.difficulty]
          return (
            <button
              key={s.label}
              onClick={() => handleSuggestion(s)}
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20,
                padding: '3px 11px',
                fontSize: 11.5,
                color: '#8892b0',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.4 : 1,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)'
                  e.currentTarget.style.color = '#00d4ff'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = '#8892b0'
              }}
            >
              <span style={{ color: diff.color, fontSize: 9 }}>{diff.dot}</span>
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Verify**

Observe that:
- Placeholder cycles every 3 seconds through the 6 prompts
- Suggestion chips show colored dots before labels (amber for Beginner, red for Advanced, cyan for Expert)
- Hover color is cyan instead of indigo

**Step 3: Commit**

```bash
git add frontend/src/components/PromptBar.jsx
git commit -m "feat: cycling placeholder, difficulty badges on prompt bar suggestions"
```

---

### Task 4: Redesign CustomNode — Hover Tooltip + Click Handler

**Files:**
- Modify: `frontend/src/components/nodes/CustomNode.jsx`

**Step 1: Replace CustomNode.jsx**

```jsx
import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import {
  Monitor, GitMerge, Shuffle, Cpu, Database,
  Zap, List, Globe, HardDrive, Bell,
} from 'lucide-react'

const NODE_TYPES = {
  client:          { Icon: Monitor,    color: '#38bdf8', label: 'Client' },
  'api-gateway':   { Icon: GitMerge,  color: '#818cf8', label: 'API Gateway' },
  'load-balancer': { Icon: Shuffle,   color: '#fb923c', label: 'Load Balancer' },
  service:         { Icon: Cpu,       color: '#a78bfa', label: 'Service' },
  database:        { Icon: Database,  color: '#34d399', label: 'Database' },
  cache:           { Icon: Zap,       color: '#facc15', label: 'Cache' },
  queue:           { Icon: List,      color: '#f472b6', label: 'Queue' },
  cdn:             { Icon: Globe,     color: '#22d3ee', label: 'CDN' },
  storage:         { Icon: HardDrive, color: '#94a3b8', label: 'Storage' },
  notification:    { Icon: Bell,      color: '#f87171', label: 'Notification' },
}

const handleStyle = (color) => ({
  width: 8,
  height: 8,
  background: color,
  border: '2px solid #0a0a0f',
  borderRadius: '50%',
})

export default function CustomNode({ data, selected }) {
  const [hovered, setHovered] = useState(false)
  const config = NODE_TYPES[data.componentType] || NODE_TYPES.service
  const { Icon, color, label } = config

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover tooltip */}
      {hovered && (
        <div className="node-tooltip">
          <div style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 600, marginBottom: 4 }}>
            {data.label}
          </div>
          <div style={{ fontSize: 11, color: '#8892b0', lineHeight: 1.5 }}>
            {data.description}
          </div>
          <div style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            fontSize: 10.5,
            color: '#3d4466',
          }}>
            Click to see interview tips ↓
          </div>
        </div>
      )}

      <div
        style={{
          width: 200,
          background: 'rgba(15,15,26,0.97)',
          border: selected
            ? `1px solid ${color}66`
            : hovered
              ? '1px solid rgba(0,212,255,0.3)'
              : '1px solid rgba(255,255,255,0.07)',
          borderLeft: `3px solid ${color}`,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: selected
            ? `0 0 0 1px ${color}33, 0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${color}18`
            : hovered
              ? '0 4px 24px rgba(0,0,0,0.5), 0 0 16px rgba(0,212,255,0.08)'
              : '0 4px 24px rgba(0,0,0,0.4)',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Handle type="target" position={Position.Left} style={handleStyle(color)} />

        <div style={{ padding: '10px 12px' }}>
          {/* Top row: icon badge left, type label right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              background: `${color}14`,
              border: `1px solid ${color}28`,
              borderRadius: 7,
            }}>
              <Icon size={12} color={color} strokeWidth={2.5} />
            </div>
            <span style={{
              color: '#3d4466',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {label}
            </span>
          </div>

          {/* Label */}
          <div style={{
            color: '#f0f4ff',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 5,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}>
            {data.label}
          </div>

          {/* Description */}
          <div style={{
            color: '#3d4466',
            fontSize: 10.5,
            lineHeight: 1.5,
          }}>
            {data.description}
          </div>
        </div>

        <Handle type="source" position={Position.Right} style={handleStyle(color)} />
      </div>
    </div>
  )
}
```

**Step 2: Verify**

Hover a node — tooltip card appears above with the component label, description, and "Click to see interview tips" hint. Node border glows cyan on hover. Selected node uses component color border.

**Step 3: Commit**

```bash
git add frontend/src/components/nodes/CustomNode.jsx
git commit -m "feat: redesign nodes with left color border, hover tooltip, click affordance"
```

---

### Task 5: Update DiagramPanel — Pass onClick + Node Explanation Pane

**Files:**
- Modify: `frontend/src/components/DiagramPanel.jsx`

**Step 1: Read the current file first, then add `onNodeClick` and `onPaneClick` props**

The key changes:
1. Accept `onNodeClick` and `onPaneClick` and `selectedNode` as props
2. Wire `onNodeClick` to React Flow's `onNodeClick` event
3. Wire `onPaneClick` to React Flow's `onPaneClick` event
4. Add a `NodeExplanationPane` component that renders at the bottom of the diagram when `selectedNode` is set

```jsx
// Add at top of DiagramPanel.jsx, after imports:
function NodeExplanationPane({ node, onClose }) {
  if (!node) return null

  const NODE_INTERVIEW_TIPS = {
    client:          'Discuss user-facing clients: web, mobile, desktop. Talk about latency sensitivity and client-side caching.',
    'api-gateway':   'API Gateway centralizes auth, rate limiting, routing. Good point to discuss token validation and DDoS protection.',
    'load-balancer': 'Explain round-robin vs least-connections. Discuss session affinity (sticky sessions) and health checks.',
    service:         'Discuss horizontal scaling, statelessness, and service discovery. Great place to mention 12-factor app principles.',
    database:        'Cover CAP theorem, ACID vs BASE, read replicas, and sharding strategies. Interviewers love schema discussion.',
    cache:           'Explain cache-aside vs write-through vs write-back. Discuss eviction policies (LRU) and cache stampede.',
    queue:           'Talk about async decoupling, fan-out patterns, at-least-once delivery, and idempotency requirements.',
    cdn:             'Discuss cache invalidation, edge locations, and which assets to serve from CDN vs origin.',
    storage:         'Blob vs object storage. Discuss S3 consistency model, lifecycle policies, and pre-signed URLs.',
    notification:    'Cover push vs pull, WebSockets vs SSE vs long polling, and fan-out at scale.',
  }

  const tip = NODE_INTERVIEW_TIPS[node.data.componentType] || 'Discuss this component\'s role, scaling properties, and failure modes.'

  return (
    <div className="explanation-pane">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#00d4ff',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            Interview Tips — {node.data.componentType}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f4ff', marginBottom: 8 }}>
            {node.data.label}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            color: '#8892b0',
            cursor: 'pointer',
            padding: '3px 8px',
            fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: '#8892b0', lineHeight: 1.65, flex: 1, overflowY: 'auto' }}>
        {tip}
      </div>
      <div style={{
        fontSize: 11,
        color: '#3d4466',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: 8,
      }}>
        💡 Ask your AI Coach about this component for a deeper explanation
      </div>
    </div>
  )
}
```

Then update the DiagramPanel function signature to accept `onNodeClick`, `onPaneClick`, `selectedNode` props, and pass them to ReactFlow:

```jsx
// In the ReactFlow component props:
onNodeClick={(_, node) => onNodeClick(node)}
onPaneClick={onPaneClick}
```

And add `<NodeExplanationPane>` at the bottom of the wrapper div (it's absolutely positioned via CSS):

```jsx
<NodeExplanationPane node={selectedNode} onClose={() => onNodeClick(null)} />
```

**Step 2: Verify**

Click a node — bottom pane slides up with the node name and interview tips. Click ✕ or the canvas background to dismiss.

**Step 3: Commit**

```bash
git add frontend/src/components/DiagramPanel.jsx
git commit -m "feat: node click explanation pane with interview tips"
```

---

### Task 6: Redesign ChatPanel — Avatars, Timestamps, Typing Indicator, Scroll Pill, Starter Cards

**Files:**
- Modify: `frontend/src/components/ChatPanel.jsx`

**Step 1: Replace ChatPanel.jsx**

Key changes:
1. Accept `width` prop and apply to wrapper div
2. Add `timestamp` to each message when created (`new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})`)
3. Replace `Avatar` component — show "AI" or "YL" initials in small circle
4. Add `TypingIndicator` component (3 dots with `typing-dot` CSS class)
5. Track scroll position with `useRef` + scroll listener — show scroll pill when user is >100px from bottom
6. Replace starter question chips with `.starter-card` button elements
7. Use `width` prop on wrapper div (replace hardcoded `width: 340`)
8. Update all colors: indigo → cyan

```jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { SendHorizonal } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'

const STARTER_QUESTIONS = [
  { q: 'Why is caching used here?',              icon: '⚡' },
  { q: 'How does this scale to millions?',        icon: '📈' },
  { q: 'What are the main trade-offs?',           icon: '⚖️' },
  { q: 'What would interviewers look for?',       icon: '🎯' },
]

function formatDiagramContext(design) {
  if (!design) return 'No design generated yet.'
  return `System: ${design.title}
Overview: ${design.description}

Components:
${design.nodes.map((n) => `- ${n.label} (${n.type}): ${n.description}`).join('\n')}

Connections:
${design.edges.map((e) => {
  const src = design.nodes.find((n) => n.id === e.source)?.label || e.source
  const tgt = design.nodes.find((n) => n.id === e.target)?.label || e.target
  return `- ${src} → ${tgt}${e.label ? ` [${e.label}]` : ''}`
}).join('\n')}`
}

function Avatar({ role }) {
  const isUser = role === 'user'
  return (
    <div style={{
      width: 26,
      height: 26,
      borderRadius: 8,
      background: isUser
        ? 'linear-gradient(135deg, #0099cc, #00d4ff)'
        : 'linear-gradient(135deg, #1e1e32, #2a2a45)',
      border: isUser ? 'none' : '1px solid rgba(0,212,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      alignSelf: 'flex-start',
      marginTop: 1,
      boxShadow: isUser ? '0 2px 10px rgba(0,212,255,0.25)' : 'none',
    }}>
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        color: isUser ? 'white' : '#00d4ff',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.03em',
      }}>
        {isUser ? 'YL' : 'AI'}
      </span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}>
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  )
}

function Message({ msg, isLast, streaming }) {
  const isUser = msg.role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 4,
      animation: 'fadeUp 0.25s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 8, width: '100%' }}>
        {!isUser && <Avatar role="assistant" />}
        <div style={{
          maxWidth: '82%',
          ...(isUser ? {
            background: 'linear-gradient(135deg, #005f80, #0099cc)',
            borderRadius: '14px 14px 4px 14px',
            padding: '9px 14px',
            color: 'rgba(255,255,255,0.93)',
            fontSize: 13,
            lineHeight: 1.6,
            boxShadow: '0 4px 16px rgba(0,153,204,0.2)',
          } : {
            background: '#0f0f1a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderLeft: '2px solid rgba(0,212,255,0.4)',
            borderRadius: '4px 14px 14px 14px',
            padding: '9px 14px',
            color: '#b4c4d8',
            fontSize: 13,
            lineHeight: 1.6,
          }),
        }}>
          {isUser ? (
            msg.content
          ) : (
            <div className="chat-md">
              {msg.content ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <TypingIndicator />
              )}
              {streaming && isLast && msg.content && (
                <span style={{
                  display: 'inline-block',
                  width: 2,
                  height: 13,
                  background: '#00d4ff',
                  marginLeft: 2,
                  borderRadius: 1,
                  verticalAlign: 'middle',
                  animation: 'blink 0.9s ease-in-out infinite',
                }} />
              )}
            </div>
          )}
        </div>
        {isUser && <Avatar role="user" />}
      </div>

      {/* Timestamp */}
      {msg.timestamp && (
        <div style={{
          fontSize: 10,
          color: '#3d4466',
          marginLeft: isUser ? 0 : 34,
          marginRight: isUser ? 34 : 0,
        }}>
          {msg.timestamp}
        </div>
      )}

      {msg.diagramUpdated && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginLeft: 34,
          padding: '3px 10px',
          background: 'rgba(0,212,255,0.07)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 20,
          fontSize: 11,
          color: '#00d4ff',
          animation: 'fadeUp 0.3s ease',
        }}>
          ↗ Diagram updated
        </div>
      )}
    </div>
  )
}

function wantsDiagramUpdate(message) {
  const lower = message.toLowerCase()
  return (
    lower.includes('draw') ||
    lower.includes('diagram') ||
    lower.includes('update the design') ||
    lower.includes('show me the design') ||
    lower.includes('redesign') ||
    lower.includes('add to the diagram') ||
    lower.includes('modify the diagram') ||
    lower.includes('change the diagram')
  )
}

function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPanel({ design, onDiagramUpdate, width = 340 }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showScrollPill, setShowScrollPill] = useState(false)
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (design && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `I've analyzed the **${design.title}** design. Ask me anything — why certain components were chosen, how it scales, what trade-offs exist, or how to explain this in an interview.`,
        timestamp: getTimestamp(),
      }])
    }
  }, [design])

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
    setShowScrollPill(false)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollPill(distFromBottom > 100)
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!showScrollPill) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || streaming || !design) return

    setInput('')
    const ts = getTimestamp()
    setMessages((prev) => [...prev, { role: 'user', content: msg, timestamp: ts }])
    setStreaming(true)

    const updateDiagram = wantsDiagramUpdate(msg)

    try {
      const chatPromise = fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          diagram_context: formatDiagramContext(design),
          history: messages.slice(-10),
        }),
      })

      const refinePromise = updateDiagram
        ? fetch(`${API_URL}/refine-design`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_design: design, modification: msg }),
          })
        : null

      const res = await chatPromise
      if (!res.ok) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiText = ''

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '',
        diagramUpdated: false,
        timestamp: getTimestamp(),
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        aiText += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: aiText,
          }
          return updated
        })
      }

      if (refinePromise) {
        try {
          const refineRes = await refinePromise
          if (refineRes.ok) {
            const updatedDesign = await refineRes.json()
            onDiagramUpdate(updatedDesign)
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = { ...updated[updated.length - 1], diagramUpdated: true }
              return updated
            })
          }
        } catch {
          // silent fail
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: getTimestamp() },
      ])
    } finally {
      setStreaming(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{
      width,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0f',
      position: 'relative',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: design ? '#22c55e' : '#3d4466',
          boxShadow: design ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
          transition: 'all 0.3s',
        }} />
        <span style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: '#f0f4ff',
          letterSpacing: '-0.01em',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          AI Coach
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 10,
          color: '#3d4466',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          LLaMA 3.3 70B
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {!design ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            textAlign: 'center',
            padding: '0 20px',
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'rgba(0,212,255,0.07)',
              border: '1px solid rgba(0,212,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              🧠
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f4ff', marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>
                AI Coach
              </p>
              <p style={{ fontSize: 12.5, color: '#3d4466', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                Generate a design to start discussing it. Ask about trade-offs, scalability, and interview strategies.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <Message
              key={i}
              msg={msg}
              isLast={i === messages.length - 1}
              streaming={streaming}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll pill */}
      {showScrollPill && (
        <button className="scroll-pill" onClick={() => scrollToBottom(true)}>
          ↓ New message
        </button>
      )}

      {/* Starter question cards */}
      {design && messages.length <= 1 && !streaming && (
        <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STARTER_QUESTIONS.map(({ q, icon }) => (
            <button
              key={q}
              className="starter-card"
              onClick={() => send(q)}
            >
              <span style={{ marginRight: 8 }}>{icon}</span>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: '#0f0f1a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '8px 8px 8px 14px',
            transition: 'border-color 0.2s',
          }}
          onFocusCapture={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'}
          onBlurCapture={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={!design || streaming}
            placeholder={design ? 'Ask about this design...' : 'Generate a design first...'}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f0f4ff',
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              resize: 'none',
              maxHeight: 90,
              overflowY: 'auto',
              lineHeight: 1.5,
              letterSpacing: '-0.01em',
            }}
          />
          <button
            onClick={() => send()}
            disabled={!design || !input.trim() || streaming}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: 'none',
              background: input.trim() && design && !streaming
                ? 'linear-gradient(135deg, #0099cc, #00d4ff)'
                : 'rgba(255,255,255,0.05)',
              color: 'white',
              cursor: input.trim() && design && !streaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              alignSelf: 'flex-end',
              transition: 'all 0.2s',
              boxShadow: input.trim() && design && !streaming
                ? '0 2px 12px rgba(0,212,255,0.25)'
                : 'none',
            }}
          >
            <SendHorizonal size={14} />
          </button>
        </div>
        <p style={{
          fontSize: 10.5,
          color: '#3d4466',
          textAlign: 'center',
          marginTop: 7,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Verify**

- Chat panel respects the `width` prop from App.jsx (resizes when dragged)
- AI messages have "AI" initials, user messages have "YL" initials
- Timestamps appear below each message
- Typing indicator (3 animated dots) shows while AI content is empty/streaming
- Scroll pill "↓ New message" appears when scrolled up >100px
- Starter questions render as full-width tappable cards

**Step 3: Commit**

```bash
git add frontend/src/components/ChatPanel.jsx
git commit -m "feat: chat panel redesign — avatars, timestamps, typing indicator, scroll pill, starter cards"
```

---

### Task 7: Read and Update DiagramPanel.jsx (full file)

**Files:**
- Modify: `frontend/src/components/DiagramPanel.jsx`

**Step 1: Read the file first**

Read `frontend/src/components/DiagramPanel.jsx` to understand the current structure.

**Step 2: Apply changes**

1. Add `NodeExplanationPane` component (from Task 5 spec above) before the `DiagramPanel` function
2. Update `DiagramPanel` function signature: add `onNodeClick`, `onPaneClick`, `selectedNode` props
3. Pass `onNodeClick={(_, node) => onNodeClick(node)}` and `onPaneClick={onPaneClick}` to the `<ReactFlow>` component
4. Update wrapper div to `position: 'relative'` to contain the absolutely positioned explanation pane
5. Add `<NodeExplanationPane node={selectedNode} onClose={() => onNodeClick(null)} />` inside the wrapper div
6. Update all color references: replace `#6366f1`/`#818cf8`/`rgba(99,102,241` → cyan equivalents (`#00d4ff`, `rgba(0,212,255`)

**Step 3: Verify**

- Clicking a node shows the explanation pane at the bottom of the canvas
- Clicking ✕ or the canvas background dismisses it
- The loading/empty states still render correctly

**Step 4: Commit**

```bash
git add frontend/src/components/DiagramPanel.jsx
git commit -m "feat: wire node click to explanation pane in DiagramPanel"
```

---

## Final Verification Checklist

Run `cd frontend && npm run dev -- --port 5176` and verify:

- [ ] Background is `#0a0a0f` (darker than before)
- [ ] Font is DM Sans (body), JetBrains Mono (logo, badges, code)
- [ ] Header logo has cyan glow instead of purple
- [ ] Prompt bar input has cyan focus border
- [ ] Placeholder cycles every 3s through 6 example prompts
- [ ] Suggestion chips show colored difficulty dots (amber/red/cyan)
- [ ] Drag handle appears between canvas and chat — 3 stacked dots visible
- [ ] Drag handle glows cyan on hover, cursor changes to `col-resize`
- [ ] Dragging resizes chat panel (min 280px, max 600px)
- [ ] Double-clicking drag handle resets to 340px
- [ ] Node hover shows tooltip card above node
- [ ] Node click shows bottom explanation pane with interview tips
- [ ] ✕ button on explanation pane dismisses it
- [ ] Chat panel width responds to drag
- [ ] Chat messages show avatar initials (AI / YL)
- [ ] Timestamps appear below messages
- [ ] Typing indicator shows while AI is generating (empty content bubble)
- [ ] Streaming cursor (blinking `▋`) shows while text is streaming
- [ ] Scroll pill "↓ New message" appears when scrolled up, clicking scrolls to bottom
- [ ] Starter questions render as full-width cards (not tiny chips)
- [ ] "↗ Diagram updated" badge is cyan (not green)
- [ ] React Flow edges are cyan-tinted (not white)
