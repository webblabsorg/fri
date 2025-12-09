// Tool configuration types

export interface ToolConfig {
  id: string
  name: string
  slug: string
  category: string
  description: string
  longDescription: string
  inputFields: InputField[]
  outputFormat: 'text' | 'markdown' | 'structured'
  complexity: 'simple' | 'medium' | 'high' | 'very_high'
  estimatedTime: string // e.g., "10-30 seconds"
  requiredTier: 'free' | 'starter' | 'pro' | 'advanced'
  aiModel: {
    free: string
    starter: string
    pro: string
    advanced: string
  }
  samplePrompts: string[]
  relatedTools: string[]
  useCases: string[]
  icon: string
}

export interface InputField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'file' | 'multiselect'
  placeholder?: string
  required: boolean
  options?: string[]
  maxLength?: number
  helpText?: string
}

export interface ToolRun {
  id: string
  toolId: string
  toolName: string
  userId: string
  projectId?: string
  inputText: string
  inputData?: Record<string, any>
  outputText?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  aiModelUsed: string
  tokensUsed?: number
  cost?: number
  runTimeMs?: number
  errorMsg?: string
  createdAt: Date
  completedAt?: Date
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  privacy: 'private' | 'team' | 'public'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  toolRuns?: ToolRun[]
}

export interface Favorite {
  id: string
  userId: string
  toolId: string
  createdAt: Date
}
