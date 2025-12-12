import { prisma } from '../db'
import { generateAIResponse, normalizeTier } from '../ai/model-service'

// Types
export interface WebSearchOptions {
  userId: string
  queryText: string
  searchMode: 'quick' | 'deep' | 'targeted' | 'monitor'
  searchType?: 'person' | 'company' | 'property' | 'case'
  sources: string[]
  dateRangeStart?: Date
  dateRangeEnd?: Date
  jurisdiction?: string
  projectId?: string
}

export interface SearchResult {
  sourceType: string
  sourceUrl: string
  sourceDomain: string
  title: string
  snippet: string
  publishedDate?: Date
  author?: string
}

export interface AnalyzedResult extends SearchResult {
  relevanceScore: number
  evidenceValue: 'high' | 'medium' | 'low' | 'none'
  evidenceType?: string
  suggestedUse?: string
  keyFindings: string[]
  mentionedEntities?: {
    people: string[]
    companies: string[]
    dates: string[]
    amounts: string[]
  }
  suggestedActions: string[]
  credibilityScore?: number
  biasIndicators: string[]
  admissibilityNotes?: {
    hearsay: string
    authentication: string
    bestEvidence: string
    privilege: string
  }
  citationBluebook?: string
  citationAlwd?: string
}

// Search provider configurations
const BING_API_KEY = process.env.BING_API_KEY
const BING_ENDPOINT = 'https://api.bing.microsoft.com/v7.0'

