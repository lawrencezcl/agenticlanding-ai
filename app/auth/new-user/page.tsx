'use client'

// Force dynamic rendering for this auth page
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

export default function NewUserPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to AgenticLanding AI!
            </CardTitle>
            <CardDescription>
              Your account has been created successfully. Get ready to create amazing landing pages with AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            <div className="text-center">
              <p className="text-green-600 font-medium">
                ✅ Account Successfully Created
              </p>
            </div>

            {/* Quick Start Options */}
            <div className="space-y-3">
              <Button
                onClick={handleGoToDashboard}
                className="w-full flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Auto-redirect message */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                You will be redirected to your dashboard automatically...
              </p>
            </div>

            {/* Welcome Features */}
            <div className="border-t pt-4">
              <div className="text-center mb-3">
                <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-1" />
                  What's Next?
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Explore the dashboard interface</li>
                <li>• Create your first AI-powered landing page</li>
                <li>• Choose from professional templates</li>
                <li>• Track performance with analytics</li>
              </ul>
            </div>

            {/* Need Help */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Need help getting started?
              </p>
              <Link
                href="mailto:support@agenticlanding.ai"
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Contact Support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}