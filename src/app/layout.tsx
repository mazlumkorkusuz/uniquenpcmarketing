import type { Metadata } from 'next'
import { Inter, Space_Grotesk, DM_Sans } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

// MASTER type: Space Grotesk for display/headings, DM Sans for body. Inter stays for the sidebar.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
})

const display = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
})

const body = DM_Sans({
  variable: '--font-body',
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
    <html lang="tr" className={`${inter.variable} ${display.variable} ${body.variable}`}>
      <body style={{ margin: 0, minHeight: '100vh' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
