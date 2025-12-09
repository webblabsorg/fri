export function FeaturesSection() {
  const features = [
    {
      title: 'Legal Research',
      description: 'Search 50+ years of case law, statutes, and regulations instantly with AI-powered semantic search.',
      icon: '🔍',
    },
    {
      title: 'Document Drafting',
      description: 'Generate contracts, briefs, motions, and legal memos in minutes with context-aware AI.',
      icon: '📝',
    },
    {
      title: 'Contract Review',
      description: 'Analyze contracts for risks, obligations, and non-standard clauses automatically.',
      icon: '⚖️',
    },
    {
      title: 'Case Summarization',
      description: 'Extract key facts, holdings, and legal reasoning from lengthy court opinions.',
      icon: '📋',
    },
    {
      title: 'Deposition Analysis',
      description: 'Summarize depositions, identify inconsistencies, and extract critical testimony.',
      icon: '🎯',
    },
    {
      title: 'Email Assistance',
      description: 'Draft professional client emails with appropriate tone and legal precision.',
      icon: '✉️',
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need to Practice Law Efficiently
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From research to client communication, Frith AI streamlines every aspect of your legal workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
