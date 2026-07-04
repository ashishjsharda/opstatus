# Opstatus

A beautiful, self-hosted open source status page. Track services, communicate incidents, schedule maintenance, and keep your users subscribed — all from a single SQLite file.

![Dark mode](https://img.shields.io/badge/theme-dark%20%2F%20light-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![SQLite](https://img.shields.io/badge/database-SQLite-blue)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## Features

- **Service health tracking** — operational / degraded / partial outage / major outage / maintenance
- **90-day uptime bars** — visual history per service  
- **Incident management** — create incidents, post timestamped updates (investigating → identified → monitoring → resolved)
- **Maintenance windows** — schedule, track, and complete planned maintenance
- **Email subscribers** — visitors subscribe to status updates
- **Dark + light mode** — gorgeous on both, theme toggle built in
- **Zero dependencies** — SQLite, no external database needed
- **Admin panel** — full CRUD via `/admin`

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/opstatus
cd opstatus

# 2. Install dependencies
npm install

# 3. Configure
cp .env.example .env.local
# Edit .env.local — at minimum change ADMIN_PASSWORD and SESSION_SECRET

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — public status page.  
Open [http://localhost:3000/admin](http://localhost:3000/admin) — admin panel.

Default admin password: `password` — **change this immediately**.

---

## Docker

```bash
# Using Docker Compose (recommended)
cp .env.example .env
# Edit .env with your values

docker compose up -d

# Or with plain Docker
docker build -t opstatus .
docker run -p 3000:3000 \
  -v opstatus_data:/app/data \
  -e ADMIN_PASSWORD=your-secure-password \
  -e SESSION_SECRET=your-32-char-random-secret \
  opstatus
```

---

## Configuration

All config lives in `.env.local` (development) or environment variables (production/Docker).

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_NAME` | Site name in header + tab title | `My Status Page` |
| `NEXT_PUBLIC_SITE_URL` | Public URL of your status page | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPPORT_URL` | Link to your support page (optional) | — |
| `ADMIN_PASSWORD` | Admin panel password | `password` |
| `SESSION_SECRET` | 32+ char random string for session encryption | ⚠️ required in prod |
| `DATABASE_PATH` | Path to SQLite DB file | `./data/opstatus.db` |
| `SMTP_HOST` | SMTP server for email notifications | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | From address for emails | — |

---

## Deployment

Opstatus runs anywhere Node.js runs.

**Vercel / Railway / Render:**  
Deploy directly from GitHub. Set environment variables in the dashboard. Note: for persistent SQLite, mount a volume (Railway/Render support this; Vercel does not — use Docker or a VM for persistence).

**VPS (Recommended for production):**
```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Clone and build
git clone https://github.com/your-org/opstatus /opt/opstatus
cd /opt/opstatus
npm install && npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name opstatus -- start
pm2 save && pm2 startup

# Nginx reverse proxy
# server { listen 80; location / { proxy_pass http://localhost:3000; } }
```

---

## Admin Panel

Navigate to `/admin` — you'll be prompted to log in.

- **Overview** — system status at a glance, quick links
- **Services** — add/edit/delete services, one-click status changes
- **Incidents** — create incidents, post updates, track resolution
- **Maintenance** — schedule and manage maintenance windows
- **Subscribers** — view all email subscribers

---

## API

All endpoints return JSON. Admin endpoints require an active session cookie.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/services` | Public | List all services |
| `POST` | `/api/services` | Admin | Create service |
| `PATCH` | `/api/services/:id` | Admin | Update service |
| `DELETE` | `/api/services/:id` | Admin | Delete service |
| `GET` | `/api/incidents` | Public | List incidents |
| `POST` | `/api/incidents` | Admin | Create incident |
| `POST` | `/api/incidents/:id/updates` | Admin | Add incident update |
| `DELETE` | `/api/incidents/:id` | Admin | Delete incident |
| `GET` | `/api/maintenance` | Public | List maintenance |
| `POST` | `/api/maintenance` | Admin | Schedule maintenance |
| `PATCH` | `/api/maintenance/:id` | Admin | Update maintenance |
| `DELETE` | `/api/maintenance/:id` | Admin | Delete maintenance |
| `POST` | `/api/subscribers` | Public | Subscribe |
| `DELETE` | `/api/subscribers?token=` | Public | Unsubscribe |
| `POST` | `/api/auth` | — | Log in (returns session cookie) |
| `DELETE` | `/api/auth` | — | Log out |

---

## License

MIT — use it, fork it, ship it.
