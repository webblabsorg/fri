import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function PricingSection() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for trying out Frith AI',
      features: [
        '3 specialized AI tools',
        '15 queries/month',
        'Google Gemini AI',
        'Email support',
        'Basic templates',
      ],
      cta: 'Start Free',
      href: 'https://app.frithai.com/signup',
      popular: false,
    },
    {
      name: 'Starter',
      price: '$29',
      description: 'For solo practitioners',
      features: [
        '15 specialized AI tools',
        '100 queries/month',
        'Claude Haiku AI',
        'Priority email support',
        'Advanced templates',
        'Document export',
      ],
      cta: 'Start Trial',
      href: 'https://app.frithai.com/signup?plan=starter',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$89',
      description: 'For growing practices',
      features: [
        '35 specialized AI tools',
        '500 queries/month',
        'Claude Sonnet AI',
        'Priority support + live chat',
        'All templates',
        'API access',
        'Team collaboration (3 users)',
      ],
      cta: 'Start Trial',
      href: 'https://app.frithai.com/signup?plan=pro',
      popular: true,
    },
    {
      name: 'Advanced',
      price: '$349',
      description: 'For established firms',
      features: [
        'All 240+ AI tools',
        'Unlimited queries (fair use)',
        'Claude Opus AI',
        'Dedicated support',
        'Custom workflows',
        'Unlimited users',
        'SSO & advanced security',
      ],
      cta: 'Start Trial',
      href: 'https://app.frithai.com/signup?plan=advanced',
      popular: false,
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free, upgrade as you grow. 45-day money-back guarantee on all paid plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 border rounded-lg ${
                plan.popular
                  ? 'border-blue-600 shadow-lg ring-2 ring-blue-600'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="block">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/pricing"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            View Detailed Pricing Comparison →
          </Link>
        </div>
      </div>
    </section>
  )
}
