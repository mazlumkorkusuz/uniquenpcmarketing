import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  imageSrc?: string
  gradient: string
  children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, icon: Icon, imageSrc, gradient, children }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: '24px 32px',
        borderBottom: '1px solid #2a2a3a',
        backgroundColor: '#13131a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={title}
              style={{ width: '28px', height: '28px', objectFit: 'contain', display: 'block' }}
            />
          ) : Icon ? (
            <Icon size={22} color="white" />
          ) : null}
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{children}</div>}
    </div>
  )
}
