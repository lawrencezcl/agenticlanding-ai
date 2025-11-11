import { Adapter } from 'next-auth/adapters'
import { databaseService } from '@/lib/database'

export function CustomAdapter(): Adapter {
  return {
    async createUser(user) {
      try {
        const newUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
          plan: 'free',
          company: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await databaseService.createUserProfile({
          id: newUser.id,
          email: newUser.email!,
          name: newUser.name,
          plan: 'free',
        })

        return newUser
      } catch (error) {
        console.error('Create user error:', error)
        throw error
      }
    },

    async getUser(id) {
      try {
        const user = await databaseService.getUserProfile(id, false)
        if (!user) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null,
          emailVerified: null,
          plan: user.plan,
          company: user.company,
        }
      } catch (error) {
        console.error('Get user error:', error)
        return null
      }
    },

    async getUserByEmail(email) {
      try {
        // For now, return null since we don't have a method to get user by email
        // This can be implemented later
        return null
      } catch (error) {
        console.error('Get user by email error:', error)
        return null
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      try {
        // This would need to be implemented in databaseService
        // For now, return null
        return null
      } catch (error) {
        console.error('Get user by account error:', error)
        return null
      }
    },

    async updateUser(user) {
      try {
        await databaseService.updateUserProfile({
          name: user.name,
          plan: user.plan as 'free' | 'pro' | 'enterprise',
          company: user.company,
        })

        return user
      } catch (error) {
        console.error('Update user error:', error)
        return user
      }
    },

    async deleteUser(userId) {
      try {
        // This would need to be implemented in databaseService
        return
      } catch (error) {
        console.error('Delete user error:', error)
      }
    },

    async linkAccount(account) {
      try {
        // This would need to be implemented in databaseService
        return account
      } catch (error) {
        console.error('Link account error:', error)
        return account
      }
    },

    async unlinkAccount({ providerAccountId, provider }) {
      try {
        // This would need to be implemented in databaseService
        return
      } catch (error) {
        console.error('Unlink account error:', error)
      }
    },

    async createSession({ sessionToken, userId, expires }) {
      try {
        // Store session in database if needed
        return {
          sessionToken,
          userId,
          expires,
        }
      } catch (error) {
        console.error('Create session error:', error)
        throw error
      }
    },

    async getSessionAndUser(sessionToken) {
      try {
        // This would need to be implemented for session persistence
        return null
      } catch (error) {
        console.error('Get session and user error:', error)
        return null
      }
    },

    async updateSession({ sessionToken, userId, expires }) {
      try {
        return {
          sessionToken,
          userId,
          expires,
        }
      } catch (error) {
        console.error('Update session error:', error)
        throw error
      }
    },

    async deleteSession(sessionToken) {
      try {
        // This would need to be implemented
        return
      } catch (error) {
        console.error('Delete session error:', error)
      }
    },

    async createVerificationToken({ identifier, expires, token }) {
      try {
        return {
          identifier,
          token,
          expires,
        }
      } catch (error) {
        console.error('Create verification token error:', error)
        throw error
      }
    },

    async useVerificationToken({ identifier, token }) {
      try {
        // Return the token that was used
        return {
          identifier,
          token,
          expires: new Date(),
        }
      } catch (error) {
        console.error('Use verification token error:', error)
        return null
      }
    },
  }
}