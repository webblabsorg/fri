// Use dynamic imports to avoid build-time initialization
let anthropic: any = null
let googleAI: any = null

async function getAnthropicClient() {
  if (!anthropic) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    })
  }
  return anthropic
}

async function getGoogleAIClient() {
  if (!googleAI) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    googleAI = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_API_KEY || ''
    )
  }
  return googleAI
}

// Model configurations
export const MODELS = {
  FREE: {
    provider: 'google',
    model: 'gemini-1.5-flash',
    maxTokens: 8192,
    costPer1kTokens: 0.0, // Free tier
  },
  PRO: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    costPer1kTokens: 0.003, // $3 per 1M tokens
  },
  ENTERPRISE: {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    maxTokens: 4096,
    costPer1kTokens: 0.015, // $15 per 1M tokens
  },
} as const

export type SubscriptionTier = keyof typeof MODELS
export type AIProvider = 'anthropic' | 'google'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIGenerateOptions {
  messages: AIMessage[]
  tier: SubscriptionTier
  temperature?: number
  maxTokens?: number
  userId?: string
  toolId?: string
}

export interface AIGenerateResult {
  content: string
  tokensUsed: {
    input: number
    output: number
    total: number
  }
  cost: number
  model: string
  provider: AIProvider
}

// Generate AI response using appropriate model based on tier
export async function generateAIResponse(
  options: AIGenerateOptions
): Promise<AIGenerateResult> {
  const modelConfig = MODELS[options.tier]
  const temperature = options.temperature ?? 0.7
  const maxTokens = options.maxTokens ?? modelConfig.maxTokens

  if (modelConfig.provider === 'anthropic') {
    return generateAnthropicResponse({
      ...options,
      modelConfig,
      temperature,
      maxTokens,
    })
  } else {
    return generateGoogleResponse({
      ...options,
      modelConfig,
      temperature,
      maxTokens,
    })
  }
}

// Anthropic (Claude) implementation
async function generateAnthropicResponse(options: {
  messages: AIMessage[]
  modelConfig: typeof MODELS.PRO | typeof MODELS.ENTERPRISE
  temperature: number
  maxTokens: number
}): Promise<AIGenerateResult> {
  const { messages, modelConfig, temperature, maxTokens } = options

  // Extract system message
  const systemMessage = messages.find((m) => m.role === 'system')
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  // Convert to Anthropic format
  const anthropicMessages = conversationMessages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))

  try {
    const client = await getAnthropicClient()
    const response = await client.messages.create({
      model: modelConfig.model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content,
      messages: anthropicMessages,
    })

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const totalTokens = inputTokens + outputTokens

    // Calculate cost
    const cost = (totalTokens / 1000) * modelConfig.costPer1kTokens

    return {
      content,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost,
      model: modelConfig.model,
      provider: 'anthropic',
    }
  } catch (error) {
    console.error('Anthropic API error:', error)
    throw new Error('Failed to generate AI response from Claude')
  }
}

// Google (Gemini) implementation
async function generateGoogleResponse(options: {
  messages: AIMessage[]
  modelConfig: typeof MODELS.FREE
  temperature: number
  maxTokens: number
}): Promise<AIGenerateResult> {
  const { messages, modelConfig, temperature, maxTokens } = options

  try {
    const client = await getGoogleAIClient()
    const model = client.getGenerativeModel({
      model: modelConfig.model,
    })

    // Convert messages to Gemini format
    const systemMessage = messages.find((m) => m.role === 'system')
    const conversationMessages = messages.filter((m) => m.role !== 'system')

    // Build prompt with system message
    let fullPrompt = ''
    if (systemMessage) {
      fullPrompt = `${systemMessage.content}\n\n`
    }

    // Add conversation history
    conversationMessages.forEach((msg) => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n\n`
      } else {
        fullPrompt += `Assistant: ${msg.content}\n\n`
      }
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    })

    const response = result.response
    const content = response.text()

    // Estimate tokens (Gemini doesn't provide exact counts in all cases)
    const inputTokens = Math.ceil(fullPrompt.length / 4)
    const outputTokens = Math.ceil(content.length / 4)
    const totalTokens = inputTokens + outputTokens

    // Free tier - no cost
    const cost = 0

    return {
      content,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost,
      model: modelConfig.model,
      provider: 'google',
    }
  } catch (error) {
    console.error('Google AI error:', error)
    throw new Error('Failed to generate AI response from Gemini')
  }
}

// Streaming support (for future implementation)
export async function streamAIResponse(
  options: AIGenerateOptions
): Promise<AsyncIterator<string>> {
  // TODO: Implement streaming for real-time responses
  throw new Error('Streaming not yet implemented')
}

// Get model info for a tier
export function getModelInfo(tier: SubscriptionTier) {
  return MODELS[tier]
}

// Validate API keys are configured
export function validateAPIKeys(): {
  anthropic: boolean
  google: boolean
} {
  return {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_AI_API_KEY,
  }
}
