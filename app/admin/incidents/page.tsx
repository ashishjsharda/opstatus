'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, AlertTriangle, Check, X, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'
type IncidentImpact = 'none' | 'minor' | 'major' | 'critical'

interface Service { id: number; name: string }
interface IncidentUpdate { id: number; status: IncidentStatus; body: string; created_at: string }
interface Incident {
  id: number; title: string; status: IncidentStatus; impact: IncidentImpact
  created_at: string; resolved_at: string | null
  updates?: IncidentUpdate[]
  services?: Service[]
}

const STATUS_OPTS = [
  { value: 'investigating', label: 'Investigating', color: 'text-red-500'    },
  { value: 'identified',    label: 'Identified',    color: 'text-orange-500' },
  { value: 'monitoring',    label: 'Monitoring',    color: 'text-amber-500'  },
  { value: 'resolved',      label: 'Resolved',      color: 'text-green-500'  },
]
const IMPACT_OPTS = ['none', 'minor', 'major', 'critical']

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-green-500/30"
const inputStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }

export default function IncidentsAdmin() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [updateForm, setUpdateForm] = useState<{ status: IncidentStatus; body: string }>({ status: 'monitoring', body: '' })
  const [addingUpdate, setAddingUpdate] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', status: 'investigating' as IncidentStatus, impact: 'minor' as IncidentImpact, body: '', service_ids: [] as number[] })
  const [saving, setSaving] = useState(false)

  async function fetchAll() {
    const [incRes, svcRes] = await Promise.all([
      fetch(`/api/incidents?all=${showAll ? '1' : '0'}`),
      fetch('/api/services'),
    ])
    setIncidents(await incRes.json())
    setServices(await svcRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [showAll])

  async function handleCreate() {
    setSaving(true)
    await fetch('/api/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form }) })
    setShowForm(false)
    setForm({ title: '', status: 'investigating', impact: 'minor', body: '', service_ids: [] })
    await fetchAll()
    setSaving(false)
  }

  async function handleAddUpdate(incidentId: number) {
    await fetch(`/api/incidents/${incidentId}/updates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateForm)
    })
    setAddingUpdate(null)
    setUpdateForm({ status: 'monitoring', body: '' })
    await fetchAll()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this incident?')) return
    await fetch(`/api/incidents/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Incidents</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {incidents.length} {showAll ? 'total' : 'active'} incident{incidents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAll(!showAll)}
            className="text-xs px-3 py-2 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            {showAll ? 'Hide resolved' : 'Show all'}
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
            <Plus size={15} /> New Incident
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>New Incident</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Title *</label>
              <input className={inputCls} style={inputStyle} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Elevated API error rates" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Status</label>
              <select className={inputCls} style={inputStyle} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as IncidentStatus }))}>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Impact</label>
              <select className={inputCls} style={inputStyle} value={form.impact}
                onChange={e => setForm(f => ({ ...f, impact: e.target.value as IncidentImpact }))}>
                {IMPACT_OPTS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Initial update *</label>
              <textarea rows={3} className={inputCls + ' resize-none'} style={inputStyle} value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="We are investigating reports of elevated error rates..." />
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
                          ? 'bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-400'
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
            <button onClick={handleCreate} disabled={!form.title || !form.body || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Create Incident
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--muted)' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Incidents List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: 'var(--muted)' }} /></div>
      ) : incidents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No incidents. Nice!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => {
            const sc = STATUS_OPTS.find(o => o.value === inc.status)
            const isExpanded = expanded === inc.id
            return (
              <div key={inc.id} className="glass-card overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${sc?.color}`}>{sc?.label}</span>
                      <h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>{inc.title}</h3>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {format(new Date(inc.created_at), 'MMM d, yyyy HH:mm')}
                      {inc.services && inc.services.length > 0 && ` · ${inc.services.map(s => s.name).join(', ')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isExpanded ? null : inc.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--muted)' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => { setAddingUpdate(addingUpdate === inc.id ? null : inc.id); setExpanded(inc.id) }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10 hover:text-blue-500"
                      style={{ color: 'var(--muted)' }}>
                      <MessageSquare size={13} />
                    </button>
                    <button onClick={() => handleDelete(inc.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                      style={{ color: 'var(--muted)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-5 py-4" style={{ borderColor: 'var(--border)' }}>
                    {/* Add update form */}
                    {addingUpdate === inc.id && (
                      <div className="mb-4 p-4 rounded-xl space-y-3"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <h4 className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Post Update</h4>
                        <select className={inputCls + ' text-xs'} style={inputStyle} value={updateForm.status}
                          onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value as IncidentStatus }))}>
                          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <textarea rows={3} className={inputCls + ' resize-none text-xs'} style={inputStyle}
                          value={updateForm.body} onChange={e => setUpdateForm(f => ({ ...f, body: e.target.value }))}
                          placeholder="Describe what's happening..." />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddUpdate(inc.id)} disabled={!updateForm.body}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors disabled:opacity-60">
                            <Check size={12} /> Post
                          </button>
                          <button onClick={() => setAddingUpdate(null)}
                            className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: 'var(--muted)' }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Update timeline */}
                    <div className="space-y-3">
                      {inc.updates?.map((u, i) => {
                        const us = STATUS_OPTS.find(o => o.value === u.status)
                        return (
                          <div key={u.id} className="flex gap-3 text-sm">
                            <div className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${us?.color.replace('text-', 'bg-')}`} />
                            <div>
                              <span className={`text-xs font-semibold ${us?.color}`}>{us?.label}</span>
                              <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>
                                {format(new Date(u.created_at), 'MMM d, HH:mm')}
                              </span>
                              <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>{u.body}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
