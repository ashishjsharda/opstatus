import { getServices, getIncidents, getMaintenance, getSubscribers, getSystemStatus } from '@/lib/db'
import { Server, AlertTriangle, Wrench, Users, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  operational:    { label: 'Operational',    color: 'text-green-500'  },
  degraded:       { label: 'Degraded',       color: 'text-amber-500'  },
  partial_outage: { label: 'Partial Outage', color: 'text-orange-500' },
  major_outage:   { label: 'Major Outage',   color: 'text-red-500'    },
  maintenance:    { label: 'Maintenance',    color: 'text-indigo-500' },
}

export default function AdminDashboard() {
  const services = getServices()
  const incidents = getIncidents(false)
  const maintenance = getMaintenance(false)
  const subscribers = getSubscribers()
  const systemStatus = getSystemStatus()

  const stats = [
    {
      label: 'Services',
      value: services.length,
      sub: `${services.filter(s => s.status === 'operational').length} operational`,
      icon: Server,
      href: '/admin/services',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/20',
    },
    {
      label: 'Active Incidents',
      value: incidents.length,
      sub: incidents.length === 0 ? 'All clear' : `${incidents.filter(i => i.status === 'investigating').length} investigating`,
      icon: AlertTriangle,
      href: '/admin/incidents',
      color: incidents.length > 0 ? 'text-orange-500' : 'text-green-500',
      bg: incidents.length > 0 ? 'bg-orange-500/10' : 'bg-green-500/10',
      ring: incidents.length > 0 ? 'ring-orange-500/20' : 'ring-green-500/20',
    },
    {
      label: 'Maintenance',
      value: maintenance.filter(m => m.status !== 'completed').length,
      sub: 'scheduled windows',
      icon: Wrench,
      href: '/admin/maintenance',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      ring: 'ring-indigo-500/20',
    },
    {
      label: 'Subscribers',
      value: subscribers.filter(s => s.confirmed).length,
      sub: `${subscribers.length} total`,
      icon: Users,
      href: '/admin/subscribers',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      ring: 'ring-purple-500/20',
    },
  ]

  const systemCfg = STATUS_LABELS[systemStatus] || STATUS_LABELS.operational

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            System is{' '}
            <span className={`font-medium ${systemCfg.color}`}>{systemCfg.label}</span>
          </p>
        </div>
        <Link href="/" target="_blank"
          className="text-xs px-3 py-2 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          View public page →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}
            className="glass-card p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} ring-1 ${stat.ring} flex items-center justify-center`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</div>
              <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{stat.label}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{stat.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Services Quick Status */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Services</h2>
          <Link href="/admin/services" className="text-xs" style={{ color: 'var(--muted)' }}>
            Manage →
          </Link>
        </div>
        {services.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No services yet.</p>
            <Link href="/admin/services" className="text-xs text-green-500 mt-1 inline-block">
              Add your first service →
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {services.slice(0, 6).map(service => {
              const sc = STATUS_LABELS[service.status] || STATUS_LABELS.operational
              return (
                <div key={service.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`status-dot ${service.status}`} />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{service.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Active Incidents</h2>
            <Link href="/admin/incidents" className="text-xs" style={{ color: 'var(--muted)' }}>
              Manage →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {incidents.map(inc => (
              <div key={inc.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{inc.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {format(new Date(inc.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>
                <span className={`text-xs font-medium ${
                  inc.status === 'resolved' ? 'text-green-500' :
                  inc.status === 'monitoring' ? 'text-amber-500' :
                  'text-orange-500'
                }`}>
                  {inc.status.charAt(0).toUpperCase() + inc.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
