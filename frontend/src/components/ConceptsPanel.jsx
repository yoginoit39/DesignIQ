import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004'

const CONCEPTS = [
  {
    category: 'Consistency & Availability',
    topics: ['CAP theorem', 'Eventual consistency', 'Strong consistency', 'Quorum reads/writes'],
  },
  {
    category: 'Storage',
    topics: ['Sharding', 'Replication', 'Indexing', 'ACID vs BASE', 'SQL vs NoSQL'],
  },
  {
    category: 'Caching',
    topics: ['Cache-aside', 'Write-through', 'Write-back', 'LRU/LFU eviction', 'Cache stampede'],
  },
  {
    category: 'Scalability',
    topics: ['Horizontal vs vertical scaling', 'Load balancing', 'Rate limiting', 'Backpressure'],
  },
  {
    category: 'Async & Messaging',
    topics: ['Message queues', 'Fan-out pattern', 'Idempotency', 'At-least-once delivery'],
  },
]

function formatDesignContext(design) {
  if (!design) return ''
  return `Current design: ${design.title} — ${design.description}`
}

export default function ConceptsPanel({ design, openConcept, onConceptHandled, getToken }) {
  const [search, setSearch] = useState('')
  const [activeConcept, setActiveConcept] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Auto-open a concept when triggered from chat chip click
  useEffect(() => {
    if (openConcept) {
      fetchConcept(openConcept)
      onConceptHandled?.()
    }
  }, [openConcept])

  useEffect(() => {
    if (!loading) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [content, loading])

  const fetchConcept = async (concept) => {
    setActiveConcept(concept)
    setContent('')
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/concept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          concept,
          diagram_context: formatDesignContext(design),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setContent(text)
        }
        const remaining = decoder.decode()
        if (remaining) setContent(prev => prev + remaining)
      } catch (err) {
        reader.cancel()
        throw err
      }
    } catch {
      setContent('Failed to load concept. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredConcepts = search
    ? CONCEPTS.map(cat => ({
        ...cat,
        topics: cat.topics.filter(t => t.toLowerCase().includes(search.toLowerCase())),
      })).filter(cat => cat.topics.length > 0)
    : CONCEPTS

  if (activeConcept) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Detail header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={() => { setActiveConcept(null); setContent('') }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3d4466',
              cursor: 'pointer',
              fontSize: 12,
              padding: '2px 4px',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#8892b0'}
            onMouseLeave={e => e.currentTarget.style.color = '#3d4466'}
          >
            ← Back
          </button>
          <span style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: '#f0f4ff',
            fontFamily: "'DM Sans', sans-serif",
            flex: 1,
          }}>
            {activeConcept}
          </span>
          {loading && (
            <span style={{
              fontSize: 10,
              color: '#3d4466',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              generating...
            </span>
          )}
        </div>

        {/* Detail content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
        }}>
          <div className="chat-md" style={{ fontSize: 12.5, color: '#b4c4d8', lineHeight: 1.75 }}>
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div style={{ color: '#3d4466', fontSize: 12 }}>Loading...</div>
            )}
            {loading && content && (
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
          <div ref={bottomRef} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search any concept..."
        style={{
          width: '100%',
          background: '#0f0f1a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: '8px 12px',
          color: '#f0f4ff',
          fontSize: 12.5,
          outline: 'none',
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 14,
          boxSizing: 'border-box',
          display: 'block',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.3)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
      />

      {/* Free-form search fallback */}
      {search && filteredConcepts.length === 0 && (
        <button
          onClick={() => fetchConcept(search.trim().slice(0, 200))}
          className="starter-card"
          style={{ marginBottom: 12 }}
        >
          🔍 Explain "{search}"
        </button>
      )}

      {/* Category sections */}
      {filteredConcepts.map(({ category, topics }) => (
        <div key={category} style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#3d4466',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 8,
          }}>
            {category}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => fetchConcept(topic)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: '3px 11px',
                  fontSize: 11.5,
                  color: '#8892b0',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)'
                  e.currentTarget.style.color = '#00d4ff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = '#8892b0'
                }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
