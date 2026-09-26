'use client'
import { useState } from 'react'
import { Plus, ExternalLink } from 'lucide-react'
import { EditButton } from './EditButton'
import { DeleteButton } from './DeleteButton'
import { RedditPostModal } from './RedditPostModal'

type Row = Record<string, unknown>
type Account = { id?: string | number; username?: unknown; [key: string]: unknown }

interface RedditPostsSectionProps {
  posts: Row[]
  accounts: Account[]
}

function PostStatusBadge({ status }: { status: unknown }) {
  const s = String(status ?? '')
  if (s === 'Yayında') return (
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#046C4E', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '5px', padding: '2px 8px', whiteSpace: 'nowrap' }}>Yayında</span>
  )
  if (s === 'Silindi') return (
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#B91C1C', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', padding: '2px 8px', whiteSpace: 'nowrap' }}>Silindi</span>
  )
  if (!s) return <span style={{ color: '#655F7D' }}>—</span>
  return (
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4A4462', backgroundColor: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '5px', padding: '2px 8px', whiteSpace: 'nowrap' }}>{s}</span>
  )
}

function EditRedditPostButton({ row, accounts }: { row: Row; accounts: Account[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <EditButton onClick={() => setOpen(true)} />
      <RedditPostModal mode="edit" initialData={row} accounts={accounts} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const TH: React.CSSProperties = {
  backgroundColor: 'rgba(23,18,43,0.02)', color: '#655F7D', fontSize: '12.5px', fontWeight: 500,
  padding: '11px 16px',
  textAlign: 'left', borderBottom: '1px solid #E8E4F1', whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = { padding: '12px 16px' }

export function RedditPostsSection({ posts, accounts }: RedditPostsSectionProps) {
  const [filter, setFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = filter ? posts.filter(p => String(p.username ?? '') === filter) : posts

  return (
    <div style={{ backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
      {/* Section header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E4F1', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#17122B' }}>Paylaşılan Postlar</span>
        <span style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#A24B08', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', padding: '2px 10px', fontSize: '13px', fontWeight: 600 }}>
          {filtered.length}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E4F1', borderRadius: '7px', padding: '6px 12px', fontSize: '13px', color: '#17122B', cursor: 'pointer', outline: 'none' }}
          >
            <option value="">Tüm hesaplar</option>
            {accounts.map(a => (
              <option key={String(a.id)} value={String(a.username ?? '')}>u/{String(a.username ?? '')}</option>
            ))}
          </select>
          <button
            onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', backgroundColor: 'rgba(255,69,0,0.12)', border: '1px solid rgba(255,69,0,0.3)', color: '#A74322', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} />
            Post Ekle
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Hesap</th>
              <th style={TH}>Subreddit</th>
              <th style={TH}>Başlık</th>
              <th style={TH}>Tarih</th>
              <th style={TH}>Durum</th>
              <th style={TH}>Link</th>
              <th style={{ ...TH, width: '80px' }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#655F7D', fontSize: '14px' }}>
                  Post bulunamadı
                </td>
              </tr>
            ) : filtered.map((post, i) => (
              <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #E8E4F1' : 'none' }}>
                <td style={TD}>
                  {post.username ? (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#BA3200', backgroundColor: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.22)', borderRadius: '5px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      u/{String(post.username)}
                    </span>
                  ) : <span style={{ color: '#655F7D' }}>—</span>}
                </td>
                <td style={TD}>
                  {post.subreddit ? (
                    <span style={{ fontSize: '12px', color: '#A24B08', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: '5px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      r/{String(post.subreddit)}
                    </span>
                  ) : <span style={{ color: '#655F7D' }}>—</span>}
                </td>
                <td style={TD}>
                  <span style={{ fontWeight: 500, color: '#17122B', maxWidth: '240px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                    {String(post.title ?? '—')}
                  </span>
                </td>
                <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                  {post.posted_at ? (
                    <span style={{ fontSize: '12px', color: '#655F7D' }}>
                      {new Date(String(post.posted_at)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  ) : <span style={{ color: '#655F7D' }}>—</span>}
                </td>
                <td style={TD}>
                  <PostStatusBadge status={post.status} />
                </td>
                <td style={TD}>
                  {post.url ? (
                    <a href={String(post.url)} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', textDecoration: 'none' }}>
                      <ExternalLink size={12} />
                      Link
                    </a>
                  ) : <span style={{ color: '#655F7D' }}>—</span>}
                </td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <EditRedditPostButton row={post} accounts={accounts} />
                    <DeleteButton table="reddit_posts" id={post.id as string} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RedditPostModal mode="add" accounts={accounts} open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
