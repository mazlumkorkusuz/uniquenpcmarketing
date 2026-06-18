export const dynamic = 'force-dynamic'
import { PlatformPage } from '../_components/PlatformPage'

export default function LinkedInIcerikPage() {
  return (
    <PlatformPage
      platform="linkedin"
      label="LinkedIn"
      color="#0a66c2"
      gradient="linear-gradient(135deg, #0a66c2, #004182)"
      imageSrc="/icons/linkedin.png"
    />
  )
}
