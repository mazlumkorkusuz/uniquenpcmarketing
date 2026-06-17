'use client'

import { useState, useEffect } from 'react'
import { BarChart2, Key, CheckCircle, ExternalLink } from 'lucide-react'

const STORAGE_KEY = 'gamalytic_api_key'

export default function GamalyticPage() {
  const [apiKey, setApiKey] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? ''
    setApiKey(stored)
    setInputValue(stored)
  }, [])

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, inputValue)
    setApiKey(inputValue)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #2a2a3a', backgroundColor: '#13131a', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BarChart2 size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Gamalytic</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>Oyun analitik platformu entegrasyonu</p>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* API key card */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Key size={18} color="#a78bfa" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>API Anahtarı</span>
            {apiKey && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4ade80' }}>
                <CheckCircle size={13} />
                Kayıtlı
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              placeholder="Gamalytic API anahtarınızı girin…"
              style={{ flex: 1, backgroundColor: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#f1f5f9', outline: 'none' }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(124,58,237,0.6)' }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#2a2a3a' }}
            />
            <button
              onClick={handleSave}
              style={{ padding: '10px 20px', borderRadius: '8px', background: saved ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: saved ? '1px solid rgba(34,197,94,0.4)' : 'none', color: saved ? '#4ade80' : 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
            >
              {saved ? 'Kaydedildi!' : 'Kaydet'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '10px', margin: '10px 0 0' }}>
            API anahtarı yalnızca bu cihazda yerel olarak saklanır.
          </p>
        </div>

        {/* Placeholder dashboard */}
        <div style={{ backgroundColor: '#1a1a24', border: '1px dashed #2a2a3a', borderRadius: '12px', padding: '56px 32px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.15))', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <BarChart2 size={28} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
            Gamalytic API entegrasyonu yakında
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 24px' }}>
            API anahtarınızı girdikten sonra oyun istatistikleri, satış verileri ve kullanıcı analizleri burada görüntülenecektir.
          </div>
          <a
            href="https://gamalytic.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
          >
            Gamalytic&apos;i İncele
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Skeleton stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {['Toplam Oyuncu', 'Günlük Aktif', 'Ort. Oturum', 'Dönüşüm Oranı'].map((label) => (
            <div key={label} style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', opacity: 0.45 }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>{label}</div>
              <div style={{ height: '26px', backgroundColor: '#2a2a3a', borderRadius: '6px', width: '65%' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
