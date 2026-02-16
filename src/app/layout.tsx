import type { Metadata } from 'next'
import { Noto_Sans_Hebrew } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const notoSansHebrew = Noto_Sans_Hebrew({
  variable: '--font-noto-sans-hebrew',
  subsets: ['hebrew', 'latin'],
})

export const metadata: Metadata = {
  title: 'Studio Dorian',
  description: 'ניהול פרויקטים וקשרי לקוחות — סטודיו דוריאן',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className={notoSansHebrew.variable}>
      <body className="font-[family-name:var(--font-noto-sans-hebrew)] antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="bottom-left" dir="rtl" />
      </body>
    </html>
  )
}
