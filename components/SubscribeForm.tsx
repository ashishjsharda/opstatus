'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

export function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setState('loading')
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setState('success')
        setMessage(data.message || 'Subscribed!')
        setEmail('')
      } else {
        setState('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <CheckCircle2 size={16} />
        {message}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-60 flex items-center gap-2"
      >
        {state === 'loading' && <Loader2 size={14} className="animate-spin" />}
        Subscribe
      </button>
      {state === 'error' && (
        <p className="absolute mt-10 text-xs text-red-500">{message}</p>
      )}
    </form>
  )
}
