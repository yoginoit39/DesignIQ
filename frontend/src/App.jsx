import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import LoginPage from './LoginPage'
import PromptBar from './components/PromptBar'
import DiagramPanel from './components/DiagramPanel'
import ChatPanel from './components/ChatPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'
const DEFAULT_CHAT_WIDTH = 340
const MIN_CHAT_WIDTH = 280
const MAX_CHAT_WIDTH = 600

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [design, setDesign] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const [selectedNode, setSelectedNode] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setChatOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  // Returns a fresh Firebase ID token for every request
  const getToken = useCallback(async () => {
    if (!user) throw new Error('Not authenticated')
    return user.getIdToken()
  }, [user])

  const handleGenerate = async (prompt) => {
    setLoading(true)
    setError(null)
    setDesign(null)
    setSelectedNode(null)

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/generate-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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

  // Show blank screen while Firebase resolves session (< 1 second)
  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#00d4ff',
          boxShadow: '0 0 12px rgba(0,212,255,0.6)',
          animation: 'blink 0.9s ease-in-out infinite',
        }} />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f' }}>

      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 20px',
        height: 48,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        gap: isMobile ? 8 : 12,
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

        {/* Divider + Subtitle — desktop only */}
        {!isMobile && (
          <>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 12, color: '#3d4466', fontWeight: 500 }}>
              System Design Interview Prep
            </span>
          </>
        )}

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
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
              {!isMobile && (
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
              )}
            </div>
          )}

          {/* Signed-in user + sign out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="avatar"
                style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.2)' }}
              />
            )}
            <button
              onClick={signOut}
              style={{
                fontSize: 11,
                color: '#3d4466',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#8892b0'}
              onMouseLeave={e => e.currentTarget.style.color = '#3d4466'}
            >
              Sign out
            </button>
          </div>

          {/* Powered by Groq — desktop only */}
          {!isMobile && (
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
          )}
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
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <DiagramPanel
          design={design}
          loading={loading}
          selectedNode={selectedNode}
          onNodeClick={setSelectedNode}
          onPaneClick={() => setSelectedNode(null)}
        />

        {/* Drag handle — desktop only */}
        {!isMobile && (
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
        )}

        {/* Desktop: sidebar chat */}
        {!isMobile && (
          <ChatPanel
            design={design}
            onDiagramUpdate={setDesign}
            width={chatWidth}
            getToken={getToken}
          />
        )}

        {/* Mobile: bottom sheet chat */}
        {isMobile && chatOpen && (
          <>
            <div
              onClick={() => setChatOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.55)',
                zIndex: 49,
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '72vh',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            }}>
              <ChatPanel
                design={design}
                onDiagramUpdate={setDesign}
                width="100%"
                getToken={getToken}
                isMobile
                onClose={() => setChatOpen(false)}
              />
            </div>
          </>
        )}

        {/* Mobile: floating chat toggle button */}
        {isMobile && (
          <button
            onClick={() => setChatOpen(v => !v)}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: chatOpen
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #0099cc, #00d4ff)',
              border: chatOpen ? '1px solid rgba(255,255,255,0.15)' : 'none',
              color: 'white',
              fontSize: 22,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: chatOpen ? 'none' : '0 4px 20px rgba(0,212,255,0.45)',
              zIndex: chatOpen ? 48 : 40,
              transition: 'all 0.2s',
            }}
            aria-label={chatOpen ? 'Close chat' : 'Open AI Coach'}
          >
            {chatOpen ? '✕' : '💬'}
          </button>
        )}
      </div>
    </div>
  )
}
