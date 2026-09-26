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
  '#6D28D9', '#1D4ED8', '#0F766E', '#047857',
  '#B45309', '#B91C1C', '#BE123C', '#6D28D9',
  '#0F766E', '#047857',
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
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#17122B', marginBottom: '4px' }}>{item.name}</div>
      <div style={{ fontSize: '14px', color: '#047857', fontWeight: 600 }}>{fmt(item.value)}</div>
      <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '2px' }}>{(item.payload.percent * 100).toFixed(1)}%</div>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', paddingTop: '12px', borderTop: '1px solid #E8E4F1', marginTop: '4px' }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#4A4462' }}>{entry.value}</span>
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
      <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#655F7D', fontSize: '12.5px' }}>
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
                  <text x={vb.cx} y={vb.cy - 10} textAnchor="middle" fill="#655F7D" fontSize={11}>
                    TOPLAM
                  </text>
                  <text x={vb.cx} y={vb.cy + 13} textAnchor="middle" fill="#17122B" fontSize={20} fontWeight={700}>
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
