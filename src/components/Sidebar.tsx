'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Globe,
  Tv2,
  Calendar,
  FileText,
  Share2,
  MessageCircle,
  Wallet,
  ChevronRight,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { useAuth } from '@/components/AppShell'
import { useState, useEffect } from 'react'

interface SubNavItem {
  href: string
  label: string
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  children?: SubNavItem[]
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/platformlar', label: 'Platformlar & Partnerler', icon: Globe },
  {
    href: '/yayincilar',
    label: 'Yayıncılar',
    icon: Tv2,
    children: [
      { href: '/yayincilar/twitch', label: 'Twitch' },
      { href: '/yayincilar/kick', label: 'Kick' },
      { href: '/yayincilar/soop', label: 'SOOP' },
      { href: '/yayincilar/niconico', label: 'NicoNico' },
      { href: '/yayincilar/chzzk', label: 'Chzzk' },
      { href: '/yayincilar/bilibili', label: 'BiliBili' },
      { href: '/yayincilar/douyin', label: 'Douyin' },
    ],
  },
  { href: '/toplantilar', label: 'Toplantılar', icon: Calendar },
  { href: '/notlar', label: 'Notlar', icon: FileText },
  {
    href: '/sosyal-medya',
    label: 'Sosyal Medya',
    icon: Share2,
    children: [
      { href: '/sosyal-medya/twitter', label: 'Twitter' },
      { href: '/sosyal-medya/instagram', label: 'Instagram' },
      { href: '/sosyal-medya/tiktok', label: 'TikTok' },
      { href: '/sosyal-medya/youtube', label: 'YouTube' },
    ],
  },
  { href: '/reddit', label: 'Reddit', icon: MessageCircle },
  { href: '/butce', label: 'Bütçe Yönetimi', icon: Wallet },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const item of navItems) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        s.add(item.href)
      }
    }
    return s
  })

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const item of navItems) {
        if (item.children?.some((c) => pathname.startsWith(c.href))) {
          next.add(item.href)
        }
      }
      return next
    })
  }, [pathname])

  const toggleExpand = (href: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: '#13131a',
        borderRight: '1px solid #2a2a3a',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid #2a2a3a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src="/uniqlogo.png"
            alt="Unique NPC Games"
            width={40}
            height={40}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
            priority
          />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
            Unique NPC
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Marketing
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '8px', paddingLeft: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Navigasyon
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const isExpanded = expanded.has(item.href)
          const hasChildren = !!item.children

          return (
            <div key={item.href} style={{ marginBottom: '2px' }}>
              {/* Main nav row */}
              <div
                className="nav-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  color: isActive ? '#a78bfa' : '#94a3b8',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  backgroundColor: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                <Link
                  href={item.href}
                  onClick={hasChildren ? () => setExpanded((prev) => { const n = new Set(prev); n.add(item.href); return n }) : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 4px 9px 12px',
                    flex: 1,
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {!hasChildren && isActive && <ChevronRight size={14} style={{ marginRight: '8px' }} />}
                </Link>
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(item.href)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '9px 10px',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ChevronDown
                      size={14}
                      style={{
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                )}
              </div>

              {/* Sub-items */}
              {hasChildren && isExpanded && (
                <div style={{ paddingLeft: '14px', paddingTop: '2px', paddingBottom: '2px' }}>
                  {item.children!.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="sub-nav-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          color: isChildActive ? '#a78bfa' : '#64748b',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: isChildActive ? 600 : 400,
                          marginBottom: '1px',
                          backgroundColor: isChildActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                          borderLeft: isChildActive ? '2px solid #7c3aed' : '2px solid transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: isChildActive ? '#a78bfa' : '#3a3a4a',
                            flexShrink: 0,
                          }}
                        />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer / User / Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2a3a' }}>
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '11px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              {user.email?.[0].toUpperCase() ?? 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#f1f5f9',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </div>
              <div style={{ fontSize: '10px', color: '#4ade80' }}>● Aktif</div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
            fontSize: '13.5px',
            fontWeight: 500,
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            opacity: loggingOut ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!loggingOut) {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.15)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)'
          }}
        >
          <LogOut size={15} />
          <span>{loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}</span>
        </button>
      </div>
    </aside>
  )
}
