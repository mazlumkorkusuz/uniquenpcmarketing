import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
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
    <html lang="tr" className={geistSans.variable}>
      <body style={{ margin: 0, minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
