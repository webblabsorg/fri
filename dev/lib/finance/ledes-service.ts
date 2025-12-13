import { prisma } from '@/lib/db'

// ============================================================================
// LEDES BILLING FORMAT SERVICE
// Supports LEDES98B and LEDES2000 formats for legal e-billing
// ============================================================================

export type LedesFormat = 'LEDES98B' | 'LEDES2000'

export interface LedesExportOptions {
  invoiceIds: string[]
  format: LedesFormat
  includeExpenses?: boolean
  includeTimeEntries?: boolean
}

export interface LedesValidationResult {
  isValid: boolean
  errors: LedesValidationError[]
  warnings: LedesValidationWarning[]
}

export interface LedesValidationError {
  field: string
  message: string
  lineNumber?: number
  code: string
}

export interface LedesValidationWarning {
  field: string
  message: string
  lineNumber?: number
}

// LEDES98B field definitions (pipe-delimited)
const LEDES98B_HEADERS = [
  'INVOICE_DATE',
  'INVOICE_NUMBER',
  'INVOICE_TOTAL',
  'BILLING_START_DATE',
  'BILLING_END_DATE',
  'INVOICE_DESCRIPTION',
  'LAW_FIRM_ID',
  'LAW_FIRM_NAME',
  'CLIENT_ID',
  'CLIENT_NAME',
  'MATTER_ID',
  'MATTER_NAME',
  'LINE_ITEM_NUMBER',
  'LINE_ITEM_DATE',
  'LINE_ITEM_TASK_CODE',
  'LINE_ITEM_EXPENSE_CODE',
  'LINE_ITEM_ACTIVITY_CODE',
  'LINE_ITEM_TIMEKEEPER_ID',
  'LINE_ITEM_TIMEKEEPER_NAME',
  'LINE_ITEM_DESCRIPTION',
  'LINE_ITEM_QUANTITY',
  'LINE_ITEM_RATE',
  'LINE_ITEM_TOTAL',
  'LINE_ITEM_ADJUSTMENT_AMOUNT',
  'LINE_ITEM_TOTAL_ADJUSTED',
]

// LEDES2000 uses XML format
const LEDES2000_NAMESPACE = 'http://www.ledes.org/2000'

/**
 * Export invoices to LEDES format
 */
export async function exportToLedes(options: LedesExportOptions): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: options.invoiceIds } },
    include: {
      client: true,
      matter: true,
      organization: true,
      lineItems: {
        include: {
          timeEntry: true,
          expense: true,
        },
      },
    },
  })

  if (invoices.length === 0) {
    throw new Error('No invoices found for export')
  }

  if (options.format === 'LEDES98B') {
    return exportToLedes98B(invoices)
  } else {
    return exportToLedes2000(invoices)
  }
}

/**
 * Export to LEDES98B format (pipe-delimited text)
 */
function exportToLedes98B(invoices: any[]): string {
  const lines: string[] = []
  
  // Header line
  lines.push(LEDES98B_HEADERS.join('|') + '[]')
  
  for (const invoice of invoices) {
    let lineItemNumber = 1
    
    for (const item of invoice.lineItems) {
      const isTimeEntry = !!item.timeEntry
      const isExpense = !!item.expense
      
      const line = [
        formatDate98B(invoice.invoiceDate),
        invoice.invoiceNumber,
        formatAmount(invoice.total),
        formatDate98B(invoice.periodStart || invoice.invoiceDate),
        formatDate98B(invoice.periodEnd || invoice.invoiceDate),
        sanitizeText(invoice.notes || ''),
        invoice.organization.id.substring(0, 20),
        sanitizeText(invoice.organization.name),
        invoice.client.id.substring(0, 20),
        sanitizeText(invoice.client.displayName),
        invoice.matter?.id?.substring(0, 20) || '',
        sanitizeText(invoice.matter?.name || ''),
        lineItemNumber.toString(),
        formatDate98B(item.date || invoice.invoiceDate),
        item.taskCode || '',
        isExpense ? (item.expenseCode || 'E999') : '',
        isTimeEntry ? (item.activityCode || 'A999') : '',
        item.timeEntry?.user?.id?.substring(0, 20) || '',
        item.timeEntry?.user?.name || '',
        sanitizeText(item.description),
        formatQuantity(item.quantity),
        formatAmount(item.rate),
        formatAmount(item.amount),
        formatAmount(item.adjustmentAmount || 0),
        formatAmount(item.amount + (item.adjustmentAmount || 0)),
      ]
      
      lines.push(line.join('|') + '[]')
      lineItemNumber++
    }
  }
  
  return lines.join('\n')
}

