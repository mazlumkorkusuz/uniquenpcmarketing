import { Settings, Mail } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MAIL_GRADIENT } from '../_components/ui'

interface AccountCard {
  id: string
  name: string
  email: string
  status: string
}

export default async function AyarlarPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('mail_accounts').select('id, name, email, status').order('created_at')
  const accounts = (data ?? []) as AccountCard[]

  return (
    <div>
      <PageHeader title="Mail Ayarları" subtitle="Mail hesapları" icon={Settings} gradient={MAIL_GRADIENT} />

      <div style={{ padding: '24px 32px' }}>
        {accounts.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>Henüz mail hesabı yok.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {accounts.map((a) => (
              <div
                key={a.id}
                style={{
                  backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: MAIL_GRADIENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Mail size={18} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>{a.name}</div>
                  <div style={{ fontSize: '13px', color: '#444444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>
                </div>
                <Badge variant={a.status === 'active' ? 'green' : 'gray'}>{a.status === 'active' ? 'Aktif' : 'Pasif'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
