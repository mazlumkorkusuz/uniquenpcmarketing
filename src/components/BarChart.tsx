'use client'

import { Bar, BarChart as RBarChart, LabelList, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { isPlatformColor } from '@/lib/theme'

type BarDatum = { label: string; value: number }

const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n)

// Tremor-style bar chart on shadcn's ChartContainer (Recharts). Platform colours stay as brand
// marks; any other colour becomes the theme's first chart colour.
export default function BarChart({
  data,
  color,
  height = 120,
  maxBars = 10,
}: {
  data: BarDatum[]
  color?: string
  height?: number
  maxBars?: number
}) {
  const bars = data.slice(0, maxBars).map((d) => ({ ...d, short: d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label }))
  const fill = color && isPlatformColor(color) ? color : 'var(--chart-1)'
  const config = { value: { label: 'Değer', color: fill } } satisfies ChartConfig

  if (bars.length === 0) {
    return (
      <div className="grid place-items-center text-xs text-muted-foreground" style={{ height }}>
        Veri yok
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="w-full" style={{ height, aspectRatio: 'auto' }}>
      <RBarChart data={bars} margin={{ top: 16, right: 4, bottom: 0, left: 4 }}>
        <XAxis
          dataKey="short"
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
        />
        <ChartTooltip cursor={{ fill: 'var(--muted)', radius: 6 }} content={<ChartTooltipContent hideLabel={false} labelKey="label" />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 2, 2]} maxBarSize={36}>
          <LabelList dataKey="value" position="top" formatter={(v) => fmt(Number(v))} style={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-2)' }} />
        </Bar>
      </RBarChart>
    </ChartContainer>
  )
}
