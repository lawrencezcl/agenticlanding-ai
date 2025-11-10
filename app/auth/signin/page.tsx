'use client'

import { getProviders, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Github, Chrome } from 'lucide-react'

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await getProviders()
        setProviders(res)
      } catch (error) {
        console.error('Error fetching providers:', error)
      }
    }
    fetchProviders()
  }, [])

  const handleOAuthSignIn = async (providerId: string) => {
    setLoading(true)
    setError('')
    try {
      await signIn(providerId, { callbackUrl: '/dashboard' })
    } catch (error) {
      setError('Failed to sign in. Please try again.')
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    try {
      await signIn('email', {
        email,
        callbackUrl: '/dashboard',
        redirect: false,
      })
      router.push('/auth/verify-request')
    } catch (error) {
      setError('Failed to send sign-in email. Please try again.')
      setLoading(false)
    }
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <Chrome className="h-5 w-5" />
      case 'github':
        return <Github className="h-5 w-5" />
      case 'email':
        return <Mail className="h-5 w-5" />
      default:
        return null
    }
  }

  const getProviderName = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'Google'
      case 'github':
        return 'GitHub'
      case 'email':
        return 'Email'
      default:
        return providerId.charAt(0).toUpperCase() + providerId.slice(1)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900">AgenticLanding AI</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to access your AI-powered landing page generator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Providers */}
            {providers && Object.values(providers)
              .filter((provider: any) => provider.id !== 'email')
              .map((provider: any) => (
                <Button
                  key={provider.id}
                  onClick={() => handleOAuthSignIn(provider.id)}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <span className="mr-2">{getProviderIcon(provider.id)}</span>
                  )}
                  Continue with {getProviderName(provider.id)}
                </Button>
              ))}

            {/* Email Sign In */}
            {providers?.email && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>
            )}

            {providers?.email && (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send sign-in link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}