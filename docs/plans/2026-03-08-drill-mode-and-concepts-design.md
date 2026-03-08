# Drill Mode + Concepts Panel — Design Doc

**Date:** 2026-03-08
**Project:** DesignIQ (system-design-prep)
**Status:** Approved, ready for implementation

---

## Problem

DesignIQ generates system designs and lets users chat with an AI Coach, but it doesn't push candidates toward the depth that real interviews require. Candidates can stay surface-level ("use Redis for caching") without being challenged on *why*. There's also no structured way to learn the fundamentals that come up in every design.

---

## Goals

1. **Drill Mode** — on-demand Socratic interviewer that pushes candidates to justify design choices with specificity
2. **Concepts Panel** — browsable + searchable concept library with AI-generated explanations, contextual to the current design
3. **Concept chips in chat** — AI Coach surfaces relevant concepts inline as clickable teal chips

---

## Architecture

All changes are frontend (React + Vite) + two new backend endpoints. No changes to existing generate/refine/chat flow.

---

## Feature 1: Drill Mode

### UI
- "🎯 Drill me" button in chat panel header (right of "LLaMA 3.3 70B" label)
- Active state: button turns cyan, label → "⏹ End drill"
- Cyan banner above input: `Interview Mode — answer thoroughly, the AI will push back`
- Input placeholder → "Answer the question..."
- Clicking "End drill" resets to normal chat (preserves history)

### Backend: `/drill` endpoint
- Streaming SSE, same pattern as `/chat`
- Request: `{ message, diagram_context, history, drill_context }`
  - `drill_context`: string tracking which components have been covered
  - Empty `message` = start of drill (AI asks the opening question)
- System prompt instructs AI to:
  - Play a strict but encouraging staff-engineer interviewer
  - Ask ONE specific question per turn about a concrete component in the design
  - Evaluate answer depth — follow up with "Good, but what about X?" if surface-level
  - Advance with "Strong answer. Let's talk about [next component]..." when satisfied
  - Never give away answers — only probe and guide

### Frontend State
```
drillMode: boolean
drillHistory: Message[]  // separate from chat history
```
- Drill history displayed in same message list; drill banner shown when active
- Switching to Concepts tab pauses drill (resumes on return)

---

## Feature 2: Concepts Panel

### UI
- Tab bar in chat panel header: `💬 Chat` | `📚 Concepts`
- Concepts tab:
  - Search box (free-form — any concept)
  - 5 category sections with topic chips:
    - **Consistency & Availability** — CAP theorem, eventual consistency, strong consistency, quorum
    - **Storage** — sharding, replication, indexing, ACID vs BASE, SQL vs NoSQL
    - **Caching** — cache-aside, write-through, write-back, LRU/LFU eviction, cache stampede
    - **Scalability** — horizontal vs vertical scaling, load balancing, rate limiting, backpressure
    - **Async & Messaging** — message queues, fan-out, idempotency, at-least-once delivery
  - Clicking a chip fires `/concept` and streams explanation below
  - Active chip highlighted cyan while loading/displaying

### Backend: `/concept` endpoint
- Streaming SSE
- Request: `{ concept: string, diagram_context: string }`
- System prompt structure — AI explains in 3 parts:
  1. **What it is** — clear definition, no jargon without explanation
  2. **When to use it** — trade-offs, alternatives, decision criteria
  3. **How to talk about it in an interview** — what to say, what depth to show, what interviewers look for
- If `diagram_context` provided: opens with how this concept applies to the current design

### Concept Chips in Chat
- Backend `CHAT_SYSTEM_PROMPT` updated: AI wraps known concepts in `[[double brackets]]`
  - Example: "You'd want to think about [[CAP theorem]] here — specifically..."
- Frontend parses streaming tokens and renders `[[...]]` patterns as teal `<button>` chips
- Clicking a chip: switches to Concepts tab, auto-selects that concept, fires `/concept`

---

## Data Flow

```
User clicks 🎯 Drill me
  → drillMode = true
  → POST /drill { message: '', diagram_context, history: [], drill_context: '' }
  → AI streams opening question
  → User answers → POST /drill { message, diagram_context, history, drill_context }
  → AI evaluates, follows up or advances
  → Repeat until "End drill" clicked

User clicks Concepts tab
  → Sees category grid + search
  → Clicks "CAP theorem"
  → POST /concept { concept: 'CAP theorem', diagram_context }
  → AI streams contextual explanation in 3 parts

User in Chat, AI responds with "[[CAP theorem]]"
  → Frontend renders as cyan chip
  → Click → switch to Concepts tab → auto-fire /concept for "CAP theorem"
```

---

## Out of Scope
- Scoring or grading drill answers
- Saving drill sessions or concept history
- User accounts or progress tracking
- Concept content being static/hardcoded
