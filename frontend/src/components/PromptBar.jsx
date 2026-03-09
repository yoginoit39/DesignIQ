import { useState, useEffect } from 'react'
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
      <div className="suggestions-row" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
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
