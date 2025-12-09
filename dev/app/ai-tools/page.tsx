import { Metadata } from 'next'
import Link from 'next/link'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'

export const metadata: Metadata = {
  title: 'AI Tools Directory - 240+ Legal AI Tools | Frith AI',
  description: 'Browse our complete catalog of 240+ specialized legal AI tools across 15+ practice areas',
}

export default function AIToolsPage() {
  const categories = [
    { name: 'Litigation & Trials', count: 28, slug: 'litigation', tools: ['Case Summarizer', 'Deposition Analyzer', 'Discovery Request Generator', 'Trial Brief Writer'] },
    { name: 'Contracts & Agreements', count: 32, slug: 'contracts', tools: ['Contract Drafter', 'NDA Generator', 'Contract Risk Analyzer', 'Redline Assistant'] },
    { name: 'Legal Research & Writing', count: 24, slug: 'research', tools: ['Case Law Search', 'Legal Memo Writer', 'Bluebook Citation Generator', 'Statute Finder'] },
    { name: 'Corporate & Business Law', count: 26, slug: 'corporate', tools: ['Corporate Formation', 'M&A Due Diligence', 'Compliance Checker', 'Board Resolution Drafter'] },
    { name: 'Intellectual Property', count: 18, slug: 'ip', tools: ['Patent Prior Art Search', 'Trademark Search', 'Copyright Analysis', 'License Agreement Drafter'] },
    { name: 'Real Estate Law', count: 16, slug: 'real-estate', tools: ['Purchase Agreement', 'Lease Analyzer', 'Title Review', 'Zoning Research'] },
    { name: 'Employment Law', count: 14, slug: 'employment', tools: ['Employment Contract', 'Severance Agreement', 'Policy Reviewer', 'Discrimination Analyzer'] },
    { name: 'Family Law', count: 12, slug: 'family', tools: ['Divorce Petition', 'Custody Agreement', 'Prenup Drafter', 'Support Calculator'] },
    { name: 'Criminal Law', count: 20, slug: 'criminal', tools: ['Plea Negotiation', 'Sentencing Memo', 'Motion to Suppress', 'Appeal Brief'] },
    { name: 'Immigration Law', count: 10, slug: 'immigration', tools: ['Visa Application', 'Asylum Brief', 'Deportation Defense', 'Family Petition'] },
    { name: 'Tax Law', count: 15, slug: 'tax', tools: ['Tax Opinion Letter', 'IRS Response', 'Tax Structure Analyzer', 'Audit Defense'] },
    { name: 'Bankruptcy & Restructuring', count: 8, slug: 'bankruptcy', tools: ['Chapter 11 Plan', 'Creditor Analysis', 'Asset Liquidation', 'Debt Restructuring'] },
    { name: 'Healthcare & Medical', count: 10, slug: 'healthcare', tools: ['HIPAA Compliance', 'Medical Record Review', 'Healthcare Contract', 'Malpractice Analysis'] },
    { name: 'Environmental Law', count: 8, slug: 'environmental', tools: ['Environmental Impact', 'Regulatory Compliance', 'Permit Application', 'Cleanup Plan'] },
    { name: 'Administrative Law', count: 9, slug: 'administrative', tools: ['Agency Petition', 'Regulatory Comment', 'FOIA Request', 'Administrative Appeal'] },
  ]

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container text-center">
          <h1 className="text-5xl font-bold mb-6">
            240+ Specialized Legal AI Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Purpose-built tools for every legal specialty, powered by Claude AI
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div key={category.slug} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{category.name}</h2>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {category.count} tools
                  </span>
                </div>
                <ul className="space-y-2 mb-6">
                  {category.tools.map((tool, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {tool}
                    </li>
                  ))}
                  <li className="text-sm text-gray-400">+ {category.count - 4} more...</li>
                </ul>
                <Link 
                  href={`/ai-tools/${category.slug}`}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  Explore {category.name} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Access All 240+ Tools?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start with 3 tools free, or get full access with our 45-day guarantee
          </p>
          <Link href="/signup">
            <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg text-lg">
              Start Free Today →
            </button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
