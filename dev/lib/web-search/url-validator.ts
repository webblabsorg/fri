import { URL } from 'url'

// SSRF Protection: Validate URLs before fetching
// Blocks localhost, private networks, metadata IPs, and non-routable hosts

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
])

// Private network ranges (CIDR notation conceptually)
const PRIVATE_IP_PATTERNS = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/,              // 192.168.0.0/16
  /^169\.254\.\d{1,3}\.\d{1,3}$/,              // Link-local 169.254.0.0/16
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,          // Loopback 127.0.0.0/8
  /^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,            // 0.0.0.0/8
]

// AWS/Cloud metadata IPs
const METADATA_IPS = new Set([
  '169.254.169.254', // AWS, GCP, Azure metadata
  '169.254.170.2',   // AWS ECS metadata
  'fd00:ec2::254',   // AWS IPv6 metadata
])

export interface UrlValidationResult {
  valid: boolean
  error?: string
  url?: URL
}

export function validateUrlForFetch(urlString: string): UrlValidationResult {
  // Check URL format
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
  }

  const hostname = url.hostname.toLowerCase()

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: 'Localhost URLs are not allowed' }
  }

  // Block metadata IPs
  if (METADATA_IPS.has(hostname)) {
    return { valid: false, error: 'Cloud metadata URLs are not allowed' }
  }

  // Block private IP ranges
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Private network URLs are not allowed' }
    }
  }

  // Block IPv6 private/local addresses
  if (hostname.startsWith('[')) {
    const ipv6 = hostname.slice(1, -1).toLowerCase()
    if (
      ipv6.startsWith('fe80:') ||  // Link-local
      ipv6.startsWith('fc') ||      // Unique local
      ipv6.startsWith('fd') ||      // Unique local
      ipv6 === '::1'                // Loopback
    ) {
      return { valid: false, error: 'Private IPv6 addresses are not allowed' }
    }
  }

  // Block file:// and other dangerous protocols that might slip through
  if (url.protocol === 'file:') {
    return { valid: false, error: 'File URLs are not allowed' }
  }

  return { valid: true, url }
}

// Safe fetch with timeout and size limits
export async function safeFetch(
  urlString: string,
  options: {
    maxSizeBytes?: number
    timeoutMs?: number
  } = {}
): Promise<{ content: string; headers: Record<string, string> }> {
  const { maxSizeBytes = 2 * 1024 * 1024, timeoutMs = 30000 } = options // 2MB, 30s defaults

  const validation = validateUrlForFetch(urlString)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FrithAI-WebSearch/1.0 (Legal Research Tool)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }

    // Check content-length header if available
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new Error(`Response too large: ${contentLength} bytes exceeds ${maxSizeBytes} byte limit`)
    }

    // Read response with size limit
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const chunks: Uint8Array[] = []
    let totalSize = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalSize += value.length
      if (totalSize > maxSizeBytes) {
        reader.cancel()
        throw new Error(`Response too large: exceeds ${maxSizeBytes} byte limit`)
      }

      chunks.push(value)
    }

    const content = new TextDecoder().decode(
      new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[]))
    )

    // Extract relevant headers
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    return { content, headers }
  } finally {
    clearTimeout(timeoutId)
  }
}
