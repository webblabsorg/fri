import { notFound } from 'next/navigation'
import { getToolConfig } from '@/lib/tools/tool-configs'
import { ToolDetailPage } from '@/components/tools/ToolDetailPage'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params
  const toolConfig = getToolConfig(slug)

  if (!toolConfig) {
    notFound()
  }

  return <ToolDetailPage tool={toolConfig} userTier="free" />
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const toolConfig = getToolConfig(slug)

  if (!toolConfig) {
    return {
      title: 'Tool Not Found',
    }
  }

  return {
    title: `${toolConfig.name} | Frith AI`,
    description: toolConfig.description,
  }
}
