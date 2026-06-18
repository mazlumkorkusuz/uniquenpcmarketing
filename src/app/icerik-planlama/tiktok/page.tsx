export const dynamic = 'force-dynamic'
import { TrendingUp } from 'lucide-react'
import { PlatformPage } from '../_components/PlatformPage'

export default function TikTokIcerikPage() {
  return (
    <PlatformPage
      platform="tiktok"
      label="TikTok"
      color="#fe2c55"
      gradient="linear-gradient(135deg, #fe2c55, #010101)"
      icon={TrendingUp}
    />
  )
}
