import { getServices, getIncidents, getMaintenance, getSystemStatus } from '@/lib/db'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SubscribeForm } from '@/components/SubscribeForm'
import { UptimeBars } from '@/components/UptimeBars'
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, Wrench,
  ChevronDown, ExternalLink, Rss, Shield
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export const revalidate = 30 // ISR: refresh every 30s

const STATUS_CONFIG = {
  operational: {
    label: 'All Systems Operational',
    sublabel: 'Everything is running smoothly.',
    icon: CheckCircle2,
    gradient: 'from-green-500/20 via-emerald-500/10 to-transparent',
    ring: 'ring-green-500/30',
    text: 'text-green-500',
    bg: 'bg-green-500/10',
    dot: 'bg-green-400',
    glow: 'shadow-green-500/20',
  },
  degraded: {
    label: 'Degraded Performance',
    sublabel: 'Some services are experiencing issues.',
    icon: AlertTriangle,
    gradient: 'from-amber-500/20 via-amber-400/10 to-transparent',
    ring: 'ring-amber-500/30',
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-400',
    glow: 'shadow-amber-500/20',
  },
  partial_outage: {
    label: 'Partial Outage',
    sublabel: 'Some services are unavailable.',
    icon: AlertTriangle,
    gradient: 'from-orange-500/20 via-orange-400/10 to-transparent',
    ring: 'ring-orange-500/30',
    text: 'text-orange-500',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-400',
    glow: 'shadow-orange-500/20',
  },
  major_outage: {
    label: 'Major Outage',
    sublabel: 'We are experiencing a significant disruption.',
    icon: XCircle,
    gradient: 'from-red-500/20 via-red-400/10 to-transparent',
    ring: 'ring-red-500/30',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    dot: 'bg-red-400',
    glow: 'shadow-red-500/20',
  },
  maintenance: {
    label: 'Under Maintenance',
    sublabel: 'Scheduled maintenance in progress.',
    icon: Wrench,
    gradient: 'from-indigo-500/20 via-indigo-400/10 to-transparent',
    ring: 'ring-indigo-500/30',
    text: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    dot: 'bg-indigo-400',
    glow: 'shadow-indigo-500/20',
  },
}

const SERVICE_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  operational:    { label: 'Operational',    color: 'text-green-500',  dot: 'bg-green-400'  },
  degraded:       { label: 'Degraded',       color: 'text-amber-500',  dot: 'bg-amber-400'  },
  partial_outage: { label: 'Partial Outage', color: 'text-orange-500', dot: 'bg-orange-400' },
  major_outage:   { label: 'Major Outage',   color: 'text-red-500',    dot: 'bg-red-400'    },
  maintenance:    { label: 'Maintenance',    color: 'text-indigo-500', dot: 'bg-indigo-400' },
}

