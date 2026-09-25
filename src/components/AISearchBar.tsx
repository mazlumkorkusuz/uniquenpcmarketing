'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, CornerDownLeft } from 'lucide-react'
import s from '@/app/dashboard.module.css'

const SUGGESTIONS = [
  'Kaç Twitch yayıncımız var?',
  'Bu ay bütçenin ne kadarı harcandı?',
  'Bu haftaki toplantılar neler?',
]

export default function AISearchBar() {
  const [query, setQuery] = useState('')
  const [asked, setAsked] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K focuses the query bar from anywhere on the dashboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setQuery(trimmed)
    setAsked(trimmed)
  }

  return (
    <div>
      <form
        className={s.ask}
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit(query)
        }}
      >
        <Sparkles size={18} aria-hidden style={{ flexShrink: 0, color: 'var(--ink-2)' }} />
        <label htmlFor="ai-query" className="sr-only">
          Verilerinize soru sorun
        </label>
        <input
          id="ai-query"
          ref={inputRef}
          className={s.askInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Verilerinize soru sorun: yayıncılar, bütçe, toplantılar…"
          autoComplete="off"
        />
        <kbd className={s.kbd}>⌘K</kbd>
        <button type="submit" className={s.btnPrimary} disabled={!query.trim()}>
          Sor
          <CornerDownLeft size={14} aria-hidden />
        </button>
      </form>

      {asked ? (
        <p className={s.askNotice} role="status">
          AI sorguları henüz açılmadı. Sorunuz kaydedilmedi: “{asked}”
        </p>
      ) : (
        <div className={s.suggestions}>
          {SUGGESTIONS.map((q) => (
            <button key={q} type="button" className={s.suggestion} onClick={() => submit(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
