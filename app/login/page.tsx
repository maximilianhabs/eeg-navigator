'use client'
import { useState, FormEvent } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Anmeldung fehlgeschlagen')
      } else {
        // Hard navigation — stellt sicher dass der Session-Cookie auf iOS Safari
        // zuverlässig im nächsten Request vorhanden ist (router.push reicht nicht)
        window.location.href = '/'
      }
    } catch {
      setError('Verbindungsfehler — bitte erneut versuchen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#060d1f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Hintergrund EEG-Welle ── */}
      <svg
        viewBox="0 0 1200 120"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          minWidth: '600px',
          opacity: 0.06,
          pointerEvents: 'none',
        }}
      >
        <polyline
          points="0,60 60,60 80,20 100,100 120,60 180,60 200,30 220,90 240,60 300,60 320,10 340,110 360,60 420,60 440,40 460,80 480,60 540,60 560,15 580,105 600,60 660,60 680,25 700,95 720,60 780,60 800,35 820,85 840,60 900,60 920,20 940,100 960,60 1020,60 1040,45 1060,75 1080,60 1140,60 1160,30 1180,90 1200,60"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
      </svg>

      {/* ── Glow oben ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '300px',
        background: 'radial-gradient(ellipse at center top, rgba(37,99,235,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* ── Content ── */}
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', zIndex: 1 }}>

        {/* Logo + Title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: '#1d4ed8',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(37,99,235,0.4)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l2-6 2 12 2-8 2 4 2-2h4"/>
            </svg>
          </div>
          <div>
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, lineHeight: 1.2 }}>
              EEG Navigator
            </h1>
            <p style={{ color: '#475569', fontSize: '12px', margin: '6px 0 0', letterSpacing: '0.01em' }}>
              Regelbasiertes EEG-Lehr- und Entscheidungssystem
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '16px',
          padding: '28px 24px',
          backdropFilter: 'blur(20px)',
        }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                placeholder="benutzername"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                width: '100%',
                background: loading ? 'rgba(37,99,235,0.5)' : '#2563eb',
                border: 'none',
                borderRadius: '8px',
                padding: '11px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                transition: 'background 0.15s',
                marginTop: '4px',
                opacity: (!username || !password) ? 0.5 : 1,
              }}
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>

          </form>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { icon: '〜', label: '94 EEG-Muster' },
            { icon: '🧠', label: 'Teaching-Module' },
            { icon: '🔍', label: 'Wizard & NCSE' },
          ].map(f => (
            <div key={f.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '10px 8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>{f.icon}</div>
              <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600, lineHeight: 1.3 }}>{f.label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: 0, right: 0,
        textAlign: 'center',
        fontSize: '10px',
        color: '#1e293b',
        padding: '0 16px',
      }}>
        <strong style={{ color: '#334155' }}>Kein Medizinprodukt.</strong>{' '}
        Ausschließlich zu Lehr- und Testzwecken. Nicht zur klinischen Anwendung.
      </div>
    </div>
  )
}
