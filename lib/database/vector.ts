import { createOpenAI } from '@ai-sdk/openai'

// Simple in-memory vector storage as placeholder
interface VectorData {
  id: string
  values: number[]
  metadata: any
}

class InMemoryVectorStore {
  private store: Map<string, VectorData> = new Map()

  async upsert(data: VectorData[]): Promise<void> {
    for (const item of data) {
      this.store.set(item.id, item)
    }
  }

  async query(queryVector: number[], topK: number = 10): Promise<{
    matches: Array<{
      id: string
      score: number
      metadata: any
    }>
  }> {
    const results = Array.from(this.store.values())
      .map(item => ({
        id: item.id,
        score: this.cosineSimilarity(queryVector, item.values),
        metadata: item.metadata
      }))
      .filter(item => item.metadata.type !== undefined) // Only return properly indexed items
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return { matches: results }
  }

  async queryByFilter(filter: any, topK: number = 10): Promise<{
    matches: Array<{
      id: string
      score: number
      metadata: any
    }>
  }> {
    const results = Array.from(this.store.values())
      .filter(item => this.matchesFilter(item.metadata, filter))
      .map(item => ({
        id: item.id,
        score: 1.0, // Default score for filter-based queries
        metadata: item.metadata
      }))
      .slice(0, topK)

    return { matches: results }
  }

  async deleteById(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.store.delete(id)
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  private matchesFilter(metadata: any, filter: any): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) {
        return false
      }
    }
    return true
  }
}

// Vector service for semantic search and embeddings
export class VectorService {
  private static instance: VectorService
  private openai: ReturnType<typeof createOpenAI>
  private vectorStore: InMemoryVectorStore

  static getInstance(): VectorService {
    if (!VectorService.instance) {
      VectorService.instance = new VectorService()
    }
    return VectorService.instance
  }

  constructor() {
    // Initialize OpenAI client for embeddings
    this.openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
    this.vectorStore = new InMemoryVectorStore()
  }

  // Generate embeddings for text
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // For now, return a simple hash-based embedding as placeholder
      // This will be replaced with actual OpenAI embeddings when API key is available
      if (!process.env.OPENAI_API_KEY) {
        return this.simpleHashEmbedding(text)
      }

      const { embedding } = await this.openai.embedding('text-embedding-3-small', {
        prompt: text,
      })

