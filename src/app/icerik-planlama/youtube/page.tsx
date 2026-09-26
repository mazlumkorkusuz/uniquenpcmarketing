export const dynamic = 'force-dynamic'
import { PlatformPage } from '../_components/PlatformPage'

export default function YouTubeIcerikPage() {
  return (
    <PlatformPage
      platform="youtube"
      label="YouTube"
      color="#FF0000"
      gradient="linear-gradient(135deg, #FF0000, #cc0000)"
      imageSrc="/icons/youtube.png"
    />
  )
}
