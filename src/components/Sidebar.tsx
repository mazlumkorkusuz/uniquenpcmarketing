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
  ChevronDown,
  LogOut,
  Mail,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { useAuth } from '@/components/AppShell'
import { useState, useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

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
    <aside id="app-sidebar" className={open ? 'app-sidebar open' : 'app-sidebar'}>
      {/* Workspace (dashboard-01 style team card) */}
      <div className="sidebar-workspace">
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'var(--card)',
            boxShadow: '0 0 0 1px var(--sidebar-border)',
          }}
        >
          <Image
            src="/uniqlogo.png"
            alt="Unique NPC Games"
            width={34}
            height={34}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
            priority
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--sidebar-foreground)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Unique NPC
          </div>
          <div style={{ fontSize: '12px', color: 'var(--sidebar-muted)', marginTop: '1px' }}>Marketing</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '6px 12px 12px', flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const hasChildren = !!item.children
          const inSection = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          // Items with children are only active on their own page; on a child page the child is active instead
          const isActive = hasChildren ? pathname === item.href : inSection
          const isExpanded = expanded.has(item.href)

          return (
            <div key={item.href} style={{ marginBottom: '1px' }}>
              <div className={`nav-item${isActive ? ' active' : inSection ? ' in-section' : ''}`}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={hasChildren ? () => setExpanded((prev) => { const n = new Set(prev); n.add(item.href); return n }) : undefined}
                >
                  {item.imageSrc ? (
                    <img src={item.imageSrc} alt="" />
                  ) : (
                    <Icon size={16} strokeWidth={1.75} />
                  )}
                  <span>{item.label}</span>
                </Link>
                {hasChildren && (
                  <button
                    className="nav-expand"
                    onClick={() => toggleExpand(item.href)}
                    aria-label={isExpanded ? `${item.label} menüsünü kapat` : `${item.label} menüsünü aç`}
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown size={14} style={{ transform: isExpanded ? 'none' : 'rotate(-90deg)' }} />
                  </button>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="sub-nav">
                  {item.children!.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={isChildActive ? 'page' : undefined}
                        className={isChildActive ? 'sub-nav-item active' : 'sub-nav-item'}
                      >
                        {child.imageSrc ? <img src={child.imageSrc} alt="" /> : <span className="sub-nav-dot" />}
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

      {/* Account */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ThemeToggle />
        <div className="sidebar-user">
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--gradient)',
              boxShadow: 'inset 0 0 0 1px var(--sidebar-border)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--gradient-foreground)',
            }}
          >
            {user?.email?.[0].toUpperCase() ?? 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', color: 'var(--sidebar-foreground)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email ?? '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--sidebar-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE9A' }} />
              Aktif
            </div>
          </div>
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Çıkış Yap"
            aria-label={loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış Yap'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
