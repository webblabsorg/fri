# Zapier Integration Documentation

## Overview

The Frith AI Zapier integration allows users to automate workflows by connecting Frith AI tools with thousands of other apps through Zapier. This integration provides both triggers (when something happens in Frith AI) and actions (do something in Frith AI).

## Available Triggers

### 1. Tool Run Completed
**Trigger:** When a tool run is completed in Frith AI
**Endpoint:** `GET /api/integrations/zapier/triggers/tool-run-completed`

**Sample Response:**
```json
[
  {
    "id": "evt_123",
    "tool_run_id": "run_456",
    "tool_id": "legal-email-drafter",
    "status": "completed",
    "output_text": "Generated email content...",
    "tokens_used": 150,
    "cost": 0.003,
    "created_at": "2023-12-10T10:30:00Z",
    "user_id": "user_789"
  }
]
```

### 2. Tool Run Created
**Trigger:** When a new tool run is started in Frith AI
**Endpoint:** `GET /api/integrations/zapier/triggers/tool-run-created`

**Sample Response:**
```json
[
  {
    "id": "evt_124",
    "tool_run_id": "run_457",
    "tool_id": "contract-analyzer",
    "status": "processing",
    "input_text": "Contract text to analyze...",
    "created_at": "2023-12-10T10:25:00Z",
    "user_id": "user_789"
  }
]
```

### 3. Project Created
**Trigger:** When a new project is created in Frith AI
**Endpoint:** `GET /api/integrations/zapier/triggers/project-created`

## Available Actions

### 1. Run Tool
**Action:** Execute a Frith AI tool with provided input
**Endpoint:** `POST /api/integrations/zapier/webhook`

**Request Body:**
```json
{
  "action": "run_tool",
  "data": {
    "tool_id": "legal-email-drafter",
    "input_text": "Draft an email about contract review",
    "user_id": "user_789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "tool_run_id": "run_458",
  "output": "Generated email content...",
  "status": "completed",
  "tokens_used": 120,
  "cost": 0.0024
}
```

### 2. Create Project
**Action:** Create a new project in Frith AI
**Endpoint:** `POST /api/integrations/zapier/webhook`

**Request Body:**
```json
{
  "action": "create_project",
  "data": {
    "name": "Contract Review Project",
    "description": "Project for reviewing client contracts",
    "user_id": "user_789",
    "workspace_id": "ws_456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "project_id": "proj_789",
  "name": "Contract Review Project",
  "description": "Project for reviewing client contracts",
  "status": "active",
  "created_at": "2023-12-10T10:35:00Z"
}
```

### 3. Get Tool Output
**Action:** Retrieve the output of a completed tool run
**Endpoint:** `POST /api/integrations/zapier/webhook`

**Request Body:**
```json
{
  "action": "get_tool_output",
  "data": {
    "tool_run_id": "run_458"
  }
}
```

## Authentication

The Zapier integration uses API key authentication. Users need to:

1. Generate an API key in their Frith AI account settings
2. Provide their User ID for scoping operations
3. Include the API key in webhook requests

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## Zapier App Configuration

### App Metadata
- **App Name:** Frith AI
- **Description:** AI-powered legal document analysis and drafting
- **Category:** Legal, AI, Productivity
- **Logo:** Frith AI logo (32x32, 64x64, 128x128)

### Authentication
- **Type:** API Key
- **Fields:**
  - API Key (required)
  - User ID (required)
  - Base URL (optional, defaults to production)

### Triggers Configuration

#### Tool Run Completed
```javascript
{
  key: 'tool_run_completed',
  noun: 'Tool Run',
  display: {
    label: 'Tool Run Completed',
    description: 'Triggers when a tool run is completed in Frith AI'
  },
  operation: {
    type: 'polling',
    perform: {
      url: '{{bundle.authData.base_url}}/api/integrations/zapier/triggers/tool-run-completed',
      params: {
        user_id: '{{bundle.authData.user_id}}',
        limit: 50
      }
    },
    sample: {
      id: 'evt_123',
      tool_run_id: 'run_456',
      tool_id: 'legal-email-drafter',
      status: 'completed',
      output_text: 'Sample generated content...',
      tokens_used: 150,
      cost: 0.003,
      created_at: '2023-12-10T10:30:00Z',
      user_id: 'user_789'
    }
  }
}
```

