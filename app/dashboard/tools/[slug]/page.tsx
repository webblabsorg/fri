import { notFound } from 'next/navigation'
import { getToolConfig } from '@/lib/tools/tool-configs'
import ToolDetailPage from '@/components/tools/ToolDetailPage'

interface PageProps {
  params: {
    slug: string
  }
}

export default function ToolPage({ params }: PageProps) {
  const toolConfig = getToolConfig(params.slug)

  if (!toolConfig) {
    notFound()
  }

  return <ToolDetailPage toolConfig={toolConfig} />
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const toolConfig = getToolConfig(params.slug)

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
