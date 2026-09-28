'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, Save, Trash2, FileText, Loader2, Mail, Upload, ImageIcon, Images, X } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { Toast } from '@/components/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import {
  MAIL_ACCOUNT_PUBLIC_COLUMNS, MAIL_LANGUAGES, MAIL_PLATFORMS, normalizeMailLanguage,
  renderTemplate, type MailAccount, type MailTemplate,
} from '@/lib/mail'
import MediaLibrary, { normalizeDomain, type MediaKind } from '../_components/MediaLibrary'
import { Card, Field, MAIL_GRADIENT, buttonStyle, inputStyle, formatDateTime } from '../_components/ui'

type Provider = 'claude' | 'gpt'

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'claude', label: 'Claude Opus 5.5' },
  { value: 'gpt', label: 'GPT-6 Astra' },
]

// Keep in sync with OFFER_DESCRIPTIONS in /api/mail-sablon-olustur, which explains each offer to the AI
const KEY_OFFERS = [
  'Steam Key (Ücretsiz Steam Key)',
  'Gelir Paylaşımı (Revenue Share)',
  'Sabit Ücret (Flat Fee)',
  'Ücretsiz Kopya + Gelir Paylaşımı',
  'Özel İçerik Anlaşması',
  'Uzun Vadeli Sponsorluk',
  'Beta Erken Erişim',
  'Turnuva / Etkinlik Sponsorluğu',
  'Affiliate / Referral Linki',
  'Bedava Kopya (No Strings Attached)',
]

const ASSET_BUCKET = 'mail-assets'
const MAX_ASSET_BYTES = 5 * 1024 * 1024

type AssetKind = 'logo' | 'banner'

// Timestamped so a re-upload gets a new URL and mail clients don't show a cached image
function assetPath(accountId: string, kind: AssetKind, file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  return `${accountId}/${kind}-${Date.now()}.${ext}`
}

// Keep in sync with TONE/LENGTH/CTA_INSTRUCTIONS in /api/mail-sablon-olustur
const TONES = ['Samimi ve Sıcak', 'Profesyonel', 'Eğlenceli ve Enerjik', 'Kısa ve Net']
const LENGTHS = ['Kısa (2-3 paragraf)', 'Orta (4-5 paragraf)', 'Uzun (6+ paragraf)']
const CTAS = ['Sadece yanıt ver', 'Steam sayfasına bak', "Discord'a katıl", 'Formu doldur', 'Linke tıkla']