/**
 * Export to LEDES2000 format (XML)
 */
function exportToLedes2000(invoices: any[]): string {
  const xmlLines: string[] = []
  
  xmlLines.push('<?xml version="1.0" encoding="UTF-8"?>')
  xmlLines.push(`<LEDES xmlns="${LEDES2000_NAMESPACE}">`)
  
  for (const invoice of invoices) {
    xmlLines.push('  <INVOICE>')
    xmlLines.push(`    <INVOICE_DATE>${formatDateXml(invoice.invoiceDate)}</INVOICE_DATE>`)
    xmlLines.push(`    <INVOICE_NUMBER>${escapeXml(invoice.invoiceNumber)}</INVOICE_NUMBER>`)
    xmlLines.push(`    <INVOICE_TOTAL>${formatAmount(invoice.total)}</INVOICE_TOTAL>`)
    xmlLines.push(`    <BILLING_START_DATE>${formatDateXml(invoice.periodStart || invoice.invoiceDate)}</BILLING_START_DATE>`)
    xmlLines.push(`    <BILLING_END_DATE>${formatDateXml(invoice.periodEnd || invoice.invoiceDate)}</BILLING_END_DATE>`)
    xmlLines.push(`    <INVOICE_DESCRIPTION>${escapeXml(invoice.notes || '')}</INVOICE_DESCRIPTION>`)
    
    xmlLines.push('    <LAW_FIRM>')
    xmlLines.push(`      <LAW_FIRM_ID>${escapeXml(invoice.organization.id)}</LAW_FIRM_ID>`)
    xmlLines.push(`      <LAW_FIRM_NAME>${escapeXml(invoice.organization.name)}</LAW_FIRM_NAME>`)
    xmlLines.push('    </LAW_FIRM>')
    
    xmlLines.push('    <CLIENT>')
    xmlLines.push(`      <CLIENT_ID>${escapeXml(invoice.client.id)}</CLIENT_ID>`)
    xmlLines.push(`      <CLIENT_NAME>${escapeXml(invoice.client.displayName)}</CLIENT_NAME>`)
    xmlLines.push('    </CLIENT>')
    
    if (invoice.matter) {
      xmlLines.push('    <MATTER>')
      xmlLines.push(`      <MATTER_ID>${escapeXml(invoice.matter.id)}</MATTER_ID>`)
      xmlLines.push(`      <MATTER_NAME>${escapeXml(invoice.matter.name)}</MATTER_NAME>`)
      xmlLines.push('    </MATTER>')
    }
    
    xmlLines.push('    <LINE_ITEMS>')
    let lineItemNumber = 1
    
    for (const item of invoice.lineItems) {
      const isTimeEntry = !!item.timeEntry
      const isExpense = !!item.expense
      
      xmlLines.push('      <LINE_ITEM>')
      xmlLines.push(`        <LINE_ITEM_NUMBER>${lineItemNumber}</LINE_ITEM_NUMBER>`)
      xmlLines.push(`        <LINE_ITEM_DATE>${formatDateXml(item.date || invoice.invoiceDate)}</LINE_ITEM_DATE>`)
      xmlLines.push(`        <LINE_ITEM_TYPE>${isExpense ? 'EXPENSE' : 'FEE'}</LINE_ITEM_TYPE>`)
      
      if (item.taskCode) {
        xmlLines.push(`        <LINE_ITEM_TASK_CODE>${escapeXml(item.taskCode)}</LINE_ITEM_TASK_CODE>`)
      }
      if (isExpense && item.expenseCode) {
        xmlLines.push(`        <LINE_ITEM_EXPENSE_CODE>${escapeXml(item.expenseCode)}</LINE_ITEM_EXPENSE_CODE>`)
      }
      if (isTimeEntry && item.activityCode) {
        xmlLines.push(`        <LINE_ITEM_ACTIVITY_CODE>${escapeXml(item.activityCode)}</LINE_ITEM_ACTIVITY_CODE>`)
      }
      
      if (item.timeEntry?.user) {
        xmlLines.push('        <TIMEKEEPER>')
        xmlLines.push(`          <TIMEKEEPER_ID>${escapeXml(item.timeEntry.user.id)}</TIMEKEEPER_ID>`)
        xmlLines.push(`          <TIMEKEEPER_NAME>${escapeXml(item.timeEntry.user.name)}</TIMEKEEPER_NAME>`)
        xmlLines.push('        </TIMEKEEPER>')
      }
      
      xmlLines.push(`        <LINE_ITEM_DESCRIPTION>${escapeXml(item.description)}</LINE_ITEM_DESCRIPTION>`)
      xmlLines.push(`        <LINE_ITEM_QUANTITY>${formatQuantity(item.quantity)}</LINE_ITEM_QUANTITY>`)
      xmlLines.push(`        <LINE_ITEM_RATE>${formatAmount(item.rate)}</LINE_ITEM_RATE>`)
      xmlLines.push(`        <LINE_ITEM_TOTAL>${formatAmount(item.amount)}</LINE_ITEM_TOTAL>`)
      
      if (item.adjustmentAmount) {
        xmlLines.push(`        <LINE_ITEM_ADJUSTMENT_AMOUNT>${formatAmount(item.adjustmentAmount)}</LINE_ITEM_ADJUSTMENT_AMOUNT>`)
        xmlLines.push(`        <LINE_ITEM_TOTAL_ADJUSTED>${formatAmount(item.amount + item.adjustmentAmount)}</LINE_ITEM_TOTAL_ADJUSTED>`)
      }
      
      xmlLines.push('      </LINE_ITEM>')
      lineItemNumber++
    }
    
    xmlLines.push('    </LINE_ITEMS>')
    xmlLines.push('  </INVOICE>')
  }
  
  xmlLines.push('</LEDES>')
  
  return xmlLines.join('\n')
}

