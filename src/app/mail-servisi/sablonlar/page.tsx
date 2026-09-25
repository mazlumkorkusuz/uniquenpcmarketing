'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, Save, Trash2, FileText } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { Toast } from '@/components/Toast'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import {
  MAIL_ACCOUNT_PUBLIC_COLUMNS, MAIL_LANGUAGES, MAIL_PLATFORMS, MAIL_TIERS,
  renderTemplate, type MailAccount, type MailTemplate,
} from '@/lib/mail'
import { Card, Field, MAIL_GRADIENT, buttonStyle, inputStyle, formatDateTime } from '../_components/ui'

type Provider = 'claude' | 'gpt'

export default function SablonlarPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [accounts, setAccounts] = useState<MailAccount[]>([])
  const [templates, setTemplates] = useState<MailTemplate[]>([])

  const [provider, setProvider] = useState<Provider>('claude')
  const [platform, setPlatform] = useState(MAIL_PLATFORMS[0])
  const [tier, setTier] = useState(MAIL_TIERS[1])
  const [language, setLanguage] = useState(MAIL_LANGUAGES[1])
  const [accountId, setAccountId] = useState('')
  const [brief, setBrief] = useState('')
  const [generating, setGenerating] = useState(false)

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

  const previewHtml = useMemo(() => renderTemplate(html, {
    name: 'Yayıncı Adı',
    email: 'ornek@mail.com',
    platform,
    followers: '25,000',
    sender_name: account?.name ?? 'Unique NPC Games',
    sender_email: account?.email ?? 'info@example.com',
    domain: account?.domain,
    logo_url: account?.logo_url,
    banner_url: account?.banner_url,
  }), [html, platform, account])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/mail-sablon-olustur', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider, platform, tier, language, brief,
          hasLogo: !!account?.logo_url,
          hasBanner: !!account?.banner_url,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Şablon oluşturulamadı')
      setEditingId(null)
      setSubject(data.subject)
      setHtml(data.html_content)
      setTemplateName(`${platform} · ${tier.split(' ')[0]} · ${language}`)
    } catch (e) {
      setToast({ message: (e as Error).message, type: 'error' })
    } finally {
      setGenerating(false)
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
      tier,
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
    if (t.tier) setTier(t.tier)
    if (t.language) setLanguage(t.language)
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
    backgroundColor: active ? '#EDEDED' : 'transparent',
    color: active ? '#0A0A0A' : '#B4B4B4',
  })

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <PageHeader title="Şablon Oluştur" subtitle="AI ile yayıncı outreach maili" icon={Sparkles} gradient={MAIL_GRADIENT} />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '24px', alignItems: 'start' }}>
          <Card title="AI Ayarları">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B4B4B4', marginBottom: '6px' }}>Model</span>
                <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: '#0A0A0A', border: '1px solid #262626', borderRadius: '8px' }}>
                  <button style={toggleStyle(provider === 'claude')} onClick={() => setProvider('claude')}>Claude</button>
                  <button style={toggleStyle(provider === 'gpt')} onClick={() => setProvider('gpt')}>GPT-4o</button>
                </div>
              </div>
              <Field label="Platform">
                <select style={inputStyle} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {MAIL_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Tier">
                <select style={inputStyle} value={tier} onChange={(e) => setTier(e.target.value)}>
                  {MAIL_TIERS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Dil">
                <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {MAIL_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Gönderen Hesap (logo / banner)">
                <select style={inputStyle} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Yok</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.email}</option>)}
                </select>
              </Field>
              <Field label="Oyun / teklif detayları">
                <textarea
                  style={{ ...inputStyle, minHeight: '110px', resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Örn: Yeni roguelike oyunumuz X için Steam key vermek ve yayında oynamasını istiyoruz. Çıkış tarihi 12 Kasım…"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
              </Field>
              <button style={buttonStyle('primary', generating)} disabled={generating} onClick={generate}>
                <Sparkles size={14} /> {generating ? 'Oluşturuluyor…' : 'Şablon Oluştur'}
              </button>
              <p style={{ fontSize: '12px', color: '#8F8F8F', margin: 0 }}>
                Kullanılabilir alanlar: {'{{name}} {{platform}} {{followers}} {{sender_name}} {{sender_email}} {{logo_url}} {{banner_url}}'}
              </p>
            </div>
          </Card>

          <Card
            title={editingId ? 'Şablonu Düzenle' : 'Şablon'}
            action={
              <button style={buttonStyle('primary', saving || !html)} disabled={saving || !html} onClick={save}>
                <Save size={14} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            }
          >
            {html || editingId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label="Şablon Adı">
                  <input style={inputStyle} value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                </Field>
                <Field label="Konu">
                  <input style={inputStyle} value={subject} onChange={(e) => setSubject(e.target.value)} />
                </Field>
                <iframe
                  title="Şablon önizleme"
                  sandbox=""
                  srcDoc={previewHtml}
                  style={{ width: '100%', height: '480px', border: '1px solid #262626', borderRadius: '8px', backgroundColor: '#0A0A0A' }}
                />
                <details>
                  <summary style={{ fontSize: '12px', color: '#B4B4B4', cursor: 'pointer' }}>HTML düzenle</summary>
                  <textarea
                    style={{ ...inputStyle, minHeight: '260px', marginTop: '8px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                  />
                </details>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#8F8F8F', margin: 0 }}>
                Soldan ayarları seçip “Şablon Oluştur”a basın ya da aşağıdan kayıtlı bir şablonu düzenleyin.
              </p>
            )}
          </Card>
        </div>

        <Card title={`Kayıtlı Şablonlar (${templates.length})`}>
          {templates.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#8F8F8F', margin: 0 }}>Henüz kayıtlı şablon yok.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {templates.map((t) => (
                <div key={t.id} style={{ border: `1px solid ${editingId === t.id ? '#EDEDED' : '#262626'}`, borderRadius: '10px', padding: '14px', backgroundColor: '#0A0A0A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <FileText size={14} color="#BAA7FF" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#EDEDED', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#B4B4B4', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {t.platform && <Badge variant="purple">{t.platform}</Badge>}
                    {t.tier && <Badge variant="blue">{t.tier.split(' ')[0]}</Badge>}
                    {t.language && <Badge variant="teal">{t.language}</Badge>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#8F8F8F', flex: 1 }}>{formatDateTime(t.created_at)}</span>
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
