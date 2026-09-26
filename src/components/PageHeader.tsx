import { LucideIcon } from 'lucide-react'
import { TitleReveal } from '@/components/effects/Effects'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  imageSrc?: string
  gradient: string
  children?: React.ReactNode
}

// Page title block in the dashboard's style: glass icon tile tinted with the page's brand
// gradient, Space Grotesk display title, muted subtitle, actions on the right.
export default function PageHeader({ title, subtitle, icon: Icon, imageSrc, gradient, children }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: '28px 32px 20px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div
          style={{
            position: 'relative',
            width: '48px',
            height: '48px',
            borderRadius: 'var(--r-md)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
            boxShadow: 'var(--shadow-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: gradient, opacity: 0.14 }} />
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              style={{ position: 'relative', width: '24px', height: '24px', objectFit: 'contain', display: 'block' }}
            />
          ) : Icon ? (
            <Icon size={20} color="var(--primary-ink)" strokeWidth={1.9} style={{ position: 'relative' }} />
          ) : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 2.6vw, 32px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            <TitleReveal text={title} />
          </h1>
          {subtitle && (
            <p style={{ fontSize: '14px', color: 'var(--ink-3)', margin: '6px 0 0 0' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>}
    </div>
  )
}
