export const dynamic = 'force-dynamic'
import { PlatformPage } from '../_components/PlatformPage'

export default function IGIcerikPage() {
  return (
    <PlatformPage
      platform="ig"
      label="IG"
      color="#c13584"
      gradient="linear-gradient(135deg, #c13584, #833ab4)"
      imageSrc="/icons/instagram.png"
    />
  )
}
