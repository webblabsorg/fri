import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getToolConfig } from '@/lib/tools/tool-configs'
import { getSessionUser } from '@/lib/auth'
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

  // Get user session to determine tier
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value
  let userTier: 'free' | 'starter' | 'pro' | 'advanced' = 'free'

  if (sessionToken) {
    const user = await getSessionUser(sessionToken)
    if (user) {
      userTier = user.subscriptionTier as 'free' | 'starter' | 'pro' | 'advanced'
    }
  }

  return <ToolDetailPage tool={toolConfig} userTier={userTier} />
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
