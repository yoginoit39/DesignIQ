import { useState } from 'react'

const SUGGESTIONS = [
  "Design Instagram's like feature",
  "Design a URL shortener like Bitly",
  "Design Twitter's news feed",
  "Design Uber's ride matching",
  "Design YouTube's video upload",
  "Design WhatsApp messaging",
]

export default function PromptBar({ onGenerate, loading }) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (prompt.trim() && !loading) {
      onGenerate(prompt.trim())
    }
  }

  const handleSuggestion = (s) => {
    if (!loading) {
      setPrompt(s)
      onGenerate(s)
    }
  }

  return (
    <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur px-4 py-3">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Try: Design Instagram's like feature or Design a URL shortener"
          disabled={loading}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span> Generate
            </>
          )}
        </button>
      </form>

      {/* Suggestion chips */}
      <div className="flex gap-2 flex-wrap">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestion(s)}
            disabled={loading}
            className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
