'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Settings, Plus, Save, Trash2, Send, Pencil, X } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Badge from '@/components/Badge'
import { Toast } from '@/components/Toast'
import { useAuth } from '@/components/AppShell'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { MAIL_ACCOUNT_PUBLIC_COLUMNS, type MailAccount } from '@/lib/mail'
import { Card, Field, ProgressBar, MAIL_GRADIENT, buttonStyle, inputStyle } from '../_components/ui'

interface AccountForm {
  name: string
  email: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_pass: string
  daily_limit: number
  logo_url: string
  banner_url: string
  domain: string
  status: string
}

const EMPTY_FORM: AccountForm = {
  name: '',
  email: '',
  smtp_host: 'smtp.hostinger.com',
  smtp_port: 465,
  smtp_user: '',
  smtp_pass: '',
  daily_limit: 200,
  logo_url: '',
  banner_url: '',
  domain: '',
  status: 'active',
}

export default function AyarlarPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { user } = useAuth()

  const [accounts, setAccounts] = useState<MailAccount[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [testTo, setTestTo] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchAccounts = useCallback(async () => {
    const { data } = await supabase.from('mail_accounts').select(MAIL_ACCOUNT_PUBLIC_COLUMNS).order('created_at')
    return (data ?? []) as unknown as MailAccount[]
  }, [supabase])

  const load = useCallback(() => fetchAccounts().then(setAccounts), [fetchAccounts])

  useEffect(() => {
    fetchAccounts().then(setAccounts)
  }, [fetchAccounts])

  const set = <K extends keyof AccountForm>(key: K, value: AccountForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (a: MailAccount) => {
    setEditingId(a.id)
    setForm({
      name: a.name,
      email: a.email,
      smtp_host: a.smtp_host,
      smtp_port: a.smtp_port,
      smtp_user: a.smtp_user,
      smtp_pass: '',
      daily_limit: a.daily_limit,
      logo_url: a.logo_url ?? '',
      banner_url: a.banner_url ?? '',
      domain: a.domain ?? '',
      status: a.status,
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.smtp_host.trim() || !form.smtp_user.trim()) {
      setToast({ message: 'Ad, email, SMTP sunucu ve kullanıcı gerekli', type: 'error' })
      return
    }
    if (!editingId && !form.smtp_pass) {
      setToast({ message: 'SMTP şifresi gerekli', type: 'error' })
      return
    }
    setSaving(true)
    const row: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      smtp_host: form.smtp_host.trim(),
      smtp_port: form.smtp_port,
      smtp_user: form.smtp_user.trim(),
      daily_limit: form.daily_limit,
      logo_url: form.logo_url.trim() || null,
      banner_url: form.banner_url.trim() || null,
      domain: form.domain.trim() || form.email.split('@')[1] || null,
      status: form.status,
    }
    // Blank password on edit keeps the stored one
    if (form.smtp_pass) row.smtp_pass = form.smtp_pass

    const { error } = editingId
      ? await supabase.from('mail_accounts').update(row).eq('id', editingId)
      : await supabase.from('mail_accounts').insert(row)
    setSaving(false)
    if (error) {
      setToast({ message: error.message, type: 'error' })
      return
    }
    setToast({ message: editingId ? 'Hesap güncellendi' : 'Hesap eklendi', type: 'success' })
    setShowForm(false)
    setEditingId(null)
    load()
  }

  const remove = async (a: MailAccount) => {
    if (!confirm(`${a.email} hesabı silinsin mi? Bu hesabı kullanan kampanyaların hesabı boşalır.`)) return
    const { error } = await supabase.from('mail_accounts').delete().eq('id', a.id)
    if (error) setToast({ message: error.message, type: 'error' })
    else load()
  }

  const sendTest = async (a: MailAccount) => {
    const to = testTo[a.id] || user?.email || a.email
    setTesting(a.id)
    const res = await fetch('/api/mail-gonder', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ test: true, account_id: a.id, to }),
    })
    const data = await res.json().catch(() => ({}))
    setTesting(null)
    setToast(res.ok ? { message: `Test maili gönderildi: ${to}`, type: 'success' } : { message: data.error ?? 'Gönderilemedi', type: 'error' })
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      <PageHeader title="Mail Ayarları" subtitle="SMTP hesapları, logo, banner ve günlük limit" icon={Settings} gradient={MAIL_GRADIENT}>
        {!showForm && (
          <button style={buttonStyle('primary')} onClick={openNew}>
            <Plus size={15} /> Hesap Ekle
          </button>
        )}
      </PageHeader>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {showForm && (
          <Card
            title={editingId ? 'Hesabı Düzenle' : 'Yeni Hesap'}
            action={<button style={{ ...buttonStyle('secondary'), padding: '6px 8px' }} onClick={() => setShowForm(false)} aria-label="Kapat"><X size={14} /></button>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              <Field label="Gönderen Adı">
                <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Unique NPC Games" />
              </Field>
              <Field label="Gönderen Email">
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => { set('email', e.target.value); if (!editingId) set('smtp_user', e.target.value) }} placeholder="partners@uniquenpc.com" />
              </Field>
              <Field label="Domain">
                <input style={inputStyle} value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="uniquenpc.com" />
              </Field>
              <Field label="SMTP Sunucu">
                <input style={inputStyle} value={form.smtp_host} onChange={(e) => set('smtp_host', e.target.value)} />
              </Field>
              <Field label="SMTP Port">
                <select style={inputStyle} value={form.smtp_port} onChange={(e) => set('smtp_port', Number(e.target.value))}>
                  <option value={465}>465 (SSL)</option>
                  <option value={587}>587 (STARTTLS)</option>
                </select>
              </Field>
              <Field label="SMTP Kullanıcı">
                <input style={inputStyle} value={form.smtp_user} onChange={(e) => set('smtp_user', e.target.value)} />
              </Field>
              <Field label={editingId ? 'SMTP Şifre (boş = değişmesin)' : 'SMTP Şifre'}>
                <input style={inputStyle} type="password" autoComplete="new-password" value={form.smtp_pass} onChange={(e) => set('smtp_pass', e.target.value)} />
              </Field>
              <Field label="Günlük Limit">
                <input style={inputStyle} type="number" min={1} value={form.daily_limit} onChange={(e) => set('daily_limit', Math.max(1, Number(e.target.value) || 1))} />
              </Field>
              <Field label="Durum">
                <select style={inputStyle} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </Field>
              <Field label="Logo URL">
                <input style={inputStyle} value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://…/logo.png" />
              </Field>
              <Field label="Banner URL">
                <input style={inputStyle} value={form.banner_url} onChange={(e) => set('banner_url', e.target.value)} placeholder="https://…/banner.png" />
              </Field>
            </div>
            {(form.logo_url || form.banner_url) && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                {form.logo_url && <img src={form.logo_url} alt="Logo" style={{ height: '40px', borderRadius: '6px', backgroundColor: '#fff', padding: '4px' }} />}
                {form.banner_url && <img src={form.banner_url} alt="Banner" style={{ maxHeight: '80px', maxWidth: '100%', borderRadius: '6px' }} />}
              </div>
            )}
            <div style={{ marginTop: '18px', display: 'flex', gap: '8px' }}>
              <button style={buttonStyle('primary', saving)} disabled={saving} onClick={save}>
                <Save size={14} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
              <button style={buttonStyle('secondary')} onClick={() => setShowForm(false)}>Vazgeç</button>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '12px 0 0' }}>
              Hostinger: sunucu <code>smtp.hostinger.com</code>, port 465 (SSL), kullanıcı adı mail adresinin kendisi.
              Logo ve banner mail içinde görüneceği için herkese açık bir URL olmalı.
            </p>
          </Card>
        )}

        {accounts.length === 0 && !showForm ? (
          <Card>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Henüz mail hesabı yok. “Hesap Ekle” ile başlayın.</p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {accounts.map((a) => (
              <div key={a.id} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
                {a.banner_url && <img src={a.banner_url} alt="" style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }} />}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {a.logo_url && <img src={a.logo_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#fff', padding: '3px' }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{a.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</div>
                    </div>
                    <Badge variant={a.status === 'active' ? 'green' : 'gray'}>{a.status === 'active' ? 'Aktif' : 'Pasif'}</Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{a.smtp_host}:{a.smtp_port} · {a.smtp_user}</div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Bugün gönderilen</div>
                    <ProgressBar value={a.sent_today} total={a.daily_limit} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }}
                      placeholder={user?.email ?? a.email}
                      value={testTo[a.id] ?? ''}
                      onChange={(e) => setTestTo((t) => ({ ...t, [a.id]: e.target.value }))}
                    />
                    <button style={{ ...buttonStyle('secondary', testing === a.id), padding: '6px 10px', fontSize: '12px' }} disabled={testing === a.id} onClick={() => sendTest(a)}>
                      <Send size={12} /> {testing === a.id ? '…' : 'Test'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button style={{ ...buttonStyle('secondary'), padding: '6px 10px', fontSize: '12px' }} onClick={() => openEdit(a)}>
                      <Pencil size={12} /> Düzenle
                    </button>
                    <button style={{ ...buttonStyle('danger'), padding: '6px 8px' }} onClick={() => remove(a)} aria-label="Sil">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
