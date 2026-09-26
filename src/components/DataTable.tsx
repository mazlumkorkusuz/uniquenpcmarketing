import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

// shadcn Table in the dashboard-01 style: quiet header row, hairline rows, hover tint.
export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'Veri bulunamadı',
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader className="bg-muted/60">
        <TableRow className="hover:bg-transparent">
          {columns.map((col) => (
            <TableHead
              key={String(col.key)}
              style={{ width: col.width }}
              className="h-10 px-4 text-xs font-medium text-muted-foreground"
            >
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, i) => (
            <TableRow key={i} className="data-row">
              {columns.map((col) => (
                <TableCell key={String(col.key)} className="px-4 py-3 text-foreground tabular-nums">
                  {col.render
                    ? col.render(row[col.key as keyof T], row)
                    : String(row[col.key as keyof T] ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
