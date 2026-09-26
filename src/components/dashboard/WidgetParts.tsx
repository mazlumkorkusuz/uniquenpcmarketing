import type { CSSProperties } from 'react'
import { RefreshCw } from 'lucide-react'
import s from '@/app/dashboard.module.css'

export function RefreshButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      type="button"
      className={`${s.iconButton} ${loading ? s.spinning : ''}`}
      onClick={onClick}
      disabled={loading}
      aria-label={label}
      title={label}
    >
      <RefreshCw size={15} aria-hidden />
    </button>
  )
}

export function RowSkeletons({ count, art = true }: { count: number; art?: boolean }) {
  return (
    <ul className={s.rankList} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className={`${s.rankRow} ${art ? '' : s.rankRowNoArt}`}>
          <span className={s.rank}>{i + 1}</span>
          {art && <span className={`${s.capsule} ${s.skeleton}`} />}
          <span className={s.rowText}>
            <span className={s.skeleton} style={{ height: 12, width: '70%' }} />
            <span className={s.skeleton} style={{ height: 8, width: '40%' }} />
          </span>
          <span className={s.skeleton} style={{ height: 12, width: 36 }} />
        </li>
      ))}
    </ul>
  )
}

// Rank badge: top 3 get the gradient treatment
export function Rank({ n }: { n: number }) {
  return <span className={`${s.rank} ${n <= 3 ? s.rankTop : ''}`}>{n}</span>
}

// Thin magnitude bar relative to the list's max value; grows in on load, staggered by row
export function Meter({ value, max, row, twitch = false }: { value: number; max: number; row: number; twitch?: boolean }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0
  return (
    <span className={`${s.meter} ${twitch ? s.meterTwitch : ''}`} aria-hidden>
      <span style={{ width: `${pct}%`, '--r': row } as CSSProperties} />
    </span>
  )
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, '') + 'K'
  return String(n)
}
