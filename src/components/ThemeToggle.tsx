'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

const OPTIONS = [
  { value: 'light', label: 'Açık tema', Icon: Sun },
  { value: 'dark', label: 'Koyu tema', Icon: Moon },
  { value: 'system', label: 'Sistem teması', Icon: Monitor },
] as const

// Three-way theme switch for the sidebar console. Renders a neutral state until mounted so the
// server and client markup match (the theme is only known in the browser).
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes mount guard
  useEffect(() => setMounted(true), [])

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Tema">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            className={active ? 'is-active' : undefined}
            onClick={() => setTheme(value)}
          >
            <Icon size={14} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
