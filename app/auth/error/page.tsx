'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCw, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorType: string | null): string => {
    switch (errorType) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support if this issue persists.'
      case 'AccessDenied':
        return 'You do not have permission to sign in. Please contact your administrator.'
      case 'Verification':
        return 'The sign-in verification token has expired or has already been used. Please try again.'
      case 'Default':
        return 'An unexpected error occurred during authentication. Please try again.'
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL. Please try again.'
      case 'OAuthCallback':
        return 'Error in handling the response from an OAuth provider. Please try again.'
      case 'OAuthCreateAccount':
        return 'Could not create user account. Please try again or contact support.'
      case 'EmailCreateAccount':
        return 'Could not create user account. Please try again or use a different sign-in method.'
      case 'Callback':
        return 'The callback URL is invalid for this application.'
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with an account but cannot be linked automatically.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return errorType || 'An unknown error occurred during authentication.'
    }
  }

  const getErrorTitle = (errorType: string | null): string => {
    switch (errorType) {
      case 'Configuration':
        return 'Configuration Error'
      case 'AccessDenied':
        return 'Access Denied'
      case 'Verification':
        return 'Verification Failed'
      case 'OAuthSignin':
      case 'OAuthCallback':
        return 'Authentication Error'
      case 'EmailCreateAccount':
        return 'Account Creation Error'
      case 'Default':
        return 'Authentication Failed'
      default:
        return 'Authentication Error'
    }
  }

  const errorTitle = getErrorTitle(error)
  const errorMessage = getErrorMessage(error)

  const handleRetry = () => {
    // Clear any stored session and redirect to sign in
    window.location.href = '/auth/signin'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900">
              {errorTitle}
            </CardTitle>
            <CardDescription className="text-red-700">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Details (for developers) */}
            {error && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-mono text-gray-600">
                  Error Code: {error}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>

            {/* Contact Support */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Still having trouble?
              </p>
              <Link
                href="mailto:support@agenticlanding.ai?subject=Authentication%20Error"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Mail className="w-4 h-4 mr-1" />
                Contact Support
              </Link>
            </div>

            {/* Additional Help */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 text-center">
                <strong>Common Solutions:</strong>
              </p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>• Clear your browser cookies and cache</li>
                <li>• Try a different browser or incognito mode</li>
                <li>• Check if you're using a valid email address</li>
                <li>• Ensure your OAuth account is properly set up</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}