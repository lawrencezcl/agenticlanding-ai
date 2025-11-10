import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { databaseService } from '@/lib/database'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    // Email provider temporarily disabled - requires adapter configuration
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: process.env.EMAIL_SERVER_PORT,
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    // }),
  ],

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Check if user exists in database
        const existingUser = await databaseService.getUserProfile(user.id, false)

        if (!existingUser) {
          // Create new user profile
          await databaseService.createUserProfile({
            id: user.id,
            email: user.email!,
            name: user.name || undefined,
            plan: 'free', // Default plan
          })
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        return false
      }
    },

    async session({ session, token }) {
      try {
        // Add user ID to session
        if (token && session.user) {
          session.user.id = token.sub!

          // Get user profile from database
          const userProfile = await databaseService.getUserProfile(token.sub!, false)
          if (userProfile) {
            session.user.plan = userProfile.plan
            session.user.company = userProfile.company
          }
        }

        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },

    async jwt({ token, user, account }) {
      // Persist additional user data to token
      if (user) {
        token.id = user.id
      }
      return token
    },
  },

  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  events: {
    async signIn({ user, account, isNewUser, profile }) {
      try {
        if (isNewUser) {
          // Track new user signup
          console.log('New user signed up:', user.email)

          // Send welcome email or perform other onboarding actions
          // This could be integrated with an email service
        }
      } catch (error) {
        console.error('Sign in event error:', error)
      }
    },

    async signOut({ session, token }) {
      try {
        // Clean up any user-specific cache or sessions
        if (token?.sub) {
          // Could clear user-specific cache here
        }
      } catch (error) {
        console.error('Sign out event error:', error)
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)