/**
 * Validate LEDES file content
 */
export function validateLedes(content: string, format: LedesFormat): LedesValidationResult {
  const errors: LedesValidationError[] = []
  const warnings: LedesValidationWarning[] = []
  
  if (format === 'LEDES98B') {
    return validateLedes98B(content)
  } else {
    return validateLedes2000(content)
  }
}

/**
 * Validate LEDES98B format
 */
function validateLedes98B(content: string): LedesValidationResult {
  const errors: LedesValidationError[] = []
  const warnings: LedesValidationWarning[] = []
  
  const lines = content.split('\n').filter(l => l.trim())
  
  if (lines.length === 0) {
    errors.push({
      field: 'file',
      message: 'File is empty',
      code: 'EMPTY_FILE',
    })
    return { isValid: false, errors, warnings }
  }
  
  // Check header line
  const headerLine = lines[0]
  if (!headerLine.endsWith('[]')) {
    errors.push({
      field: 'header',
      message: 'Header line must end with []',
      lineNumber: 1,
      code: 'INVALID_LINE_TERMINATOR',
    })
  }
  
  const headers = headerLine.replace('[]', '').split('|')
  const expectedHeaders = LEDES98B_HEADERS
  
  if (headers.length !== expectedHeaders.length) {
    errors.push({
      field: 'header',
      message: `Expected ${expectedHeaders.length} columns, found ${headers.length}`,
      lineNumber: 1,
      code: 'INVALID_COLUMN_COUNT',
    })
  }
  
  // Validate each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1
    
    if (!line.endsWith('[]')) {
      errors.push({
        field: 'line',
        message: 'Line must end with []',
        lineNumber,
        code: 'INVALID_LINE_TERMINATOR',
      })
    }
    
    const fields = line.replace('[]', '').split('|')
    
    if (fields.length !== expectedHeaders.length) {
      errors.push({
        field: 'line',
        message: `Expected ${expectedHeaders.length} fields, found ${fields.length}`,
        lineNumber,
        code: 'INVALID_FIELD_COUNT',
      })
      continue
    }
    
    // Validate required fields
    const invoiceDate = fields[0]
    const invoiceNumber = fields[1]
    const invoiceTotal = fields[2]
    const lawFirmId = fields[6]
    const clientId = fields[8]
    
    if (!invoiceDate || !isValidDate98B(invoiceDate)) {
      errors.push({
        field: 'INVOICE_DATE',
        message: 'Invalid or missing invoice date (format: YYYYMMDD)',
        lineNumber,
        code: 'INVALID_DATE',
      })
    }
    
    if (!invoiceNumber) {
      errors.push({
        field: 'INVOICE_NUMBER',
        message: 'Invoice number is required',
        lineNumber,
        code: 'MISSING_REQUIRED',
      })
    }
    
    if (!invoiceTotal || isNaN(parseFloat(invoiceTotal))) {
      errors.push({
        field: 'INVOICE_TOTAL',
        message: 'Invalid invoice total',
        lineNumber,
        code: 'INVALID_AMOUNT',
      })
    }
    
    if (!lawFirmId) {
      warnings.push({
        field: 'LAW_FIRM_ID',
        message: 'Law firm ID is recommended',
        lineNumber,
      })
    }
    
    if (!clientId) {
      errors.push({
        field: 'CLIENT_ID',
        message: 'Client ID is required',
        lineNumber,
        code: 'MISSING_REQUIRED',
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate LEDES2000 format (XML)
 */
function validateLedes2000(content: string): LedesValidationResult {
  const errors: LedesValidationError[] = []
  const warnings: LedesValidationWarning[] = []
  
  // Basic XML structure validation
  if (!content.includes('<?xml')) {
    errors.push({
      field: 'xml',
      message: 'Missing XML declaration',
      code: 'MISSING_XML_DECLARATION',
    })
  }
  
  if (!content.includes('<LEDES')) {
    errors.push({
      field: 'root',
      message: 'Missing LEDES root element',
      code: 'MISSING_ROOT_ELEMENT',
    })
  }
  
  if (!content.includes('</LEDES>')) {
    errors.push({
      field: 'root',
      message: 'Missing closing LEDES tag',
      code: 'UNCLOSED_ROOT_ELEMENT',
    })
  }
  
  // Check for required elements
  const requiredElements = [
    'INVOICE_DATE',
    'INVOICE_NUMBER',
    'INVOICE_TOTAL',
    'CLIENT_ID',
    'CLIENT_NAME',
  ]
  
  for (const element of requiredElements) {
    if (!content.includes(`<${element}>`)) {
      errors.push({
        field: element,
        message: `Missing required element: ${element}`,
        code: 'MISSING_REQUIRED_ELEMENT',
      })
    }
  }
  
  // Check for balanced tags (simple check)
  const openTags = (content.match(/<INVOICE>/g) || []).length
  const closeTags = (content.match(/<\/INVOICE>/g) || []).length
  
  if (openTags !== closeTags) {
    errors.push({
      field: 'INVOICE',
      message: 'Unbalanced INVOICE tags',
      code: 'UNBALANCED_TAGS',
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Helper functions
function formatDate98B(date: Date | string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatDateXml(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

function formatAmount(amount: number | any): string {
  const num = Number(amount) || 0
  return num.toFixed(2)
}

function formatQuantity(quantity: number | any): string {
  const num = Number(quantity) || 0
  return num.toFixed(2)
}

function sanitizeText(text: string): string {
  // Remove pipe characters and line breaks for LEDES98B
  return text.replace(/\|/g, ' ').replace(/[\r\n]/g, ' ').trim()
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function isValidDate98B(dateStr: string): boolean {
  if (!/^\d{8}$/.test(dateStr)) return false
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6))
  const day = parseInt(dateStr.substring(6, 8))
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31
}

/**
 * Get supported LEDES formats
 */
export function getSupportedFormats(): { format: LedesFormat; name: string; description: string }[] {
  return [
    {
      format: 'LEDES98B',
      name: 'LEDES 1998B',
      description: 'Pipe-delimited text format, widely supported by e-billing vendors',
    },
    {
      format: 'LEDES2000',
      name: 'LEDES 2000',
      description: 'XML-based format with extended metadata support',
    },
  ]
}
