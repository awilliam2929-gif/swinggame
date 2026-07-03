import { useState, type FormEvent, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../store/AppContext'

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Nope. Wrong email or password — no mulligans on typing.'
          : err.message,
      )
    }
  }

  return (
    <div className="auth-screen">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-overlay" aria-hidden="true" />
      <form className="auth-card" onSubmit={submit}>
        <div className="brand auth-brand">
          <span className="brand-mark" aria-hidden="true">
            SG
          </span>
          <span className="brand-name">Swing Game</span>
        </div>
        <p className="auth-tagline">Members only. The money remembers.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn primary big auth-submit" disabled={busy}>
          {busy ? 'Checking…' : 'Let me in'}
        </button>
        <p className="auth-hint">
          One shared login for the whole group — ask the scorekeeper.
        </p>
      </form>
    </div>
  )
}

/**
 * With Supabase configured: require the group sign-in before showing the
 * app. Without it: pass straight through (local-only mode).
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { session, authReady } = useApp()
  if (!supabase) return <>{children}</>
  if (!authReady) {
    return (
      <div className="auth-screen">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <p className="auth-loading">Warming up the cart…</p>
      </div>
    )
  }
  if (!session) return <LoginScreen />
  return <>{children}</>
}
