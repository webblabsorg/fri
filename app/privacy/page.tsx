import { Metadata } from 'next'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy - Frith AI',
  description: 'Privacy Policy for Frith AI Legal Platform',
}

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="container max-w-4xl py-20">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: December 9, 2025</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We collect information you provide directly to us:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Account information (name, email, firm name)</li>
              <li>Payment information (processed by Stripe)</li>
              <li>Usage data (tool runs, documents created)</li>
              <li>Communications with support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide and improve our Service</li>
              <li>Process payments and subscriptions</li>
              <li>Send important updates and notifications</li>
              <li>Provide customer support</li>
              <li>Analyze usage patterns to improve features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>AES-256 encryption for data at rest</li>
              <li>TLS 1.3 encryption for data in transit</li>
              <li>Regular security audits and penetration testing</li>
              <li>SOC 2 Type II compliance</li>
              <li>Employee background checks and training</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. AI Model Training</h2>
            <p className="text-gray-700 mb-4">
              <strong>We do not use your confidential data to train AI models.</strong> Your documents,
              queries, and generated content remain private. We use third-party AI providers (Anthropic
              Claude, Google Gemini) under strict data processing agreements that prohibit model training
              on your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Attorney-Client Privilege</h2>
            <p className="text-gray-700 mb-4">
              We understand the importance of attorney-client privilege. We implement technical and
              organizational safeguards to protect privileged communications. However, users are
              responsible for ensuring their use of Frith AI complies with professional ethics rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your data for as long as your account is active. Upon account deletion, we delete
              or anonymize your personal data within 30 days, except where required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Data Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We share data only with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>AI providers (Anthropic, Google) under strict DPAs</li>
              <li>Payment processors (Stripe)</li>
              <li>Infrastructure providers (Vercel, Neon)</li>
              <li>When required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
            <p className="text-gray-700">
              For privacy questions or to exercise your rights, contact us at: privacy@frithai.com
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  )
}
