export type ParsedBankStatement = {
  format: 'csv' | 'ofx' | 'qfx'
  statementDate?: Date
  periodStart?: Date
  periodEnd?: Date
  openingBalance?: number
  closingBalance?: number
  transactions: Array<{
    transactionDate: Date
    description: string
    amount: number
    transactionType: 'debit' | 'credit'
    checkNumber?: string
    referenceNumber?: string
  }>
}

function parseOfxDate(raw: string): Date | null {
  // OFX dates are typically YYYYMMDD or YYYYMMDDHHMMSS
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return null
  const y = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10) - 1
  const d = parseInt(m[3], 10)
  return new Date(Date.UTC(y, mo, d))
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (c === ',' && !inQuotes) {
      out.push(current.trim())
      current = ''
      continue
    }
    current += c
  }
  out.push(current.trim())
  return out
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseNumberLike(s: string): number | undefined {
  const cleaned = s.replace(/[^0-9.\-]/g, '')
  if (!cleaned) return undefined
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function parseDateLike(s: string): Date | null {
  const trimmed = s.trim()
  if (!trimmed) return null
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`)
  }
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (us) {
    const mm = us[1].padStart(2, '0')
    const dd = us[2].padStart(2, '0')
    const yyyy = us[3].length === 2 ? `20${us[3]}` : us[3]
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
  }
  const dash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/)
  if (dash) {
    const mm = dash[1].padStart(2, '0')
    const dd = dash[2].padStart(2, '0')
    const yyyy = dash[3].length === 2 ? `20${dash[3]}` : dash[3]
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
  }
  const dt = new Date(trimmed)
  return Number.isFinite(dt.getTime()) ? dt : null
}

export function parseCsvBankStatement(text: string): ParsedBankStatement {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV does not contain enough rows')
  }

  const header = parseCsvLine(lines[0]).map(normalizeHeader)
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h))

  const dateIdx = idx(['date', 'transaction date', 'posted date', 'posting date'])
  const descIdx = idx(['description', 'name', 'memo', 'details', 'payee'])
  const amtIdx = idx(['amount', 'transaction amount', 'amt', 'debit/credit'])
  const debitIdx = idx(['debit'])
  const creditIdx = idx(['credit'])
  const checkIdx = idx(['check number', 'check', 'checkno', 'check #'])
  const refIdx = idx(['reference', 'reference number', 'ref', 'fitid', 'id'])

  if (dateIdx === -1 || descIdx === -1 || (amtIdx === -1 && debitIdx === -1 && creditIdx === -1)) {
    throw new Error('CSV header must include date, description, and amount (or debit/credit) columns')
  }

  const transactions: ParsedBankStatement['transactions'] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])

    const date = dateIdx >= 0 ? parseDateLike(cols[dateIdx] || '') : null
    if (!date) continue

    const description = (cols[descIdx] || '').trim() || 'Transaction'

    let amount: number | undefined
    let transactionType: 'debit' | 'credit' = 'debit'

    if (amtIdx >= 0) {
      const n = parseNumberLike(cols[amtIdx] || '')
      if (n === undefined) continue
      amount = n
      transactionType = n < 0 ? 'debit' : 'credit'
    } else {
      const debit = debitIdx >= 0 ? parseNumberLike(cols[debitIdx] || '') : undefined
      const credit = creditIdx >= 0 ? parseNumberLike(cols[creditIdx] || '') : undefined
      if (credit !== undefined && credit !== 0) {
        amount = Math.abs(credit)
        transactionType = 'credit'
      } else if (debit !== undefined && debit !== 0) {
        amount = Math.abs(debit)
        transactionType = 'debit'
      } else {
        continue
      }
    }

    const checkNumber = checkIdx >= 0 ? (cols[checkIdx] || undefined) : undefined
    const referenceNumber = refIdx >= 0 ? (cols[refIdx] || undefined) : undefined

    transactions.push({
      transactionDate: date,
      description,
      amount: Math.abs(amount),
      transactionType,
      checkNumber,
      referenceNumber,
    })
  }

  if (transactions.length === 0) {
    throw new Error('No transactions parsed from CSV')
  }

  const dates = transactions.map((t) => t.transactionDate.getTime())
  const periodStart = new Date(Math.min(...dates))
  const periodEnd = new Date(Math.max(...dates))

  return {
    format: 'csv',
    statementDate: periodEnd,
    periodStart,
    periodEnd,
    transactions,
  }
}

export function parseOfxQfxBankStatement(text: string, format: 'ofx' | 'qfx'): ParsedBankStatement {
  const txns: ParsedBankStatement['transactions'] = []

  const blocks = text.split(/<STMTTRN>/i)
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i]

    const get = (tag: string) => {
      const re = new RegExp(`<${tag}>([^<\r\n]+)`, 'i')
      const m = b.match(re)
      return m?.[1]?.trim()
    }

    const dt = get('DTPOSTED')
    const amt = get('TRNAMT')
    const name = get('NAME') || get('MEMO') || 'Transaction'
    const check = get('CHECKNUM')
    const fitid = get('FITID')

    const date = dt ? parseOfxDate(dt) : null
    const amountRaw = amt ? Number(String(amt).replace(/[^0-9.\-]/g, '')) : NaN
    if (!date || !Number.isFinite(amountRaw)) continue

    const transactionType: 'debit' | 'credit' = amountRaw < 0 ? 'debit' : 'credit'

    txns.push({
      transactionDate: date,
      description: name,
      amount: Math.abs(amountRaw),
      transactionType,
      checkNumber: check || undefined,
      referenceNumber: fitid || undefined,
    })
  }

  if (txns.length === 0) {
    throw new Error(`No transactions parsed from ${format.toUpperCase()}`)
  }

  const dates = txns.map((t) => t.transactionDate.getTime())
  const periodStart = new Date(Math.min(...dates))
  const periodEnd = new Date(Math.max(...dates))

  // Try extract balances (optional)
  const balAmtMatch = text.match(/<BALAMT>([^<\r\n]+)/i)
  const closingBalance = balAmtMatch ? Number(String(balAmtMatch[1]).replace(/[^0-9.\-]/g, '')) : undefined

  return {
    format,
    statementDate: periodEnd,
    periodStart,
    periodEnd,
    closingBalance: Number.isFinite(closingBalance as number) ? (closingBalance as number) : undefined,
    transactions: txns,
  }
}
