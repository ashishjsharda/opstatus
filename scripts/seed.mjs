/**
 * Opstatus demo seed script
 * Populates your local DB with realistic demo data so you can see the UI in action.
 *
 * Usage:
 *   node --experimental-sqlite scripts/seed.mjs
 *
 * Defaults to ./data/opstatus.db — set DATABASE_PATH env var to override.
 */

import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DATABASE_PATH || './data/opstatus.db'

// Ensure data dir exists
const dir = dirname(DB_PATH)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

if (!existsSync(DB_PATH)) {
  console.error(`❌  Database not found at ${DB_PATH}`)
  console.error('    Run "npm run dev" at least once to initialise it, then re-run this script.')
  process.exit(1)
}

const db = new DatabaseSync(DB_PATH)
db.exec(`PRAGMA foreign_keys = ON`)

// ─── Services ──────────────────────────────────────────────────────────────

const services = [
  // Core
  { name: 'API',           description: 'REST & GraphQL endpoints',    url: null, group_name: 'Core',           status: 'operational',    order_idx: 0 },
  { name: 'Web App',       description: 'Main customer dashboard',     url: null, group_name: 'Core',           status: 'operational',    order_idx: 1 },
  { name: 'Auth Service',  description: 'Login, SSO & token refresh',  url: null, group_name: 'Core',           status: 'operational',    order_idx: 2 },
  { name: 'Database',      description: 'Primary PostgreSQL cluster',  url: null, group_name: 'Core',           status: 'operational',    order_idx: 3 },
  // Infrastructure
  { name: 'CDN',           description: 'Global content delivery',     url: null, group_name: 'Infrastructure', status: 'degraded',       order_idx: 4 },
  { name: 'DNS',           description: 'Name resolution',             url: null, group_name: 'Infrastructure', status: 'operational',    order_idx: 5 },
  { name: 'Object Storage',description: 'File & media storage',        url: null, group_name: 'Infrastructure', status: 'operational',    order_idx: 6 },
  // Integrations
  { name: 'Email',         description: 'Transactional email delivery',url: null, group_name: 'Integrations',   status: 'operational',    order_idx: 7 },
  { name: 'Payments',      description: 'Stripe payment processing',   url: null, group_name: 'Integrations',   status: 'operational',    order_idx: 8 },
  { name: 'Webhooks',      description: 'Outbound webhook delivery',   url: null, group_name: 'Integrations',   status: 'operational',    order_idx: 9 },
]

const insertService = db.prepare(
  `INSERT OR IGNORE INTO services (name, description, url, group_name, status, order_idx)
   VALUES (?, ?, ?, ?, ?, ?)`
)

const serviceIds = {}
for (const s of services) {
  const r = insertService.run(s.name, s.description, s.url, s.group_name, s.status, s.order_idx)
  const id = r.lastInsertRowid
    ? Number(r.lastInsertRowid)
    : Number(db.prepare(`SELECT id FROM services WHERE name = ?`).get(s.name).id)
  serviceIds[s.name] = id
  console.log(`  ✓ Service: ${s.name} (${s.status})`)
}

// ─── Uptime history (90 days, mostly operational with a few blips) ──────────

const insertLog = db.prepare(`INSERT INTO uptime_logs (service_id, status, logged_at) VALUES (?, ?, ?)`)

const now = Date.now()
for (const [name, id] of Object.entries(serviceIds)) {
  // Seed one log entry per day for 90 days
  for (let d = 89; d >= 0; d--) {
    const ts = new Date(now - d * 86_400_000).toISOString()
    // CDN has degraded days scattered; others 99%+ operational
    let status = 'operational'
    if (name === 'CDN' && [5, 12, 23, 31].includes(d)) status = 'degraded'
    if (name === 'API' && d === 45) status = 'partial_outage'
    if (name === 'Database' && d === 60) status = 'degraded'
    insertLog.run(id, status, ts)
  }
}
console.log(`  ✓ Uptime history seeded (90 days)`)

// ─── Active incident ────────────────────────────────────────────────────────

const existingIncident = db.prepare(`SELECT id FROM incidents WHERE title = 'Elevated CDN latency in EU region'`).get()
if (!existingIncident) {
  const inc = db.prepare(
    `INSERT INTO incidents (title, status, impact, created_at, updated_at)
     VALUES (?, 'monitoring', 'minor', datetime('now', '-2 hours'), datetime('now', '-30 minutes'))`
  ).run('Elevated CDN latency in EU region')
  const incId = Number(inc.lastInsertRowid)

  // Link to CDN service
  db.prepare(`INSERT OR IGNORE INTO incident_services (incident_id, service_id) VALUES (?, ?)`).run(incId, serviceIds['CDN'])

  // Timeline of updates
  const updates = [
    { status: 'investigating', body: "We are investigating reports of elevated response times from our CDN nodes in the EU-West region. Other regions appear unaffected.", offset: '-2 hours' },
    { status: 'identified',    body: "The issue has been identified as a misconfiguration pushed during a routine cache rule update. A rollback is in progress.", offset: '-90 minutes' },
    { status: 'monitoring',    body: "The configuration rollback has been applied. Latency metrics are returning to normal. We are monitoring to confirm full resolution.", offset: '-30 minutes' },
  ]
  for (const u of updates) {
    db.prepare(
      `INSERT INTO incident_updates (incident_id, status, body, created_at)
       VALUES (?, ?, ?, datetime('now', ?))`
    ).run(incId, u.status, u.body, u.offset)
  }
  console.log(`  ✓ Incident: "Elevated CDN latency in EU region" (monitoring)`)
}

// ─── Scheduled maintenance ──────────────────────────────────────────────────

const existingMaint = db.prepare(`SELECT id FROM maintenance WHERE title = 'Database cluster upgrade'`).get()
if (!existingMaint) {
  const maint = db.prepare(
    `INSERT INTO maintenance (title, description, status, scheduled_at, ends_at)
     VALUES (?, ?, 'scheduled', datetime('now', '+3 days'), datetime('now', '+3 days', '+2 hours'))`
  ).run(
    'Database cluster upgrade',
    'Upgrading PostgreSQL from 15 to 16. Brief connection interruptions (< 30s) expected during failover.'
  )
  const maintId = Number(maint.lastInsertRowid)
  db.prepare(`INSERT OR IGNORE INTO maintenance_services (maintenance_id, service_id) VALUES (?, ?)`).run(maintId, serviceIds['Database'])
  db.prepare(`INSERT OR IGNORE INTO maintenance_services (maintenance_id, service_id) VALUES (?, ?)`).run(maintId, serviceIds['API'])
  console.log(`  ✓ Maintenance: "Database cluster upgrade" (scheduled in 3 days)`)
}

console.log('\n🎉  Seed complete! Restart the dev server and refresh your browser.\n')
