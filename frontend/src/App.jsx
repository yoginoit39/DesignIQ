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
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <header className="flex items-center px-5 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm">
            🏛️
          </div>
          <span className="font-bold text-slate-100 text-base tracking-tight">DesignIQ</span>
          <span className="hidden sm:inline text-xs text-slate-600 border border-slate-700 rounded px-2 py-0.5 ml-1">
            System Design Interview Prep
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {design && (
            <span className="text-xs text-slate-500">
              {design.nodes.length} components · {design.edges.length} connections
            </span>
          )}
          <a
            href="https://groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-600 hover:text-slate-400 transition"
          >
            Powered by Groq
          </a>
        </div>
      </header>

      {/* Prompt Bar */}
      <PromptBar onGenerate={handleGenerate} loading={loading} />

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex-shrink-0">
          ⚠️ {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DiagramPanel design={design} loading={loading} />
        <ChatPanel design={design} />
      </div>
    </div>
  )
}
