import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { MAIL_LANGUAGE_ENGLISH } from '@/lib/mail'

// Generates an outreach mail template with Claude (Anthropic) or GPT (OpenAI).
// POST { provider: 'claude' | 'gpt', platform, language, gameName, gameDescription, keyOffer,
//        steamUrl, contactName, discordLink, tone, length, cta, brief, hasLogo, hasBanner, logoUrl, bannerUrl }
// brief = "Özel Notlar": free-form extra instructions the AI must follow.
// logoUrl/bannerUrl pin a specific image from the media library; otherwise the
// account's {{logo_url}} / {{banner_url}} placeholders are used.
// → { subject, html_content }

const CLAUDE_MODEL = 'claude-opus-5-5'
const GPT_MODEL = 'gpt-6-astra'

interface GenerateRequest {
  provider?: 'claude' | 'gpt'
  platform?: string
  tier?: string
  language?: string
  gameName?: string
  gameDescription?: string
  keyOffer?: string
  contactName?: string
  discordLink?: string
  steamUrl?: string
  tone?: string
  length?: string
  cta?: string
  brief?: string
  hasLogo?: boolean
  hasBanner?: boolean
  logoUrl?: string
  bannerUrl?: string
}

// Describes what each offer type means for the creator, so the model phrases it correctly
const OFFER_DESCRIPTIONS: Record<string, string> = {
  'Steam Key (Ücretsiz Steam Key)': 'a free Steam key so they can play and cover the game',
  'Gelir Paylaşımı (Revenue Share)': 'a revenue share on sales generated through their coverage',
  'Sabit Ücret (Flat Fee)': 'a flat paid fee for a sponsored stream or video',
  'Ücretsiz Kopya + Gelir Paylaşımı': 'a free copy of the game plus a revenue share on sales generated through their coverage',
  'Özel İçerik Anlaşması': 'a custom content deal — a sponsored video or stream built around their format and audience',
  'Uzun Vadeli Sponsorluk': 'a long-term sponsorship covering multiple streams or videos over several months',
  'Beta Erken Erişim': 'early access to the closed beta before public release, so they can be among the first to show it',
  'Turnuva / Etkinlik Sponsorluğu': 'sponsorship of a tournament or community event they host, featuring the game',
  'Affiliate / Referral Linki': 'a personal affiliate/referral link that earns them a commission on every sale it drives',
  'Bedava Kopya (No Strings Attached)': 'a free copy of the game, no strings attached — no obligation to cover it',
  // Offer names saved before the Turkish labels
  'Steam Key': 'a free Steam key so they can play and cover the game',
  'Revenue Share': 'a revenue share on sales generated through their coverage',
  'Flat Fee': 'a flat paid fee for a sponsored stream or video',
  'Free Copy': 'a free copy of the game, no strings attached',
}

