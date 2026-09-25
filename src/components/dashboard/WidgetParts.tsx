import { RefreshCw } from 'lucide-react'
import s from '@/app/dashboard.module.css'

export function RefreshButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button type="button" className={s.iconButton} onClick={onClick} disabled={loading} aria-label={label} title={label}>
      <RefreshCw size={14} aria-hidden />
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
          <span className={s.skeleton} style={{ height: 12, width: '70%' }} />
          <span className={s.skeleton} style={{ height: 12, width: 36 }} />
        </li>
      ))}
    </ul>
  )
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0$/, '') + 'K'
  return String(n)
}
