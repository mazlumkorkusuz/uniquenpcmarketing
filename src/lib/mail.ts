// Shared types and helpers for the Mail Servisi module

export interface MailAccount {
  id: string
  name: string
  email: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_pass?: string
  daily_limit: number
  sent_today: number
  logo_url: string | null
  banner_url: string | null
  domain: string | null
  status: string
  created_at: string
}

// Accounts created in the app use 'active'; rows added by hand use 'Aktif'
export const ACTIVE_ACCOUNT_STATUSES = ['active', 'Aktif']
export const isAccountActive = (status: string) => ACTIVE_ACCOUNT_STATUSES.includes(status)

// Every column except smtp_pass — use this for anything rendered in the browser
export const MAIL_ACCOUNT_PUBLIC_COLUMNS =
  'id, name, email, smtp_host, smtp_port, smtp_user, daily_limit, sent_today, logo_url, banner_url, domain, status, created_at'

export interface MailTemplate {
  id: string
  name: string
  platform: string | null
  tier: string | null
  language: string | null
  subject: string
  html_content: string
  account_id: string | null
  created_at: string
}

export interface MailCampaign {
  id: string
  name: string
  template_id: string | null
  account_id: string | null
  status: string
  total_recipients: number
  sent_count: number
  open_count: number
  reply_count: number
  bounce_count: number
  delay_seconds: number
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface MailRecipient {
  id: string
  campaign_id: string
  // Sending account for this recipient; null → the campaign's account_id
  account_id?: string | null
  email: string
  name: string | null
  platform: string | null
  followers: number | null
  language: string | null
  status: string
  sent_at: string | null
  opened_at: string | null
  open_count: number
  replied_at: string | null
  bounced_at: string | null
  bounce_type: string | null
  created_at: string
}

export const MAIL_PLATFORMS = ['Twitch', 'YouTube', 'Kick', 'TikTok', 'Instagram', 'Twitter', 'SOOP', 'Chzzk', 'BiliBili', 'Steam Küratör']
export const MAIL_TIERS = ['Nano (<10K)', 'Micro (10K–100K)', 'Mid (100K–500K)', 'Macro (500K–1M)', 'Mega (1M+)']
// Turkish display names (same naming as the streamer tables' language column)
export const MAIL_LANGUAGES = ['İngilizce', 'Korece', 'Japonca', 'Çince', 'Türkçe', 'Almanca', 'Fransızca', 'İspanyolca', 'Portekizce']

// English names for AI prompts, plus the native names older templates were saved with
export const MAIL_LANGUAGE_ENGLISH: Record<string, string> = {
  'İngilizce': 'English', 'Korece': 'Korean', 'Japonca': 'Japanese', 'Çince': 'Chinese', 'Türkçe': 'Turkish',
  'Almanca': 'German', 'Fransızca': 'French', 'İspanyolca': 'Spanish', 'Portekizce': 'Portuguese',
}
const LEGACY_LANGUAGE_NAMES: Record<string, string> = {
  'English': 'İngilizce', '한국어': 'Korece', '日本語': 'Japonca', '中文': 'Çince', 'Türkçe': 'Türkçe',
  'Deutsch': 'Almanca', 'Français': 'Fransızca', 'Español': 'İspanyolca', 'Português': 'Portekizce',
}
export const normalizeMailLanguage = (language: string) => LEGACY_LANGUAGE_NAMES[language] ?? language

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sending: 'Gönderiliyor',
  paused: 'Duraklatıldı',
  completed: 'Tamamlandı',
}

export const RECIPIENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  sent: 'Gönderildi',
  opened: 'Açıldı',
  replied: 'Yanıtladı',
  bounced: 'Bounce',
  failed: 'Hata',
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Fills {{placeholders}} in a template. Values are HTML-escaped unless `raw` is set (used for subjects).
export function renderTemplate(
  text: string,
  vars: Record<string, string | number | null | undefined>,
  raw = false,
): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const v = vars[key]
    if (v === null || v === undefined) return ''
    const s = String(v)
    return raw ? s : escapeHtml(s)
  })
}

export function percent(part: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((part / total) * 1000) / 10}%`
}
