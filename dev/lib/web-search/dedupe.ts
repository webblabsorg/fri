import crypto from 'crypto'

// Dedupe utilities for web search results

export interface DedupeableResult {
  sourceUrl: string
  title: string
  sourceDomain?: string
}

/**
 * Generate a hash for deduplication based on URL and title
 */
export function generateResultHash(result: DedupeableResult): string {
  const normalized = `${normalizeUrl(result.sourceUrl)}|${normalizeTitle(result.title)}`
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

/**
 * Normalize URL for comparison (remove trailing slashes, www, protocol)
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    let hostname = parsed.hostname.toLowerCase()
    
    // Remove www prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }
    
    // Normalize path (remove trailing slash)
    let path = parsed.pathname
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1)
    }
    
    return `${hostname}${path}${parsed.search}`
  } catch {
    return url.toLowerCase()
  }
}

/**
 * Normalize title for comparison
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim()
}

/**
 * Deduplicate results by URL and title similarity
 */
export function dedupeResults<T extends DedupeableResult>(
  newResults: T[],
  existingResults: T[]
): { unique: T[]; duplicates: T[] } {
  const existingHashes = new Set(existingResults.map(r => generateResultHash(r)))
  const existingUrls = new Set(existingResults.map(r => normalizeUrl(r.sourceUrl)))
  
  const unique: T[] = []
  const duplicates: T[] = []
  const seenHashes = new Set<string>()
  
  for (const result of newResults) {
    const hash = generateResultHash(result)
    const normalizedUrl = normalizeUrl(result.sourceUrl)
    
    // Check if duplicate
    if (existingHashes.has(hash) || existingUrls.has(normalizedUrl) || seenHashes.has(hash)) {
      duplicates.push(result)
    } else {
      unique.push(result)
      seenHashes.add(hash)
    }
  }
  
  return { unique, duplicates }
}

/**
 * Check if two results are likely duplicates
 */
export function areDuplicates(a: DedupeableResult, b: DedupeableResult): boolean {
  // Same URL (normalized)
  if (normalizeUrl(a.sourceUrl) === normalizeUrl(b.sourceUrl)) {
    return true
  }
  
  // Same domain and very similar title
  if (a.sourceDomain === b.sourceDomain) {
    const titleA = normalizeTitle(a.title)
    const titleB = normalizeTitle(b.title)
    
    // Check for substring match (one title contains the other)
    if (titleA.includes(titleB) || titleB.includes(titleA)) {
      return true
    }
    
    // Check similarity ratio
    const similarity = calculateSimilarity(titleA, titleB)
    if (similarity > 0.85) {
      return true
    }
  }
  
  return false
}

/**
 * Calculate simple similarity ratio between two strings
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0
  
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  
  // Simple character overlap ratio
  const shorterChars = new Set(shorter.split(''))
  let matches = 0
  for (const char of longer) {
    if (shorterChars.has(char)) matches++
  }
  
  return matches / longer.length
}
