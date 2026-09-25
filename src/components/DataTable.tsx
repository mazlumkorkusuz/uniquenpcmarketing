interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'Veri bulunamadı',
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  backgroundColor: 'var(--color-bg-section)',
                  color: '#6B6B6B',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '11px 16px',
                  textAlign: 'left',
                  borderBottom: '1px solid #E0E0E0',
                  whiteSpace: 'nowrap',
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '48px 16px',
                  textAlign: 'center',
                  color: '#6B6B6B',
                  fontSize: '14px',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="data-row"
                style={{
                  borderBottom: i < data.length - 1 ? '1px solid #E5E5E5' : 'none',
                  backgroundColor: i % 2 === 1 ? '#F9F9F9' : '#FFFFFF',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    style={{
                      padding: '12px 16px',
                      color: '#111111',
                      fontSize: '13.5px',
                    }}
                  >
                    {col.render
                      ? col.render(row[col.key as keyof T], row)
                      : String(row[col.key as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
