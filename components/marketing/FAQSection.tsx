'use client'

import { useState } from 'react'

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'What AI models does Frith AI use?',
      answer: 'We use multiple AI models depending on your plan: Google Gemini (Free tier), Claude Haiku (Starter), Claude Sonnet (Pro), and Claude Opus (Advanced). All models are specifically tuned for legal tasks.',
    },
    {
      question: 'Is my data secure and confidential?',
      answer: 'Absolutely. We use bank-level encryption (AES-256), never train AI models on your data, and comply with attorney-client privilege requirements. Our infrastructure is SOC 2 compliant.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! Cancel anytime with one click. Plus, we offer a 45-day money-back guarantee on all paid plans—no questions asked.',
    },
    {
      question: 'How accurate are the AI-generated legal documents?',
      answer: 'Our tools achieve 93%+ accuracy on legal research tasks and 85%+ quality scores on drafting tasks. However, all outputs should be reviewed by a licensed attorney before use.',
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'Yes! Our Free plan includes 3 tools and 15 queries/month forever. Paid plans come with a 45-day money-back guarantee, essentially giving you a risk-free trial.',
    },
    {
      question: 'Can multiple team members use one account?',
      answer: 'The Pro plan includes 3 users, and the Advanced plan includes unlimited users. Team features include shared projects, templates, and collaboration tools.',
    },
    {
      question: 'What practice areas do you support?',
      answer: 'We support 15+ practice areas including litigation, corporate law, IP, real estate, employment, family law, criminal law, immigration, bankruptcy, and more—with 240+ specialized tools.',
    },
    {
      question: 'Do you integrate with Clio or other legal software?',
      answer: 'Integrations with Clio, MyCase, and Microsoft Word are planned for Q2 2025. Currently, you can export documents in DOCX, PDF, and TXT formats.',
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Frith AI
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
