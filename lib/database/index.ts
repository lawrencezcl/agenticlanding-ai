import { postgresService } from './postgres'
import { kvService } from './kv'
import { vectorService } from './vector'
import { blobService } from './blob'

// Unified database service that orchestrates all Vercel database services
export class DatabaseService {
  private static instance: DatabaseService

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Health check for all services
  async healthCheck(): Promise<{
    postgres: boolean
    kv: boolean
    vector: boolean
    blob: boolean
    overall: boolean
  }> {
    const [postgres, kv, vector, blob] = await Promise.all([
      postgresService.healthCheck(),
      kvService.healthCheck(),
      vectorService.healthCheck(),
      blobService.healthCheck(),
    ])

    const overall = postgres && kv && vector && blob

    return {
      postgres,
      kv,
      vector,
      blob,
      overall,
    }
  }

  // Landing page operations
  async createLandingPage(data: {
    id: string
    title: string
    content: any
    metadata: any
    userId: string
    status: 'draft' | 'published' | 'archived'
  }) {
    try {
      // Store in Postgres
      const page = await postgresService.createLandingPage(data)

      // Index in Vector for search
      await vectorService.indexLandingPage({
        id: data.id,
        title: data.title,
        content: JSON.stringify(data.content),
        metadata: data.metadata,
      })

      // Cache in KV
      await kvService.cacheLLMResponse(
        `landing_page:${data.id}`,
        page,
        3600 // 1 hour
      )

      return page
    } catch (error) {
      console.error('Create landing page error:', error)
      throw error
    }
  }

  async getLandingPage(id: string, useCache = true) {
    try {
      // Try cache first
      if (useCache) {
        const cached = await kvService.getCachedLLMResponse(`landing_page:${id}`)
        if (cached) {
          return cached
        }
      }

      // Get from Postgres
      const page = await postgresService.getLandingPage(id)
      if (!page) return null

      // Cache the result
      if (useCache) {
        await kvService.cacheLLMResponse(`landing_page:${id}`, page, 3600)
      }

      return page
    } catch (error) {
      console.error('Get landing page error:', error)
      throw error
    }
  }

  async updateLandingPage(id: string, data: Partial<{
    title: string
    content: any
    metadata: any
    status: 'draft' | 'published' | 'archived'
  }>) {
    try {
      // Update in Postgres
      const updatedPage = await postgresService.updateLandingPage(id, data)

      // Update in Vector if content changed
      if (data.content || data.title) {
        const current = await postgresService.getLandingPage(id)
        if (current) {
          await vectorService.updateContent({
            id,
            type: 'landing_page',
            content: {
              id,
              title: data.title || current.title,
              content: JSON.stringify(data.content || current.content),
              metadata: data.metadata || current.metadata,
            },
          })
        }
      }

      // Clear cache
      await kvService.deleteSession(`landing_page:${id}`)

      return updatedPage
    } catch (error) {
      console.error('Update landing page error:', error)
      throw error
    }
  }

  async searchLandingPages(query: string, options: {
    limit?: number
    userId?: string
    filters?: Record<string, any>
  } = {}) {
    try {
      // Search using Vector
      const results = await vectorService.searchLandingPages(
        query,
        options.limit || 10,
        options.filters
      )

      // If userId is specified, filter results
      if (options.userId) {
        const filteredResults = []
        for (const result of results) {
          const page = await postgresService.getLandingPage(result.id)
          if (page && page.user_id === options.userId) {
            filteredResults.push({ ...result, pageData: page })
          }
        }
        return filteredResults
      }

      // Enrich with full page data
      const enrichedResults = []
      for (const result of results) {
        const page = await postgresService.getLandingPage(result.id)
        if (page) {
          enrichedResults.push({ ...result, pageData: page })
        }
      }

      return enrichedResults
    } catch (error) {
      console.error('Search landing pages error:', error)
      return []
    }
  }

  // Analytics operations
  async trackAnalytics(data: {
    type: 'page_view' | 'conversion'
    pageId: string
    sessionId: string
    eventData: any
  }) {
    try {
      // Store in Postgres
      if (data.type === 'page_view') {
        await postgresService.trackPageView({
          pageId: data.pageId,
          sessionId: data.sessionId,
          ...data.eventData,
        })
      } else if (data.type === 'conversion') {
        await postgresService.trackConversion({
          pageId: data.pageId,
          sessionId: data.sessionId,
          ...data.eventData,
        })
      }

      // Update real-time cache
      const cacheKey = `analytics:realtime:${data.pageId}`
      const cached = await kvService.getCachedLLMResponse(cacheKey) || {
        views: 0,
        conversions: 0,
        lastUpdated: new Date().toISOString(),
      }

      if (data.type === 'page_view') {
        cached.views += 1
      } else if (data.type === 'conversion') {
        cached.conversions += 1
      }

      cached.lastUpdated = new Date().toISOString()
      await kvService.cacheLLMResponse(cacheKey, cached, 300) // 5 minutes
    } catch (error) {
      console.error('Track analytics error:', error)
      throw error
    }
  }

