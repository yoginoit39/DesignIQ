# Drill Mode + Concepts Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add on-demand Socratic drill mode and an AI-generated concepts panel to DesignIQ's chat panel.

**Architecture:** Two new FastAPI streaming endpoints (`/drill`, `/concept`) + frontend tab switcher in ChatPanel (Chat | Concepts) + drill mode toggle + concept chip rendering in chat messages.

**Tech Stack:** FastAPI + Groq streaming (backend) · React 18 + Vite (frontend) · All inline styles, no new dependencies.

---

### Task 1: Backend — Add `/drill` endpoint

**Files:**
- Modify: `backend/main.py`

**Step 1: Add DRILL_SYSTEM_PROMPT and DrillRequest model**

Add after `CHAT_SYSTEM_PROMPT` (around line 108):

```python
DRILL_SYSTEM_PROMPT = """You are a senior staff engineer at a top tech company conducting a live system design interview. The candidate has generated a design and you are drilling them on their choices.

Rules:
- Ask ONE specific, pointed question per turn about a concrete component in the design
- Focus on: WHY they chose it, HOW they'd configure it, WHAT trade-offs they considered
- If the answer is surface-level, push back directly: "Okay, but what eviction policy, and why? What happens on a cache miss under high load?"
- If the answer shows genuine depth, acknowledge briefly then advance: "Good. Now let's talk about [next component] — ..."
- Never give away the answer — only probe and guide
- Be direct but encouraging — senior mentor, not a judge
- For the first message (empty), pick the most architecturally interesting component and open with a tough question about it

Current system design being drilled:
{diagram_context}
"""


class DrillRequest(BaseModel):
    message: str
    diagram_context: str
    history: list
    drill_context: str = ""
```

**Step 2: Add /drill endpoint**

Add after the `/chat` endpoint:

```python
@app.post("/drill")
async def drill(request: DrillRequest):
    system_prompt = DRILL_SYSTEM_PROMPT.format(
        diagram_context=request.diagram_context
    )

    messages = [{"role": "system", "content": system_prompt}]

    for msg in request.history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    if request.message:
        messages.append({"role": "user", "content": request.message})

    def stream():
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.6,
            max_tokens=600,
            stream=True,
        )
        for chunk in completion:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    return StreamingResponse(
        stream(),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},
    )
```

**Step 3: Verify**

With backend running (`venv/bin/uvicorn main:app --reload --port 8004`), test:

```bash
curl -X POST http://localhost:8004/drill \
  -H "Content-Type: application/json" \
  -d '{"message":"","diagram_context":"Uber ride matching with load balancer, API gateway, ride matching service, database, cache","history":[],"drill_context":""}' \
  --no-buffer
```

Expected: AI streams a tough opening question about one of the components.

---

### Task 2: Backend — Add `/concept` endpoint

**Files:**
- Modify: `backend/main.py`

**Step 1: Add CONCEPT_SYSTEM_PROMPT and ConceptRequest model**

Add after the DrillRequest model:

```python
CONCEPT_SYSTEM_PROMPT = """You are a system design interview coach explaining a technical concept concisely.

Explain "{concept}" in exactly these 3 sections with these exact headers:

## What it is
Clear definition with one concrete example. 2-3 sentences max.

## When to use it
Trade-offs, alternatives, and decision signals. What tells you to reach for this? What are the downsides? 3-4 sentences.

## How to talk about it in an interview
What to say, what depth to show, what FAANG interviewers look for. Include one sample phrase a candidate could use. 3-4 sentences.

{context_section}
No fluff. Candidates are in interview prep mode."""


class ConceptRequest(BaseModel):
    concept: str
    diagram_context: str = ""
```

**Step 2: Add /concept endpoint**

Add after the `/drill` endpoint:

```python
@app.post("/concept")
async def concept(request: ConceptRequest):
    context_section = ""
    if request.diagram_context:
        context_section = f"\nContext: Relate this concept to the candidate's current design where relevant: {request.diagram_context}"

    system_prompt = CONCEPT_SYSTEM_PROMPT.format(
        concept=request.concept,
        context_section=context_section,
    )

    def stream():
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Explain: {request.concept}"},
            ],
            temperature=0.4,
            max_tokens=500,
            stream=True,
        )
        for chunk in completion:
            token = chunk.choices[0].delta.content
            if token:
                yield token

    return StreamingResponse(
        stream(),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},
    )
```

**Step 3: Verify**

