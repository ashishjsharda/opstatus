'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  const options = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ]

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded-lg transition-all duration-150 ${
            theme === value
              ? 'bg-white dark:bg-dark-muted shadow-sm text-green-500'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title={value}
        >
          <Icon size={14} strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}
