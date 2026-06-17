export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import Badge, { statusBadge } from '@/components/Badge'
import { Wallet } from 'lucide-react'

async function getData() {
  const [{ data: expenses }, { data: settings }] = await Promise.all([
    supabase.from('budget_expenses').select('*').order('date', { ascending: false }),
    supabase.from('budget_settings').select('*').order('year', { ascending: false }),
  ])
  return { expenses: expenses ?? [], settings: settings ?? [] }
}

type Row = Record<string, unknown>

function currency(v: unknown) {
  if (v === null || v === undefined) return <span style={{ color: '#64748b' }}>—</span>
  return <span style={{ color: '#4ade80', fontWeight: 600 }}>{Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
}

function dateCell(v: unknown) {
  if (!v) return <span style={{ color: '#64748b' }}>—</span>
  return <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(v as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
}

export default async function ButcePage() {
  const { expenses, settings } = await getData()

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number((e as Row).amount) || 0), 0)
  const currentSetting = settings[0] as Row | undefined
  const monthlyBudget = Number(currentSetting?.monthly_budget ?? 0)
  const budgetPercent = monthlyBudget > 0 ? Math.min(Math.round((totalExpenses / monthlyBudget) * 100), 100) : 0
  const remaining = monthlyBudget - totalExpenses

  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    const cat = String((e as Row).category ?? 'Diğer')
    byCategory[cat] = (byCategory[cat] ?? 0) + (Number((e as Row).amount) || 0)
  }
  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  const expenseCols = [
    { key: 'title', label: 'Başlık', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{String(v ?? '—')}</span> },
    { key: 'amount', label: 'Tutar', render: currency },
    { key: 'category', label: 'Kategori', render: (v: unknown) => v ? <Badge variant="purple">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'platform', label: 'Platform', render: (v: unknown) => v ? <Badge variant="blue">{String(v)}</Badge> : <span style={{ color: '#64748b' }}>—</span> },
    { key: 'date', label: 'Tarih', render: dateCell },
    { key: 'status', label: 'Durum', render: (v: unknown) => statusBadge(v as string) ?? <span style={{ color: '#64748b' }}>—</span> },
    { key: 'description', label: 'Açıklama', render: (v: unknown) => v ? (
      <span style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {String(v)}
      </span>
    ) : <span style={{ color: '#64748b' }}>—</span> },
  ]

  const settingsCols = [
    { key: 'year', label: 'Yıl', render: (v: unknown) => <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{String(v ?? '—')}</span> },
    { key: 'month', label: 'Ay', render: (v: unknown) => {
      if (!v) return <span style={{ color: '#64748b' }}>—</span>
      const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
      return <span style={{ color: '#94a3b8' }}>{months[Number(v) - 1] ?? String(v)}</span>
    }},
    { key: 'monthly_budget', label: 'Aylık Bütçe', render: currency },
    { key: 'currency', label: 'Para Birimi', render: (v: unknown) => v ? <Badge variant="teal">{String(v)}</Badge> : <Badge variant="teal">TRY</Badge> },
    { key: 'notes', label: 'Not', render: (v: unknown) => v ? <span style={{ fontSize: '12px', color: '#94a3b8' }}>{String(v)}</span> : <span style={{ color: '#64748b' }}>—</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Bütçe Yönetimi"
        subtitle="Harcamalar, bütçe takibi ve finansal planlama"
        icon={Wallet}
        gradient="linear-gradient(135deg, #22c55e, #14b8a6)"
      />
      <div style={{ padding: '24px 32px' }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Aylık Bütçe</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80' }}>
              {monthlyBudget > 0 ? `${monthlyBudget.toLocaleString('tr-TR')} ₺` : '—'}
            </div>
          </div>
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Toplam Harcama</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: totalExpenses > monthlyBudget && monthlyBudget > 0 ? '#f87171' : '#f1f5f9' }}>
              {totalExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </div>
          </div>
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Kalan Bütçe</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: remaining < 0 ? '#f87171' : '#2dd4bf' }}>
              {monthlyBudget > 0 ? `${remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '—'}
            </div>
          </div>
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Toplam İşlem</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f1f5f9' }}>{expenses.length}</div>
          </div>
        </div>

        {/* Progress bar */}
        {monthlyBudget > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Bütçe Kullanım Oranı</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: budgetPercent > 80 ? '#f87171' : '#4ade80' }}>%{budgetPercent}</span>
            </div>
            <div style={{ height: '12px', backgroundColor: '#2a2a3a', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${budgetPercent}%`,
                  background: budgetPercent > 80
                    ? 'linear-gradient(90deg, #ef4444, #f87171)'
                    : budgetPercent > 60
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #22c55e, #4ade80)',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>0 ₺</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{monthlyBudget.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {categoryEntries.length > 0 && (
          <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>Kategoriye Göre Harcama</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {categoryEntries.map(([cat, amount]) => {
                const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                return (
                  <div key={cat} style={{ backgroundColor: '#13131a', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{cat}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#4ade80' }}>{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>%{pct}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Expenses table */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Harcamalar</span>
            <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
              {expenses.length}
            </span>
          </div>
          <DataTable columns={expenseCols} data={expenses as Row[]} emptyMessage="Harcama kaydı bulunamadı" />
        </div>

        {/* Budget settings */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#14b8a6' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>Bütçe Ayarları</span>
          </div>
          <DataTable columns={settingsCols} data={settings as Row[]} emptyMessage="Bütçe ayarı bulunamadı" />
        </div>
      </div>
    </div>
  )
}
