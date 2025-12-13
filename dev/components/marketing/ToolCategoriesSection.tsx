import Link from 'next/link'

export function ToolCategoriesSection() {
  const categories = [
    { name: 'Litigation & Trials', count: 28, icon: '⚖️', slug: 'litigation' },
    { name: 'Contracts & Agreements', count: 32, icon: '📝', slug: 'contracts' },
    { name: 'Legal Research & Writing', count: 24, icon: '🔍', slug: 'research' },
    { name: 'Corporate & Business Law', count: 26, icon: '🏢', slug: 'corporate' },
    { name: 'Intellectual Property', count: 18, icon: '💡', slug: 'ip' },
    { name: 'Real Estate Law', count: 16, icon: '🏠', slug: 'real-estate' },
    { name: 'Employment Law', count: 14, icon: '👥', slug: 'employment' },
    { name: 'Family Law', count: 12, icon: '👨‍👩‍👧', slug: 'family' },
    { name: 'Criminal Law', count: 20, icon: '🔒', slug: 'criminal' },
    { name: 'Immigration Law', count: 10, icon: '🌍', slug: 'immigration' },
    { name: 'Tax Law', count: 15, icon: '💰', slug: 'tax' },
    { name: 'Bankruptcy & Restructuring', count: 8, icon: '📊', slug: 'bankruptcy' },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            240+ Specialized AI Tools Across Every Practice Area
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Purpose-built tools for every legal specialty, powered by Claude AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              href={`/ai-tools/${category.slug}`}
              className="p-6 bg-white border rounded-lg hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{category.icon}</div>
                <span className="text-sm font-medium text-gray-900">
                  {category.count} tools
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
              <p className="text-sm text-gray-600">
                Explore {category.count} specialized tools →
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/ai-tools"
            className="inline-flex items-center text-gray-900 hover:text-gray-700 font-semibold underline"
          >
            View All 240+ Tools →
          </Link>
        </div>
      </div>
    </section>
  )
}
