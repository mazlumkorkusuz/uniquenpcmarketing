'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ImageOff, X } from 'lucide-react'

export type MediaKind = 'logo' | 'banner'

// Images are served by each account's website at /images/Logo{n}.jpg and /images/Banner{n}.jpg.
// Numbers that don't exist are simply hidden once they fail to load.
const MEDIA_COUNTS: Record<MediaKind, number> = { logo: 4, banner: 16 }
const MEDIA_PREFIX: Record<MediaKind, string> = { logo: 'Logo', banner: 'Banner' }
const TABS: { kind: MediaKind; label: string }[] = [
  { kind: 'logo', label: 'Logolar' },
  { kind: 'banner', label: 'Bannerlar' },
]

// "https://site.com/" or "site.com/path" → "site.com"
export function normalizeDomain(domain: string | null | undefined): string | null {
  const host = domain?.trim().replace(/^https?:\/\//i, '').split(/[/?#]/)[0]
  return host || null
}

export function mediaUrls(domain: string, kind: MediaKind): string[] {
  return Array.from({ length: MEDIA_COUNTS[kind] }, (_, i) => `https://${domain}/images/${MEDIA_PREFIX[kind]}${i + 1}.jpg`)
}

export default function MediaLibrary({
  domain,
  initialKind,
  selected,
  onSelect,
  onClose,
}: {
  domain: string
  initialKind: MediaKind
  selected: Partial<Record<MediaKind, string | null>>
  onSelect: (kind: MediaKind, url: string) => void
  onClose: () => void
}) {
  const [kind, setKind] = useState<MediaKind>(initialKind)
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState<Set<string>>(new Set())
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  const urls = mediaUrls(domain, kind)
  const visible = urls.filter((u) => !failed.has(u))
  const settled = urls.every((u) => failed.has(u) || loaded.has(u))

  const markFailed = (url: string) => setFailed((s) => new Set(s).add(url))
  const markLoaded = (url: string) => setLoaded((s) => new Set(s).add(url))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-library-title"
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(5,5,8,0.96)', backdropFilter: 'blur(6px)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 id="media-library-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f0f0f0' }}>Medya Kütüphanesi</h2>
        <span style={{ fontSize: '13px', color: '#8a8d98' }}>{domain}/images</span>
        <div style={{ flex: 1 }} />
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Kapat"
          className="media-close"
          style={{ display: 'inline-flex', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#f0f0f0', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      <div role="tablist" aria-label="Medya türü" style={{ display: 'flex', gap: '4px', padding: '14px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map((t) => {
          const active = t.kind === kind
          return (
            <button
              key={t.kind}
              role="tab"
              aria-selected={active}
              onClick={() => setKind(t.kind)}
              style={{
                padding: '10px 16px', marginBottom: '-1px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: 'transparent',
                border: 'none', borderBottom: `2px solid ${active ? '#f0f0f0' : 'transparent'}`, color: active ? '#f0f0f0' : '#8a8d98',
              }}
            >
              {t.label}
              {settled && active && <span style={{ marginLeft: '8px', fontWeight: 500, color: '#8a8d98' }}>{visible.length}</span>}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>
        {settled && visible.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#8a8d98', fontSize: '14px', textAlign: 'center' }}>
            <ImageOff size={28} strokeWidth={1.5} />
            <span>
              {domain}/images altında {kind === 'logo' ? 'logo' : 'banner'} bulunamadı.
              <br />
              Beklenen dosyalar: {MEDIA_PREFIX[kind]}1.jpg, {MEDIA_PREFIX[kind]}2.jpg…
            </span>
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '16px',
              gridTemplateColumns: kind === 'logo' ? 'repeat(auto-fill, minmax(180px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
          >
            {visible.map((url) => {
              const isSelected = selected[kind] === url
              const file = url.split('/').pop()
              return (
                <li key={url}>
                  <button
                    onClick={() => onSelect(kind, url)}
                    aria-pressed={isSelected}
                    className="media-card"
                    data-selected={isSelected || undefined}
                    style={{ width: '100%', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
                  >
                    <span
                      className="media-thumb"
                      style={{ aspectRatio: kind === 'logo' ? '1 / 1' : '16 / 9', ...(loaded.has(url) ? { background: '#111217', animation: 'none' } : {}) }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={file}
                        loading="lazy"
                        onLoad={() => markLoaded(url)}
                        onError={() => markFailed(url)}
                        style={{ width: '100%', height: '100%', objectFit: kind === 'logo' ? 'contain' : 'cover', padding: kind === 'logo' ? '14px' : 0, opacity: loaded.has(url) ? 1 : 0 }}
                      />
                      {isSelected && (
                        <span style={{ position: 'absolute', top: '10px', right: '10px', display: 'inline-flex', padding: '4px', borderRadius: '999px', backgroundColor: '#f0f0f0', color: '#000' }}>
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <style>{`
        .media-card {
          display: block;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: #0c0d11;
          overflow: hidden;
          transition: border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }
        .media-card:hover { border-color: rgba(255,255,255,0.28); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .media-card:focus-visible { outline: 2px solid #f0f0f0; outline-offset: 2px; }
        .media-card[data-selected] { border-color: #f0f0f0; }
        .media-thumb {
          position: relative;
          display: block;
          width: 100%;
          background: linear-gradient(100deg, #111217 30%, #1a1b22 50%, #111217 70%) 0 0 / 200% 100%;
          animation: media-shimmer 1.4s linear infinite;
        }
        .media-close:hover { background: rgba(255,255,255,0.08) !important; }
        .media-close:focus-visible { outline: 2px solid #f0f0f0; outline-offset: 2px; }
        @keyframes media-shimmer { to { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) {
          .media-card, .media-thumb { transition: none; animation: none; }
          .media-card:hover { transform: none; }
        }
      `}</style>
    </div>
  )
}
