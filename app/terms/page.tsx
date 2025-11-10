import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/auth/signup"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign Up
        </Link>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By accessing and using AgenticLanding AI, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-6">
              AgenticLanding AI is an AI-powered platform for creating high-converting landing pages. Our service uses advanced machine learning models to generate, optimize, and deploy landing pages.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-600 mb-6">
              You are responsible for safeguarding the password and all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. User Content</h2>
            <p className="text-gray-600 mb-6">
              You retain ownership of all content you create using our platform. By using our service, you grant us a license to use, modify, and display your content as necessary to provide the service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Privacy</h2>
            <p className="text-gray-600 mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of our service, to understand our practices.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Payment Terms</h2>
            <p className="text-gray-600 mb-6">
              Certain features of our service may require payment. All payments are non-refundable unless otherwise specified.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Prohibited Uses</h2>
            <p className="text-gray-600 mb-6">
              You may not use our service for any illegal or unauthorized purpose. You may not use our service to create content that is harmful, offensive, or violates any applicable laws.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-600 mb-6">
              The service and its original content, features, and functionality are owned by AgenticLanding AI and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Disclaimer</h2>
            <p className="text-gray-600 mb-6">
              Our service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, and hereby disclaim all warranties.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-600 mb-6">
              In no event shall AgenticLanding AI, our directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Termination</h2>
            <p className="text-gray-600 mb-6">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-600 mb-6">
              We reserve the right to modify these terms at any time. If we make material changes, we will notify you by email or by posting a notice on our site prior to the change becoming effective.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about these Terms of Service, please contact us at legal@agenticlanding.ai
            </p>

            <p className="text-sm text-gray-500 mt-12">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}