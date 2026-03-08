import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { SendHorizonal } from 'lucide-react'
import ConceptsPanel from './ConceptsPanel'

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

function Message({ msg, isLast, streaming, onConceptClick }) {
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
                renderWithConceptChips(msg.content, onConceptClick)
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

function renderWithConceptChips(content, onConceptClick) {
  const parts = content.split(/(\[\[[^\]]+\]\])/)
  // No chips found — render full markdown normally
  if (parts.length === 1) {
    return <ReactMarkdown>{content}</ReactMarkdown>
  }
  // Mix of text and chips — render inline
  return parts.map((part, i) => {
    const match = part.match(/^\[\[([^\]]+)\]\]$/)
    if (match) {
      return (
        <button key={i} className="concept-chip" onClick={() => onConceptClick(match[1])}>
          {match[1]}
        </button>
      )
    }
    return part ? <span key={i}>{part}</span> : null
  })
}

export default function ChatPanel({ design, onDiagramUpdate, width = 340 }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showScrollPill, setShowScrollPill] = useState(false)
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('chat')
  const [openConcept, setOpenConcept] = useState(null)
  const [drillMode, setDrillMode] = useState(false)
  const drillModeRef = useRef(false)

  const setDrill = useCallback((val) => {
    drillModeRef.current = val
    setDrillMode(val)
  }, [])

  const handleConceptChipClick = useCallback((concept) => {
    setOpenConcept(concept)
    setActiveTab('concepts')
  }, [])

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
      const isDrill = drillModeRef.current
      const chatPromise = fetch(`${API_URL}/${isDrill ? 'drill' : 'chat'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          diagram_context: formatDiagramContext(design),
          history: messages.slice(-10),
        }),
      })

      const refinePromise = !isDrill && updateDiagram
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

      try {
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
        const remaining = decoder.decode()
        if (remaining) {
          aiText += remaining
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiText }
            return updated
          })
        }
      } catch (err) {
        reader.cancel()
        throw err
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
  }, [setDrill])

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
        padding: '10px 14px',
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
          flexShrink: 0,
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

        {/* Drill button — only show when design is loaded and in chat tab */}
        {design && activeTab === 'chat' && (
          <button
            onClick={drillMode ? endDrill : startDrill}
            disabled={streaming}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: drillMode ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: drillMode ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              padding: '3px 10px',
              fontSize: 11,
              color: drillMode ? '#00d4ff' : '#3d4466',
              cursor: streaming ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!drillMode) e.currentTarget.style.color = '#8892b0' }}
            onMouseLeave={e => { if (!drillMode) e.currentTarget.style.color = '#3d4466' }}
          >
            {drillMode ? '⏹ End drill' : '🎯 Drill me'}
          </button>
        )}

        <span style={{
          marginLeft: 'auto',
          fontSize: 10,
          color: '#3d4466',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          LLaMA 3.3 70B
        </span>
      </div>

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
                  onConceptClick={handleConceptChipClick}
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
                placeholder={
                  !design ? 'Generate a design first...'
                  : drillMode ? 'Answer the question...'
                  : 'Ask about this design...'
                }
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
        </>
      )}
    </div>
  )
}
