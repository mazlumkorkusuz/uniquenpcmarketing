export const dynamic = 'force-dynamic'
import { PlatformPage } from '../_components/PlatformPage'

export default function InstagramIcerikPage() {
  return (
    <PlatformPage
      platform="instagram"
      label="Instagram"
      color="#e1306c"
      gradient="linear-gradient(135deg, #e1306c, #833ab4)"
      imageSrc="/icons/instagram.png"
    />
  )
}
