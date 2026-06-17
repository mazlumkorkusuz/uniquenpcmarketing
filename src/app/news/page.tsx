import { Newspaper } from 'lucide-react'

export default function NewsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 8px 32px rgba(245,158,11,0.3)' }}>
        <Newspaper size={28} color="white" />
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>News</h1>
      <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Yakında hizmetinizde</p>
    </div>
  )
}
