/**
 * Clio API Client
 * 
 * Provides a wrapper around the Clio REST API for legal practice management.
 * Handles authentication, rate limiting, and common API operations.
 */

interface ClioConfig {
  accessToken: string
  refreshToken?: string
  baseUrl?: string
}

interface ClioMatter {
  id: number
  display_number: string
  description: string
  status: string
  client: {
    id: number
    name: string
    type: string
  }
  practice_area: {
    id: number
    name: string
  }
  created_at: string
  updated_at: string
}

interface ClioDocument {
  id: number
  name: string
  description?: string
  size: number
  created_at: string
  updated_at: string
  matter?: {
    id: number
    display_number: string
    description: string
  }
  created_by: {
    id: number
    name: string
    email: string
  }
}

interface ClioContact {
  id: number
  name: string
  type: string
  email_addresses: Array<{
    id: number
    name: string
    address: string
    default_email: boolean
  }>
  phone_numbers: Array<{
    id: number
    name: string
    number: string
    default_number: boolean
  }>
}

export class ClioClient {
  private config: ClioConfig
  private baseUrl: string

  constructor(config: ClioConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://app.clio.com/api/v4'
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - token may be expired')
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded')
        }
        throw new Error(`Clio API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('[Clio] API request failed:', error)
      throw error
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    const response = await this.makeRequest<{ data: any }>('/users/who_am_i')
    return response.data
  }

  /**
   * List matters with optional filtering
   */
  async getMatters(params?: {
    limit?: number
    offset?: number
    status?: string
    client_id?: number
  }): Promise<{ data: ClioMatter[] }> {
    const searchParams = new URLSearchParams()
    
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.client_id) searchParams.set('client_id', params.client_id.toString())

    const endpoint = `/matters${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.makeRequest<{ data: ClioMatter[] }>(endpoint)
  }

  /**
   * Get a specific matter by ID
   */
  async getMatter(matterId: number): Promise<{ data: ClioMatter }> {
    return this.makeRequest<{ data: ClioMatter }>(`/matters/${matterId}`)
  }

  /**
   * Create a new matter
   */
  async createMatter(matter: {
    client_id: number
    description: string
    practice_area_id?: number
    status?: string
  }): Promise<{ data: ClioMatter }> {
    return this.makeRequest<{ data: ClioMatter }>('/matters', {
      method: 'POST',
      body: JSON.stringify({ data: matter }),
    })
  }

  /**
   * List documents with optional filtering
   */
  async getDocuments(params?: {
    limit?: number
    offset?: number
    matter_id?: number
  }): Promise<{ data: ClioDocument[] }> {
    const searchParams = new URLSearchParams()
    
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.matter_id) searchParams.set('matter_id', params.matter_id.toString())

    const endpoint = `/documents${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.makeRequest<{ data: ClioDocument[] }>(endpoint)
  }

  /**
   * Upload a document to a matter
   */
  async uploadDocument(params: {
    matter_id: number
    name: string
    description?: string
    file: Buffer
    filename: string
    contentType: string
  }): Promise<{ data: ClioDocument }> {
    const formData = new FormData()
    
    // Create file blob
    const blob = new Blob([new Uint8Array(params.file)], { type: params.contentType })
    formData.append('data[name]', params.name)
    formData.append('data[matter_id]', params.matter_id.toString())
    if (params.description) {
      formData.append('data[description]', params.description)
    }
    formData.append('data[document]', blob, params.filename)

    const response = await fetch(`${this.baseUrl}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Accept': 'application/json',
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Download a document
   */
  async downloadDocument(documentId: number): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/documents/${documentId}/download`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.status} ${response.statusText}`)
    }

    return response.arrayBuffer()
  }

  /**
   * List contacts (clients)
   */
  async getContacts(params?: {
    limit?: number
    offset?: number
    type?: 'Person' | 'Company'
  }): Promise<{ data: ClioContact[] }> {
    const searchParams = new URLSearchParams()
    
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.type) searchParams.set('type', params.type)

    const endpoint = `/contacts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return this.makeRequest<{ data: ClioContact[] }>(endpoint)
  }

  /**
   * Create a new contact
   */
  async createContact(contact: {
    name: string
    type: 'Person' | 'Company'
    email?: string
    phone?: string
  }): Promise<{ data: ClioContact }> {
    const contactData: any = {
      name: contact.name,
      type: contact.type,
    }

    if (contact.email) {
      contactData.email_addresses = [{
        name: 'Work',
        address: contact.email,
        default_email: true,
      }]
    }

    if (contact.phone) {
      contactData.phone_numbers = [{
        name: 'Work',
        number: contact.phone,
        default_number: true,
      }]
    }

    return this.makeRequest<{ data: ClioContact }>('/contacts', {
      method: 'POST',
      body: JSON.stringify({ data: contactData }),
    })
  }

  /**
   * Search across matters, contacts, and documents
   */
  async search(query: string, types?: string[]): Promise<{
    matters: ClioMatter[]
    contacts: ClioContact[]
    documents: ClioDocument[]
  }> {
    const searchParams = new URLSearchParams()
    searchParams.set('query', query)
    if (types && types.length > 0) {
      searchParams.set('types', types.join(','))
    }

    const response = await this.makeRequest<{
      data: {
        matters: ClioMatter[]
        contacts: ClioContact[]
        documents: ClioDocument[]
      }
    }>(`/search?${searchParams.toString()}`)

    return response.data
  }
}

/**
 * Create a Clio client instance
 */
export function createClioClient(config: ClioConfig): ClioClient {
  return new ClioClient(config)
}

/**
 * Validate Clio access token
 */
export async function validateClioToken(accessToken: string): Promise<boolean> {
  try {
    const client = new ClioClient({ accessToken })
    await client.getCurrentUser()
    return true
  } catch (error) {
    return false
  }
}
