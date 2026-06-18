export const dynamic = 'force-dynamic'
import { Play } from 'lucide-react'
import { PlatformPage } from '../_components/PlatformPage'

export default function YouTubeIcerikPage() {
  return (
    <PlatformPage
      platform="youtube"
      label="YouTube"
      color="#ff4444"
      gradient="linear-gradient(135deg, #ff4444, #cc0000)"
      icon={Play}
    />
  )
}