```bash
curl -X POST http://localhost:8004/concept \
  -H "Content-Type: application/json" \
  -d '{"concept":"CAP theorem","diagram_context":""}' \
  --no-buffer
```

Expected: AI streams a 3-section explanation with headers `## What it is`, `## When to use it`, `## How to talk about it in an interview`.

---

### Task 3: Backend — Update CHAT_SYSTEM_PROMPT to emit `[[concept]]` chips

**Files:**
- Modify: `backend/main.py`

**Step 1: Add concept chip instruction to CHAT_SYSTEM_PROMPT**

Find the existing `CHAT_SYSTEM_PROMPT` and add this at the end (before the closing `"""`):

```python
# Find this line:
Be encouraging, educational, and conversational. Keep answers focused — 3-5 paragraphs max.
Use bullet points for lists. Use technical terms but explain them clearly.

IMPORTANT: NEVER draw ASCII diagrams, text-based diagrams, box-and-arrow art, or any text representation of a diagram. If the user asks to "draw" or "update" or "modify" the diagram, the visual diagram on the left canvas is already being updated automatically — just acknowledge that and describe the changes conversationally in plain text.

# Replace with:
Be encouraging, educational, and conversational. Keep answers focused — 3-5 paragraphs max.
Use bullet points for lists. Use technical terms but explain them clearly.

IMPORTANT: NEVER draw ASCII diagrams, text-based diagrams, box-and-arrow art, or any text representation of a diagram. If the user asks to "draw" or "update" or "modify" the diagram, the visual diagram on the left canvas is already being updated automatically — just acknowledge that and describe the changes conversationally in plain text.

CONCEPT CHIPS: When you mention a system design concept that a candidate should study deeply (e.g., CAP theorem, cache-aside, sharding, eventual consistency, idempotency), wrap it in double brackets like [[CAP theorem]] or [[cache-aside pattern]]. Only wrap the first mention per concept per response. This renders as a clickable learning chip in the UI.
```

**Step 2: Verify**

Ask the AI Coach a question and check that its response contains `[[...]]` around at least one concept. You can test via curl if desired or just test in the UI once the frontend chips are wired up.

---

### Task 4: Frontend — Add `.concept-chip` CSS to `index.css`

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Append concept chip styles**

Add at the end of `frontend/src/index.css`:

```css
/* ---------- Concept chips (inline in chat) ---------- */
.concept-chip {
  display: inline;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 11.5px;
  color: #00d4ff;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  margin: 0 2px;
  line-height: 1.6;
  transition: background 0.15s;
  vertical-align: baseline;
}

.concept-chip:hover {
  background: rgba(0, 212, 255, 0.2);
}
```

**Step 2: Verify**

No visual check yet — this will be used when chips render in Task 6.

---

### Task 5: Frontend — Create `ConceptsPanel.jsx`

**Files:**
- Create: `frontend/src/components/ConceptsPanel.jsx`

**Step 1: Create the file with this complete content**

