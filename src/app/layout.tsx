import type { Metadata } from 'next'
import { Bricolage_Grotesque, Geist } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'
import ThemeProvider from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

// Caravan type: Bricolage Grotesque carries the display voice, Geist does the work.
const display = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
})

const body = Geist({
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
    <html lang="tr" className={cn(display.variable, body.variable, 'font-sans')} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
