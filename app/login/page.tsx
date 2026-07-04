'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Invalid password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={22} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Admin Login</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Opstatus admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoFocus
                className="w-full px-3 py-2.5 pr-10 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted)' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium text-sm bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
          Default password: <code className="font-mono bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded">password</code>
          <br />Change it in settings after first login.
        </p>
      </div>
    </div>
  )
}