// Execute a web search
export async function executeWebSearch(options: WebSearchOptions): Promise<{
  queryId: string
  results: AnalyzedResult[]
  resultCount: number
}> {
  const {
    userId,
    queryText,
    searchMode,
    searchType,
    sources,
    dateRangeStart,
    dateRangeEnd,
    jurisdiction,
    projectId,
  } = options

  // Create the query record
  const query = await prisma.webSearchQuery.create({
    data: {
      userId,
      projectId,
      queryText,
      searchMode,
      searchType,
      sources,
      dateRangeStart,
      dateRangeEnd,
      jurisdiction,
      status: 'processing',
      relatedTerms: [],
    },
  })

  try {
    // Expand query using AI for deep searches
    let expandedQuery = queryText
    let relatedTerms: string[] = []

    if (searchMode === 'deep' || searchMode === 'targeted') {
      const expansion = await expandQueryWithAI(queryText, searchType, jurisdiction)
      expandedQuery = expansion.expandedQuery
      relatedTerms = expansion.relatedTerms
    }

    // Fetch results from enabled sources
    const rawResults: SearchResult[] = []

    if (sources.includes('web')) {
      const webResults = await searchBingWeb(expandedQuery, dateRangeStart, dateRangeEnd)
      rawResults.push(...webResults)
    }

    if (sources.includes('news')) {
      const newsResults = await searchBingNews(expandedQuery, dateRangeStart, dateRangeEnd)
      rawResults.push(...newsResults)
    }

    // Analyze results with AI
    const analyzedResults = await analyzeResultsWithAI(rawResults, queryText, searchType)

    // Sort by relevance score
    analyzedResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Save results to database
    for (const result of analyzedResults) {
      await prisma.webSearchResult.create({
        data: {
          queryId: query.id,
          sourceType: result.sourceType,
          sourceUrl: result.sourceUrl,
          sourceDomain: result.sourceDomain,
          title: result.title,
          snippet: result.snippet,
          publishedDate: result.publishedDate,
          author: result.author,
          relevanceScore: result.relevanceScore,
          evidenceValue: result.evidenceValue,
          evidenceType: result.evidenceType,
          suggestedUse: result.suggestedUse,
          keyFindings: result.keyFindings,
          mentionedEntities: result.mentionedEntities,
          suggestedActions: result.suggestedActions,
          credibilityScore: result.credibilityScore,
          biasIndicators: result.biasIndicators,
          admissibilityNotes: result.admissibilityNotes,
          citationBluebook: result.citationBluebook,
          citationAlwd: result.citationAlwd,
          userTags: [],
        },
      })
    }

    // Update query status
    await prisma.webSearchQuery.update({
      where: { id: query.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        resultCount: analyzedResults.length,
        expandedQuery,
        relatedTerms,
      },
    })

    return {
      queryId: query.id,
      results: analyzedResults,
      resultCount: analyzedResults.length,
    }
  } catch (error) {
    // Update query with error
    await prisma.webSearchQuery.update({
      where: { id: query.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    throw error
  }
}

// Expand query using AI
async function expandQueryWithAI(
  query: string,
  searchType?: string,
  jurisdiction?: string
): Promise<{ expandedQuery: string; relatedTerms: string[] }> {
  const systemPrompt = `You are a legal research assistant helping expand a search query for maximum effectiveness.
Your task is to enhance the search query with relevant legal terms, synonyms, and related concepts.
Return a JSON object with:
- expandedQuery: The enhanced search query string
- relatedTerms: Array of related search terms`

  const userPrompt = `Original Query: ${query}
${searchType ? `Search Type: ${searchType}` : ''}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ''}

Expand this query for legal research purposes. Include relevant legal terms, synonyms, and Boolean operators where helpful.`

  try {
    const response = await generateAIResponse({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tier: 'PRO',
      temperature: 0.3,
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        expandedQuery: parsed.expandedQuery || query,
        relatedTerms: parsed.relatedTerms || [],
      }
    }
  } catch (error) {
    console.error('Query expansion error:', error)
  }

  return { expandedQuery: query, relatedTerms: [] }
}

// Search Bing Web
async function searchBingWeb(
  query: string,
  dateStart?: Date,
  dateEnd?: Date
): Promise<SearchResult[]> {
  if (!BING_API_KEY) {
    console.warn('Bing API key not configured, using mock results')
    return getMockWebResults(query)
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: '20',
      mkt: 'en-US',
      safeSearch: 'Moderate',
    })

    if (dateStart && dateEnd) {
      params.append('freshness', `${dateStart.toISOString().split('T')[0]}..${dateEnd.toISOString().split('T')[0]}`)
    }

    const response = await fetch(`${BING_ENDPOINT}/search?${params}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`)
    }

    const data = await response.json()
    const results: SearchResult[] = []

    if (data.webPages?.value) {
      for (const item of data.webPages.value) {
        results.push({
          sourceType: 'web',
          sourceUrl: item.url,
          sourceDomain: new URL(item.url).hostname,
          title: item.name,
          snippet: item.snippet,
          publishedDate: item.dateLastCrawled ? new Date(item.dateLastCrawled) : undefined,
        })
      }
    }

    return results
  } catch (error) {
    console.error('Bing web search error:', error)
    return getMockWebResults(query)
  }
}

// Search Bing News
async function searchBingNews(
  query: string,
  dateStart?: Date,
  dateEnd?: Date
): Promise<SearchResult[]> {
  if (!BING_API_KEY) {
    console.warn('Bing API key not configured, using mock results')
    return getMockNewsResults(query)
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: '20',
      mkt: 'en-US',
      safeSearch: 'Moderate',
    })

    if (dateStart && dateEnd) {
      params.append('freshness', `${dateStart.toISOString().split('T')[0]}..${dateEnd.toISOString().split('T')[0]}`)
    }

    const response = await fetch(`${BING_ENDPOINT}/news/search?${params}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Bing News API error: ${response.status}`)
    }

    const data = await response.json()
    const results: SearchResult[] = []

    if (data.value) {
      for (const item of data.value) {
        results.push({
          sourceType: 'news',
          sourceUrl: item.url,
          sourceDomain: new URL(item.url).hostname,
          title: item.name,
          snippet: item.description,
          publishedDate: item.datePublished ? new Date(item.datePublished) : undefined,
          author: item.provider?.[0]?.name,
        })
      }
    }

    return results
  } catch (error) {
    console.error('Bing news search error:', error)
    return getMockNewsResults(query)
  }
}