const INCIDENT_STATUS = {
  investigating: { label: 'Investigating', color: 'text-red-500',    bg: 'bg-red-500/10'    },
  identified:    { label: 'Identified',    color: 'text-orange-500', bg: 'bg-orange-500/10' },
  monitoring:    { label: 'Monitoring',    color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
  resolved:      { label: 'Resolved',      color: 'text-green-500',  bg: 'bg-green-500/10'  },
}

const IMPACT_CONFIG = {
  none:     { label: 'None',     color: 'text-gray-500'  },
  minor:    { label: 'Minor',    color: 'text-amber-500' },
  major:    { label: 'Major',    color: 'text-orange-500'},
  critical: { label: 'Critical', color: 'text-red-500'   },
}

export default function StatusPage() {
  const services = getServices()
  const incidents = getIncidents(false)
  const maintenance = getMaintenance(false)
  const systemStatus = getSystemStatus()

  const cfg = STATUS_CONFIG[systemStatus] || STATUS_CONFIG.operational
  const StatusIcon = cfg.icon

  // Group services
  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    const g = s.group_name || 'Core'
    if (!acc[g]) acc[g] = []
    acc[g].push(s)
    return acc
  }, {})

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Status'
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL || ''

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 85%, transparent)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center ring-1 ${cfg.ring}`}>
              <Shield size={14} className={cfg.text} />
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
              {siteName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {supportUrl && (
              <a href={supportUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 transition-colors"
                style={{ color: 'var(--muted)' }}>
                Support <ExternalLink size={10} />
              </a>
            )}
            <Link href="/admin" className="text-xs transition-colors" style={{ color: 'var(--muted)' }}>
              Admin
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fade-in">

        {/* ── System Status Banner ────────────────────────────────────── */}
        <div className={`relative overflow-hidden rounded-2xl p-6 ring-1 ${cfg.ring} shadow-xl ${cfg.glow}`}
          style={{ background: 'var(--card)' }}>
          {/* Gradient blob */}
          <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} pointer-events-none`} />
          <div className="relative flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${cfg.bg} flex items-center justify-center ring-1 ${cfg.ring} flex-shrink-0`}>
              <StatusIcon size={22} className={cfg.text} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${cfg.text}`}>{cfg.label}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{cfg.sublabel}</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2">
              <span className={`relative flex h-2.5 w-2.5`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dot}`} />
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Live</span>
            </div>
          </div>
          <div className="relative mt-4 pt-4 border-t text-xs flex items-center gap-1"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <Clock size={11} />
            Last updated {format(new Date(), "MMM d, yyyy 'at' HH:mm zzz")}
          </div>
        </div>

        {/* ── Active Maintenance Banner ────────────────────────────────── */}
        {maintenance.filter(m => m.status !== 'completed').map(m => (
          <div key={m.id} className="rounded-xl border p-4 flex items-start gap-3"
            style={{ background: 'color-mix(in srgb, #6366f1 8%, var(--card))', borderColor: '#6366f130' }}>
            <Wrench size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm text-indigo-500">{m.title}</p>
              {m.description && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{m.description}</p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {format(new Date(m.scheduled_at), 'MMM d, HH:mm')} — {format(new Date(m.ends_at), 'MMM d, HH:mm')}
              </p>
            </div>
          </div>
        ))}

        {/* ── Services ────────────────────────────────────────────────── */}
        {Object.entries(grouped).map(([group, svcs]) => (
          <section key={group} className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                {group}
              </h2>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>90-day uptime</span>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {svcs.map((service, i) => {
                const sc = SERVICE_STATUS_CONFIG[service.status] || SERVICE_STATUS_CONFIG.operational
                return (
                  <div key={service.id}
                    className="px-5 py-4 flex items-center gap-4 group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`status-dot flex-shrink-0 ${service.status}`} />
                        <span className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                          {service.name}
                        </span>
                        {service.url && (
                          <a href={service.url} target="_blank" rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={11} style={{ color: 'var(--muted)' }} />
                          </a>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <UptimeBars serviceId={service.id} />
                      <span className="text-xs font-mono w-12 text-right" style={{ color: 'var(--muted)' }}>
                        {service.uptime_90}%
                      </span>
                      <span className={`text-xs font-medium ${sc.color} hidden sm:block w-28 text-right`}>
                        {sc.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {services.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Shield size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No services configured yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Add services from the <Link href="/admin" className="underline underline-offset-2">admin panel</Link>.
            </p>
          </div>
        )}

        {/* ── Active Incidents ─────────────────────────────────────────── */}
        {incidents.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <AlertTriangle size={14} className="text-orange-500" />
              Active Incidents
            </h2>
            <div className="space-y-3">
              {incidents.map(incident => {
                const is = INCIDENT_STATUS[incident.status] || INCIDENT_STATUS.investigating
                const imp = IMPACT_CONFIG[incident.impact] || IMPACT_CONFIG.minor
                return (
                  <div key={incident.id} className="glass-card overflow-hidden">
                    <div className="px-5 py-4 border-b flex items-start justify-between gap-3"
                      style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {incident.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${is.color} ${is.bg}`}>
                            {is.label}
                          </span>
                          <span className={`text-xs font-medium ${imp.color}`}>
                            {imp.label} impact
                          </span>
                          {incident.services && incident.services.length > 0 && (
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>
                              · {incident.services.map(s => s.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>
                        {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Timeline */}
                    {incident.updates && incident.updates.length > 0 && (
                      <div className="px-5 py-4 space-y-4">
                        {incident.updates.map((update, i) => {
                          const us = INCIDENT_STATUS[update.status] || INCIDENT_STATUS.investigating
                          return (
                            <div key={update.id} className="relative flex gap-3">
                              {i < incident.updates!.length - 1 && (
                                <div className="absolute left-[7px] top-5 bottom-0 w-px"
                                  style={{ background: 'var(--border)' }} />
                              )}
                              <div className={`mt-1 flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 border-current ${us.color}`} />
                              <div className="flex-1 min-w-0 pb-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold ${us.color}`}>{us.label}</span>
                                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                    {format(new Date(update.created_at), 'MMM d, HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                                  {update.body}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Upcoming Maintenance ─────────────────────────────────────── */}
        {maintenance.filter(m => m.status === 'scheduled').length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Wrench size={14} className="text-indigo-500" />
              Scheduled Maintenance
            </h2>
            <div className="space-y-2">
              {maintenance.filter(m => m.status === 'scheduled').map(m => (
                <div key={m.id} className="glass-card px-5 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{m.title}</p>
                    {m.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{m.description}</p>
                    )}
                    {m.services && m.services.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                        Affects: {m.services.map(s => s.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-indigo-500">
                      {format(new Date(m.scheduled_at), 'MMM d')}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {format(new Date(m.scheduled_at), 'HH:mm')} – {format(new Date(m.ends_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Subscribe ────────────────────────────────────────────────── */}
        <section className="glass-card px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center flex-shrink-0">
              <Rss size={16} className="text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                Stay in the loop
              </h3>
              <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--muted)' }}>
                Get notified about incidents and maintenance via email.
              </p>
              <SubscribeForm />
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="text-center pb-8">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Powered by{' '}
            <a href="https://github.com/your-org/opstatus" target="_blank" rel="noopener noreferrer"
              className="hover:underline underline-offset-2 font-medium">
              Opstatus
            </a>
            {' '}· Open source status page
          </p>
        </footer>
      </main>
    </div>
  )
}