      return embedding
    } catch (error) {
      console.error('Embedding generation error:', error)
      // Fallback to simple hash embedding
      return this.simpleHashEmbedding(text)
    }
  }

  // Simple hash-based embedding as fallback
  private simpleHashEmbedding(text: string): number[] {
    const embedding = new Array(1536).fill(0) // Standard embedding size
    let hash = 0

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    // Distribute hash across embedding dimensions
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * 0.1
    }

    return embedding
  }

  // Store landing page content for semantic search
  async indexLandingPage(data: {
    id: string
    title: string
    content: string
    metadata: any
  }): Promise<void> {
    try {
      const embeddingText = `${data.title} ${data.content}`
      const embedding = await this.generateEmbedding(embeddingText)

      await this.vectorStore.upsert([{
        id: data.id,
        values: embedding,
        metadata: {
          type: 'landing_page',
          title: data.title,
          content: data.content,
          ...data.metadata
        }
      }])

      console.log(`Indexed landing page: ${data.id}`)
    } catch (error) {
      console.error('Index landing page error:', error)
      throw error
    }
  }

  // Search landing pages by semantic similarity
  async searchLandingPages(
    query: string,
    limit: number = 10,
    filters?: Record<string, any>
  ): Promise<Array<{
    id: string
    score: number
    metadata: any
  }>> {
    try {
      const queryEmbedding = await this.generateEmbedding(query)

      const results = await this.vectorStore.query(queryEmbedding, limit)

      let matches = results.matches || []

      // Apply filters if provided
      if (filters) {
        matches = matches.filter(match => {
          for (const [key, value] of Object.entries(filters)) {
            if (match.metadata[key] !== value) {
              return false
            }
          }
          return true
        })
      }

      return matches
    } catch (error) {
      console.error('Search landing pages error:', error)
      return []
    }
  }

  // Find similar landing pages
  async findSimilarLandingPages(
    pageId: string,
    limit: number = 5
  ): Promise<Array<{
    id: string
    score: number
    metadata: any
  }>> {
    try {
      // Get the page data from our store
      const allData = await this.vectorStore.queryByFilter({ type: 'landing_page' }, 1000)
      const targetPage = allData.matches.find(match => match.id === pageId)

      if (!targetPage) {
        console.warn(`Page ${pageId} not found in vector store`)
        return []
      }

      const results = await this.vectorStore.query(targetPage.metadata.embedding || [], limit + 1)

      // Exclude the page itself from results
      return results.matches?.filter(match => match.id !== pageId).slice(0, limit) || []
    } catch (error) {
      console.error('Find similar landing pages error:', error)
      return []
    }
  }

  // Index brand guidelines for compliance checking
  async indexBrandGuidelines(data: {
    id: string
    brandId: string
    guidelines: string
    rules: any[]
  }): Promise<void> {
    try {
      const embeddingText = `${data.brandId} ${data.guidelines} ${JSON.stringify(data.rules)}`
      const embedding = await this.generateEmbedding(embeddingText)

      await this.vectorStore.upsert([{
        id: `brand_guidelines:${data.id}`,
        values: embedding,
        metadata: {
          type: 'brand_guidelines',
          brandId: data.brandId,
          guidelines: data.guidelines,
          rules: data.rules
        }
      }])

      console.log(`Indexed brand guidelines: ${data.id}`)
    } catch (error) {
      console.error('Index brand guidelines error:', error)
      throw error
    }
  }

  // Search relevant brand guidelines
  async searchBrandGuidelines(
    content: string,
    brandId?: string,
    limit: number = 5
  ): Promise<Array<{
    id: string
    score: number
    metadata: any
  }>> {
    try {
      const contentEmbedding = await this.generateEmbedding(content)

      const results = await this.vectorStore.query(contentEmbedding, limit * 2) // Get more to filter

      let matches = results.matches?.filter(match => match.metadata.type === 'brand_guidelines') || []

      // Filter by brandId if provided
      if (brandId) {
        matches = matches.filter(match => match.metadata.brandId === brandId)
      }

      return matches.slice(0, limit)
    } catch (error) {
      console.error('Search brand guidelines error:', error)
      return []
    }
  }

  // Index templates for template library
  async indexTemplate(data: {
    id: string
    name: string
    description: string
    category: string
    tags: string[]
    content: any
  }): Promise<void> {
    try {
      const embeddingText = `${data.name} ${data.description} ${data.tags.join(' ')} ${JSON.stringify(data.content)}`
      const embedding = await this.generateEmbedding(embeddingText)

      await this.vectorStore.upsert([{
        id: `template:${data.id}`,
        values: embedding,
        metadata: {
          type: 'template',
          name: data.name,
          description: data.description,
          category: data.category,
          tags: data.tags,
          content: data.content
        }
      }])

      console.log(`Indexed template: ${data.id}`)
    } catch (error) {
      console.error('Index template error:', error)
      throw error
    }
  }

  // Search templates by description or requirements
  async searchTemplates(
    query: string,
    category?: string,
    tags?: string[],
    limit: number = 10
  ): Promise<Array<{
    id: string
    score: number
    metadata: any
  }>> {
    try {
      const queryEmbedding = await this.generateEmbedding(query)

      const results = await this.vectorStore.query(queryEmbedding, limit * 2) // Get more to filter

      let matches = results.matches?.filter(match => match.metadata.type === 'template') || []

      // Filter by category if provided
      if (category) {
        matches = matches.filter(match => match.metadata.category === category)
      }

      // Filter by tags if provided
      if (tags && tags.length > 0) {
        matches = matches.filter(match =>
          tags.some(tag => match.metadata.tags?.includes(tag))
        )
      }

      return matches.slice(0, limit)
    } catch (error) {
      console.error('Search templates error:', error)
      return []
    }
  }

  // Index user behavior patterns for personalization
  async indexUserBehavior(data: {
    userId: string
    sessionId: string
    actions: any[]
    preferences: any
  }): Promise<void> {
    try {
      const behaviorText = `${JSON.stringify(data.actions)} ${JSON.stringify(data.preferences)}`
      const embedding = await this.generateEmbedding(behaviorText)

      await this.vectorStore.upsert([{
        id: `user_behavior:${data.userId}:${data.sessionId}`,
        values: embedding,
        metadata: {
          type: 'user_behavior',
          userId: data.userId,
          sessionId: data.sessionId,
          actions: data.actions,
          preferences: data.preferences,
          timestamp: new Date().toISOString()
        }
      }])

      console.log(`Indexed user behavior: ${data.userId}:${data.sessionId}`)
    } catch (error) {
      console.error('Index user behavior error:', error)
      throw error
    }
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<Array<{
    id: string
    score: number
    metadata: any
  }>> {
    try {
      // Find user's recent behavior patterns
      const behaviorResults = await this.vectorStore.queryByFilter({
        type: 'user_behavior',
        userId: userId
      }, 10)

      if (!behaviorResults.matches || behaviorResults.matches.length === 0) {
        return []
      }

      // Use the most recent behavior as query
      const recentBehavior = behaviorResults.matches[0]
      const behaviorEmbedding = await this.generateEmbedding(
        JSON.stringify(recentBehavior.metadata.actions)
      )

      // Find similar landing pages based on behavior
      const recommendations = await this.vectorStore.query(behaviorEmbedding, limit * 2)

      return recommendations.matches?.filter(match => match.metadata.type === 'landing_page').slice(0, limit) || []
    } catch (error) {
      console.error('Get personalized recommendations error:', error)
      return []
    }
  }

  // Delete indexed content
  async deleteContent(id: string): Promise<void> {
    try {
      await this.vectorStore.deleteById([id])
      console.log(`Deleted content: ${id}`)
    } catch (error) {
      console.error('Delete content error:', error)
      throw error
    }
  }

  // Update indexed content
  async updateContent(data: {
    id: string
    type: string
    content: any
  }): Promise<void> {
    try {
      // Delete existing content first
      await this.deleteContent(data.id)

      // Re-index based on type
      switch (data.type) {
        case 'landing_page':
          await this.indexLandingPage(data.content)
          break
        case 'template':
          await this.indexTemplate(data.content)
          break
        case 'brand_guidelines':
          await this.indexBrandGuidelines(data.content)
          break
        default:
          console.warn(`Unknown content type: ${data.type}`)
      }
    } catch (error) {
      console.error('Update content error:', error)
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testEmbedding = await this.generateEmbedding('health check test')
      return testEmbedding && testEmbedding.length > 0
    } catch (error) {
      console.error('Vector health check failed:', error)
      return false
    }
  }
}

export const vectorService = VectorService.getInstance()