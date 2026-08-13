import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { M_PLUS_Rounded_1c } from 'next/font/google'
import './globals.css'

const rounded = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-rounded',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '元素タイピング｜元素記号・イオン式をおぼえよう',
  description:
    '元素記号とイオン式をタイピングでおぼえる学習ゲーム。全118元素と中学レベルのイオンに対応。AI先生に質問もできます。',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#e9ebfa',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${rounded.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