### Actions Configuration

#### Run Tool
```javascript
{
  key: 'run_tool',
  noun: 'Tool Run',
  display: {
    label: 'Run AI Tool',
    description: 'Execute a Frith AI tool with provided input'
  },
  operation: {
    inputFields: [
      {
        key: 'tool_id',
        label: 'Tool ID',
        type: 'string',
        required: true,
        choices: {
          'legal-email-drafter': 'Legal Email Drafter',
          'contract-analyzer': 'Contract Analyzer',
          'legal-research': 'Legal Research Assistant'
        }
      },
      {
        key: 'input_text',
        label: 'Input Text',
        type: 'text',
        required: true
      }
    ],
    perform: {
      url: '{{bundle.authData.base_url}}/api/integrations/zapier/webhook',
      method: 'POST',
      body: {
        action: 'run_tool',
        data: {
          tool_id: '{{bundle.inputData.tool_id}}',
          input_text: '{{bundle.inputData.input_text}}',
          user_id: '{{bundle.authData.user_id}}'
        }
      }
    },
    sample: {
      success: true,
      tool_run_id: 'run_458',
      output: 'Sample generated content...',
      status: 'completed',
      tokens_used: 120,
      cost: 0.0024
    }
  }
}
```

## Common Use Cases

### 1. Email Automation
**Trigger:** New email in Gmail
**Action:** Run Legal Email Drafter tool
**Result:** Generate professional legal response

### 2. Document Processing
**Trigger:** New file in Google Drive
**Action:** Run Contract Analyzer tool
**Result:** Extract key terms and risks

### 3. Project Management
**Trigger:** Tool Run Completed
**Action:** Create task in Asana
**Result:** Track AI-generated content review

### 4. Slack Notifications
**Trigger:** Tool Run Completed
**Action:** Send message to Slack
**Result:** Notify team of completed analysis

### 5. CRM Integration
**Trigger:** Tool Run Completed
**Action:** Update Salesforce record
**Result:** Add AI insights to client records

## Error Handling

The integration includes comprehensive error handling:

### Common Error Codes
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid API key)
- `404` - Not Found (tool run, project, etc.)
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

## Rate Limiting

- **Triggers:** 1 request per minute per user
- **Actions:** 10 requests per minute per user
- **Burst:** Up to 50 requests in a 5-minute window

## Testing

### Development Environment
- Use test API keys for development
- Sandbox mode available for testing triggers/actions
- Mock responses for rapid iteration

### Zapier CLI Testing
```bash
# Install Zapier CLI
npm install -g zapier-platform-cli

# Test triggers
zapier test --grep="tool_run_completed"

# Test actions
zapier test --grep="run_tool"
```

## Deployment

### Zapier App Store Submission
1. Complete app development and testing
2. Submit for Zapier review
3. Address any feedback
4. Publish to Zapier App Directory

### Monitoring
- Track usage metrics via Zapier dashboard
- Monitor error rates and performance
- User feedback and support requests

## Security Considerations

1. **API Key Security:** Keys are encrypted in transit and at rest
2. **User Scoping:** All operations are scoped to the authenticated user
3. **Rate Limiting:** Prevents abuse and ensures fair usage
4. **Input Validation:** All inputs are validated and sanitized
5. **Audit Logging:** All integration activities are logged

## Support

For technical support:
- **Documentation:** [Integration docs URL]
- **Email:** integrations@frith.ai
- **Zapier Support:** Contact through Zapier platform

## Version History

- **v1.0.0:** Initial release with basic triggers and actions
- **v1.1.0:** (Planned) Enhanced error handling and additional triggers
- **v1.2.0:** (Planned) Webhook-based triggers for real-time updates
