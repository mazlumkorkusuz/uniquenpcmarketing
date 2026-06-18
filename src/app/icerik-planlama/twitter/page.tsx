export const dynamic = 'force-dynamic'
import { Share2 } from 'lucide-react'
import { PlatformPage } from '../_components/PlatformPage'

export default function TwitterIcerikPage() {
  return (
    <PlatformPage
      platform="twitter"
      label="Twitter"
      color="#1d9bf0"
      gradient="linear-gradient(135deg, #1d9bf0, #0c6fa8)"
      icon={Share2}
    />
  )
}
