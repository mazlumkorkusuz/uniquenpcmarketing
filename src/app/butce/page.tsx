export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Wallet } from 'lucide-react'
import { BudgetExpenseModal, EditBudgetExpenseButton } from '@/components/BudgetExpenseModal'
import { DeleteButton } from '@/components/DeleteButton'

async function getData() {
  const { data: expenses } = await supabase
    .from('budget_expenses')
    .select('*')
    .order('date', { ascending: false })
  return { expenses: expenses ?? [] }
}

type Row = Record<string, unknown>

function currency(v: unknown) {
  if (v === null || v === undefined) return <span style={{ color: '#8F8F8F' }}>—</span>
  return <span style={{ color: '#3DD68C', fontWeight: 600 }}>${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: '#8F8F8F' }}>—</span>
  return <span style={{ fontSize: '12px', color: '#8F8F8F' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
}

export default async function ButcePage() {
  const { expenses } = await getData()

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number((e as Row).amount) || 0), 0)

  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    const cat = String((e as Row).category ?? 'Diğer')
    byCategory[cat] = (byCategory[cat] ?? 0) + (Number((e as Row).amount) || 0)
  }
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  const expenseCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#EDEDED' }}>{String(v ?? '—')}</span> },
    { key: 'amount', label: 'Tutar', render: currency },
    { key: 'category', label: 'Kategori', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'platform', label: 'Platform', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'date', label: 'Tarih', render: dateCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'description', label: 'Açıklama', render: (v: unknown) => v ? (
      <span style={{ fontSize: '12px', color: '#B4B4B4', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {String(v)}
      </span>
    ) : <span style={{ color: '#8F8F8F' }}>—</span> },
    { key: 'id', label: '', width: '80px', render: (_: unknown, row: Row) => (
      <div style={{ display: 'flex', gap: '4px' }}>
        <EditBudgetExpenseButton row={row} accentColor="#22c55e" />
        <DeleteButton table="budget_expenses" id={row.id as string} />
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Bütçe Yönetimi"
        subtitle="Harcamalar, bütçe takibi ve finansal planlama"
        icon={Wallet}
        gradient="linear-gradient(135deg, #22c55e, #14b8a6)"
      >
        <BudgetExpenseModal accentColor="#22c55e" buttonLabel="+ Harcama Ekle" />
      </PageHeader>
      <div style={{ padding: '24px 32px' }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#8F8F8F', fontWeight: 500, marginBottom: '8px' }}>Toplam Bütçe</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3DD68C' }}>
              ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#8F8F8F', fontWeight: 500, marginBottom: '8px' }}>Toplam Harcama</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#EDEDED' }}>
              ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#8F8F8F', fontWeight: 500, marginBottom: '8px' }}>Toplam İşlem</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#EDEDED' }}>{expenses.length}</div>
          </div>
        </div>

        {/* Category breakdown */}
        {categoryEntries.length > 0 && (
          <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#EDEDED', marginBottom: '16px' }}>Kategoriye Göre Harcama</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {categoryEntries.map(([cat, amount]) => {
                const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                return (
                  <div key={cat} style={{ backgroundColor: '#0A0A0A', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#8F8F8F', marginBottom: '4px' }}>{cat}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#3DD68C' }}>${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: '11px', color: '#B4B4B4', marginTop: '2px' }}>%{pct}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Expenses table */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#EDEDED' }}>Harcamalar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(34,197,94,0.12)', color: '#3DD68C', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {expenses.length}
            </span>
          </div>
          <DataTable columns={expenseCols} data={expenses as Row[]} emptyMessage="Harcama kaydı bulunamadı" />
        </div>
      </div>
    </div>
  )
}
