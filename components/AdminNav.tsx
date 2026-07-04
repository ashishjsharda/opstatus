'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, LayoutDashboard, Server, AlertTriangle, Wrench, Users, LogOut, ExternalLink } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/admin',            label: 'Overview',    icon: LayoutDashboard },
  { href: '/admin/services',   label: 'Services',    icon: Server          },
  { href: '/admin/incidents',  label: 'Incidents',   icon: AlertTriangle   },
  { href: '/admin/maintenance',label: 'Maintenance', icon: Wrench          },
  { href: '/admin/subscribers',label: 'Subscribers', icon: Users           },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 85%, transparent)' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center">
            <Shield size={14} className="text-green-500" />
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Admin</span>
        </div>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  active
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                )}
                style={{ color: active ? undefined : 'var(--muted)' }}>
                <Icon size={13} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/" target="_blank"
            className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--muted)' }} title="View public page">
            <ExternalLink size={14} />
          </Link>
          <ThemeToggle />
          <button onClick={handleLogout}
            className="p-2 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
            style={{ color: 'var(--muted)' }} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
