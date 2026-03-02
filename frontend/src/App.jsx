import { useState } from 'react'
import PromptBar from './components/PromptBar'
import DiagramPanel from './components/DiagramPanel'
import ChatPanel from './components/ChatPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'

export default function App() {
  const [design, setDesign] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async (prompt) => {
    setLoading(true)
    setError(null)
    setDesign(null)

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#07070f' }}>

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
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
          }}>
            ⬡
          </div>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#eef0ff',
            letterSpacing: '-0.03em',
          }}>
            DesignIQ
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

        {/* Subtitle */}
        <span style={{ fontSize: 12, color: '#383c56', fontWeight: 500 }}>
          System Design Interview Prep
        </span>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {design && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'fadeIn 0.4s ease' }}>
              <span style={{
                fontSize: 11,
                color: '#383c56',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                padding: '2px 9px',
              }}>
                {design.nodes.length} nodes
              </span>
              <span style={{
                fontSize: 11,
                color: '#383c56',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                padding: '2px 9px',
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
              color: '#383c56',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#7b80a0'}
            onMouseLeave={e => e.currentTarget.style.color = '#383c56'}
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
        <DiagramPanel design={design} loading={loading} />

        {/* Vertical divider */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

        <ChatPanel design={design} />
      </div>
    </div>
  )
}
