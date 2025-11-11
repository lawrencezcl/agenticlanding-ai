'use client'

import { Suspense } from 'react'

// Force dynamic rendering for this auth page
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCw, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function AuthErrorContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-red-700">
              An error occurred during authentication. Please try again or contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = '/auth/signin'}
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

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}