  async getAnalytics(pageId: string, options: {
    startDate?: Date
    endDate?: Date
    useCache?: boolean
  } = {}) {
    try {
      // Try cache first for recent data
      if (options.useCache !== false) {
        const cacheKey = `analytics:realtime:${pageId}`
        const cached = await kvService.getCachedLLMResponse(cacheKey)
        if (cached && this.isRecentData(cached.lastUpdated)) {
          return cached
        }
      }

      // Get from Postgres for historical data
      const analytics = await postgresService.getPageAnalytics(
        pageId,
        options.startDate,
        options.endDate
      )

      // Process analytics data
      const processed = this.processAnalyticsData(analytics)

      // Cache the results
      await kvService.cacheLLMResponse(`analytics:realtime:${pageId}`, processed, 300)

      return processed
    } catch (error) {
      console.error('Get analytics error:', error)
      throw error
    }
  }

  // Template operations
  async createTemplate(data: {
    id: string
    name: string
    description: string
    category: string
    tags: string[]
    content: any
    previewImage?: File | Buffer
  }) {
    try {
      // Upload template files to Blob
      const uploadResult = await blobService.uploadTemplate(
        data.content,
        data.id,
        data.previewImage
      )

      // Index in Vector for search
      await vectorService.indexTemplate({
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        content: data.content,
      })

      // Store metadata in KV
      const templateMetadata = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags,
        templateUrl: uploadResult.templateUrl,
        previewUrl: uploadResult.previewUrl,
        createdAt: new Date().toISOString(),
      }

      await kvService.set(`template:${data.id}`, JSON.stringify(templateMetadata))

      return templateMetadata
    } catch (error) {
      console.error('Create template error:', error)
      throw error
    }
  }

  async searchTemplates(query: string, options: {
    category?: string
    tags?: string[]
    limit?: number
  } = {}) {
    try {
      const results = await vectorService.searchTemplates(
        query,
        options.category,
        options.tags,
        options.limit || 10
      )

      // Enrich with full metadata
      const enrichedResults = []
      for (const result of results) {
        const metadata = await kvService.get(`template:${result.id}`)
        if (metadata) {
          enrichedResults.push({
            ...result,
            metadata: JSON.parse(metadata),
          })
        }
      }

      return enrichedResults
    } catch (error) {
      console.error('Search templates error:', error)
      return []
    }
  }

  // User operations
  async createUserProfile(data: {
    id: string
    email: string
    name?: string
    company?: string
    plan: 'free' | 'pro' | 'enterprise'
  }) {
    try {
      // Store in Postgres
      const profile = await postgresService.createUserProfile(data)

      // Cache in KV
      await kvService.cacheLLMResponse(`user_profile:${data.id}`, profile, 3600)

      return profile
    } catch (error) {
      console.error('Create user profile error:', error)
      throw error
    }
  }

  async getUserProfile(userId: string, useCache = true) {
    try {
      // Try cache first
      if (useCache) {
        const cached = await kvService.getCachedLLMResponse(`user_profile:${userId}`)
        if (cached) {
          return cached
        }
      }

      // Get from Postgres
      const profile = await postgresService.getUserProfile(userId)
      if (!profile) return null

      // Cache the result
      if (useCache) {
        await kvService.cacheLLMResponse(`user_profile:${userId}`, profile, 3600)
      }

      return profile
    } catch (error) {
      console.error('Get user profile error:', error)
      throw error
    }
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number) {
    return kvService.checkRateLimit(identifier, limit, window)
  }

  // Performance tracking
  async trackPerformance(metric: string, value: number) {
    return kvService.trackPerformance(metric, value)
  }

  // Helper methods
  private isRecentData(timestamp: string): boolean {
    const now = new Date()
    const lastUpdated = new Date(timestamp)
    const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60)
    return diffMinutes < 5 // Consider data recent if less than 5 minutes old
  }

  private processAnalyticsData(analytics: any[]): any {
    const views = analytics.filter(a => a.event_type === 'page_view').length
    const conversions = analytics.filter(a => a.event_type === 'conversion').length
    const conversionRate = views > 0 ? (conversions / views) * 100 : 0

    return {
      views,
      conversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      lastUpdated: new Date().toISOString(),
    }
  }
}

export const databaseService = DatabaseService.getInstance()