// HubSpot CRM integration service

interface HubSpotContact {
  email: string
  firstname?: string
  lastname?: string
  company?: string
  jobtitle?: string
  lead_source?: string
  lead_score?: string
  practice_areas?: string
  firm_size?: string
}

interface HubSpotResponse {
  id: string
  properties: Record<string, any>
  createdAt: string
  updatedAt: string
}

export class HubSpotService {
  private apiKey: string
  private baseUrl = 'https://api.hubapi.com'

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || ''
    if (!this.apiKey) {
      console.warn('HubSpot API key not configured. CRM integration disabled.')
    }
  }

  async syncLead(lead: any): Promise<HubSpotResponse | null> {
    if (!this.apiKey) {
      console.log('HubSpot API key not configured, skipping lead sync')
      return null
    }

    try {
      // Parse name into first and last name
      const nameParts = lead.name ? lead.name.split(' ') : []
      const firstname = nameParts[0] || ''
      const lastname = nameParts.slice(1).join(' ') || ''

      // Prepare contact data
      const contactData: HubSpotContact = {
        email: lead.email,
        firstname,
        lastname,
        company: lead.company || '',
        jobtitle: lead.role || '',
        lead_source: 'Chatbot',
        lead_score: lead.leadScore || 'medium',
        practice_areas: lead.practiceAreas ? JSON.stringify(lead.practiceAreas) : '',
        firm_size: lead.firmSize || ''
      }

      // Check if contact already exists
      const existingContact = await this.findContactByEmail(lead.email)
      
      if (existingContact) {
        // Update existing contact
        return await this.updateContact(existingContact.id, contactData)
      } else {
        // Create new contact
        return await this.createContact(contactData)
      }
    } catch (error) {
      console.error('Error syncing lead to HubSpot:', error)
      return null
    }
  }

  private async findContactByEmail(email: string): Promise<HubSpotResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }]
            }],
            properties: ['email', 'firstname', 'lastname', 'company', 'jobtitle'],
            limit: 1
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.results && data.results.length > 0 ? data.results[0] : null
    } catch (error) {
      console.error('Error finding contact in HubSpot:', error)
      return null
    }
  }

  private async createContact(contactData: HubSpotContact): Promise<HubSpotResponse> {
    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: contactData
        })
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private async updateContact(contactId: string, contactData: HubSpotContact): Promise<HubSpotResponse> {
    const response = await fetch(
      `${this.baseUrl}/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: contactData
        })
      }
    )

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  async createDeal(contactId: string, dealData: {
    dealname: string
    amount?: number
    dealstage: string
    pipeline: string
    closedate?: string
  }): Promise<HubSpotResponse | null> {
    if (!this.apiKey) {
      return null
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/deals`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: dealData,
            associations: [{
              to: { id: contactId },
              types: [{
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 3 // Contact to Deal association
              }]
            }]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating deal in HubSpot:', error)
      return null
    }
  }

  async addNote(contactId: string, noteText: string): Promise<HubSpotResponse | null> {
    if (!this.apiKey) {
      return null
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/notes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              hs_note_body: noteText,
              hs_timestamp: new Date().toISOString()
            },
            associations: [{
              to: { id: contactId },
              types: [{
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 202 // Contact to Note association
              }]
            }]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error adding note in HubSpot:', error)
      return null
    }
  }
}

export const hubspotService = new HubSpotService()
