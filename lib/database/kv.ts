import { kv } from '@vercel/kv'

// KV service for caching, rate limiting, and session management
export class KVService {
  private static instance: KVService

  static getInstance(): KVService {
    if (!KVService.instance) {
      KVService.instance = new KVService()
    }
    return KVService.instance
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    try {
      const key = `rate_limit:${identifier}`
      const current = await kv.incr(key)

      if (current === 1) {
        await kv.expire(key, window)
      }

      const remaining = Math.max(0, limit - current)
      const allowed = current <= limit
      const ttl = await kv.ttl(key)
      const resetTime = Date.now() + (ttl * 1000)

      return {
        allowed,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fail open - allow the request if KV is down
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (window * 1000)
      }
    }
  }

  // Caching LLM responses
  async cacheLLMResponse(
    promptHash: string,
    response: any,
    ttl: number = 3600
  ): Promise<void> {
    try {
      const key = `llm_cache:${promptHash}`
      await kv.setex(key, ttl, JSON.stringify(response))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async getCachedLLMResponse(promptHash: string): Promise<any | null> {
    try {
      const key = `llm_cache:${promptHash}`
      const cached = await kv.get(key)
      return cached ? JSON.parse(cached as string) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // Session management
  async createSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    try {
      const key = `session:${sessionId}`
      await kv.setex(key, ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Session creation error:', error)
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const key = `session:${sessionId}`
      const session = await kv.get(key)
      return session ? JSON.parse(session as string) : null
    } catch (error) {
      console.error('Session get error:', error)
      return null
    }
  }

  async updateSession(sessionId: string, data: any): Promise<void> {
    try {
      const key = `session:${sessionId}`
      const existing = await this.getSession(sessionId)
      if (existing) {
        const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
        await kv.set(key, JSON.stringify(updated))
        // Refresh TTL
        await kv.expire(key, 86400)
      }
    } catch (error) {
      console.error('Session update error:', error)
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `session:${sessionId}`
      await kv.del(key)
    } catch (error) {
      console.error('Session deletion error:', error)
    }
  }

  // User preferences and settings
  async setUserPreference(userId: string, key: string, value: any): Promise<void> {
    try {
      const prefKey = `user_prefs:${userId}:${key}`
      await kv.set(prefKey, JSON.stringify(value))
    } catch (error) {
      console.error('Set user preference error:', error)
    }
  }

  async getUserPreference(userId: string, key: string): Promise<any | null> {
    try {
      const prefKey = `user_prefs:${userId}:${key}`
      const value = await kv.get(prefKey)
      return value ? JSON.parse(value as string) : null
    } catch (error) {
      console.error('Get user preference error:', error)
      return null
    }
  }

  async getAllUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const pattern = `user_prefs:${userId}:*`
      const keys = await kv.keys(pattern)
      const preferences: Record<string, any> = {}

      for (const fullKey of keys) {
        const key = fullKey.replace(`user_prefs:${userId}:`, '')
        const value = await kv.get(fullKey)
        if (value) {
          preferences[key] = JSON.parse(value as string)
        }
      }

      return preferences
    } catch (error) {
      console.error('Get all user preferences error:', error)
      return {}
    }
  }

  // Analytics caching
  async cacheAnalytics(pageId: string, analytics: any, ttl: number = 300): Promise<void> {
    try {
      const key = `analytics:${pageId}`
      await kv.setex(key, ttl, JSON.stringify(analytics))
    } catch (error) {
      console.error('Analytics cache error:', error)
    }
  }

  async getCachedAnalytics(pageId: string): Promise<any | null> {
    try {
      const key = `analytics:${pageId}`
      const cached = await kv.get(key)
      return cached ? JSON.parse(cached as string) : null
    } catch (error) {
      console.error('Analytics cache get error:', error)
      return null
    }
  }

  // Feature flags
  async setFeatureFlag(flag: string, enabled: boolean, ttl: number = 3600): Promise<void> {
    try {
      const key = `feature_flag:${flag}`
      await kv.setex(key, ttl, enabled.toString())
    } catch (error) {
      console.error('Set feature flag error:', error)
    }
  }

  async getFeatureFlag(flag: string): Promise<boolean> {
    try {
      const key = `feature_flag:${flag}`
      const value = await kv.get(key)
      return value === 'true'
    } catch (error) {
      console.error('Get feature flag error:', error)
      return false
    }
  }

  // Performance metrics
  async trackPerformance(metric: string, value: number, ttl: number = 3600): Promise<void> {
    try {
      const key = `perf:${metric}`
      await kv.lpush(key, value.toString())
      await kv.expire(key, ttl)

      // Keep only last 1000 values
      await kv.ltrim(key, 0, 999)
    } catch (error) {
      console.error('Performance tracking error:', error)
    }
  }

  async getPerformanceMetrics(metric: string, count: number = 100): Promise<number[]> {
    try {
      const key = `perf:${metric}`
      const values = await kv.lrange(key, 0, count - 1)
      return values.map(v => parseFloat(v))
    } catch (error) {
      console.error('Get performance metrics error:', error)
      return []
    }
  }

  // Queue management for background jobs
  async enqueue(queue: string, job: any): Promise<void> {
    try {
      const key = `queue:${queue}`
      await kv.rpush(key, JSON.stringify(job))
    } catch (error) {
      console.error('Enqueue error:', error)
    }
  }

  async dequeue(queue: string): Promise<any | null> {
    try {
      const key = `queue:${queue}`
      const job = await kv.lpop(key)
      return job ? JSON.parse(job) : null
    } catch (error) {
      console.error('Dequeue error:', error)
      return null
    }
  }

  async getQueueLength(queue: string): Promise<number> {
    try {
      const key = `queue:${queue}`
      return await kv.llen(key) || 0
    } catch (error) {
      console.error('Get queue length error:', error)
      return 0
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health_check'
      await kv.set(testKey, 'ok')
      await kv.del(testKey)
      return true
    } catch (error) {
      console.error('KV health check failed:', error)
      return false
    }
  }
}

export const kvService = KVService.getInstance()