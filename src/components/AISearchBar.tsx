'use client'

import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'

export default function AISearchBar() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginBottom: '28px' }}>
      <div
        onClick={() => setOpen(true)}
        style={{
          background: 'linear-gradient(#0a0a0f, #0a0a0f) padding-box, linear-gradient(135deg, #7c3aed, #3b82f6) border-box',
          border: '1px solid transparent',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          cursor: 'text',
          transition: 'box-shadow 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
      >
        <Sparkles size={17} color="#a78bfa" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '14px', color: '#475569', userSelect: 'none' }}>
          Verilerinizi sorgulayın... (örn: &apos;Kaç Twitch yayıncımız var?&apos;)
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '3px 8px', flexShrink: 0, letterSpacing: '0.04em' }}>
          AI
        </span>
      </div>

      {open && (
        <div
          style={{
            marginTop: '8px',
            padding: '11px 16px',
            background: 'linear-gradient(#13131a, #13131a) padding-box, linear-gradient(135deg, #7c3aed44, #3b82f644) border-box',
            border: '1px solid transparent',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Sparkles size={14} color="#a78bfa" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#a78bfa', flex: 1 }}>Yakında hizmetinizde</span>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569' }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