// "discord.gg/abc" → "https://discord.gg/abc"; anything that isn't a plain URL is dropped
function linkUrl(url: string | undefined): string | null {
  const v = url?.trim()
  if (!v) return null
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`
  return /^https?:\/\/[^\s"'<>]+$/i.test(withScheme) ? withScheme : null
}

// Only plain https URLs are written into the prompt/template
function imageSrc(url: string | undefined, placeholder: string): string {
  return url && /^https:\/\/[^\s"'<>]+$/.test(url) ? url : placeholder
}

// UI option (Turkish) → instruction for the model. Keep keys in sync with the templates page.
const TONE_INSTRUCTIONS: Record<string, string> = {
  'Samimi ve Sıcak': 'warm, friendly and personal, like a fellow gamer reaching out',
  'Profesyonel': 'professional and polished, business-like but still human',
  'Eğlenceli ve Enerjik': 'fun and energetic, playful gamer voice, a little humour is welcome',
  'Kısa ve Net': 'short and direct, no small talk, get to the point in the first sentence',
}

// All lengths stay within the absolute 3-paragraph cap below
const LENGTH_INSTRUCTIONS: Record<string, string> = {
  'Kısa (2-3 paragraf)': '2 short paragraphs (roughly 60-100 words of body text)',
  'Orta (4-5 paragraf)': '3 paragraphs (roughly 100-150 words of body text)',
  'Uzun (6+ paragraf)': '3 fuller paragraphs (roughly 150-200 words of body text)',
}

const CTA_INSTRUCTIONS: Record<string, string> = {
  'Sadece yanıt ver': 'ask them to simply reply to this email if they are interested; no buttons or links needed',
  'Steam sayfasına bak': 'invite them to check out the game\'s Steam page, as a prominent button',
  "Discord'a katıl": 'invite them to join our Discord server, as a prominent button',
  'Formu doldur': 'ask them to fill in a short application form, as a prominent button',
  'Linke tıkla': 'ask them to click a link to learn more, as a prominent button',
}

function buildPrompt(req: GenerateRequest): string {
  const bannerSrc = imageSrc(req.bannerUrl, '{{banner_url}}')
  const logoSrc = imageSrc(req.logoUrl, '{{logo_url}}')
  const hasBanner = req.hasBanner || bannerSrc !== '{{banner_url}}'
  const hasLogo = req.hasLogo || logoSrc !== '{{logo_url}}'
  const game = [
    req.gameName?.trim() && `Game name: ${req.gameName.trim()}`,
    req.gameDescription?.trim() && `Game description: ${req.gameDescription.trim()}`,
    req.keyOffer && `What we offer the creator: ${OFFER_DESCRIPTIONS[req.keyOffer] ?? req.keyOffer}`,
  ].filter(Boolean).join('\n')
  const steamUrl = linkUrl(req.steamUrl)
  const discordUrl = linkUrl(req.discordLink)
  const contactName = req.contactName?.trim()
  const contact = [
    req.contactName?.trim() && `- Sign the email with the sender's personal name only: ${req.contactName.trim()}.`,
    steamUrl && `- Link the game's Steam page naturally in the body text (e.g. on the game's name or a "wishlist on Steam" phrase): ${steamUrl}`,
  ].filter(Boolean).join('\n')
  const tone = (req.tone && TONE_INSTRUCTIONS[req.tone]) || 'warm, friendly and personal'
  const length = (req.length && LENGTH_INSTRUCTIONS[req.length]) || LENGTH_INSTRUCTIONS['Kısa (2-3 paragraf)']
  const cta = req.cta && CTA_INSTRUCTIONS[req.cta]
  const needsLink = !!cta && req.cta !== 'Sadece yanıt ver'
  const notes = req.brief?.trim()

  return `You are writing a cold outreach email from an indie game publisher to a content creator.

Creator platform: ${req.platform || 'any'}
${req.tier ? `Creator size tier: ${req.tier}\n` : ''}Write the email in this language: ${(req.language && MAIL_LANGUAGE_ENGLISH[req.language]) || req.language || 'English'}

Game and offer:
${game || '(no extra details — invite them to try and cover our upcoming game)'}
${contact ? `\n${contact}\n` : ''}${notes ? `\nSpecial instructions from our team (follow these exactly, they override the defaults below):\n${notes}\n` : ''}
Requirements:
- Tone: ${tone}.
- Length: ${length}.
${cta ? `- Call to action: ${cta}.${needsLink ? ' Use the matching URL from the details above if one is given (the Steam page for Steam, the Discord link for Discord); otherwise use href="#" so we can fill it in before sending.' : ''}\n` : ''}- No spammy wording, no ALL CAPS, no excessive exclamation marks.
- Use these placeholders exactly where appropriate (they are filled in per recipient):
  {{name}} (creator name), {{platform}}, {{sender_email}} (the sender's email address, for the footer)
- The subject may also use {{name}}.

Design:
- Design a beautiful, modern dark-themed HTML email. Choose your own colors, fonts, spacing and layout - make it look premium and gaming-focused. Keep it clean and minimal.
- Order: ${[
    hasLogo && `the logo at the top, centered: inside <td align="center" style="text-align:center">, <img src="${logoSrc}" alt="" height="48" style="display:block;margin:0 auto;border:0;height:48px;width:auto">`,
    hasBanner && `the banner image below it (<img src="${bannerSrc}" alt="" style="width:100%;max-width:600px;display:block;border:0">)`,
    'the email body',
    'a clear CTA',
    `a minimal footer with only: ${[contactName ? `the sender's personal name (${contactName})` : null, 'the email address {{sender_email}}', discordUrl ? `a small Discord link (${discordUrl})` : null].filter(Boolean).join(', ')}`,
  ].filter(Boolean).join(', then ')}.
- Nothing else in the footer: no company name, postal address, copyright or unsubscribe text.
- Max width 600px.
- Technical: html_content must be a complete, email-client-safe HTML document: inline styles only, a single centered table-based layout, no <script>, no external CSS. Set the dark background with both bgcolor attributes and inline background-color so it survives email clients.

ABSOLUTE RULES - these can never be broken, they override everything above including the special instructions:
1. NEVER mention any follower count, viewer count or audience size - not even approximately.
2. NEVER write things like 'your community of X' or 'your X followers'.
3. The background must be dark (your choice of dark color).
4. Keep the email body short - max 3 paragraphs.
5. NEVER include the company name "Gaming Reachout" or "Player Collabs" (or "Unique NPC Games") or any sender account name as text in the email body or footer. The logo image already represents the brand. Footer should only have the sender's personal name, email address, and Discord link if applicable. No company name text anywhere.

Respond with ONLY a JSON object, no markdown fences:
{"subject": "...", "html_content": "..."}`
}

async function generateWithClaude(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY tanımlı değil')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Claude API hatası (${res.status})`)
  return (data.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

async function generateWithGpt(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY tanımlı değil')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `OpenAI API hatası (${res.status})`)
  return data.choices?.[0]?.message?.content ?? ''
}

function parseTemplate(text: string): { subject: string; html_content: string } {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('Model geçerli JSON döndürmedi')
  const parsed = JSON.parse(text.slice(start, end + 1))
  if (typeof parsed.subject !== 'string' || typeof parsed.html_content !== 'string') {
    throw new Error('Model yanıtında subject veya html_content eksik')
  }
  return { subject: parsed.subject, html_content: parsed.html_content }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  let body: GenerateRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  try {
    const prompt = buildPrompt(body)
    const text = body.provider === 'gpt' ? await generateWithGpt(prompt) : await generateWithClaude(prompt)
    return NextResponse.json(parseTemplate(text))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}