// Pill-style radio group built on real radio inputs (keyboard + screen reader friendly)
function RadioPills({ legend, name, options, value, onChange }: {
  legend: string
  name: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <legend style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px', padding: 0 }}>{legend}</legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {options.map((o) => {
          const checked = value === o
          return (
            <label
              key={o}
              className="radio-pill"
              style={{
                padding: '6px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '999px', cursor: 'pointer',
                border: `1px solid ${checked ? 'var(--foreground)' : 'var(--border)'}`,
                backgroundColor: checked ? 'var(--foreground)' : 'transparent',
                color: checked ? 'var(--background)' : 'var(--text-2)',
              }}
            >
              <input type="radio" name={name} value={o} checked={checked} onChange={() => onChange(o)} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
              {o}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// One-click game presets: fill the game fields for a title we promote often
const GAME_PRESETS = [
  {
    name: 'Tales of the Trade',
    description: {
      'Türkçe': "Dedenin bürokratik hatasından doğan 99.999.999.980 altınlık borcu ödemek için T.R.M.P. programına kayıt yaptırıyorsun. Rift'lere dalıp hammadde topluyorsun, bunları şehirde işleyip ürüne dönüştürüyorsun, kendi dükkânında NPC'lerle kıran kırana pazarlık yaparak satıyorsun. Zindanda ölürsen o koşuda topladıklarını kaybediyorsun ama şehirde her şey güvende. 1-4 kişilik co-op, solo da tam oynanır. PC için Steam'de çıkıyor.",
      default: "You join the T.R.M.P. program to pay off your grandfather's 99,999,999,980-gold debt born from a bureaucratic filing error. You raid Rifts to gather materials, craft them into goods at your workshop, and haggle them away in your own shop with NPC customers. Die in the dungeon and lose everything you collected that run, but your shop and progress are always safe. 1-4 player co-op, fully playable solo. Coming to Steam on PC.",
    } as Record<string, string>,
    discordLink: 'discord.gg/bDJ9us8hr',
    steamUrl: 'https://store.steampowered.com/app/4416430/Tales_of_the_Trade/',
  },
]

const PREVIEW_VARS = {
  name: 'Yayıncı Adı',
  email: 'ornek@mail.com',
  followers: '25,000',
}

export default function SablonlarPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [accounts, setAccounts] = useState<MailAccount[]>([])
  const [templates, setTemplates] = useState<MailTemplate[]>([])

  const [provider, setProvider] = useState<Provider>('claude')
  const [platform, setPlatform] = useState(MAIL_PLATFORMS[0])
  const [language, setLanguage] = useState(MAIL_LANGUAGES[0])
  const [accountId, setAccountId] = useState('')
  const [gameName, setGameName] = useState('')
  const [gameDescription, setGameDescription] = useState('')
  const [steamUrl, setSteamUrl] = useState('')
  const [keyOffer, setKeyOffer] = useState(KEY_OFFERS[0])
  const [tone, setTone] = useState(TONES[0])
  const [length, setLength] = useState(LENGTHS[0])
  const [cta, setCta] = useState(CTAS[0])
  const [notes, setNotes] = useState('')
  const [contactName, setContactName] = useState('')
  const [discordLink, setDiscordLink] = useState('')
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState<AssetKind | null>(null)
  // Images picked from the media library for this template; override the account's own logo/banner
  const [picked, setPicked] = useState<Record<MediaKind, string | null>>({ logo: null, banner: null })
  const [libraryKind, setLibraryKind] = useState<MediaKind | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from('mail_templates').select('*').order('created_at', { ascending: false })
    return (data ?? []) as MailTemplate[]
  }, [supabase])

  const loadTemplates = () => fetchTemplates().then(setTemplates)

  useEffect(() => {
    supabase.from('mail_accounts').select(MAIL_ACCOUNT_PUBLIC_COLUMNS).order('created_at').then(({ data }) => {
      const list = (data ?? []) as unknown as MailAccount[]
      setAccounts(list)
      if (list[0]) setAccountId((id) => id || list[0].id)
    })
    fetchTemplates().then(setTemplates)
  }, [supabase, fetchTemplates])

  const account = accounts.find((a) => a.id === accountId)
  const accountDomain = normalizeDomain(account?.domain)
  const logoUrl = picked.logo ?? account?.logo_url ?? null
  const bannerUrl = picked.banner ?? account?.banner_url ?? null

  const changeAccount = (id: string) => {
    setAccountId(id)
    setPicked({ logo: null, banner: null })
  }

  const closeLibrary = useCallback(() => setLibraryKind(null), [])

  const previewVars = useMemo(() => ({
    ...PREVIEW_VARS,
    platform,
    sender_name: account?.name ?? 'Unique NPC Games',
    sender_email: account?.email ?? 'info@example.com',
    domain: account?.domain,
    logo_url: logoUrl,
    banner_url: bannerUrl,
  }), [platform, account, logoUrl, bannerUrl])

  const previewHtml = useMemo(() => renderTemplate(html, previewVars), [html, previewVars])
  const previewSubject = useMemo(() => renderTemplate(subject, previewVars, true), [subject, previewVars])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/mail-sablon-olustur', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider, platform, language,
          gameName, gameDescription, steamUrl, keyOffer, contactName, discordLink, tone, length, cta, brief: notes,
          hasLogo: !!logoUrl,
          hasBanner: !!bannerUrl,
          logoUrl: picked.logo ?? undefined,
          bannerUrl: picked.banner ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Şablon oluşturulamadı')
      setEditingId(null)
      setSubject(data.subject)
      setHtml(data.html_content)
      setTemplateName(`${platform} · ${keyOffer.replace(/\s*\(.*\)$/, '')} · ${language}`)
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  // Uploads a logo/banner to storage and stores its public URL on the selected account
  const uploadAsset = async (kind: AssetKind, file: File) => {
    if (!account) return
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Lütfen bir görsel dosyası seçin', type: 'error' })
      return
    }
    if (file.size > MAX_ASSET_BYTES) {
      setToast({ message: 'Görsel en fazla 5 MB olabilir', type: 'error' })
      return
    }
    setUploading(kind)
    try {
      const path = assetPath(account.id, kind, file)
      const { error: uploadError } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, { contentType: file.type, upsert: true })
      if (uploadError) throw new Error(`Yükleme başarısız: ${uploadError.message}`)
      const url = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path).data.publicUrl
      const column = kind === 'logo' ? 'logo_url' : 'banner_url'
      const { error: updateError } = await supabase.from('mail_accounts').update({ [column]: url }).eq('id', account.id)
      if (updateError) throw new Error(`Hesap güncellenemedi: ${updateError.message}`)
      setAccounts((list) => list.map((a) => (a.id === account.id ? { ...a, [column]: url } : a)))
      setPicked((p) => ({ ...p, [kind]: null }))
      setToast({ message: kind === 'logo' ? 'Logo yüklendi' : 'Banner yüklendi', type: 'success' })
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' })
    } finally {
      setUploading(null)
    }
  }

  const save = async () => {
    if (!templateName.trim() || !subject.trim() || !html.trim()) {
      setToast({ message: 'Şablon adı, konu ve içerik gerekli', type: 'error' })
      return
    }
    setSaving(true)
    const row = {
      name: templateName.trim(),
      platform,
      language,
      subject,
      html_content: html,
      account_id: accountId || null,
    }
    const { error } = editingId
      ? await supabase.from('mail_templates').update(row).eq('id', editingId)
      : await supabase.from('mail_templates').insert(row)
    setSaving(false)
    if (error) {
      setToast({ message: error.message, type: 'error' })
      return
    }
    setToast({ message: editingId ? 'Şablon güncellendi' : 'Şablon kaydedildi', type: 'success' })
    setEditingId(null)
    loadTemplates()
  }

  const edit = (t: MailTemplate) => {
    setEditingId(t.id)
    setTemplateName(t.name)
    setSubject(t.subject)
    setHtml(t.html_content)
    if (t.platform) setPlatform(t.platform)
    if (t.language) setLanguage(normalizeMailLanguage(t.language))
    if (t.account_id) setAccountId(t.account_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (t: MailTemplate) => {
    if (!confirm(`"${t.name}" şablonu silinsin mi?`)) return
    const { error } = await supabase.from('mail_templates').delete().eq('id', t.id)
    if (error) setToast({ message: error.message, type: 'error' })
    else {
      if (editingId === t.id) setEditingId(null)
      loadTemplates()
    }
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: active ? 'var(--primary-soft)' : 'transparent',
    color: active ? 'var(--primary-ink)' : 'var(--text-2)',
  })

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-foreground)', margin: '6px 0 -4px',
  }

  const hasTemplate = !!html || !!editingId

  return (
    <div>
      {libraryKind && accountDomain && (
        <MediaLibrary
          domain={accountDomain}
          initialKind={libraryKind}
          selected={picked}
          onSelect={(kind, url) => { setPicked((p) => ({ ...p, [kind]: url })); setLibraryKind(null) }}
          onClose={closeLibrary}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <PageHeader title="Şablon Oluştur" subtitle="AI ile yayıncılara tanıtım maili" icon={Sparkles} gradient={MAIL_GRADIENT} />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(0, 1.5fr)', gap: '24px', alignItems: 'start' }}>
          {/* ── Left: settings ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card title="AI Ayarları">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>Model</span>
                  <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    {PROVIDERS.map((p) => (
                      <button key={p.value} style={toggleStyle(provider === p.value)} aria-pressed={provider === p.value} onClick={() => setProvider(p.value)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={sectionLabel}>Oyun</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  {GAME_PRESETS.map((g) => (
                    <button
                      key={g.name}
                      style={{ ...buttonStyle('secondary'), padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => {
                        setGameName(g.name)
                        setGameDescription(g.description[language] ?? g.description.default)
                        setDiscordLink(g.discordLink)
                        setSteamUrl(g.steamUrl)
                      }}
                    >
                      <Sparkles size={12} /> {g.name}
                    </button>
                  ))}
                  {gameName && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 4px 3px 10px', borderRadius: '999px', fontSize: '12px', backgroundColor: 'var(--muted)', color: 'var(--text-2)' }}>
                      Oyun: <strong style={{ color: 'var(--foreground)' }}>{gameName}</strong>
                      <button
                        onClick={() => setGameName('')}
                        aria-label="Oyun adını kaldır"
                        style={{ display: 'inline-flex', padding: '2px', border: 'none', borderRadius: '999px', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
                <Field label="Oyun Açıklaması">
                  <textarea
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Tür, öne çıkan özellikler, çıkış tarihi…"
                    value={gameDescription}
                    onChange={(e) => setGameDescription(e.target.value)}
                  />
                </Field>
                <Field label="Steam Sayfası">
                  <input style={inputStyle} type="url" placeholder="https://store.steampowered.com/app/…" value={steamUrl} onChange={(e) => setSteamUrl(e.target.value)} />
                </Field>
                <Field label="Teklif">
                  <select style={inputStyle} value={keyOffer} onChange={(e) => setKeyOffer(e.target.value)}>
                    {KEY_OFFERS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <RadioPills legend="Ton" name="tone" options={TONES} value={tone} onChange={setTone} />
                <RadioPills legend="Mail Uzunluğu" name="length" options={LENGTHS} value={length} onChange={setLength} />
                <Field label="CTA Türü">
                  <select style={inputStyle} value={cta} onChange={(e) => setCta(e.target.value)}>
                    {CTAS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Özel Notlar">
                  <textarea
                    style={{ ...inputStyle, minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="AI'ya ekstra talimat ver... (örn: oyunun çıkış tarihi 15 Kasım, mutlaka belirt)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>

                <div style={sectionLabel}>Hedef</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Field label="Platform">
                    <select style={inputStyle} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                      {MAIL_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Dil">
                    <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)}>
                      {MAIL_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                </div>

                <div style={sectionLabel}>İletişim</div>
                <Field label="İletişim Kişisi">
                  <input style={inputStyle} placeholder="Adınız" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </Field>
                <Field label="Discord Sunucu Linki">
                  <input style={inputStyle} type="url" placeholder="https://discord.gg/…" value={discordLink} onChange={(e) => setDiscordLink(e.target.value)} />
                </Field>
                <Field label="Gönderen Hesap">
                  <select style={inputStyle} value={accountId} onChange={(e) => changeAccount(e.target.value)}>
                    <option value="">Yok</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
                  </select>
                </Field>
                {account && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    {(['logo', 'banner'] as const).map((kind) => {
                      const url = kind === 'logo' ? logoUrl : bannerUrl
                      const label = kind === 'logo' ? 'Logo' : 'Banner'
                      const busy = uploading === kind
                      return (
                        <div key={kind} style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
                          <div
                            style={{
                              height: '72px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: 'var(--muted-foreground)',
                            }}
                          >
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} alt={`${account.name} ${label.toLowerCase()}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: kind === 'logo' ? 'contain' : 'cover', width: kind === 'banner' ? '100%' : undefined }} />
                            ) : (
                              <ImageIcon size={20} strokeWidth={1.5} aria-label={`${label} yok`} />
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))', gap: '6px' }}>
                          <button
                            style={{ ...buttonStyle('secondary', !accountDomain), justifyContent: 'center', padding: '6px 10px', fontSize: '12px' }}
                            disabled={!accountDomain}
                            title={accountDomain ? undefined : 'Bu hesabın domain alanı boş'}
                            onClick={() => setLibraryKind(kind)}
                          >
                            <Images size={13} /> {label} Seç
                          </button>
                          <label
                            style={{
                              ...buttonStyle('secondary', !!uploading), justifyContent: 'center', padding: '6px 10px', fontSize: '12px',
                              cursor: uploading ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                            {busy ? 'Yükleniyor…' : `${label} Yükle`}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/gif,image/webp"
                              style={{ display: 'none' }}
                              disabled={!!uploading}
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAsset(kind, f); e.target.value = '' }}
                            />
                          </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button style={buttonStyle('primary', generating)} disabled={generating} onClick={generate}>
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? 'Oluşturuluyor…' : 'Şablon Oluştur'}
                </button>
              </div>
            </Card>

            {hasTemplate && (
              <Card
                title={editingId ? 'Şablonu Düzenle' : 'Şablonu Kaydet'}
                action={
                  <button style={buttonStyle('primary', saving || !html)} disabled={saving || !html} onClick={save}>
                    <Save size={14} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
                  </button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Field label="Şablon Adı">
                    <input style={inputStyle} value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                  </Field>
                  <Field label="Konu">
                    <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </Field>
                  <details>
                    <summary style={{ fontSize: '12px', color: 'var(--text-2)', cursor: 'pointer' }}>HTML düzenle</summary>
                    <textarea
                      style={{ ...inputStyle, minHeight: '260px', marginTop: '8px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                    />
                  </details>
                </div>
              </Card>
            )}
          </div>

          {/* ── Right: live preview ────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <Card title="Önizleme" padded={false}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>Konu:</span>
                <span style={{ color: subject ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: subject ? 600 : 400, minWidth: 0, overflowWrap: 'anywhere' }}>
                  {subject ? previewSubject : 'Şablon oluşturulunca burada görünecek'}
                </span>
              </div>
              <div style={{ position: 'relative', height: 'max(600px, calc(100vh - 200px))', backgroundColor: 'var(--muted)' }}>
                {html ? (
                  <iframe
                    title="Şablon önizleme"
                    sandbox=""
                    srcDoc={previewHtml}
                    style={{ display: 'block', width: '100%', height: '100%', border: 0, backgroundColor: '#fff' }}
                  />
                ) : !generating && (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--muted-foreground)', fontSize: '13px', textAlign: 'center', padding: '24px' }}>
                    <Mail size={28} strokeWidth={1.5} />
                    Soldaki alanları doldurup “Şablon Oluştur”a basın ya da aşağıdan kayıtlı bir şablonu düzenleyin.
                  </div>
                )}
                {generating && (
                  <div
                    role="status"
                    style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                      backgroundColor: 'color-mix(in srgb, var(--card) 85%, transparent)', color: 'var(--text-2)', fontSize: '13px', fontWeight: 600,
                    }}
                  >
                    <Loader2 size={28} className="animate-spin" />
                    {PROVIDERS.find((p) => p.value === provider)?.label} şablonu yazıyor…
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <Card title={`Kayıtlı Şablonlar (${templates.length})`}>
          {templates.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Henüz kayıtlı şablon yok.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {templates.map((t) => (
                <div key={t.id} style={{ border: `1px solid ${editingId === t.id ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', padding: '14px', backgroundColor: 'var(--card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <FileText size={14} color="var(--primary-ink)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {t.platform && <Badge variant="purple">{t.platform}</Badge>}
                    {t.language && <Badge variant="teal">{t.language}</Badge>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', flex: 1 }}>{formatDateTime(t.created_at)}</span>
                    <button style={{ ...buttonStyle('secondary'), padding: '5px 10px', fontSize: '12px' }} onClick={() => edit(t)}>Düzenle</button>
                    <button style={{ ...buttonStyle('danger'), padding: '5px 8px' }} onClick={() => remove(t)} aria-label="Sil"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
