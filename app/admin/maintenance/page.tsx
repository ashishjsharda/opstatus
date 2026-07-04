'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Wrench, Check, X } from 'lucide-react'
import { format } from 'date-fns'

interface Service { id: number; name: string }
interface Maintenance {
  id: number; title: string; description: string | null
  status: 'scheduled' | 'in_progress' | 'completed'
  scheduled_at: string; ends_at: string; created_at: string
  services?: Service[]
}

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-green-500/30"
const inputStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }

export default function MaintenanceAdmin() {
  const [windows, setWindows] = useState<Maintenance[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '', ends_at: '', service_ids: [] as number[] })
  const [saving, setSaving] = useState(false)

  async function fetchAll() {
    const [mRes, sRes] = await Promise.all([fetch('/api/maintenance?all=1'), fetch('/api/services')])
    setWindows(await mRes.json())
    setServices(await sRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function handleCreate() {
    setSaving(true)
    await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowForm(false)
    setForm({ title: '', description: '', scheduled_at: '', ends_at: '', service_ids: [] })
    await fetchAll()
    setSaving(false)
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...windows.find(w => w.id === id), status })
    })
    await fetchAll()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete maintenance window?')) return
    await fetch(`/api/maintenance/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  const STATUS_COLORS: Record<string, string> = {
    scheduled:   'text-indigo-500',
    in_progress: 'text-amber-500',
    completed:   'text-green-500',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Maintenance</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Schedule planned maintenance windows</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Schedule Maintenance
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>New Maintenance Window</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Title *</label>
              <input className={inputCls} style={inputStyle} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Database migration" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Description</label>
              <input className={inputCls} style={inputStyle} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what will happen" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Starts At *</label>
              <input type="datetime-local" className={inputCls} style={inputStyle} value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Ends At *</label>
              <input type="datetime-local" className={inputCls} style={inputStyle} value={form.ends_at}
                onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
            </div>
            {services.length > 0 && (
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Affected Services</label>
                <div className="flex flex-wrap gap-2">
                  {services.map(s => (
                    <button key={s.id} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        service_ids: f.service_ids.includes(s.id)
                          ? f.service_ids.filter(id => id !== s.id)
                          : [...f.service_ids, s.id]
                      }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        form.service_ids.includes(s.id)
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      style={form.service_ids.includes(s.id) ? {} : { borderColor: 'var(--border)', color: 'var(--muted)' }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleCreate} disabled={!form.title || !form.scheduled_at || !form.ends_at || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Schedule
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--muted)' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: 'var(--muted)' }} /></div>
      ) : windows.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Wrench size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No maintenance windows scheduled.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {windows.map(w => (
              <div key={w.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${STATUS_COLORS[w.status]}`}>
                      {w.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    <h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>{w.title}</h3>
                  </div>
                  {w.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{w.description}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {format(new Date(w.scheduled_at), 'MMM d, HH:mm')} → {format(new Date(w.ends_at), 'MMM d, HH:mm')}
                    {w.services && w.services.length > 0 && ` · ${w.services.map(s => s.name).join(', ')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={w.status}
                    onChange={e => handleStatusChange(w.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg border outline-none cursor-pointer"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button onClick={() => handleDelete(w.id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                    style={{ color: 'var(--muted)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
