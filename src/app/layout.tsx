import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Unique NPC Marketing Hub',
  description: 'Oyun şirketi pazarlama takip paneli',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={geistSans.variable}>
      <body style={{ margin: 0, minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main
            style={{
              marginLeft: '260px',
              flex: 1,
              minHeight: '100vh',
              backgroundColor: '#0a0a0f',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
