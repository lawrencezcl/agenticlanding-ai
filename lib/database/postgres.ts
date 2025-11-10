import { sql } from '@vercel/postgres'

// Database connection pool for Vercel Postgres
export class PostgresService {
  private static instance: PostgresService

  static getInstance(): PostgresService {
    if (!PostgresService.instance) {
      PostgresService.instance = new PostgresService()
    }
    return PostgresService.instance
  }

  // Landing pages data
  async createLandingPage(data: {
    id: string
    title: string
    content: any
    metadata: any
    userId: string
    status: 'draft' | 'published' | 'archived'
  }) {
    try {
      const result = await sql`
        INSERT INTO landing_pages (id, title, content, metadata, user_id, status, created_at, updated_at)
        VALUES (${data.id}, ${data.title}, ${JSON.stringify(data.content)}, ${JSON.stringify(data.metadata)}, ${data.userId}, ${data.status}, NOW(), NOW())
        RETURNING *
      `
      return result.rows[0]
    } catch (error) {
      console.error('Error creating landing page:', error)
      throw error
    }
  }

  async getLandingPage(id: string) {
    try {
      const result = await sql`SELECT * FROM landing_pages WHERE id = ${id}`
      return result.rows[0]
    } catch (error) {
      console.error('Error getting landing page:', error)
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
      const updates = []
      const values = []
      let paramIndex = 1

      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex++}`)
        values.push(data.title)
      }
      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex++}`)
        values.push(JSON.stringify(data.content))
      }
      if (data.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`)
        values.push(JSON.stringify(data.metadata))
      }
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`)
        values.push(data.status)
      }

      updates.push(`updated_at = NOW()`)
      values.push(id)

      const result = await sql`
        UPDATE landing_pages
        SET ${updates.join(', ')}
        WHERE id = ${id}
        RETURNING *
      `
      return result.rows[0]
    } catch (error) {
      console.error('Error updating landing page:', error)
      throw error
    }
  }

  async getUserLandingPages(userId: string, limit = 10, offset = 0) {
    try {
      const result = await sql`
        SELECT * FROM landing_pages
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      return result.rows
    } catch (error) {
      console.error('Error getting user landing pages:', error)
      throw error
    }
  }

  // Campaign data
  async createCampaign(data: {
    id: string
    name: string
    objective: string
    targetAudience: any
    brandGuidelines: any
    userId: string
  }) {
    try {
      const result = await sql`
        INSERT INTO campaigns (id, name, objective, target_audience, brand_guidelines, user_id, created_at, updated_at)
        VALUES (${data.id}, ${data.name}, ${data.objective}, ${JSON.stringify(data.targetAudience)}, ${JSON.stringify(data.brandGuidelines)}, ${data.userId}, NOW(), NOW())
        RETURNING *
      `
      return result.rows[0]
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  }

  async getCampaign(id: string) {
    try {
      const result = await sql`SELECT * FROM campaigns WHERE id = ${id}`
      return result.rows[0]
    } catch (error) {
      console.error('Error getting campaign:', error)
      throw error
    }
  }

  // Analytics data
  async trackPageView(data: {
    pageId: string
    sessionId: string
    userAgent: string
    referrer?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
  }) {
    try {
      const result = await sql`
        INSERT INTO analytics (id, page_id, session_id, event_type, user_agent, referrer, utm_source, utm_medium, utm_campaign, created_at)
        VALUES (gen_random_uuid(), ${data.pageId}, ${data.sessionId}, 'page_view', ${data.userAgent}, ${data.referrer || null}, ${data.utmSource || null}, ${data.utmMedium || null}, ${data.utmCampaign || null}, NOW())
        RETURNING *
      `
      return result.rows[0]
    } catch (error) {
      console.error('Error tracking page view:', error)
      throw error
    }
  }

  async trackConversion(data: {
    pageId: string
    sessionId: string
    conversionType: string
    value?: number
    metadata?: any
  }) {
    try {
      const result = await sql`
        INSERT INTO analytics (id, page_id, session_id, event_type, conversion_type, value, metadata, created_at)
        VALUES (gen_random_uuid(), ${data.pageId}, ${data.sessionId}, 'conversion', ${data.conversionType}, ${data.value || null}, ${JSON.stringify(data.metadata || {})}, NOW())
        RETURNING *
      `
      return result.rows[0]
    } catch (error) {
      console.error('Error tracking conversion:', error)
      throw error
    }
  }

  async getPageAnalytics(pageId: string, startDate?: Date, endDate?: Date) {
    try {
      let query = `SELECT * FROM analytics WHERE page_id = ${pageId}`
      const params = []

      if (startDate) {
        query += ` AND created_at >= $${params.length + 1}`
        params.push(startDate)
      }

      if (endDate) {
        query += ` AND created_at <= $${params.length + 1}`
        params.push(endDate)
      }

      query += ` ORDER BY created_at DESC`

      const result = await sql.query(query, params)
      return result.rows
    } catch (error) {
      console.error('Error getting page analytics:', error)
      throw error
    }
  }

  // User management
  async createUserProfile(data: {
    id: string
    email: string
    name?: string
    company?: string
    plan: 'free' | 'pro' | 'enterprise'
  }) {
    try {
      const result = await sql`
        INSERT INTO user_profiles (id, email, name, company, plan, created_at, updated_at)
        VALUES (${data.id}, ${data.email}, ${data.name || null}, ${data.company || null}, ${data.plan}, NOW(), NOW())
        RETURNING *
      `
      return result.rows[0]
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  async getUserProfile(userId: string) {
    try {
      const result = await sql`SELECT * FROM user_profiles WHERE id = ${userId}`
      return result.rows[0]
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  async updateUserProfile(userId: string, data: Partial<{
    name: string
    company: string
    plan: 'free' | 'pro' | 'enterprise'
  }>) {
    try {
      const updates = []
      const values = []
      let paramIndex = 1

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`)
        values.push(data.name)
      }
      if (data.company !== undefined) {
        updates.push(`company = $${paramIndex++}`)
        values.push(data.company)
      }
      if (data.plan !== undefined) {
        updates.push(`plan = $${paramIndex++}`)
        values.push(data.plan)
      }

      updates.push(`updated_at = NOW()`)
      values.push(userId)

      const result = await sql`
        UPDATE user_profiles
        SET ${updates.join(', ')}
        WHERE id = ${userId}
        RETURNING *
      `
      return result.rows[0]
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

export const postgresService = PostgresService.getInstance()