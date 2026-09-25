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
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  color: '#A1A4A5',
                  fontSize: '13px',
                  fontWeight: 500,
                  padding: '10px 16px',
                  textAlign: 'left',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
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
                  color: '#8F8F8F',
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
                  borderBottom: i < data.length - 1 ? '1px solid #1F1F1F' : 'none',
                  backgroundColor: i % 2 === 1 ? '#0E0E0E' : '#0A0A0A',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    style={{
                      padding: '12px 16px',
                      color: '#EDEDED',
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
