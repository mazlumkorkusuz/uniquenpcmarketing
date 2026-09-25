// Light theme tokens shared by inline styles.
// Source of truth: design-system/uniquenpc/MASTER.md (mirrored as CSS variables in globals.css)

export const theme = {
  bg: '#FFFFFF',
  card: '#F5F5F5',
  cardBorder: '#EBEBEB',
  section: '#EDEDED',
  rowAlt: '#F9F9F9',
  hover: '#F0F0F0',
  border: '#E0E0E0',
  divider: '#E5E5E5',
  text: '#111111',
  textSecondary: '#444444',
  textMuted: '#6B6B6B',
  primary: '#111111',
  danger: '#EF4444',
  cardShadow: '0 2px 8px rgba(0,0,0,0.08)',
}

export const PLATFORM_COLORS: Record<string, string> = {
  twitch: '#9146FF',
  steam: '#1B2838',
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
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? '#111111' : '#FFFFFF'
}

// Buttons are black unless they belong to a platform, which keeps its brand color
export function buttonColor(color: string): { background: string; text: string } {
  const background = isPlatformColor(color) ? color : theme.primary
  return { background, text: textOn(background) }
}
