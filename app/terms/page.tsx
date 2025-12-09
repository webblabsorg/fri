import { Metadata } from 'next'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'

export const metadata: Metadata = {
  title: 'Terms of Service - Frith AI',
  description: 'Terms of Service for Frith AI Legal Platform',
}

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="container max-w-4xl py-20">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: December 9, 2025</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using Frith AI ("Service"), you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Frith AI provides AI-powered legal assistance tools designed to help legal professionals
              draft documents, conduct research, and manage their practice more efficiently.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Review all AI-generated content before use</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not misuse or abuse the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Professional Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              Frith AI is a tool to assist legal professionals. All AI-generated content must be reviewed
              by a licensed attorney before use. Frith AI does not provide legal advice and is not
              responsible for how users utilize the generated content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Subscription and Billing</h2>
            <p className="text-gray-700 mb-4">
              Paid subscriptions are billed monthly or annually. You may cancel at any time. All paid
              plans include a 45-day money-back guarantee.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              You retain all rights to content you input into Frith AI. Frith AI retains all rights to
              the platform software and AI models. We do not train our AI models on your confidential data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              Frith AI is provided "as is" without warranties. We are not liable for any damages arising
              from the use or inability to use the Service, including but not limited to professional
              malpractice claims.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Continued use of the Service
              constitutes acceptance of modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
            <p className="text-gray-700">
              For questions about these Terms, please contact us at: legal@frithai.com
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  )
}
