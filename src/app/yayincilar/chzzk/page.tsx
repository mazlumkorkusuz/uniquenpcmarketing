import PageHeader from '@/components/PageHeader'
import { Tv2 } from 'lucide-react'

export default function ChzzkPage() {
  return (
    <div>
      <PageHeader title="Chzzk Yayıncıları" subtitle="Chzzk platformu takibi" icon={Tv2} gradient="linear-gradient(135deg, #00ffa3, #00b377)" />
      <div style={{ padding: '24px 32px' }}>
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'rgba(0,255,163,0.08)', border: '1px solid rgba(0,255,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Tv2 size={24} color="#00ffa3" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>Henüz Veri Yok</div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Chzzk yayıncı verileri henüz eklenmemiştir.</div>
          <div style={{ fontSize: '12px', color: '#475569' }}>Supabase'e chzzk_streamers tablosu eklendiğinde burada görüntülenecektir.</div>
        </div>
      </div>
    </div>
  )
}
