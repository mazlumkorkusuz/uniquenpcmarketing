// Dark theme tokens shared by inline styles (Resend-inspired).
// Mirrored as CSS variables in globals.css

export const theme = {
  bg: '#0A0A0A',
  card: '#111111',
  cardBorder: '#1A1A1A',
  section: '#141414',
  rowAlt: '#0E0E0E',
  hover: '#161616',
  border: '#262626',
  divider: '#1F1F1F',
  text: '#EDEDED',
  textSecondary: '#B4B4B4',
  textMuted: '#8F8F8F',
  primary: '#EDEDED',
  danger: '#EF4444',
  cardShadow: 'none',
}

export const PLATFORM_COLORS: Record<string, string> = {
  twitch: '#9146FF',
  steam: '#66C0F4',
  youtube: '#FF0000',
  kick: '#53FC18',
  soop: '#00A8FF',
  chzzk: '#00FFA3',
  bilibili: '#00A1D6',
  douyin: '#FF0050',
  reddit: '#FF4500',
  twitter: '#1D9BF0',
  instagram: '#E1306C',
  tiktok: '#FE2C55',
  linkedin: '#0A66C2',
}

const platformColorSet = new Set(
  [...Object.values(PLATFORM_COLORS), '#FF4444'].map((c) => c.toLowerCase()),
)

export function isPlatformColor(color: string): boolean {
  return platformColorSet.has(color.toLowerCase())
}

// Readable text color (black or white) on top of a solid hex background
export function textOn(color: string): string {
  const hex = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF'
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? '#0A0A0A' : '#FFFFFF'
}

// Buttons are light (Resend-style) unless they belong to a platform, which keeps its brand color
export function buttonColor(color: string): { background: string; text: string } {
  const background = isPlatformColor(color) ? color : theme.primary
  return { background, text: textOn(background) }
}
