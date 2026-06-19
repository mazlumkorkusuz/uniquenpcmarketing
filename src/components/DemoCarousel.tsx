'use client'

import { useEffect, useRef, useState } from 'react'

interface DemoItem {
  appid: number
  name: string
  fullgame_appid: number | null
  image_url: string
}

interface Props {
  onSelect: (item: { id: number; name: string; tiny_image: string }) => void
}

export default function DemoCarousel({ onSelect }: Props) {
  const [demos, setDemos] = useState<DemoItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    fetch('/api/steam-demos')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setDemos(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || isPaused) return
    let frame: number
    const scroll = () => {
      container.scrollLeft += 0.5
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0
      }
      frame = requestAnimationFrame(scroll)
    }
    frame = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(frame)
  }, [isPaused])

  if (!demos.length) return null

  const track = [...demos, ...demos]

  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <div
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ display: 'flex', gap: '12px', overflowX: 'hidden', scrollBehavior: 'auto' }}
      >
        {track.map((demo, i) => (
          <div
            key={i}
            style={{ flexShrink: 0, width: '220px', cursor: 'pointer' }}
            onClick={() => onSelect({
              id:         demo.fullgame_appid || demo.appid,
              name:       demo.name,
              tiny_image: demo.image_url,
            })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={demo.image_url}
              alt={demo.name}
              width={220}
              height={82}
              style={{ borderRadius: '8px', width: '220px', height: '82px', objectFit: 'cover' }}
              onError={e => {
                const parent = e.currentTarget.parentElement
                if (parent) parent.style.display = 'none'
              }}
            />
            <p style={{ fontSize: '11px', marginTop: '4px', color: '#ccc', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {demo.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
