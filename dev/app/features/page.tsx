import { Metadata } from 'next'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { CTASection } from '@/components/marketing/CTASection'

export const metadata: Metadata = {
  title: 'Features - Frith AI Legal Platform',
  description: 'Explore 240+ AI-powered legal tools designed to streamline your practice',
}

export default function FeaturesPage() {
  const features = [
    {
      category: 'Legal Research',
      icon: '🔍',
      description: 'AI-powered research across 50+ years of case law and statutes',
      tools: [
        'Case Law Search & Analysis',
        'Statute Finder',
        'Regulatory Research',
        'Bluebook Citation Generator',
        'Legal Precedent Finder',
      ],
    },
    {
      category: 'Document Drafting',
      icon: '📝',
      description: 'Generate professional legal documents in minutes',
      tools: [
        'Contract Drafting (30+ types)',
        'Legal Memo Writer',
        'Brief Generator',
        'Motion Drafter',
        'Demand Letter Generator',
      ],
    },
    {
      category: 'Contract Analysis',
      icon: '⚖️',
      description: 'AI-powered contract review and risk assessment',
      tools: [
        'Contract Risk Analyzer',
        'Clause Comparison',
        'Non-Standard Terms Detector',
        'Obligation Tracker',
        'Redlining Assistant',
      ],
    },
    {
      category: 'Litigation Support',
      icon: '🎯',
      description: 'Tools to prepare for and manage litigation',
      tools: [
        'Deposition Summarizer',
        'Discovery Request Generator',
        'Evidence Organizer',
        'Witness Statement Analyzer',
        'Trial Preparation Checklist',
      ],
    },
    {
      category: 'Client Communication',
      icon: '✉️',
      description: 'Professional client communications made easy',
      tools: [
        'Email Drafter',
        'Status Update Generator',
        'Engagement Letter Writer',
        'Settlement Proposal Drafter',
        'Client FAQ Generator',
      ],
    },
    {
      category: 'Practice Management',
      icon: '📊',
      description: 'Organize and streamline your workflow',
      tools: [
        'Project Timeline Generator',
        'Task Prioritizer',
        'Deadline Calculator',
        'Team Collaboration Tools',
        'Document Version Control',
      ],
    },
  ]

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Everything You Need to Practice Law Efficiently
            </h1>
            <p className="text-xl text-gray-600">
              240+ specialized AI tools designed by legal professionals, for legal professionals
            </p>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-20">
        <div className="container">
          <div className="space-y-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-12 items-center`}
              >
                <div className="flex-1">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h2 className="text-3xl font-bold mb-4">{feature.category}</h2>
                  <p className="text-lg text-gray-600 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.tools.map((tool, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <svg
                          className="w-5 h-5 text-blue-600 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                    <span className="text-gray-400">Feature Screenshot</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </MarketingLayout>
  )
}
