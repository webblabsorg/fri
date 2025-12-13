import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ChatbotProvider } from '@/components/chatbot/ChatbotProvider'
import { OrganizationProvider } from '@/components/providers/OrganizationProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Frith AI - Legal AI Platform',
  description: 'The #1 AI-Powered Legal Assistant Platform with 240+ Specialized Tools',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <OrganizationProvider>
            <ChatbotProvider>
              {children}
            </ChatbotProvider>
          </OrganizationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
