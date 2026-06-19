'use client'

import { useState, useEffect, useRef } from 'react'

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
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/steam-demos')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setDemos(data) })
      .catch(() => {})
  }, [])

  if (!demos.length) return null

  const track = [...demos, ...demos]

  const pause  = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'paused' }
  const resume = () => { if (trackRef.current) trackRef.current.style.animationPlayState = 'running' }

  return (
    <div style={{ marginBottom: '28px' }}>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0px); }
          100% { transform: translateX(-50%); }
        }
        .demo-marquee-track {
          animation: marquee 90s linear infinite;
        }
        .demo-marquee-card {
          flex-shrink: 0;
          width: 220px;
          border: 1px solid #2a2a3a;
          border-radius: 10px;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          background-color: #1a1a24;
          text-align: left;
          transition: border-color 0.15s;
        }
        .demo-marquee-card:hover { border-color: #7c3aed; }
      `}</style>

      <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
        🎮 Demo Vitrini
      </div>

      <div style={{ overflow: 'hidden', width: '100%' }}>
        <div
          ref={trackRef}
          className="demo-marquee-track"
          style={{ display: 'flex', gap: '12px', width: 'max-content' }}
          onMouseEnter={pause}
          onMouseLeave={resume}
        >
          {track.map((demo, i) => (
            <button
              key={`${demo.appid}-${i}`}
              className="demo-marquee-card"
              onClick={() => onSelect({
                id:         demo.fullgame_appid ?? demo.appid,
                name:       demo.name,
                tiny_image: demo.image_url,
              })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={demo.image_url}
                alt={demo.name}
                width={231}
                height={87}
                style={{ display: 'block', objectFit: 'cover', width: '100%', height: '83px' }}
                onError={e => {
                  const card = (e.currentTarget as HTMLElement).closest('button') as HTMLElement | null
                  if (card) card.style.display = 'none'
                }}
              />
              <div style={{ padding: '5px 8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {demo.name}
                </div>
                <span style={{ flexShrink: 0, fontSize: '9px', fontWeight: 700, color: '#4ade80', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', padding: '1px 5px', letterSpacing: '0.04em' }}>
                  DEMO
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
