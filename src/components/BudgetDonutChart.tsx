'use client'

import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts'

const COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)',
  'var(--primary-ink)', 'var(--teal)', 'var(--info)', 'var(--warning)', 'var(--rose)',
]

export type BudgetDatum = { name: string; value: number }

function fmt(n: number) {
  return n >= 1_000_000
    ? '$' + (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1000
    ? '$' + (n / 1000).toFixed(1) + 'k'
    : '$' + n.toLocaleString('en-US')
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-2)' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>{item.name}</div>
      <div style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>{fmt(item.value)}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{(item.payload.percent * 100).toFixed(1)}%</div>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function BudgetDonutChart({ data }: { data: BudgetDatum[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div style={{ height: '300px' }} />

  if (data.length === 0) {
    return (
      <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
        Harcama verisi bulunamadı
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          innerRadius={72}
          outerRadius={112}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
          <Label
            content={(props) => {
              const vb = (props as { viewBox?: { cx: number; cy: number } }).viewBox
              if (!vb) return null
              return (
                <g>
                  <text x={vb.cx} y={vb.cy - 10} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11}>
                    TOPLAM
                  </text>
                  <text x={vb.cx} y={vb.cy + 13} textAnchor="middle" fill="var(--foreground)" fontSize={20} fontWeight={700}>
                    {fmt(total)}
                  </text>
                </g>
              )
            }}
            position="center"
          />
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
