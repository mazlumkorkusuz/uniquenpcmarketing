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
      backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)',
      border: '1px solid #E8E4F1',
      borderRadius: '12px',
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
          fontFamily: 'var(--font-display)', fontSize: '18px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', fontWeight: 600, color: '#17122B', flexShrink: 0,
          boxShadow: 'none',
        }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#C2410C', fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em' }}>u/{username}</div>
          {createdDate && (
            <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '2px' }}>Katılım: {createdDate}</div>
          )}
          {subreddits.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
              {subreddits.slice(0, 4).map((s, i) => (
                <span key={i} style={{
                  fontSize: '12px', backgroundColor: 'rgba(255,69,0,0.1)', color: '#C2410C',
                  border: '1px solid rgba(255,69,0,0.22)', borderRadius: '8px', padding: '1px 6px',
                }}>r/{s}</span>
              ))}
              {subreddits.length > 4 && (
                <span style={{ fontSize: '12px', color: '#655F7D', alignSelf: 'center' }}>+{subreddits.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#C2410C' }}>{fmt(karma)}</div>
          <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '3px', }}>Karma</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#047857' }}>{fmt(commentKarma)}</div>
          <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '3px', }}>Yorum K.</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '-0.01em', fontWeight: 600, color: '#1D4ED8' }}>{fmt(postCount)}</div>
          <div style={{ fontSize: '12px', color: '#655F7D', marginTop: '3px', }}>Post</div>
        </div>
      </div>

      {/* Password */}
      {password && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '8px 12px',
          border: '1px solid #E8E4F1',
        }}>
          <span style={{ fontSize: '12px', color: '#655F7D', flexShrink: 0, }}>Şifre</span>
          <span style={{
            fontSize: '14px', color: '#17122B', fontFamily: 'monospace', flex: 1,
            letterSpacing: showPassword ? 'normal' : '3px',
          }}>
            {showPassword ? password : '••••••••'}
          </span>
          <button
            onClick={() => setShowPassword(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#655F7D', padding: '2px', display: 'flex', alignItems: 'center' }}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: '12px', color: '#655F7D', borderTop: '1px solid #E8E4F1', paddingTop: '10px' }}>
        Son aktif: {createdDate ?? '—'}
      </div>
    </div>
  )
}
