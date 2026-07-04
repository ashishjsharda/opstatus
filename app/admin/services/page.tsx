'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, Server, Check, X } from 'lucide-react'

type ServiceStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'

interface Service {
  id: number
  name: string
  description: string | null
  url: string | null
  group_name: string
  status: ServiceStatus
  order_idx: number
  uptime_90?: number
}

const STATUS_OPTIONS: { value: ServiceStatus; label: string; color: string }[] = [
  { value: 'operational',    label: 'Operational',    color: 'text-green-500'  },
  { value: 'degraded',       label: 'Degraded',       color: 'text-amber-500'  },
  { value: 'partial_outage', label: 'Partial Outage', color: 'text-orange-500' },
  { value: 'major_outage',   label: 'Major Outage',   color: 'text-red-500'    },
  { value: 'maintenance',    label: 'Maintenance',    color: 'text-indigo-500' },
]

const EMPTY_FORM = { name: '', description: '', url: '', group_name: 'Core', status: 'operational' as ServiceStatus, order_idx: 0 }

export default function ServicesAdmin() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function fetchServices() {
    const res = await fetch('/api/services')
    setServices(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  async function handleSave() {
    setSaving(true)
    const method = editId ? 'PATCH' : 'POST'
    const url = editId ? `/api/services/${editId}` : '/api/services'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    await fetchServices()
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this service?')) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    await fetchServices()
  }

  async function quickStatusChange(id: number, status: ServiceStatus) {
    await fetch(`/api/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...services.find(s => s.id === id), status }),
    })
    await fetchServices()
  }

  function startEdit(service: Service) {
    setForm({ name: service.name, description: service.description || '', url: service.url || '', group_name: service.group_name, status: service.status, order_idx: service.order_idx })
    setEditId(service.id)
    setShowForm(true)
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-green-500/30 transition-all"
  const inputStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Services</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {services.length} service{services.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
          <Plus size={15} /> Add Service
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {editId ? 'Edit Service' : 'New Service'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Name *</label>
              <input className={inputCls} style={inputStyle} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="API" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Group</label>
              <input className={inputCls} style={inputStyle} value={form.group_name}
                onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} placeholder="Core" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Description</label>
              <input className={inputCls} style={inputStyle} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>URL (optional)</label>
              <input className={inputCls} style={inputStyle} value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://api.example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ServiceStatus }))}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={!form.name || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editId ? 'Save Changes' : 'Create Service'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--muted)' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: 'var(--muted)' }} /></div>
      ) : services.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Server size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No services yet. Add one above.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {services.map(service => {
              const sc = STATUS_OPTIONS.find(o => o.value === service.status)
              return (
                <div key={service.id} className="px-5 py-4 flex items-center gap-4">
                  <span className={`status-dot flex-shrink-0 ${service.status}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{service.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{service.group_name}{service.description ? ` · ${service.description}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Quick status change */}
                    <select
                      value={service.status}
                      onChange={e => quickStatusChange(service.id, e.target.value as ServiceStatus)}
                      className="text-xs px-2 py-1 rounded-lg border outline-none cursor-pointer"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: sc?.color.replace('text-', 'var(--tw-') }}>
                      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button onClick={() => startEdit(service)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--muted)' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(service.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                      style={{ color: 'var(--muted)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
