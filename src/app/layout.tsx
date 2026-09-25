import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

// Resend-style type: Inter for UI text, Geist (closest free match to ABC Favorit) for display headings
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
})

const geist = Geist({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
  title: 'Unique NPC Games Marketing',
  description: 'Oyun şirketi pazarlama takip paneli',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${geist.variable}`}>
      <body style={{ margin: 0, minHeight: '100vh', backgroundColor: '#000000' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
