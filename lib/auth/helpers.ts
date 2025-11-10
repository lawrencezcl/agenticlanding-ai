import { getServerSession } from 'next-auth/next'
import { authOptions } from './config'
import { databaseService } from '@/lib/database'
import { NextRequest } from 'next/server'

// Get current user session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

// Get current user with full profile
export async function getCurrentUserWithProfile() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const profile = await databaseService.getUserProfile(session.user.id)
  return {
    ...session.user,
    profile,
  }
}

// Require authentication - returns user or throws error
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

// Check if user has specific plan
export async function requirePlan(requiredPlan: 'free' | 'pro' | 'enterprise') {
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile) {
    throw new Error('Authentication required')
  }

  const planHierarchy = {
    free: 0,
    pro: 1,
    enterprise: 2,
  }

  const userPlanLevel = planHierarchy[userWithProfile.profile?.plan || 'free']
  const requiredPlanLevel = planHierarchy[requiredPlan]

  if (userPlanLevel < requiredPlanLevel) {
    throw new Error(`${requiredPlan} plan required`)
  }

  return userWithProfile
}

// Check if user owns a resource
export async function requireOwnership(resourceId: string, resourceType: 'landing_page' | 'campaign') {
  const user = await requireAuth()

  let resource
  switch (resourceType) {
    case 'landing_page':
      resource = await databaseService.getLandingPage(resourceId)
      break
    case 'campaign':
      // Add campaign lookup when implemented
      resource = null
      break
    default:
      throw new Error(`Unknown resource type: ${resourceType}`)
  }

  if (!resource || resource.user_id !== user.id) {
    throw new Error('Access denied')
  }

  return { user, resource }
}

// Get user from request (for API routes)
export async function getUserFromRequest(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    return session?.user || null
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

// Rate limiting by user
export async function checkUserRateLimit(
  request: NextRequest,
  limit: number,
  window: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const user = await getUserFromRequest(request)
  const identifier = user?.id || request.ip || 'anonymous'

  return databaseService.checkRateLimit(identifier, limit, window)
}

// Create user session token
export async function createSessionToken(user: any) {
  // This would be used for custom session management
  // For now, we rely on NextAuth's built-in session management
  return {
    userId: user.id,
    email: user.email,
    plan: user.plan || 'free',
  }
}

// Validate session token
export async function validateSessionToken(token: string) {
  // This would validate custom session tokens
  // For now, we rely on NextAuth's built-in validation
  try {
    const session = await getServerSession(authOptions)
    return session?.user || null
  } catch (error) {
    console.error('Error validating session token:', error)
    return null
  }
}

// Authentication middleware for API routes
export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const user = await requireAuth()
      return await handler(request, { user, ...args[0] }, ...args.slice(1))
    } catch (error) {
      if (error instanceof Error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

// Plan-based middleware for API routes
export function withPlan(requiredPlan: 'free' | 'pro' | 'enterprise') {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      try {
        const user = await requirePlan(requiredPlan)
        return await handler(request, { user, ...args[0] }, ...args.slice(1))
      } catch (error) {
        if (error instanceof Error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ error: 'Authorization failed' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }
}

// Ownership middleware for API routes
export function withOwnership(resourceType: 'landing_page' | 'campaign') {
  return function(handler: Function) {
    return async (request: NextRequest, { params }: { params: any }, ...args: any[]) => {
      try {
        const resourceId = params.id
        if (!resourceId) {
          throw new Error('Resource ID required')
        }

        const { user, resource } = await requireOwnership(resourceId, resourceType)
        return await handler(request, { user, resource, params, ...args[0] }, ...args.slice(1))
      } catch (error) {
        if (error instanceof Error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ error: 'Authorization failed' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
  }
}

// Check if user can perform action based on plan limits
export async function checkPlanLimits(
  userId: string,
  action: 'create_landing_page' | 'generate_content' | 'use_advanced_features'
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await getCurrentUserWithProfile()
  if (!user) {
    return { allowed: false, reason: 'Authentication required' }
  }

  const plan = user.profile?.plan || 'free'
  const limits = {
    free: {
      maxLandingPages: 3,
      maxContentGenerations: 10,
      advancedFeatures: false,
    },
    pro: {
      maxLandingPages: 50,
      maxContentGenerations: 500,
      advancedFeatures: true,
    },
    enterprise: {
      maxLandingPages: Infinity,
      maxContentGenerations: Infinity,
      advancedFeatures: true,
    },
  }

  const userLimits = limits[plan]

  switch (action) {
    case 'create_landing_page':
      // Check current landing page count
      const userPages = await databaseService.getUserLandingPages(userId, 1000, 0)
      if (userPages.length >= userLimits.maxLandingPages) {
        return {
          allowed: false,
          reason: `Maximum landing pages (${userLimits.maxLandingPages}) reached for ${plan} plan`,
        }
      }
      break

    case 'generate_content':
      // Check content generation count (would need to implement tracking)
      // For now, assume pro and enterprise have unlimited
      if (plan === 'free') {
        // Would implement daily/monthly limit check here
        return { allowed: true }
      }
      break

    case 'use_advanced_features':
      if (!userLimits.advancedFeatures) {
        return {
          allowed: false,
          reason: `Advanced features require ${plan === 'free' ? 'Pro' : 'Enterprise'} plan`,
        }
      }
      break
  }

  return { allowed: true }
}