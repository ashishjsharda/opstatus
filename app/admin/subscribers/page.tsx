import { getSubscribers } from '@/lib/db'
import { format } from 'date-fns'
import { Users, CheckCircle2, Clock } from 'lucide-react'

export default function SubscribersAdmin() {
  const subscribers = getSubscribers()
  const confirmed = subscribers.filter(s => s.confirmed)
  const pending = subscribers.filter(s => !s.confirmed)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Subscribers</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {confirmed.length} confirmed · {pending.length} pending
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{confirmed.length}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Confirmed</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center">
              <Clock size={16} className="text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{pending.length}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Pending</div>
            </div>
          </div>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No subscribers yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Visitors can subscribe on the public status page.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              <span>Email</span>
              <span>Status</span>
              <span>Subscribed</span>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {subscribers.map(s => (
              <div key={s.id} className="px-5 py-3 grid grid-cols-3 items-center text-sm">
                <span className="font-mono text-xs truncate" style={{ color: 'var(--text)' }}>{s.email}</span>
                <span className={`text-xs font-medium ${s.confirmed ? 'text-green-500' : 'text-amber-500'}`}>
                  {s.confirmed ? 'Confirmed' : 'Pending'}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {format(new Date(s.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
