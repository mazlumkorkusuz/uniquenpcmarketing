'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Eye, Reply, AlertTriangle, Loader2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { MailRecipient } from '@/lib/mail'
import { RecipientStatusBadge } from './ui'

interface TrackingLog {
  id: string
  event: string
  ip: string | null
  user_agent: string | null
  created_at: string
}

// Exact timestamp: 27 Eylül 2026, 14:03:27
export function formatExact(v: string): string {
  return new Date(v).toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// Best-effort device/client from a user agent. Webmail providers fetch images through their own
// proxies, so for those the "device" is the provider, not the reader's machine.
export function describeUserAgent(ua: string | null): string {
  if (!ua) return 'Bilinmiyor'
  if (/GoogleImageProxy|ggpht\.com/i.test(ua)) return 'Gmail (Google görsel proxy)'
  if (/YahooMailProxy/i.test(ua)) return 'Yahoo Mail (proxy)'
  if (/Microsoft Outlook|ms-office|Outlook/i.test(ua)) return 'Outlook'
  if (/Thunderbird/i.test(ua)) return 'Thunderbird'

  const os =
    /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Windows/.test(ua) ? 'Windows'
    : /Linux/.test(ua) ? 'Linux'
    : null
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    // Apple Mail sends a WebKit UA without a Safari token
    : /AppleWebKit/.test(ua) && os && ['iPhone', 'iPad', 'macOS'].includes(os) ? 'Apple Mail'
    : null
  return [browser, os].filter(Boolean).join(' · ') || ua.slice(0, 60)
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
        {icon} {title}
      </h3>
      {children}
    </section>
  )
}

export default function RecipientDrawer({
  recipient,
  campaignName,
  onClose,
}: {
  recipient: MailRecipient
  campaignName: string | null
  onClose: () => void
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [visible, setVisible] = useState(false)
  const [logs, setLogs] = useState<TrackingLog[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('mail_tracking_logs')
      .select('id, event, ip, user_agent, created_at')
      .eq('recipient_id', recipient.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setLogs((data ?? []) as TrackingLog[])
      })
    return () => { cancelled = true }
  }, [supabase, recipient.id])

  const opens = logs?.filter((l) => l.event === 'open') ?? []
  const muted: React.CSSProperties = { fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="recipient-drawer-title" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
      />
      <aside
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(480px, 100vw)', overflowY: 'auto',
          backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)', boxShadow: '-12px 0 32px rgba(0,0,0,0.25)',
          transform: visible ? 'none' : 'translateX(100%)', transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Recipient */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="recipient-drawer-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', overflowWrap: 'anywhere' }}>
              {recipient.name ?? recipient.email}
            </h2>
            <p style={{ ...muted, marginTop: '4px', overflowWrap: 'anywhere' }}>{recipient.email}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <RecipientStatusBadge status={recipient.status} />
              {recipient.platform && <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{recipient.platform}</span>}
              {recipient.followers != null && (
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{recipient.followers.toLocaleString('tr-TR')} takipçi</span>
              )}
            </div>
            {campaignName && <p style={{ ...muted, marginTop: '10px' }}>Kampanya: <strong style={{ color: 'var(--foreground)' }}>{campaignName}</strong></p>}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Kapat"
            style={{ display: 'inline-flex', padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <Section title={`Açılma Geçmişi${logs ? ` (${opens.length})` : ''}`} icon={<Eye size={14} />}>
          {error ? (
            <p style={{ ...muted, color: 'var(--danger)' }}>Kayıtlar yüklenemedi: {error}</p>
          ) : !logs ? (
            <p style={{ ...muted, display: 'flex', alignItems: 'center', gap: '8px' }}><Loader2 size={13} className="animate-spin" /> Yükleniyor…</p>
          ) : opens.length === 0 ? (
            <p style={muted}>Henüz açılmadı.</p>
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {opens.map((l) => (
                <li key={l.id} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>{formatExact(l.created_at)}</div>
                  <div style={{ marginTop: '4px', color: 'var(--text-2)' }}>{describeUserAgent(l.user_agent)}</div>
                  <div style={{ marginTop: '2px', color: 'var(--muted-foreground)', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>IP: {l.ip ?? '—'}</div>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Cevap" icon={<Reply size={14} />}>
          {recipient.replied_at ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>{formatExact(recipient.replied_at)}</p>
              {recipient.reply_subject || recipient.reply_body ? (
                <div style={{ borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {recipient.reply_subject && (
                    <div style={{ padding: '10px 12px', borderBottom: recipient.reply_body ? '1px solid var(--border)' : undefined, fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', overflowWrap: 'anywhere' }}>
                      {recipient.reply_subject}
                    </div>
                  )}
                  {recipient.reply_body && (
                    <p style={{ margin: 0, padding: '10px 12px', fontSize: '13px', lineHeight: 1.55, color: 'var(--text-2)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {recipient.reply_body}
                    </p>
                  )}
                </div>
              ) : (
                <p style={muted}>Cevap içeriği yok (elle işaretlendi veya içerik kaydedilmeden önce senkronize edildi).</p>
              )}
            </div>
          ) : (
            <p style={muted}>Henüz cevap yok</p>
          )}
        </Section>

        <Section title="Bounce" icon={<AlertTriangle size={14} />}>
          {recipient.bounced_at ? (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--danger)' }}>
              <strong>{recipient.bounce_type === 'hard' ? 'Kalıcı (hard)' : recipient.bounce_type === 'soft' ? 'Geçici (soft)' : recipient.bounce_type ?? 'Bounce'}</strong>
              {' — '}{formatExact(recipient.bounced_at)}
            </p>
          ) : (
            <p style={muted}>Bounce yok</p>
          )}
        </Section>
      </aside>
    </div>
  )
}
