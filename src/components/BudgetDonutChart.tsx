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
  '#7c3aed', '#3b82f6', '#14b8a6', '#22c55e',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6',
  '#06b6d4', '#a3e635',
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
    <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>{item.name}</div>
      <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: 600 }}>{fmt(item.value)}</div>
      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{(item.payload.percent * 100).toFixed(1)}%</div>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', paddingTop: '12px', borderTop: '1px solid #2a2a3a', marginTop: '4px' }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{entry.value}</span>
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
      <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '13px' }}>
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
                  <text x={vb.cx} y={vb.cy - 10} textAnchor="middle" fill="#64748b" fontSize={11}>
                    TOPLAM
                  </text>
                  <text x={vb.cx} y={vb.cy + 13} textAnchor="middle" fill="#f1f5f9" fontSize={20} fontWeight={700}>
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
