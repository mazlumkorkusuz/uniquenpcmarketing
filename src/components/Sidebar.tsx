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
  BarChart2,
  Newspaper,
  Star,
  CalendarCheck,
  ChevronRight,
  ChevronDown,
  LogOut,
  Mail,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { useAuth } from '@/components/AppShell'
import { useState, useEffect } from 'react'

interface SubNavItem {
  href: string
  label: string
  imageSrc?: string
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  imageSrc?: string
  children?: SubNavItem[]
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/platformlar',
    label: 'Platformlar & Partnerler',
    icon: Globe,
    children: [
      { href: '/platformlar/lurkit', label: 'Lurkit' },
      { href: '/platformlar/terminals', label: 'Terminals.io' },
      { href: '/platformlar/mythic-talent', label: 'Mythic Talent' },
    ],
  },
  {
    href: '/yayincilar',
    label: 'Yayıncılar',
    icon: Tv2,
    children: [
      { href: '/yayincilar/twitch',   label: 'Twitch',   imageSrc: '/icons/twitch.png' },
      { href: '/yayincilar/kick',     label: 'Kick',     imageSrc: '/icons/kick.png' },
      { href: '/yayincilar/soop',     label: 'SOOP',     imageSrc: '/icons/soop.jpeg' },
      { href: '/yayincilar/youtube',  label: 'YouTube',  imageSrc: '/icons/youtube.png' },
      { href: '/yayincilar/chzzk',    label: 'Chzzk',    imageSrc: '/icons/chzzk.png' },
      { href: '/yayincilar/bilibili', label: 'BiliBili', imageSrc: '/icons/bilibili.png' },
      { href: '/yayincilar/douyin',   label: 'Douyin',   imageSrc: '/icons/tiktok.png' },
    ],
  },
  { href: '/toplantilar', label: 'Toplantılar', icon: Calendar },
  { href: '/notlar', label: 'Notlar', icon: FileText },
  {
    href: '/sosyal-medya',
    label: 'Sosyal Medya',
    icon: Share2,
    children: [
      { href: '/sosyal-medya/twitter',   label: 'Twitter',   imageSrc: '/icons/x.png' },
      { href: '/sosyal-medya/instagram', label: 'Instagram', imageSrc: '/icons/instagram.png' },
      { href: '/sosyal-medya/tiktok',    label: 'TikTok',    imageSrc: '/icons/tiktok.png' },
    ],
  },
  { href: '/reddit', label: 'Reddit', icon: MessageCircle, imageSrc: '/icons/reddit.svg' },
  { href: '/butce', label: 'Bütçe Yönetimi', icon: Wallet },
  {
    href: '/icerik-planlama',
    label: 'İçerik Planlaması',
    icon: CalendarCheck,
    children: [
      { href: '/icerik-planlama/tiktok',    label: 'TikTok',    imageSrc: '/icons/tiktok.png' },
      { href: '/icerik-planlama/instagram', label: 'Instagram', imageSrc: '/icons/instagram.png' },
      { href: '/icerik-planlama/twitter',   label: 'Twitter',   imageSrc: '/icons/x.png' },
      { href: '/icerik-planlama/linkedin',  label: 'LinkedIn',  imageSrc: '/icons/linkedin.png' },
      { href: '/icerik-planlama/youtube',   label: 'YouTube',   imageSrc: '/icons/youtube.png' },
      { href: '/icerik-planlama/reddit',    label: 'Reddit',    imageSrc: '/icons/reddit.svg' },
      { href: '/icerik-planlama/ig',        label: 'IG',        imageSrc: '/icons/instagram.png' },
    ],
  },
  { href: '/steam-kuratorleri', label: 'Steam Küratörleri', icon: Star, imageSrc: '/icons/steamlogo.png' },
  { href: '/gamalytic', label: 'Gamalytic', icon: BarChart2, imageSrc: '/icons/gamalytic-logo.svg' },
  { href: '/news', label: 'News', icon: Newspaper },
  {
    href: '/mail-servisi',
    label: 'Mail Servisi',
    icon: Mail,
    children: [
      { href: '/mail-servisi/kampanyalar',      label: 'Kampanyalar' },
      { href: '/mail-servisi/kampanyalar/yeni', label: 'Yeni Kampanya' },
      { href: '/mail-servisi/sablonlar',        label: 'Şablon Oluştur' },
      { href: '/mail-servisi/tracking',         label: 'Tracking' },
      { href: '/mail-servisi/ayarlar',          label: 'Ayarlar' },
    ],
  },
]

export default function Sidebar({ open = false }: { open?: boolean }) {
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
      id="app-sidebar"
      className={open ? 'app-sidebar open' : 'app-sidebar'}
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-card)',
        borderRight: '1px solid var(--color-border-card)',
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
          borderBottom: '1px solid var(--color-border-card)',
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
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
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111111', lineHeight: 1.2 }}>
            Unique NPC
          </div>
          <div style={{ fontSize: '11px', color: '#444444', marginTop: '2px' }}>
            Marketing
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '8px', paddingLeft: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Navigasyon
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const hasChildren = !!item.children
          const inSection = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          // Items with children only go black on their own page; on a child page the child is black instead
          const isActive = hasChildren ? pathname === item.href : inSection
          const isExpanded = expanded.has(item.href)

          return (
            <div key={item.href} style={{ marginBottom: '2px' }}>
              {/* Main nav row */}
              <div
                className={isActive ? 'nav-item active' : 'nav-item'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  color: isActive ? '#FFFFFF' : inSection ? '#111111' : '#444444',
                  fontSize: '13.5px',
                  fontWeight: isActive || inSection ? 600 : 500,
                  backgroundColor: isActive ? '#111111' : 'transparent',
                  border: '1px solid transparent',
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
                  {item.imageSrc ? (
                    <img
                      src={item.imageSrc}
                      alt={item.label}
                      style={{ width: '17px', height: '17px', objectFit: 'contain', borderRadius: '3px', flexShrink: 0, opacity: isActive || inSection ? 1 : 0.8, backgroundColor: isActive ? '#FFFFFF' : 'transparent', padding: isActive ? '1px' : 0 }}
                    />
                  ) : (
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  )}
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
                        className={isChildActive ? 'sub-nav-item active' : 'sub-nav-item'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          color: isChildActive ? '#FFFFFF' : '#444444',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: isChildActive ? 600 : 400,
                          marginBottom: '1px',
                          backgroundColor: isChildActive ? '#111111' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {child.imageSrc ? (
                          <img
                            src={child.imageSrc}
                            alt={child.label}
                            style={{ width: '15px', height: '15px', objectFit: 'contain', borderRadius: '3px', flexShrink: 0, opacity: isChildActive ? 1 : 0.8, backgroundColor: isChildActive ? '#FFFFFF' : 'transparent', padding: isChildActive ? '1px' : 0 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: isChildActive ? '#FFFFFF' : '#BDBDBD',
                              flexShrink: 0,
                            }}
                          />
                        )}
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
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-card)' }}>
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border-card)',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#111111',
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
                  color: '#111111',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </div>
              <div style={{ fontSize: '10px', color: '#16A34A' }}>● Aktif</div>
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
            color: '#DC2626',
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
