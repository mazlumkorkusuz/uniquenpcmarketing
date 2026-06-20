'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { EditRedditAccountButton } from './RedditAccountModal'
import { DeleteButton } from './DeleteButton'

type Account = Record<string, unknown>

function fmt(n: number) {
  return n.toLocaleString('tr-TR')
}

function fmtDate(v: unknown) {
  if (!v) return null
  return new Date(String(v)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function RedditAccountCard({ account }: { account: Account }) {
  const [showPassword, setShowPassword] = useState(false)

  const username = String(account.username ?? 'unknown')
  const initial = username.charAt(0).toUpperCase()
  const karma = Number(account.karma || 0)
  const commentKarma = Number(account.comment_karma || 0)
  const postCount = Number(account.post_count || 0)
  const password = account.password ? String(account.password) : null
  const subreddits = account.subreddits
    ? String(account.subreddits).split(',').map((s: string) => s.trim()).filter(Boolean)
    : []
  const createdDate = fmtDate(account.created ?? account.created_at)

  return (
    <div style={{
      backgroundColor: '#1a1a24',
      border: '1px solid #2a2a3a',
      borderRadius: '14px',
      padding: '20px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Actions */}
      <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '4px' }}>
        <EditRedditAccountButton row={account} />
        <DeleteButton table="reddit_accounts" id={account.id as string} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingRight: '68px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          backgroundColor: '#ff4500', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 800, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 12px rgba(255,69,0,0.35)',
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#ff4500', fontSize: '15px' }}>u/{username}</div>
          {createdDate && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Katılım: {createdDate}</div>
          )}
          {subreddits.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
              {subreddits.slice(0, 4).map((s, i) => (
                <span key={i} style={{
                  fontSize: '11px', backgroundColor: 'rgba(255,69,0,0.1)', color: '#ff6534',
                  border: '1px solid rgba(255,69,0,0.22)', borderRadius: '4px', padding: '1px 6px',
                }}>r/{s}</span>
              ))}
              {subreddits.length > 4 && (
                <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>+{subreddits.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ backgroundColor: '#13131a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24' }}>{fmt(karma)}</div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Karma</div>
        </div>
        <div style={{ backgroundColor: '#13131a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#4ade80' }}>{fmt(commentKarma)}</div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Yorum K.</div>
        </div>
        <div style={{ backgroundColor: '#13131a', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>{fmt(postCount)}</div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Post</div>
        </div>
      </div>

      {/* Password */}
      {password && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#13131a', borderRadius: '8px', padding: '8px 12px',
          border: '1px solid #2a2a3a',
        }}>
          <span style={{ fontSize: '11px', color: '#64748b', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Şifre</span>
          <span style={{
            fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace', flex: 1,
            letterSpacing: showPassword ? 'normal' : '3px',
          }}>
            {showPassword ? password : '••••••••'}
          </span>
          <button
            onClick={() => setShowPassword(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px', display: 'flex', alignItems: 'center' }}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: '11px', color: '#475569', borderTop: '1px solid #2a2a3a', paddingTop: '10px' }}>
        Son aktif: {createdDate ?? '—'}
      </div>
    </div>
  )
}
