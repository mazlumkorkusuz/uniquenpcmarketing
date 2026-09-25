import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import s from '@/app/dashboard.module.css'

interface QuickLinkCardProps {
  href: string
  label: string
  color: string
  icon?: LucideIcon
  imageSrc?: string
}

export default function QuickLinkCard({ href, label, color, icon: Icon, imageSrc }: QuickLinkCardProps) {
  return (
    <Link href={href} className={s.quickCard}>
      <span className={s.quickIcon} style={{ backgroundColor: color + '1A', color }} aria-hidden>
        {imageSrc ? <img src={imageSrc} alt="" /> : Icon ? <Icon size={17} /> : null}
      </span>
      {label}
    </Link>
  )
}
