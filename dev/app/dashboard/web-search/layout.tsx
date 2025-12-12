import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Web Search - Frith AI',
  description: 'AI-powered web search for evidence, case law, news, and public records',
}

export default function WebSearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
