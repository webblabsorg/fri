import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { buildPrompt } from '@/lib/ai/prompt-builder'
import { getToolConfig } from '@/lib/tools/tool-configs'
import { normalizeTier, validateAPIKeys } from '@/lib/ai/model-service'
import { OutputEvaluator } from '@/lib/ai/evaluation'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Disable body size limit for streaming
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mapToolToPromptType(toolSlug: string): string {
  const mapping: Record<string, string> = {
    'legal-email-drafter': 'EMAIL_DRAFTER',
    'case-law-summarizer': 'CASE_SUMMARIZER',
    'contract-risk-analyzer': 'CONTRACT_RISK_ANALYZER',
    'deposition-summarizer': 'DEPOSITION_SUMMARIZER',
    'legal-memo-writer': 'LEGAL_MEMO_WRITER',
    'legal-issue-spotter': 'LEGAL_ISSUE_SPOTTER',
    'demand-letter-generator': 'DEMAND_LETTER',
    'contract-drafter-nda': 'CONTRACT_DRAFTER',
    'contract-clause-extractor': 'CONTRACT_CLAUSE_EXTRACTOR',
    'contract-summary-generator': 'CONTRACT_SUMMARY',
    'discovery-request-generator': 'DISCOVERY_REQUEST',
    'motion-to-dismiss-drafter': 'MOTION_TO_DISMISS',
    'manda-due-diligence-analyzer': 'DUE_DILIGENCE',
    'board-resolution-drafter': 'BOARD_RESOLUTION',
    'employment-contract-generator': 'EMPLOYMENT_CONTRACT',
    'termination-letter-drafter': 'TERMINATION_LETTER',
    'patent-prior-art-search': 'PATENT_SEARCH',
    'client-status-update': 'CLIENT_UPDATE',
    'lease-agreement-analyzer': 'LEASE_ANALYZER',
    'legal-research-assistant': 'LEGAL_RESEARCH',
  }
  return mapping[toolSlug] || 'EMAIL_DRAFTER'
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })
    }

    const body = await request.json()
    const { toolId, context } = body

    if (!toolId || !context) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: toolId, context' }),
        { status: 400 }
      )
    }

    const toolConfig = getToolConfig(toolId)
    if (!toolConfig) {
      return new Response(
        JSON.stringify({ error: `Tool configuration not found: ${toolId}` }),
        { status: 404 }
      )
    }

    // Check user's tier access
    const userTier = user.subscriptionTier as 'free' | 'starter' | 'pro' | 'advanced'
    const tierOrder = ['free', 'starter', 'pro', 'advanced']
    const requiredTierIndex = tierOrder.indexOf(toolConfig.requiredTier)
    const userTierIndex = tierOrder.indexOf(userTier)

    if (userTierIndex < requiredTierIndex) {
      return new Response(
        JSON.stringify({
          error: `This tool requires ${toolConfig.requiredTier} plan or higher`,
        }),
        { status: 403 }
      )
    }

    // Validate API keys are configured
    const apiKeys = validateAPIKeys()
    if (!apiKeys.anthropic && !apiKeys.google) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 503 }
      )
    }

    // Build prompts
    const prompts = buildPrompt(mapToolToPromptType(toolId), context)
    const normalizedTier = normalizeTier(userTier.toUpperCase())
    const aiModelDisplay = toolConfig.aiModel[userTier]

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = ''
        const startTime = Date.now()

        try {
          // Determine which provider based on tier
          const useGoogle = normalizedTier === 'FREE'

          if (useGoogle && apiKeys.google) {
            // Google Gemini streaming - use actual API key from env
            const googleApiKey = process.env.GOOGLE_AI_API_KEY
            if (!googleApiKey) {
              throw new Error('Google API key not configured')
            }
            const genAI = new GoogleGenerativeAI(googleApiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

            const result = await model.generateContentStream([
              { text: prompts.system },
              { text: prompts.user },
            ])

            for await (const chunk of result.stream) {
              const text = chunk.text()
              fullContent += text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`))
            }
          } else if (apiKeys.anthropic) {
            // Anthropic Claude streaming - use actual API key from env
            const anthropicApiKey = process.env.ANTHROPIC_API_KEY
            if (!anthropicApiKey) {
              throw new Error('Anthropic API key not configured')
            }
            const anthropic = new Anthropic({ apiKey: anthropicApiKey })
            const modelName =
              normalizedTier === 'ENTERPRISE' || normalizedTier === 'PROFESSIONAL'
                ? 'claude-sonnet-4-20250514'
                : 'claude-3-5-haiku-20241022'

            const stream = await anthropic.messages.stream({
              model: modelName,
              max_tokens: 4000,
              temperature: 0.7,
              system: prompts.system,
              messages: [{ role: 'user', content: prompts.user }],
            })

            for await (const chunk of stream) {
              if (
                chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta'
              ) {
                const text = chunk.delta.text
                fullContent += text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
                )
              }
            }
          }

          const endTime = Date.now()
          const runTimeMs = endTime - startTime

          // Evaluate the output
          const evaluation = OutputEvaluator.evaluate(
            fullContent,
            JSON.stringify(context),
            toolConfig.category,
            toolId
          )

          // Save to database
          const toolRun = await prisma.toolRun.create({
            data: {
              userId: user.id,
              toolId: toolId,
              inputText: JSON.stringify(context),
              outputText: fullContent,
              status: 'completed',
              aiModelUsed: aiModelDisplay,
              tokensUsed: Math.ceil(fullContent.length / 4), // Rough estimate
              cost: 0.001, // Rough estimate
              runTimeMs: runTimeMs,
              evaluationScore: evaluation.score,
              evaluationData: evaluation as any,
              evaluatedAt: new Date(),
              completedAt: new Date(),
            },
          })

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                executionId: toolRun.id,
                evaluation: {
                  score: evaluation.score,
                  passed: evaluation.passed,
                  threshold: evaluation.threshold,
                },
              })}\n\n`
            )
          )
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: 'Streaming failed',
                done: true,
              })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Stream setup error:', error)
    return new Response(JSON.stringify({ error: 'Failed to setup stream' }), {
      status: 500,
    })
  }
}