// Analyze results with AI
async function analyzeResultsWithAI(
  results: SearchResult[],
  originalQuery: string,
  searchType?: string
): Promise<AnalyzedResult[]> {
  const analyzedResults: AnalyzedResult[] = []

  // Process in batches of 5 for efficiency
  const batchSize = 5
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize)
    const batchAnalysis = await analyzeBatch(batch, originalQuery, searchType)
    analyzedResults.push(...batchAnalysis)
  }

  return analyzedResults
}

async function analyzeBatch(
  results: SearchResult[],
  originalQuery: string,
  searchType?: string
): Promise<AnalyzedResult[]> {
  const systemPrompt = `You are a legal evidence analyst evaluating web search results for evidentiary value.
For each result, analyze and provide:
1. relevanceScore (0-100): How relevant to the legal matter
2. evidenceValue: "high", "medium", "low", or "none"
3. evidenceType: "documentary", "testimonial", "demonstrative", or null
4. suggestedUse: "impeachment", "corroboration", "direct", or null
5. keyFindings: Array of specific relevant facts
6. mentionedEntities: {people: [], companies: [], dates: [], amounts: []}
7. suggestedActions: Array of follow-up actions
8. credibilityScore (0-100): Source reliability
9. biasIndicators: Array of potential bias indicators
10. admissibilityNotes: {hearsay: "", authentication: "", bestEvidence: "", privilege: ""}
11. citationBluebook: Proper Bluebook citation

Return a JSON array with analysis for each result.`

  const resultsText = results.map((r, idx) => 
    `Result ${idx + 1}:
Title: ${r.title}
Source: ${r.sourceDomain}
Date: ${r.publishedDate?.toISOString() || 'Unknown'}
Snippet: ${r.snippet}`
  ).join('\n\n')

  const userPrompt = `Search Query: ${originalQuery}
${searchType ? `Search Type: ${searchType}` : ''}

Analyze these search results for legal evidentiary value:

${resultsText}

Return a JSON array with analysis for each result in order.`

  try {
    const response = await generateAIResponse({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tier: 'PRO',
      temperature: 0.2,
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const analyses = JSON.parse(jsonMatch[0])
      
      return results.map((result, idx) => {
        const analysis = analyses[idx] || {}
        return {
          ...result,
          relevanceScore: analysis.relevanceScore || 50,
          evidenceValue: analysis.evidenceValue || 'none',
          evidenceType: analysis.evidenceType,
          suggestedUse: analysis.suggestedUse,
          keyFindings: analysis.keyFindings || [],
          mentionedEntities: analysis.mentionedEntities,
          suggestedActions: analysis.suggestedActions || [],
          credibilityScore: analysis.credibilityScore,
          biasIndicators: analysis.biasIndicators || [],
          admissibilityNotes: analysis.admissibilityNotes,
          citationBluebook: analysis.citationBluebook,
          citationAlwd: generateAlwdCitation(result),
        }
      })
    }
  } catch (error) {
    console.error('AI analysis error:', error)
  }

  // Return results with default analysis if AI fails
  return results.map(result => ({
    ...result,
    relevanceScore: 50,
    evidenceValue: 'none' as const,
    keyFindings: [],
    suggestedActions: [],
    biasIndicators: [],
  }))
}

// Generate ALWD citation
function generateAlwdCitation(result: SearchResult): string {
  const date = result.publishedDate 
    ? result.publishedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  
  return `${result.author ? `${result.author}, ` : ''}${result.title}, ${result.sourceDomain.toUpperCase()} (${date}), ${result.sourceUrl}`
}

// Generate citation for a result
export async function generateCitation(
  resultId: string,
  format: 'bluebook' | 'alwd'
): Promise<string> {
  const result = await prisma.webSearchResult.findUnique({
    where: { id: resultId },
  })

  if (!result) {
    throw new Error('Result not found')
  }

  if (format === 'bluebook' && result.citationBluebook) {
    return result.citationBluebook
  }

  if (format === 'alwd' && result.citationAlwd) {
    return result.citationAlwd
  }

  // Generate citation using AI
  const systemPrompt = `You are a legal citation expert. Generate a proper ${format === 'bluebook' ? 'Bluebook (21st edition)' : 'ALWD (7th edition)'} citation for this web source.`

  const userPrompt = `Generate a ${format.toUpperCase()} citation for:
Title: ${result.title}
Author: ${result.author || 'Unknown'}
Source: ${result.sourceDomain}
Date: ${result.publishedDate?.toISOString() || 'Unknown'}
URL: ${result.sourceUrl}
Access Date: ${new Date().toISOString()}`

  const response = await generateAIResponse({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tier: 'STARTER',
    temperature: 0.1,
  })

  // Update the result with the citation
  const updateField = format === 'bluebook' ? 'citationBluebook' : 'citationAlwd'
  await prisma.webSearchResult.update({
    where: { id: resultId },
    data: { [updateField]: response.content },
  })

  return response.content
}

// Archive a URL
export async function archiveUrl(
  userId: string,
  resultId: string,
  url: string
): Promise<{ archivedUrl: string }> {
  // Try to get from Wayback Machine
  try {
    const saveResponse = await fetch(`https://web.archive.org/save/${url}`, {
      method: 'GET',
    })

    if (saveResponse.ok) {
      const archivedUrl = `https://web.archive.org/web/${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}/${url}`
      
      // Update the result
      if (resultId) {
        await prisma.webSearchResult.update({
          where: { id: resultId },
          data: {
            archivedUrl,
            archivedAt: new Date(),
          },
        })
      }

      return { archivedUrl }
    }
  } catch (error) {
    console.error('Wayback Machine archive error:', error)
  }

  // Fallback: store content locally
  try {
    const response = await fetch(url)
    const content = await response.text()
    const contentHash = Buffer.from(content).toString('base64').slice(0, 64)

    const archive = await prisma.webSearchArchive.create({
      data: {
        userId,
        resultId,
        originalUrl: url,
        archivedContent: content,
        contentHash,
      },
    })

    return { archivedUrl: `/api/web-search/archives/${archive.id}` }
  } catch (error) {
    throw new Error('Failed to archive URL')
  }
}

// Save result to project/matter
export async function saveResultToProject(
  resultId: string,
  projectId: string,
  notes?: string,
  tags?: string[]
): Promise<void> {
  await prisma.webSearchResult.update({
    where: { id: resultId },
    data: {
      isSaved: true,
      savedToProjectId: projectId,
      userNotes: notes,
      userTags: tags || [],
    },
  })
}

// Mock results for development/testing
function getMockWebResults(query: string): SearchResult[] {
  return [
    {
      sourceType: 'web',
      sourceUrl: 'https://example.com/legal-article-1',
      sourceDomain: 'example.com',
      title: `Legal Analysis: ${query}`,
      snippet: `This comprehensive article discusses the legal implications of ${query} and provides detailed analysis of relevant case law and statutory provisions.`,
      publishedDate: new Date('2024-06-15'),
    },
    {
      sourceType: 'web',
      sourceUrl: 'https://lawreview.edu/article-2',
      sourceDomain: 'lawreview.edu',
      title: `Case Study: ${query} in Modern Litigation`,
      snippet: `An academic examination of how ${query} has been addressed in recent court decisions, with implications for practitioners.`,
      publishedDate: new Date('2024-03-20'),
      author: 'Prof. Jane Smith',
    },
  ]
}

function getMockNewsResults(query: string): SearchResult[] {
  return [
    {
      sourceType: 'news',
      sourceUrl: 'https://legalnews.com/breaking-story',
      sourceDomain: 'legalnews.com',
      title: `Breaking: Major Development in ${query} Case`,
      snippet: `A significant ruling was issued today regarding ${query}, potentially setting new precedent for similar cases nationwide.`,
      publishedDate: new Date(),
      author: 'Legal News Staff',
    },
  ]
}
