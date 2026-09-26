import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import s from '@/app/dashboard.module.css'

export type Tone = 'violet' | 'rose' | 'blue' | 'green' | 'amber' | 'red' | 'neutral'

interface QuickLinkCardProps {
  href: string
  label: string
  tone: Tone
  toneClass: string
  icon?: LucideIcon
  imageSrc?: string
}

export default function QuickLinkCard({ href, label, toneClass, icon: Icon, imageSrc }: QuickLinkCardProps) {
  return (
    <Link href={href} className={s.quickCard}>
      <span className={`${s.quickIcon} ${toneClass}`} aria-hidden>
        {imageSrc ? <img src={imageSrc} alt="" /> : Icon ? <Icon size={16} /> : null}
      </span>
      {label}
    </Link>
  )
}