```jsx
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'

const CONCEPTS = [
  {
    category: 'Consistency & Availability',
    topics: ['CAP theorem', 'Eventual consistency', 'Strong consistency', 'Quorum reads/writes'],
  },
  {
    category: 'Storage',
    topics: ['Sharding', 'Replication', 'Indexing', 'ACID vs BASE', 'SQL vs NoSQL'],
  },
  {
    category: 'Caching',
    topics: ['Cache-aside', 'Write-through', 'Write-back', 'LRU/LFU eviction', 'Cache stampede'],
  },
  {
    category: 'Scalability',
    topics: ['Horizontal vs vertical scaling', 'Load balancing', 'Rate limiting', 'Backpressure'],
  },
  {
    category: 'Async & Messaging',
    topics: ['Message queues', 'Fan-out pattern', 'Idempotency', 'At-least-once delivery'],
  },
]

function formatDesignContext(design) {
  if (!design) return ''
  return `Current design: ${design.title} — ${design.description}`
}

export default function ConceptsPanel({ design, openConcept, onConceptHandled }) {
  const [search, setSearch] = useState('')
  const [activeConcept, setActiveConcept] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Auto-open a concept when triggered from chat chip click
  useEffect(() => {
    if (openConcept) {
      fetchConcept(openConcept)
      onConceptHandled?.()
    }
  }, [openConcept])

  useEffect(() => {
    if (!loading) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [content])

  const fetchConcept = async (concept) => {
    setActiveConcept(concept)
    setContent('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/concept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          diagram_context: formatDesignContext(design),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setContent(text)
      }
    } catch {
      setContent('Failed to load concept. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredConcepts = search
    ? CONCEPTS.map(cat => ({
        ...cat,
        topics: cat.topics.filter(t => t.toLowerCase().includes(search.toLowerCase())),
      })).filter(cat => cat.topics.length > 0)
    : CONCEPTS

  if (activeConcept) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Detail header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={() => { setActiveConcept(null); setContent('') }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3d4466',
              cursor: 'pointer',
              fontSize: 12,
              padding: '2px 4px',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#8892b0'}
            onMouseLeave={e => e.currentTarget.style.color = '#3d4466'}
          >
            ← Back
          </button>
          <span style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: '#f0f4ff',
            fontFamily: "'DM Sans', sans-serif",
            flex: 1,
          }}>
            {activeConcept}
          </span>
          {loading && (
            <span style={{
              fontSize: 10,
              color: '#3d4466',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              generating...
            </span>
          )}
        </div>

        {/* Detail content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
        }}>
          <div className="chat-md" style={{ fontSize: 12.5, color: '#b4c4d8', lineHeight: 1.75 }}>
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div style={{ color: '#3d4466', fontSize: 12 }}>Loading...</div>
            )}
            {loading && content && (
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
          <div ref={bottomRef} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search any concept..."
        style={{
          width: '100%',
          background: '#0f0f1a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: '8px 12px',
          color: '#f0f4ff',
          fontSize: 12.5,
          outline: 'none',
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 14,
          boxSizing: 'border-box',
          display: 'block',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.3)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
      />

      {/* Free-form search fallback */}
      {search && filteredConcepts.length === 0 && (
        <button
          onClick={() => fetchConcept(search)}
          className="starter-card"
          style={{ marginBottom: 12 }}
        >
          🔍 Explain "{search}"
        </button>
      )}

      {/* Category sections */}
      {filteredConcepts.map(({ category, topics }) => (
        <div key={category} style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#3d4466',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 8,
          }}>
            {category}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => fetchConcept(topic)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: '3px 11px',
                  fontSize: 11.5,
                  color: '#8892b0',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)'
                  e.currentTarget.style.color = '#00d4ff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = '#8892b0'
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Verify**

The component exists at `frontend/src/components/ConceptsPanel.jsx`. It won't render yet — wired in Task 6.

---

### Task 6: Frontend — Update ChatPanel: tab bar + Concepts tab + concept chip handler

**Files:**
- Modify: `frontend/src/components/ChatPanel.jsx`

**Step 1: Add new imports at the top**

Replace:
```jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { SendHorizonal } from 'lucide-react'
```

With:
```jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { SendHorizonal } from 'lucide-react'
import ConceptsPanel from './ConceptsPanel'
```

**Step 2: Add `renderWithConceptChips` helper function**

Add this function after `getTimestamp()` and before the `ChatPanel` export:

```jsx
function renderWithConceptChips(content, onConceptClick) {
  // Split on [[concept name]] patterns — only complete patterns are matched
  const parts = content.split(/(\[\[[^\]]+\]\])/)
  return parts.map((part, i) => {
    const match = part.match(/^\[\[([^\]]+)\]\]$/)
    if (match) {
      return (
        <button key={i} className="concept-chip" onClick={() => onConceptClick(match[1])}>
          {match[1]}
        </button>
      )
    }
    return part ? <ReactMarkdown key={i}>{part}</ReactMarkdown> : null
  })
}
```

**Step 3: Update `Message` component to accept and use `onConceptClick`**

Replace the Message function signature:
```jsx
function Message({ msg, isLast, streaming }) {
```
With:
```jsx
function Message({ msg, isLast, streaming, onConceptClick }) {
```

Replace the AI message content rendering block (inside the `.chat-md` div):
```jsx
{msg.content ? (
  <ReactMarkdown>{msg.content}</ReactMarkdown>
) : (
  <TypingIndicator />
)}
```
With:
```jsx
{msg.content ? (
  renderWithConceptChips(msg.content, onConceptClick)
) : (
  <TypingIndicator />
)}
```

**Step 4: Add tab + concept state to ChatPanel**

Inside `ChatPanel`, after the existing state declarations (`messages`, `input`, etc.), add:

```jsx
const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'concepts'
const [openConcept, setOpenConcept] = useState(null)
```

Add a handler:
```jsx
const handleConceptChipClick = useCallback((concept) => {
  setOpenConcept(concept)
  setActiveTab('concepts')
}, [])
```

**Step 5: Update the panel header to include tab bar**

Replace the existing panel header `<div>`:
```jsx
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
    width: 7, height: 7, borderRadius: '50%',
    background: design ? '#22c55e' : '#3d4466',
    boxShadow: design ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
    transition: 'all 0.3s',
  }} />
  <span style={{
    fontSize: 12.5, fontWeight: 600, color: '#f0f4ff',
    letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif",
  }}>
    AI Coach
  </span>
  <span style={{
    marginLeft: 'auto', fontSize: 10, color: '#3d4466',
    fontFamily: "'JetBrains Mono', monospace",
  }}>
    LLaMA 3.3 70B
  </span>
