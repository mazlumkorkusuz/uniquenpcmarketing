// Light theme tokens for inline styles (design-system/uniquenpc/MASTER.md).
// Mirrored as CSS variables in globals.css

export const theme = {
  bg: '#F6F5FB',
  card: '#FFFFFF',
  cardBorder: '#E8E4F1',
  section: '#FAF9FD',
  rowAlt: '#FAF9FD',
  hover: 'rgba(109,40,217,0.04)',
  border: '#E8E4F1',
  divider: '#E8E4F1',
  text: '#17122B',
  textSecondary: '#4A4462',
  textMuted: '#655F7D',
  primary: '#6D28D9',
  danger: '#B91C1C',
  cardShadow: '0 1px 2px rgba(23,18,43,.04), 0 1px 1px rgba(23,18,43,.03)',
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

function rgbOf(color: string): [number, number, number] | null {
  const hex = color.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Readable text color (ink or white) on top of a solid hex background
export function textOn(color: string): string {
  const rgb = rgbOf(color)
  if (!rgb) return '#FFFFFF'
  return luminance(rgb) > 0.4 ? '#17122B' : '#FFFFFF'
}

// A platform color darkened until it reads as text on white and light tints (5.6:1 on white, so it still clears 4.5:1 on a 13% tint of itself). Kick #53FC18 and Chzzk
// #00FFA3 fail as-is, so MASTER forbids using them raw for text on light surfaces.
export function inkOf(color: string): string {
  let rgb = rgbOf(color)
  if (!rgb) return color
  for (let i = 0; i < 20 && (1.05 / (luminance(rgb) + 0.05)) < 5.6; i++) {
    rgb = rgb.map((c) => Math.round(c * 0.9)) as [number, number, number]
  }
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()
}

// Primary buttons use the MASTER signature gradient for every page (callers still pass a color)
export function buttonColor(...args: [color?: string]): { background: string; text: string } {
  void args
  return { background: 'var(--gradient)', text: 'var(--gradient-foreground)' }
}

// A translucent version of any colour (hex or CSS variable), for tints and soft borders.
// Replaces the old `color + '22'` hex-alpha concatenation, which only worked on hex values.
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}
