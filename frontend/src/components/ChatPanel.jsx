import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'

function formatDiagramContext(design) {
  if (!design) return 'No design has been generated yet.'

  const nodeList = design.nodes
    .map((n) => `  - ${n.label} (${n.type}): ${n.description}`)
    .join('\n')

  const edgeList = design.edges
    .map((e) => {
      const src = design.nodes.find((n) => n.id === e.source)?.label || e.source
      const tgt = design.nodes.find((n) => n.id === e.target)?.label || e.target
      return `  - ${src} → ${tgt}${e.label ? ` [${e.label}]` : ''}`
    })
    .join('\n')

  return `System Design: ${design.title}
Overview: ${design.description}

Components:
${nodeList}

Data Flow:
${edgeList}`
}

const STARTER_QUESTIONS = [
  'Why is caching used here?',
  'How does this scale to millions of users?',
  'What are the trade-offs in this design?',
  'What would interviewers look for?',
]

export default function ChatPanel({ design }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (design && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `I've analyzed the **${design.title}** design. Ask me anything about it — trade-offs, scalability, what interviewers look for, or how specific components work.`,
        },
      ])
    }
  }, [design])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg || streaming) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setStreaming(true)

    const history = messages.slice(-10)

    try {
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          diagram_context: formatDiagramContext(design),
          history,
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('Chat request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let aiText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        aiText += chunk
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: aiText }
          return updated
        })
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. Please try again.' },
        ])
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="w-80 xl:w-96 flex flex-col border-l border-slate-700/50 bg-slate-900/60">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold text-slate-200">AI Coach</span>
        <span className="ml-auto text-xs text-slate-600">LLaMA 3.3 70B</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {!design ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="text-3xl">💬</div>
            <p className="text-slate-500 text-sm">Generate a design to start discussing it with the AI coach.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <svg className="animate-spin w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-300 rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="chat-markdown">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {streaming && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-4 bg-indigo-400 animate-pulse ml-0.5 rounded-sm align-middle" />
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter questions */}
      {design && messages.length <= 1 && !streaming && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-700/50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={design ? 'Ask about this design...' : 'Generate a design first...'}
            disabled={!design || streaming}
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-40 resize-none transition"
            style={{ maxHeight: 100, overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!design || !input.trim() || streaming}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition flex-shrink-0"
          >
            {streaming ? (
              <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
