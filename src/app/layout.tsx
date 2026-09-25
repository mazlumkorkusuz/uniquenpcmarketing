import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
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
    <html lang="tr" className={jakarta.variable}>
      <body style={{ margin: 0, minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
