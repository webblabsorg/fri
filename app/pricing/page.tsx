import { Metadata } from 'next'
import Link from 'next/link'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pricing - Frith AI',
  description: 'Simple, transparent pricing with a 45-day money-back guarantee',
}

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for trying out Frith AI',
      tools: '3',
      queries: '15/month',
      aiModel: 'Google Gemini',
      features: [
        '3 specialized AI tools',
        '15 queries per month',
        'Google Gemini AI',
        'Email support (24-48h)',
        'Basic templates',
        'Document export (TXT)',
      ],
      cta: 'Start Free',
      href: '/signup',
    },
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'For solo practitioners',
      tools: '15',
      queries: '100/month',
      aiModel: 'Claude Haiku',
      features: [
        '15 specialized AI tools',
        '100 queries per month',
        'Claude Haiku AI (faster, smarter)',
        'Priority email support (12-24h)',
        'Advanced templates',
        'Document export (DOCX, PDF, TXT)',
        '45-day money-back guarantee',
      ],
      cta: 'Start 14-Day Trial',
      href: '/signup?plan=starter',
    },
    {
      name: 'Pro',
      price: '$89',
      period: '/month',
      description: 'For growing practices',
      tools: '35',
      queries: '500/month',
      aiModel: 'Claude Sonnet',
      popular: true,
      features: [
        '35 specialized AI tools',
        '500 queries per month',
        'Claude Sonnet AI (best accuracy)',
        'Priority support + live chat (4-12h)',
        'All templates & workflows',
        'API access',
        'Team collaboration (3 users)',
        'Advanced analytics',
        '45-day money-back guarantee',
      ],
      cta: 'Start 14-Day Trial',
      href: '/signup?plan=pro',
    },
    {
      name: 'Advanced',
      price: '$349',
      period: '/month',
      description: 'For established firms',
      tools: '240+',
      queries: 'Unlimited (fair use)',
      aiModel: 'Claude Opus',
      features: [
        'All 240+ AI tools',
        'Unlimited queries (fair use policy)',
        'Claude Opus AI (maximum capability)',
        'Dedicated support + phone (2-4h)',
        'Custom workflows & integrations',
        'Unlimited team members',
        'SSO & advanced security',
        'Training & onboarding',
        'SLA guarantee (99.9% uptime)',
        '45-day money-back guarantee',
      ],
      cta: 'Start 14-Day Trial',
      href: '/signup?plan=advanced',
    },
  ]

  const comparisonFeatures = [
    { name: 'AI Tools', free: '3', starter: '15', pro: '35', advanced: '240+' },
    { name: 'Monthly Queries', free: '15', starter: '100', pro: '500', advanced: 'Unlimited' },
    { name: 'AI Model', free: 'Gemini', starter: 'Haiku', pro: 'Sonnet', advanced: 'Opus' },
    { name: 'Team Members', free: '1', starter: '1', pro: '3', advanced: 'Unlimited' },
    { name: 'Support', free: 'Email', starter: 'Priority', pro: 'Live Chat', advanced: 'Phone' },
    { name: 'API Access', free: '✗', starter: '✗', pro: '✓', advanced: '✓' },
    { name: 'Custom Workflows', free: '✗', starter: '✗', pro: '✗', advanced: '✓' },
    { name: 'SSO', free: '✗', starter: '✗', pro: '✗', advanced: '✓' },
  ]

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            Start free, upgrade as you grow. All paid plans include a 45-day money-back guarantee.
          </p>
          <p className="text-sm text-gray-500">No credit card required for free plan</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 border rounded-xl ${
                  plan.popular
                    ? 'border-blue-600 shadow-2xl ring-2 ring-blue-600 scale-105'
                    : 'border-gray-200 shadow-lg'
                } bg-white`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    MOST POPULAR
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 h-12">{plan.description}</p>
                  <div className="flex items-baseline mb-4">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Tools:</span>
                      <span className="font-semibold">{plan.tools}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Queries:</span>
                      <span className="font-semibold">{plan.queries}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">AI Model:</span>
                      <span className="font-semibold">{plan.aiModel}</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Detailed Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-6 text-left">Feature</th>
                  <th className="py-4 px-6 text-center">Free</th>
                  <th className="py-4 px-6 text-center">Starter</th>
                  <th className="py-4 px-6 text-center bg-blue-50">Pro</th>
                  <th className="py-4 px-6 text-center">Advanced</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4 px-6 font-medium">{feature.name}</td>
                    <td className="py-4 px-6 text-center text-gray-600">{feature.free}</td>
                    <td className="py-4 px-6 text-center text-gray-600">{feature.starter}</td>
                    <td className="py-4 px-6 text-center bg-blue-50 font-semibold">{feature.pro}</td>
                    <td className="py-4 px-6 text-center text-gray-600">{feature.advanced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pricing FAQs
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                What's included in the 45-day money-back guarantee?
              </h3>
              <p className="text-gray-600">
                If you're not satisfied with any paid plan for any reason, contact us within 45 days
                for a full refund—no questions asked.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! Upgrade or downgrade anytime. Upgrades take effect immediately. Downgrades take
                effect at the next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                What happens if I exceed my query limit?
              </h3>
              <p className="text-gray-600">
                You'll be notified at 80% and 100% usage. You can either wait for the next billing cycle
                or upgrade your plan for instant additional queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-4">
            Start Your 45-Day Risk-Free Trial Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            No credit card required · Cancel anytime
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Get Started Free →
            </Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
