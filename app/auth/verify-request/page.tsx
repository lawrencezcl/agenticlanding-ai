import Link from 'next/link'
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent you a magic link to sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Open your email inbox</li>
                <li>2. Find the email from AgenticLanding AI</li>
                <li>3. Click the magic link to sign in</li>
                <li>4. The link will expire in 24 hours</li>
              </ol>
            </div>

            {/* Tips */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Didn't receive the email?</strong>
              </p>
              <ul className="text-xs text-gray-500 space-y-1 text-left">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait a few minutes for delivery</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Email
              </Button>
            </div>

            {/* Support */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Still having trouble?
              </p>
              <Link
                href="mailto:support@agenticlanding.ai?subject=Magic%20Link%20Issue"
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