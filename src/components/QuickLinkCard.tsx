import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import s from '@/app/dashboard.module.css'

interface QuickLinkCardProps {
  href: string
  label: string
  desc: string
  color: string
  icon?: LucideIcon
  imageSrc?: string
}

export default function QuickLinkCard({ href, label, desc, color, icon: Icon, imageSrc }: QuickLinkCardProps) {
  return (
    <Link href={href} className={s.quickCard}>
      <span className={s.quickIcon} style={{ backgroundColor: color + '14', color }} aria-hidden>
        {imageSrc ? <img src={imageSrc} alt="" /> : Icon ? <Icon size={20} /> : null}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={s.quickLabel} style={{ display: 'block' }}>{label}</span>
        <span className={s.quickDesc} style={{ display: 'block' }}>{desc}</span>
      </span>
      <ChevronRight size={18} className={s.quickArrow} aria-hidden />
    </Link>
  )
}
