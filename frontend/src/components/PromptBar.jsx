import { useState, useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  "Instagram's like feature",
  "URL shortener like Bitly",
  "Twitter's news feed",
  "Uber's ride matching",
  "YouTube video upload",
  "WhatsApp messaging",
]

export default function PromptBar({ onGenerate, loading }) {
  const [prompt, setPrompt] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (prompt.trim() && !loading) onGenerate(prompt.trim())
  }

  const handleSuggestion = (s) => {
    if (loading) return
    const full = `Design ${s}`
    setPrompt(full)
    onGenerate(full)
  }

  return (
    <div style={{
      padding: '12px 16px 10px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(7,7,15,0.8)',
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
            ? 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.6))'
            : 'rgba(255,255,255,0.06)',
          transition: 'background 0.2s',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0c0c1d',
            borderRadius: 11,
            paddingLeft: 14,
            gap: 10,
          }}>
            <Sparkles
              size={15}
              color={focused ? '#818cf8' : '#383c56'}
              style={{ flexShrink: 0, transition: 'color 0.2s' }}
            />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Describe a system to design — e.g. Instagram's like feature"
              disabled={loading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#eef0ff',
                fontSize: 13.5,
                padding: '11px 0',
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
              }}
            />
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
            fontFamily: 'inherit',
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

      {/* Suggestion chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#383c56', marginRight: 2, flexShrink: 0 }}>Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestion(s)}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: '3px 11px',
              fontSize: 11.5,
              color: '#7b80a0',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.4 : 1,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
                e.currentTarget.style.color = '#a5b4fc'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = '#7b80a0'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
