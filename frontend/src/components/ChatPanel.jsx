import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { SendHorizonal, Sparkles } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'

const STARTER_QUESTIONS = [
  'Why is caching used here?',
  'How does this scale to millions of users?',
  'What are the main trade-offs?',
  'What would interviewers look for?',
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
  if (role === 'user') return null
  return (
    <div style={{
      width: 26,
      height: 26,
      borderRadius: 8,
      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      alignSelf: 'flex-start',
      marginTop: 1,
      boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
    }}>
      <Sparkles size={12} color="white" />
    </div>
  )
}

function Message({ msg, isLast, streaming }) {
  const isUser = msg.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 8,
      animation: 'fadeUp 0.25s ease',
    }}>
      {!isUser && <Avatar role="assistant" />}
      <div style={{
        maxWidth: '83%',
        ...(isUser ? {
          background: 'linear-gradient(135deg, #6366f1, #9333ea)',
          borderRadius: '16px 16px 4px 16px',
          padding: '9px 14px',
          color: 'rgba(255,255,255,0.93)',
          fontSize: 13.5,
          lineHeight: 1.6,
          boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
        } : {
          background: '#0d0d1c',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '2px solid rgba(99,102,241,0.5)',
          borderRadius: '4px 16px 16px 16px',
          padding: '9px 14px',
          color: '#b4bcd8',
          fontSize: 13.5,
          lineHeight: 1.6,
        }),
      }}>
        {isUser ? (
          msg.content
        ) : (
          <div className="chat-md">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            {streaming && isLast && (
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 14,
                background: '#818cf8',
                marginLeft: 2,
                borderRadius: 1,
                verticalAlign: 'middle',
                animation: 'blink 0.9s ease-in-out infinite',
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPanel({ design }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (design && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `I've analyzed the **${design.title}** design. Ask me anything — why certain components were chosen, how it scales, what trade-offs exist, or how to explain this in an interview.`,
      }])
    }
  }, [design])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || streaming || !design) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setStreaming(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          diagram_context: formatDiagramContext(design),
          history: messages.slice(-10),
        }),
      })

      if (!res.ok) throw new Error('Failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        aiText += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: aiText }
          return updated
        })
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
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
      width: 340,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#07070f',
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
          background: design ? '#34d399' : '#383c56',
          boxShadow: design ? '0 0 6px rgba(52,211,153,0.6)' : 'none',
          transition: 'all 0.3s',
        }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#eef0ff', letterSpacing: '-0.01em' }}>
          AI Coach
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#383c56' }}>
          LLaMA 3.3 70B
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
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
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#818cf8" />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#eef0ff', marginBottom: 5 }}>
                AI Coach
              </p>
              <p style={{ fontSize: 12.5, color: '#383c56', lineHeight: 1.6 }}>
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

      {/* Starter question chips */}
      {design && messages.length <= 1 && !streaming && (
        <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              style={{
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: 20,
                padding: '4px 11px',
                fontSize: 11.5,
                color: '#818cf8',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.07)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)'
              }}
            >
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
        <div style={{
          display: 'flex',
          gap: 8,
          background: '#0d0d1c',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '8px 8px 8px 14px',
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={(e) => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'}
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
              color: '#eef0ff',
              fontSize: 13,
              fontFamily: 'inherit',
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
                ? 'linear-gradient(135deg, #6366f1, #a855f7)'
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
                ? '0 2px 12px rgba(99,102,241,0.3)'
                : 'none',
            }}
          >
            <SendHorizonal size={14} />
          </button>
        </div>
        <p style={{ fontSize: 10.5, color: '#383c56', textAlign: 'center', marginTop: 7 }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
