import { useState, useRef, useCallback } from 'react'
import PromptBar from './components/PromptBar'
import DiagramPanel from './components/DiagramPanel'
import ChatPanel from './components/ChatPanel'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'
const DEFAULT_CHAT_WIDTH = 340
const MIN_CHAT_WIDTH = 280
const MAX_CHAT_WIDTH = 600

export default function App() {
  const [design, setDesign] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const [selectedNode, setSelectedNode] = useState(null)

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

  const handleGenerate = async (prompt) => {
    setLoading(true)
    setError(null)
    setDesign(null)
    setSelectedNode(null)

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0f' }}>

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

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />

        {/* Subtitle */}
        <span style={{ fontSize: 12, color: '#3d4466', fontWeight: 500 }}>
          System Design Interview Prep
        </span>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
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
            </div>
          )}
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
        <DiagramPanel
          design={design}
          loading={loading}
          selectedNode={selectedNode}
          onNodeClick={setSelectedNode}
          onPaneClick={() => setSelectedNode(null)}
        />

        {/* Drag handle */}
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

        <ChatPanel
          design={design}
          onDiagramUpdate={setDesign}
          width={chatWidth}
        />
      </div>
    </div>
  )
}
