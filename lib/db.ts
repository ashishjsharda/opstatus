// node:sqlite is built into Node 22+ (no native compilation required)
// Run with: node --experimental-sqlite (already set in package.json scripts)
import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH || './data/opstatus.db'

let _db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (_db) return _db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  _db = new DatabaseSync(DB_PATH)
  initSchema(_db)
  return _db
}

function initSchema(db: DatabaseSync) {
  db.exec(`PRAGMA journal_mode = WAL`)
  db.exec(`PRAGMA foreign_keys = ON`)

  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      url         TEXT,
      group_name  TEXT    DEFAULT 'Core',
      status      TEXT    NOT NULL DEFAULT 'operational',
      order_idx   INTEGER DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uptime_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      status     TEXT    NOT NULL,
      logged_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'investigating',
      impact      TEXT    NOT NULL DEFAULT 'minor',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS incident_services (
      incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
      service_id  INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      PRIMARY KEY (incident_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS incident_updates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
      status      TEXT    NOT NULL,
      body        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS maintenance (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      description  TEXT,
      status       TEXT    NOT NULL DEFAULT 'scheduled',
      scheduled_at TEXT    NOT NULL,
      ends_at      TEXT    NOT NULL,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS maintenance_services (
      maintenance_id INTEGER NOT NULL REFERENCES maintenance(id) ON DELETE CASCADE,
      service_id     INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      PRIMARY KEY (maintenance_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      token      TEXT    NOT NULL UNIQUE,
      confirmed  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('site_name',      'My Status Page'),
      ('site_url',       'http://localhost:3000'),
      ('support_url',    ''),
      ('admin_password', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
  `)
}

// ─── Service helpers ────────────────────────────────────────────────────────

export type ServiceStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'

export interface Service {
  id: number
  name: string
  description: string | null
  url: string | null
  group_name: string
  status: ServiceStatus
  order_idx: number
  created_at: string
  updated_at: string
  uptime_90?: number
}

export function getServices(): Service[] {
  const db = getDb()
  const services = db.prepare(`SELECT * FROM services ORDER BY order_idx, name`).all() as Service[]

  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  for (const s of services) {
    const logs = db.prepare(
      `SELECT status FROM uptime_logs WHERE service_id = ? AND logged_at >= ? ORDER BY logged_at`
    ).all(s.id, from) as { status: string }[]

    if (logs.length === 0) {
      s.uptime_90 = 100
    } else {
      const up = logs.filter(l => l.status === 'operational').length
      s.uptime_90 = Math.round((up / logs.length) * 1000) / 10
    }
  }

  return services
}

export function getService(id: number): Service | null {
  return getDb().prepare(`SELECT * FROM services WHERE id = ?`).get(id) as Service | null
}

export function createService(data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
  const db = getDb()
  const result = db.prepare(
    `INSERT INTO services (name, description, url, group_name, status, order_idx)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(data.name, data.description, data.url, data.group_name, data.status, data.order_idx)
  return result.lastInsertRowid
}

export function updateService(id: number, data: Partial<Service>) {
  const db = getDb()
  // Merge with existing to avoid nulling out fields
  const existing = getService(id)
  if (!existing) return
  const merged = { ...existing, ...data }
  db.prepare(
    `UPDATE services SET name=?, description=?, url=?, group_name=?, status=?, order_idx=?,
     updated_at=datetime('now') WHERE id=?`
  ).run(merged.name, merged.description, merged.url, merged.group_name, merged.status, merged.order_idx, id)

  if (data.status) {
    db.prepare(`INSERT INTO uptime_logs (service_id, status) VALUES (?, ?)`).run(id, data.status)
  }
}

export function deleteService(id: number) {
  getDb().prepare(`DELETE FROM services WHERE id = ?`).run(id)
}

// ─── Incident helpers ────────────────────────────────────────────────────────

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'
export type IncidentImpact = 'none' | 'minor' | 'major' | 'critical'

export interface Incident {
  id: number
  title: string
  status: IncidentStatus
  impact: IncidentImpact
  created_at: string
  resolved_at: string | null
  updated_at: string
  updates?: IncidentUpdate[]
  services?: Service[]
}

export interface IncidentUpdate {
  id: number
  incident_id: number
  status: IncidentStatus
  body: string
  created_at: string
}

export function getIncidents(includeResolved = false): Incident[] {
  const db = getDb()
  const incidents = db.prepare(
    includeResolved
      ? `SELECT * FROM incidents ORDER BY created_at DESC`
      : `SELECT * FROM incidents WHERE status != 'resolved' ORDER BY created_at DESC`
  ).all() as Incident[]

  for (const inc of incidents) {
    inc.updates = db.prepare(
      `SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY created_at DESC`
    ).all(inc.id) as IncidentUpdate[]

    const serviceIds = db.prepare(
      `SELECT service_id FROM incident_services WHERE incident_id = ?`
    ).all(inc.id) as { service_id: number }[]

    inc.services = serviceIds.map(r => getService(r.service_id)).filter(Boolean) as Service[]
  }

  return incidents
}

export function getIncident(id: number): Incident | null {
  const db = getDb()
  const inc = db.prepare(`SELECT * FROM incidents WHERE id = ?`).get(id) as Incident | null
  if (!inc) return null

  inc.updates = db.prepare(
    `SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY created_at DESC`
  ).all(id) as IncidentUpdate[]

  const serviceIds = db.prepare(
    `SELECT service_id FROM incident_services WHERE incident_id = ?`
  ).all(id) as { service_id: number }[]

  inc.services = serviceIds.map(r => getService(r.service_id)).filter(Boolean) as Service[]
  return inc
}

export function createIncident(data: {
  title: string
  status: IncidentStatus
  impact: IncidentImpact
  body: string
  service_ids: number[]
}): number {
  const db = getDb()
  const result = db.prepare(
    `INSERT INTO incidents (title, status, impact) VALUES (?, ?, ?)`
  ).run(data.title, data.status, data.impact)

  const incidentId = Number(result.lastInsertRowid)

  db.prepare(
    `INSERT INTO incident_updates (incident_id, status, body) VALUES (?, ?, ?)`
  ).run(incidentId, data.status, data.body)

  for (const sid of data.service_ids) {
    db.prepare(`INSERT OR IGNORE INTO incident_services (incident_id, service_id) VALUES (?, ?)`).run(incidentId, sid)
  }

  return incidentId
}

export function addIncidentUpdate(incidentId: number, status: IncidentStatus, body: string) {
  const db = getDb()
  db.prepare(
    `INSERT INTO incident_updates (incident_id, status, body) VALUES (?, ?, ?)`
  ).run(incidentId, status, body)

  db.prepare(
    `UPDATE incidents SET status=?, updated_at=datetime('now'),
     resolved_at=CASE WHEN ? = 'resolved' THEN datetime('now') ELSE NULL END WHERE id=?`
  ).run(status, status, incidentId)
}

export function deleteIncident(id: number) {
  getDb().prepare(`DELETE FROM incidents WHERE id = ?`).run(id)
}

// ─── Maintenance helpers ─────────────────────────────────────────────────────

export interface MaintenanceWindow {
  id: number
  title: string
  description: string | null
  status: 'scheduled' | 'in_progress' | 'completed'
  scheduled_at: string
  ends_at: string
  created_at: string
  services?: Service[]
}

export function getMaintenance(includeCompleted = false): MaintenanceWindow[] {
  const db = getDb()
  const windows = db.prepare(
    includeCompleted
      ? `SELECT * FROM maintenance ORDER BY scheduled_at ASC`
      : `SELECT * FROM maintenance WHERE status != 'completed' ORDER BY scheduled_at ASC`
  ).all() as MaintenanceWindow[]

  for (const w of windows) {
    const serviceIds = db.prepare(
      `SELECT service_id FROM maintenance_services WHERE maintenance_id = ?`
    ).all(w.id) as { service_id: number }[]
    w.services = serviceIds.map(r => getService(r.service_id)).filter(Boolean) as Service[]
  }

  return windows
}

export function createMaintenance(data: {
  title: string
  description?: string
  scheduled_at: string
  ends_at: string
  service_ids: number[]
}): number {
  const db = getDb()
  const result = db.prepare(
    `INSERT INTO maintenance (title, description, scheduled_at, ends_at) VALUES (?, ?, ?, ?)`
  ).run(data.title, data.description ?? null, data.scheduled_at, data.ends_at)

  const maintenanceId = Number(result.lastInsertRowid)

  for (const sid of data.service_ids) {
    db.prepare(`INSERT OR IGNORE INTO maintenance_services (maintenance_id, service_id) VALUES (?, ?)`).run(maintenanceId, sid)
  }

  return maintenanceId
}

export function updateMaintenance(id: number, data: Partial<MaintenanceWindow>) {
  const db = getDb()
  const existing = db.prepare(`SELECT * FROM maintenance WHERE id = ?`).get(id) as MaintenanceWindow | null
  if (!existing) return
  const merged = { ...existing, ...data }
  db.prepare(
    `UPDATE maintenance SET title=?, description=?, status=?, scheduled_at=?, ends_at=?,
     updated_at=datetime('now') WHERE id=?`
  ).run(merged.title, merged.description, merged.status, merged.scheduled_at, merged.ends_at, id)
}

export function deleteMaintenance(id: number) {
  getDb().prepare(`DELETE FROM maintenance WHERE id = ?`).run(id)
}

// ─── Subscriber helpers ──────────────────────────────────────────────────────

export interface Subscriber {
  id: number
  email: string
  token: string
  confirmed: number
  created_at: string
}

export function getSubscribers(): Subscriber[] {
  return getDb().prepare(`SELECT * FROM subscribers ORDER BY created_at DESC`).all() as Subscriber[]
}

export function addSubscriber(email: string): { token: string } | null {
  const db = getDb()
  const token = crypto.randomUUID()
  try {
    db.prepare(`INSERT INTO subscribers (email, token) VALUES (?, ?)`).run(email, token)
    return { token }
  } catch {
    return null
  }
}

export function confirmSubscriber(token: string): boolean {
  const result = getDb().prepare(`UPDATE subscribers SET confirmed=1 WHERE token=?`).run(token)
  return result.changes > 0
}

export function deleteSubscriber(token: string) {
  getDb().prepare(`DELETE FROM subscribers WHERE token=?`).run(token)
}

// ─── Settings helpers ────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const row = getDb().prepare(`SELECT value FROM settings WHERE key=?`).get(key) as { value: string } | null
  return row?.value ?? null
}

export function setSetting(key: string, value: string) {
  getDb().prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run(key, value)
}

// ─── System status ───────────────────────────────────────────────────────────

export type SystemStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'

export function getSystemStatus(): SystemStatus {
  const services = getDb().prepare(`SELECT status FROM services`).all() as { status: string }[]
  if (services.length === 0) return 'operational'

  const statuses = services.map(s => s.status)
  if (statuses.some(s => s === 'major_outage'))   return 'major_outage'
  if (statuses.some(s => s === 'partial_outage')) return 'partial_outage'
  if (statuses.some(s => s === 'degraded'))       return 'degraded'
  if (statuses.some(s => s === 'maintenance'))    return 'maintenance'
  return 'operational'
}