</div>
```

With:
```jsx
{/* Panel header */}
<div style={{
  padding: '10px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
}}>
  <div style={{
    width: 7, height: 7, borderRadius: '50%',
    background: design ? '#22c55e' : '#3d4466',
    boxShadow: design ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
    transition: 'all 0.3s', flexShrink: 0,
  }} />

  {/* Tab switcher */}
  <div style={{
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  }}>
    {[
      { id: 'chat', label: '💬 Chat' },
      { id: 'concepts', label: '📚 Concepts' },
    ].map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        style={{
          background: activeTab === tab.id ? 'rgba(0,212,255,0.12)' : 'transparent',
          border: activeTab === tab.id ? '1px solid rgba(0,212,255,0.25)' : '1px solid transparent',
          borderRadius: 6,
          padding: '3px 10px',
          fontSize: 11,
          color: activeTab === tab.id ? '#00d4ff' : '#3d4466',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          transition: 'all 0.15s',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>

  <span style={{
    marginLeft: 'auto', fontSize: 10, color: '#3d4466',
    fontFamily: "'JetBrains Mono', monospace",
  }}>
    LLaMA 3.3 70B
  </span>
</div>
```

**Step 6: Add the ConceptsPanel below the header, conditionally rendered**

Find the Messages `<div ref={scrollRef}>` block. Wrap it — and all the content below the header — so that the Concepts panel replaces it when `activeTab === 'concepts'`.

After the closing `</div>` of the header, add:

```jsx
{/* Concepts tab */}
{activeTab === 'concepts' && (
  <ConceptsPanel
    design={design}
    openConcept={openConcept}
    onConceptHandled={() => setOpenConcept(null)}
  />
)}

{/* Chat tab */}
{activeTab === 'chat' && (
  <>
    {/* ... existing messages div, scroll pill, starter cards, input area ... */}
  </>
)}
```

Wrap all existing content after the header (the messages div, scroll pill, starter cards, and input area) inside the `activeTab === 'chat'` fragment.

**Step 7: Pass `onConceptClick` to Message components**

Find where Message is rendered:
```jsx
<Message
  key={i}
  msg={msg}
  isLast={i === messages.length - 1}
  streaming={streaming}
/>
```

Replace with:
```jsx
<Message
  key={i}
  msg={msg}
  isLast={i === messages.length - 1}
  streaming={streaming}
  onConceptClick={handleConceptChipClick}
/>
```

**Step 8: Verify**

Open the app. The chat panel header should show "💬 Chat | 📚 Concepts" tab switcher. Clicking "📚 Concepts" shows the concepts panel with 5 category sections and a search box. Clicking a concept chip loads an AI explanation.

---

### Task 7: Frontend — Add Drill Mode to ChatPanel

**Files:**
- Modify: `frontend/src/components/ChatPanel.jsx`

**Step 1: Add drill state + ref**

After the existing state declarations, add:

```jsx
const [drillMode, setDrillMode] = useState(false)
const drillModeRef = useRef(false)

const setDrill = useCallback((val) => {
  drillModeRef.current = val
  setDrillMode(val)
}, [])
```

**Step 2: Add `startDrill` function**

Add after the `handleKey` function:

```jsx
const startDrill = async () => {
  if (streaming || !design) return
  setDrill(true)
  setActiveTab('chat')
  setStreaming(true)

  try {
    const res = await fetch(`${API_URL}/drill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        diagram_context: formatDiagramContext(design),
        history: [],
        drill_context: '',
      }),
    })
    if (!res.ok) throw new Error('Failed')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let aiText = ''

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: getTimestamp(),
    }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      aiText += decoder.decode(value, { stream: true })
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiText }
        return updated
      })
    }
  } catch {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Failed to start drill session. Please try again.',
      timestamp: getTimestamp(),
    }])
    setDrill(false)
  } finally {
    setStreaming(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }
}

const endDrill = useCallback(() => {
  setDrill(false)
}, [])
```

**Step 3: Update `send` to use `/drill` endpoint when drill mode is active**

In the existing `send` function, find the `chatPromise` fetch call:
```jsx
const chatPromise = fetch(`${API_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: msg,
    diagram_context: formatDiagramContext(design),
    history: messages.slice(-10),
  }),
})
```

Replace with:
```jsx
const isDrill = drillModeRef.current
const chatPromise = fetch(`${API_URL}/${isDrill ? 'drill' : 'chat'}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(isDrill ? {
    message: msg,
    diagram_context: formatDiagramContext(design),
    history: messages.slice(-10),
    drill_context: '',
  } : {
    message: msg,
    diagram_context: formatDiagramContext(design),
    history: messages.slice(-10),
  }),
})
```

Also update the `refinePromise` to not fire during drill mode:
```jsx
// Find:
const refinePromise = updateDiagram
  ? fetch(`${API_URL}/refine-design`, { ... })
  : null

// Replace with:
const refinePromise = !isDrill && updateDiagram
  ? fetch(`${API_URL}/refine-design`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_design: design, modification: msg }),
    })
  : null
```

**Step 4: Add Drill button to the panel header**

In the panel header (from Task 6), add the drill button between the tab switcher and the "LLaMA 3.3 70B" label:

```jsx
{/* Drill button — only show when design is loaded and in chat tab */}
{design && activeTab === 'chat' && (
  <button
    onClick={drillMode ? endDrill : startDrill}
    disabled={streaming && !drillMode}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      background: drillMode
        ? 'rgba(0,212,255,0.12)'
        : 'rgba(255,255,255,0.04)',
      border: drillMode
        ? '1px solid rgba(0,212,255,0.35)'
        : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8,
      padding: '3px 10px',
      fontSize: 11,
      color: drillMode ? '#00d4ff' : '#3d4466',
      cursor: streaming && !drillMode ? 'not-allowed' : 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => {
      if (!drillMode) e.currentTarget.style.color = '#8892b0'
    }}
    onMouseLeave={e => {
      if (!drillMode) e.currentTarget.style.color = '#3d4466'
    }}
  >
    {drillMode ? '⏹ End drill' : '🎯 Drill me'}
  </button>
)}
```

**Step 5: Add drill banner above the input area**

Find the input area `<div style={{ padding: '10px 14px 14px', ... }}>`. Add a drill banner just before it, inside the `activeTab === 'chat'` block:

```jsx
{/* Drill mode banner */}
{drillMode && (
  <div style={{
    margin: '0 14px 8px',
    padding: '7px 12px',
    background: 'rgba(0,212,255,0.06)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 8,
    fontSize: 11,
    color: '#00d4ff',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  }}>
    <span>🎯</span>
    <span>Interview Mode — answer thoroughly, the AI will push back</span>
  </div>
)}
```

**Step 6: Update input placeholder for drill mode**

Find the textarea `placeholder` prop:
```jsx
placeholder={design ? 'Ask about this design...' : 'Generate a design first...'}
```

Replace with:
```jsx
placeholder={
  !design ? 'Generate a design first...'
  : drillMode ? 'Answer the question...'
  : 'Ask about this design...'
}
```

**Step 7: Verify**

1. Generate a design
2. Click "🎯 Drill me" — button turns cyan, banner appears, AI asks the first tough question
3. Answer it — AI follows up or advances to next component
4. Click "⏹ End drill" — banner disappears, button resets, normal chat resumes
5. Switch to Concepts tab mid-drill — drill state preserved, returns to drill on tab switch back

---

## Final Verification Checklist

Run `cd frontend && VITE_API_URL=http://localhost:8004 npm run dev -- --port 5176`

- [ ] Tab bar shows "💬 Chat | 📚 Concepts" in the panel header
- [ ] Clicking "📚 Concepts" renders the concepts panel with 5 categories
- [ ] Clicking a concept chip fetches and streams a 3-section explanation
- [ ] "← Back" returns to the category grid
- [ ] Search box filters chips; unmatched search shows "🔍 Explain ..." button
- [ ] "🎯 Drill me" button only appears when a design is loaded
- [ ] Clicking "🎯 Drill me": button turns cyan, banner appears, AI asks first question
- [ ] Answering drill question: AI evaluates and follows up
- [ ] Clicking "⏹ End drill": button resets, banner disappears
- [ ] Chat AI responses render `[[concept]]` as teal clickable chips
- [ ] Clicking a chip switches to Concepts tab and auto-loads the explanation
- [ ] `/refine-design` is NOT called during drill mode
