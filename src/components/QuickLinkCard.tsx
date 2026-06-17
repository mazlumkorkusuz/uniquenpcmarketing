'use client'

import Link from 'next/link'
import { useState } from 'react'

interface QuickLinkCardProps {
  href: string
  label: string
  desc: string
  color: string
}

export default function QuickLinkCard({ href, label, desc, color }: QuickLinkCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: hovered ? '#22222f' : '#1a1a24',
          border: `1px solid ${hovered ? color + '60' : '#2a2a3a'}`,
          borderRadius: '10px',
          padding: '16px',
          transition: 'all 0.15s ease',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
            marginBottom: '10px',
          }}
        />
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>{desc}</div>
      </div>
    </Link>
  )
}
