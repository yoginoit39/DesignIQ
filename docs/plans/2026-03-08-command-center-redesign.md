# DesignIQ — "Command Center" Frontend Redesign

**Date**: 2026-03-08
**Status**: Approved
**Scope**: Full frontend UI overhaul + resizable chat panel

---

## Goal

Transform the DesignIQ frontend into a premium, professional interview prep tool that feels energetic, technically credible, and highly interactive — without losing its current dark-theme identity.

---

## Design Direction: "Command Center"

Professional dark tool aesthetic. Think Warp terminal meets Notion AI. Sharp, focused, motivating.

---

## Layout & Structure

```
┌─────────────────────────────────────────────────────┐
│  HEADER  [Logo] [DesignIQ] ····· [node count] [Groq]│
├─────────────────────────────────────────────────────┤
│  PROMPT BAR  ─ animated cycling placeholder          │
│  [████████████████████████████] [Generate ▶]        │
│  Chips: [● Beginner] Instagram Feed                  │
├──────────────────────────────────┬──────────────────┤
│                                  ║  ← drag handle   │
│   DIAGRAM CANVAS (flex-1)        ║  CHAT PANEL      │
│   React Flow + node tooltips     ║  (resizable,     │
│   + bottom slide-up explain pane ║   min 280px,     │
│                                  ║   max 600px)     │
└──────────────────────────────────┴──────────────────┘
```

- Drag handle between canvas and chat — visual grip dots, cyan glow on hover, `cursor: col-resize`
- Chat panel: min 280px, max 600px, double-click resets to 340px
- Node click → bottom explanation pane slides up (200px), shows role + tradeoffs + interview tips

---

## Visual Design System

### Colors

| Variable    | Value                  | Usage                          |
|-------------|------------------------|--------------------------------|
| --bg        | #0a0a0f                | Base background                |
| --surface   | #0f0f1a                | Panel backgrounds              |
| --surface-2 | #161625                | Hover/active states            |
| --surface-3 | #1e1e32                | Input backgrounds              |
| --border    | rgba(255,255,255,0.05) | Subtle dividers                |
| --border-2  | rgba(255,255,255,0.10) | Primary borders                |
| --cyan      | #00d4ff                | Primary accent                 |
| --cyan-dim  | #00d4ff22              | Glow backgrounds               |
| --amber     | #f59e0b                | Beginner badge, warnings       |
| --red       | #ef4444                | Advanced badge, errors         |
| --green     | #22c55e                | Success, online indicator      |
| --text-1    | #f0f4ff                | Primary text                   |
| --text-2    | #8892b0                | Secondary text                 |
| --text-3    | #3d4466                | Tertiary/placeholder           |

### Typography

- **Display/mono**: JetBrains Mono — logo, node type labels, badges, code
- **Body/UI**: DM Sans — messages, descriptions, buttons, body copy

### Suggestion Chip Difficulty Badges

```
[● Beginner]  Instagram feed        ← amber dot
[◆ Advanced]  Uber surge pricing    ← red dot
[■ Expert]    Google search index   ← cyan dot
```

---

## Component Specs

### Header
- Logo: hexagon icon + "DesignIQ" in JetBrains Mono
- Right: node/edge count badges (shown post-generation), "Powered by Groq" link
- Height: 48px, surface background, bottom border

### Prompt Bar
- Animated cycling placeholder (rotates through example prompts every 3s)
- Suggestion chips with difficulty badges (amber/red/cyan dot prefix)
- Generate button: cyan gradient, loading spinner

### Diagram Canvas (DiagramPanel)
- Node redesign:
  - Left colored border strip (category color)
  - Icon top-left, type badge top-right in JetBrains Mono
  - Label bold DM Sans, description muted
  - Hover: cyan glow border + tooltip card above node (explains the component)
  - Click: triggers bottom explanation pane
- Bottom explanation pane:
  - Slides up 200px from bottom of canvas on node click
  - Shows: node name, role in system, tradeoffs, interview talking points
  - Dismissed by clicking X or clicking canvas background
- Loading state: animated logo + 4-step progress
- Empty state: placeholder diagram with instructions

### Chat Panel (ChatPanel)
- Header: "AI Coach" + green pulse dot + "LLaMA 3.3 70B" badge
- Messages:
  - AI: left-aligned, bordered box, "AI" avatar initials, timestamp
  - User: right-aligned, cyan-tinted bubble, "You" avatar initials, timestamp
  - Typing indicator: animated 3-dot pulse
  - Streaming cursor: blinking `▋`
  - "↗ Diagram updated" cyan pill badge on relevant messages
- Starter questions: tappable card components (not plain chips)
- Scroll: auto-scroll to bottom, "↓ New message" pill if user scrolled up
- Input: sticky footer textarea + Send button

### Resize Handle
- 8px wide drag zone between canvas and chat
- Visual: 3 dots `⠿` centered, cyan glow on hover
- `cursor: col-resize` on hover
- Smooth resize via `requestAnimationFrame`
- Double-click resets to 340px default
- Min: 280px, Max: 600px

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Full design system update (colors, fonts, animations) |
| `src/App.jsx` | Resize logic (useState + mousedown/mousemove/mouseup), drag handle, node click → explanation pane state |
| `src/components/PromptBar.jsx` | Cycling placeholder, difficulty badges on chips |
| `src/components/DiagramPanel.jsx` | Bottom explanation pane, loading/empty state polish |
| `src/components/ChatPanel.jsx` | Avatar initials, timestamps, typing indicator, scroll pill, starter question cards |
| `src/components/nodes/CustomNode.jsx` | Left border strip, hover tooltip, new layout |

---

## Success Criteria

- [ ] Chat panel resizes horizontally with drag handle (min 280px, max 600px)
- [ ] Double-click on drag handle resets chat to 340px
- [ ] JetBrains Mono + DM Sans loaded and applied correctly
- [ ] Cyan accent replaces indigo-violet throughout
- [ ] Suggestion chips show difficulty badges
- [ ] Node hover shows tooltip explaining the component
- [ ] Node click shows bottom explanation pane with interview tips
- [ ] Chat shows avatar initials + timestamps
- [ ] AI typing indicator (3-dot pulse) shows during streaming
- [ ] "↓ New message" scroll pill appears when user scrolled up
- [ ] Starter questions render as tappable cards
