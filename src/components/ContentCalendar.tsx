'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CalPost {
  id: string
  platform: string
  title: string | null
  scheduled_date: string | null
  status: string | null
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

interface ContentCalendarProps {
  posts: CalPost[]
  platformColors?: Record<string, string>
  singleColor?: string
  compact?: boolean
}

export function ContentCalendar({ posts, platformColors = {}, singleColor, compact = false }: ContentCalendarProps) {
  const now = new Date()
  const [view, setView] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))

  const yr = view.getFullYear()
  const mo = view.getMonth()
  const daysInMonth = new Date(yr, mo + 1, 0).getDate()
  const startOffset = (new Date(yr, mo, 1).getDay() + 6) % 7

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const dayPosts = (day: number): CalPost[] => {
    const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return posts.filter(p => p.scheduled_date === ds)
  }

  const isToday = (day: number) =>
    day === now.getDate() && mo === now.getMonth() && yr === now.getFullYear()

  const cellH = compact ? 38 : 58

  const navBtn: React.CSSProperties = {
    background: 'none',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '4px 6px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    transition: 'border-color 0.15s',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? '10px' : '16px' }}>
        <button style={navBtn} onClick={() => setView(new Date(yr, mo - 1, 1))}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: compact ? '13px' : '15px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
          {MONTHS[mo]} {yr}
        </span>
        <button style={navBtn} onClick={() => setView(new Date(yr, mo + 1, 1))}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#475569', padding: compact ? '3px 0' : '5px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} style={{ minHeight: `${cellH}px` }} />
          const ps = dayPosts(day)
          const today = isToday(day)

          return (
            <div
              key={i}
              style={{
                minHeight: `${cellH}px`,
                borderRadius: '6px',
                padding: compact ? '4px' : '5px 6px',
                backgroundColor: today ? 'rgba(124,58,237,0.15)' : ps.length > 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                border: today ? '1px solid rgba(124,58,237,0.4)' : ps.length > 0 ? '1px solid rgba(42,42,58,0.8)' : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{
                fontSize: compact ? '11px' : '12px',
                fontWeight: today ? 700 : 400,
                color: today ? '#a78bfa' : '#94a3b8',
                lineHeight: 1,
              }}>
                {day}
              </span>

              {ps.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '1px' }}>
                  {compact ? (
                    ps.slice(0, 5).map((p, pi) => (
                      <div
                        key={pi}
                        title={p.title ?? p.platform}
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: singleColor ?? (platformColors[p.platform?.toLowerCase?.() ?? ''] ?? '#7c3aed'),
                          flexShrink: 0,
                        }}
                      />
                    ))
                  ) : (
                    <>
                      {ps.slice(0, 3).map((p, pi) => {
                        const plat = p.platform?.toLowerCase?.() ?? ''
                        const c = singleColor ?? platformColors[plat] ?? '#7c3aed'
                        return (
                          <div
                            key={pi}
                            title={`${p.platform}: ${p.title ?? ''}`}
                            style={{
                              fontSize: '8px',
                              fontWeight: 700,
                              color: c,
                              backgroundColor: c + '28',
                              border: `1px solid ${c}44`,
                              borderRadius: '3px',
                              padding: '0 3px',
                              lineHeight: '13px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              maxWidth: '100%',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {(p.platform ?? '').slice(0, 3).toUpperCase()}
                          </div>
                        )
                      })}
                      {ps.length > 3 && (
                        <span style={{ fontSize: '8px', color: '#64748b', lineHeight: '13px' }}>+{ps.length - 3}</span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
