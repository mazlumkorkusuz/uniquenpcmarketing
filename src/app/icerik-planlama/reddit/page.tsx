export const dynamic = 'force-dynamic'
import { PlatformPage } from '../_components/PlatformPage'

export default function RedditIcerikPage() {
  return (
    <PlatformPage
      platform="reddit"
      label="Reddit"
      color="#ff4500"
      gradient="linear-gradient(135deg, #ff4500, #cc3700)"
      imageSrc="/icons/reddit.svg"
    />
  )
}
