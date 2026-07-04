import { getDb } from '@/lib/db'

interface UptimeBarsProps {
  serviceId: number
}

export function UptimeBars({ serviceId }: UptimeBarsProps) {
  const db = getDb()
  const days = 90
  const now = new Date()

  // Get logs for the last 90 days
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
  const logs = db.prepare(
    `SELECT status, logged_at FROM uptime_logs
     WHERE service_id = ? AND logged_at >= ?
     ORDER BY logged_at ASC`
  ).all(serviceId, from) as { status: string; logged_at: string }[]

  // Build per-day buckets (last 90 days, most recent on the right)
  const buckets: string[] = Array(days).fill('empty')

  for (const log of logs) {
    const logDate = new Date(log.logged_at)
    const daysAgo = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24))
    const idx = days - 1 - daysAgo
    if (idx >= 0 && idx < days) {
      // Worst status wins for the day
      const priority = ['operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance']
      const current = buckets[idx]
      const newPriority = priority.indexOf(log.status)
      const currentPriority = priority.indexOf(current)
      if (current === 'empty' || newPriority > currentPriority) {
        buckets[idx] = log.status
      }
    }
  }

  // Show last 45 bars (truncate for display)
  const displayBuckets = buckets.slice(-45)

  return (
    <div className="flex items-center gap-px h-8 w-28" title="90-day uptime history">
      {displayBuckets.map((status, i) => (
        <div
          key={i}
          className={`uptime-bar flex-1`}
          style={{
            height: '100%',
            maxHeight: status === 'empty' ? '40%' : '100%',
            opacity: status === 'empty' ? 0.2 : 1,
            background: status === 'empty'
              ? undefined
              : status === 'operational'   ? '#22c55e'
              : status === 'degraded'      ? '#f59e0b'
              : status === 'partial_outage'? '#f97316'
              : status === 'major_outage'  ? '#ef4444'
              : status === 'maintenance'   ? '#6366f1'
              : undefined,
            borderRadius: '2px',
            transition: 'all 0.15s ease',
          }}
          title={status === 'empty' ? 'No data' : status.replace(/_/g, ' ')}
        />
      ))}
    </div>
  )
}
