import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-6">
              Welcome to AgenticLanding AI. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use our service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 mb-4">
              <strong>Personal Information:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 ml-4">
              <li>Name and email address</li>
              <li>Profile information</li>
              <li>Authentication credentials</li>
              <li>Payment information (when applicable)</li>
            </ul>

            <p className="text-gray-600 mb-4">
              <strong>Usage Data:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 ml-4">
              <li>Landing pages created</li>
              <li>AI-generated content</li>
              <li>Performance metrics</li>
              <li>Feature usage patterns</li>
            </ul>

            <p className="text-gray-600 mb-4">
              <strong>Technical Data:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 ml-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Page navigation patterns</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 ml-4">
              <li>Provide and maintain our service</li>
              <li>Generate and optimize landing pages</li>
              <li>Personalize your experience</li>
              <li>Analyze usage patterns and improve our service</li>
              <li>Communicate with you about your account</li>
              <li>Ensure security and prevent fraud</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. AI and Machine Learning</h2>
            <p className="text-gray-600 mb-6">
              Our service uses artificial intelligence and machine learning models to generate landing page content. We process your inputs and generated content to improve our AI models. All AI-generated content is associated with your account and is not used to train models for other users without your explicit consent.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Data Sharing</h2>
            <p className="text-gray-600 mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this privacy policy. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 ml-4">
              <li>Service providers who assist in operating our service</li>
              <li>Payment processors for transaction processing</li>
              <li>Legal authorities when required by law</li>
              <li>Business partners with your explicit consent</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 ml-4">
              <li>SSL/TLS encryption for data transmission</li>
              <li>Secure data storage practices</li>
              <li>Regular security assessments</li>
              <li>Employee access controls and training</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
            <p className="text-gray-600 mb-6">
              We retain your personal information only as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. You may request deletion of your account and associated data at any time.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Your Rights</h2>
            <p className="text-gray-600 mb-6">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-600 mb-6">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-600 mb-6">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-600 mb-6">
              Your personal information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-600 mb-6">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about this Privacy Policy, please contact us at privacy@agenticlanding.ai
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