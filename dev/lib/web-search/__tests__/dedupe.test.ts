import {
  generateResultHash,
  normalizeUrl,
  normalizeTitle,
  dedupeResults,
  areDuplicates,
} from '../dedupe'

describe('normalizeUrl', () => {
  it('should remove www prefix', () => {
    expect(normalizeUrl('https://www.example.com/page')).toBe('example.com/page')
  })

  it('should remove trailing slash', () => {
    expect(normalizeUrl('https://example.com/page/')).toBe('example.com/page')
  })

  it('should preserve query strings', () => {
    expect(normalizeUrl('https://example.com/page?id=1')).toBe('example.com/page?id=1')
  })

  it('should handle root path', () => {
    expect(normalizeUrl('https://example.com/')).toBe('example.com/')
  })

  it('should lowercase hostname', () => {
    expect(normalizeUrl('https://EXAMPLE.COM/Page')).toBe('example.com/Page')
  })

  it('should handle invalid URLs gracefully', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url')
  })
})

describe('normalizeTitle', () => {
  it('should lowercase', () => {
    expect(normalizeTitle('Hello World')).toBe('hello world')
  })

  it('should remove punctuation', () => {
    expect(normalizeTitle('Hello, World!')).toBe('hello world')
  })

  it('should normalize whitespace', () => {
    expect(normalizeTitle('Hello   World')).toBe('hello world')
  })

  it('should trim', () => {
    expect(normalizeTitle('  Hello World  ')).toBe('hello world')
  })
})

describe('generateResultHash', () => {
  it('should generate consistent hashes', () => {
    const result = { sourceUrl: 'https://example.com/page', title: 'Test Title' }
    const hash1 = generateResultHash(result)
    const hash2 = generateResultHash(result)
    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different URLs', () => {
    const result1 = { sourceUrl: 'https://example.com/page1', title: 'Test' }
    const result2 = { sourceUrl: 'https://example.com/page2', title: 'Test' }
    expect(generateResultHash(result1)).not.toBe(generateResultHash(result2))
  })

  it('should generate different hashes for different titles', () => {
    const result1 = { sourceUrl: 'https://example.com/page', title: 'Title 1' }
    const result2 = { sourceUrl: 'https://example.com/page', title: 'Title 2' }
    expect(generateResultHash(result1)).not.toBe(generateResultHash(result2))
  })

  it('should normalize URLs before hashing', () => {
    const result1 = { sourceUrl: 'https://www.example.com/page/', title: 'Test' }
    const result2 = { sourceUrl: 'https://example.com/page', title: 'Test' }
    expect(generateResultHash(result1)).toBe(generateResultHash(result2))
  })
})

describe('dedupeResults', () => {
  it('should return all results when no duplicates', () => {
    const newResults = [
      { sourceUrl: 'https://a.com', title: 'A' },
      { sourceUrl: 'https://b.com', title: 'B' },
    ]
    const existing: typeof newResults = []
    
    const { unique, duplicates } = dedupeResults(newResults, existing)
    expect(unique).toHaveLength(2)
    expect(duplicates).toHaveLength(0)
  })

  it('should filter duplicates from existing results', () => {
    const existing = [
      { sourceUrl: 'https://a.com', title: 'A' },
    ]
    const newResults = [
      { sourceUrl: 'https://a.com', title: 'A' },
      { sourceUrl: 'https://b.com', title: 'B' },
    ]
    
    const { unique, duplicates } = dedupeResults(newResults, existing)
    expect(unique).toHaveLength(1)
    expect(unique[0].sourceUrl).toBe('https://b.com')
    expect(duplicates).toHaveLength(1)
  })

  it('should filter duplicates within new results', () => {
    const newResults = [
      { sourceUrl: 'https://a.com', title: 'A' },
      { sourceUrl: 'https://a.com', title: 'A' },
    ]
    
    const { unique, duplicates } = dedupeResults(newResults, [])
    expect(unique).toHaveLength(1)
    expect(duplicates).toHaveLength(1)
  })

  it('should handle normalized URL duplicates', () => {
    const existing = [
      { sourceUrl: 'https://www.example.com/page/', title: 'Test' },
    ]
    const newResults = [
      { sourceUrl: 'https://example.com/page', title: 'Test' },
    ]
    
    const { unique, duplicates } = dedupeResults(newResults, existing)
    expect(unique).toHaveLength(0)
    expect(duplicates).toHaveLength(1)
  })
})

describe('areDuplicates', () => {
  it('should detect same URL as duplicate', () => {
    const a = { sourceUrl: 'https://example.com/page', title: 'A' }
    const b = { sourceUrl: 'https://example.com/page', title: 'B' }
    expect(areDuplicates(a, b)).toBe(true)
  })

  it('should detect normalized URL duplicates', () => {
    const a = { sourceUrl: 'https://www.example.com/page/', title: 'A' }
    const b = { sourceUrl: 'https://example.com/page', title: 'B' }
    expect(areDuplicates(a, b)).toBe(true)
  })

  it('should detect similar titles on same domain', () => {
    const a = { sourceUrl: 'https://news.com/article1', title: 'Breaking News: Major Event', sourceDomain: 'news.com' }
    const b = { sourceUrl: 'https://news.com/article2', title: 'Breaking News: Major Event Today', sourceDomain: 'news.com' }
    expect(areDuplicates(a, b)).toBe(true)
  })

  it('should not detect different content as duplicates', () => {
    const a = { sourceUrl: 'https://a.com/page1', title: 'Completely Different' }
    const b = { sourceUrl: 'https://b.com/page2', title: 'Another Topic' }
    expect(areDuplicates(a, b)).toBe(false)
  })
})
