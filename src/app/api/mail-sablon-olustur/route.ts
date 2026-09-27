import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Generates an outreach mail template with Claude (Anthropic) or GPT (OpenAI).
// POST { provider: 'claude' | 'gpt', platform, language, gameName, gameDescription, keyOffer,
//        contactName, discordLink, brief, hasLogo, hasBanner }
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
  brief?: string
  hasLogo?: boolean
  hasBanner?: boolean
}

// Describes what each offer type means for the creator, so the model phrases it correctly
const OFFER_DESCRIPTIONS: Record<string, string> = {
  'Steam Key': 'a free Steam key so they can play and cover the game',
  'Revenue Share': 'a revenue share on sales generated through their coverage',
  'Flat Fee': 'a flat paid fee for a sponsored stream or video',
  'Free Copy': 'a free copy of the game, no strings attached',
}

function buildPrompt(req: GenerateRequest): string {
  const game = [
    req.gameName?.trim() && `Game name: ${req.gameName.trim()}`,
    req.gameDescription?.trim() && `Game description: ${req.gameDescription.trim()}`,
    req.keyOffer && `What we offer the creator: ${OFFER_DESCRIPTIONS[req.keyOffer] ?? req.keyOffer}`,
    req.brief?.trim() && `Extra notes: ${req.brief.trim()}`,
  ].filter(Boolean).join('\n')
  const contact = [
    req.contactName?.trim() && `- Sign the email as ${req.contactName.trim()} from {{sender_name}}.`,
    req.discordLink?.trim() && `- Include our Discord server as a clickable link: ${req.discordLink.trim()}`,
  ].filter(Boolean).join('\n')

  return `You are writing a cold outreach email from Unique NPC Games, an indie game publisher, to a content creator.

Creator platform: ${req.platform || 'any'}
${req.tier ? `Creator size tier: ${req.tier}\n` : ''}Write the email in this language: ${req.language || 'English'}

Game and offer:
${game || '(no extra details — invite them to try and cover our upcoming game)'}
${contact ? `\n${contact}\n` : ''}
Requirements:
- Short, friendly and personal; no spammy wording, no ALL CAPS, max ~150 words of body text.
- Use these placeholders exactly where appropriate (they are filled in per recipient):
  {{name}} (creator name), {{platform}}, {{followers}}, {{sender_name}}, {{sender_email}}
${req.hasBanner ? '- Put <img src="{{banner_url}}" alt="" style="width:100%;max-width:600px;display:block;border:0"> at the top.\n' : ''}${req.hasLogo ? '- Put <img src="{{logo_url}}" alt="" height="40" style="display:block;border:0"> in the signature.\n' : ''}- html_content must be a complete, email-client-safe HTML body: inline styles only, a single centered 600px-wide table layout, no <script>, no external CSS.
- The subject may also use {{name}}.

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
