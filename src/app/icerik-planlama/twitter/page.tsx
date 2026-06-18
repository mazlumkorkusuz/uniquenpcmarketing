export const dynamic = 'force-dynamic'
import { PlatformPage } from '../_components/PlatformPage'

export default function TwitterIcerikPage() {
  return (
    <PlatformPage
      platform="twitter"
      label="Twitter"
      color="#1d9bf0"
      gradient="linear-gradient(135deg, #1d9bf0, #0c6fa8)"
      imageSrc="/icons/x.png"
    />
  )
}
