import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ImportTracker — Gestion Commerciale',
  description: 'Outil interne privé pour suivre les importations, dépenses et bénéfices',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#f8f9fc]">{children}</body>
    </html>
  )
}
