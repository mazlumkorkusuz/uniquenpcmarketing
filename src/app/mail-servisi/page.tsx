import PageHeader from '@/components/PageHeader'
import { Mail } from 'lucide-react'

export default function MailServisiPage() {
  return (
    <div>
      <PageHeader title="Mail Servisi" icon={Mail} gradient="linear-gradient(135deg, #f59e0b, #ef4444)" />
      <p style={{ fontSize: '14px', color: '#94a3b8' }}>Mail Servisi yakında</p>
    </div>
  )
}
