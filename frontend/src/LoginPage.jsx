import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await signIn()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #0099cc, #00d4ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          boxShadow: '0 4px 24px rgba(0,212,255,0.35)',
        }}>
          ⬡
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#f0f4ff',
            letterSpacing: '-0.03em',
            fontFamily: "'JetBrains Mono', monospace",
            margin: 0,
          }}>
            DesignIQ
          </h1>
          <p style={{ fontSize: 14, color: '#3d4466', margin: '6px 0 0', fontWeight: 500 }}>
            System Design Interview Prep
          </p>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        minWidth: 320,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f4ff', margin: 0 }}>
            Sign in to continue
          </p>
          <p style={{ fontSize: 12.5, color: '#3d4466', margin: '6px 0 0', lineHeight: 1.6 }}>
            Practice system design with AI coaching
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: loading ? 'rgba(255,255,255,0.04)' : '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: loading ? '#3d4466' : '#1a1a2e',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            justifyContent: 'center',
            transition: 'all 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Google G icon */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {error && (
          <p style={{ fontSize: 12, color: '#fca5a5', margin: 0, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>

      <p style={{ fontSize: 11.5, color: '#3d4466', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        By signing in you agree to use this tool for interview prep only.
        Powered by Groq + LLaMA 3.3 70B.
      </p>
    </div>
  )
}
