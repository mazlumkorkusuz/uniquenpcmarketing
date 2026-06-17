type BarDatum = { label: string; value: number }

export default function BarChart({
  data,
  color = '#7c3aed',
  height = 120,
  maxBars = 10,
}: {
  data: BarDatum[]
  color?: string
  height?: number
  maxBars?: number
}) {
  const bars = data.slice(0, maxBars)
  const max = Math.max(...bars.map((d) => d.value), 1)

  const fmt = (n: number) =>
    n >= 1_000_000
      ? (n / 1_000_000).toFixed(1) + 'M'
      : n >= 1000
      ? (n / 1000).toFixed(0) + 'k'
      : String(n)

  if (bars.length === 0) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '12px', color: '#475569' }}>Veri yok</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${height}px`, padding: '0 4px' }}>
      {bars.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            height: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, lineHeight: 1 }}>{fmt(d.value)}</span>
          <div
            style={{
              width: '100%',
              background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
              borderRadius: '3px 3px 0 0',
              height: `${Math.max((d.value / max) * 100, 2)}%`,
            }}
          />
          <span
            style={{
              fontSize: '9px',
              color: '#64748b',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
          </span>
        </div>
      ))}
    </div>
  )
}
