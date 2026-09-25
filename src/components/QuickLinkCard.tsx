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
          backgroundColor: hovered ? '#F0F0F0' : '#FFFFFF',
          border: `1px solid ${hovered ? color + '60' : '#E0E0E0'}`,
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
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: '#6B6B6B' }}>{desc}</div>
      </div>
    </Link>
  )
}
