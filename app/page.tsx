export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm">
        <h1 className="mb-8 text-center text-6xl font-bold">
          Frith AI
        </h1>
        <p className="text-center text-2xl mb-4">
          Legal AI Platform
        </p>
        <p className="text-center text-lg text-gray-600">
          240+ Specialized Legal AI Tools
        </p>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="rounded-lg border border-gray-300 p-6 hover:border-gray-400 transition-colors">
            <h2 className="mb-2 text-2xl font-semibold">Phase 0</h2>
            <p className="text-gray-600">Foundation & Setup</p>
            <p className="mt-2 text-sm text-green-600">✓ In Progress</p>
          </div>
          
          <div className="rounded-lg border border-gray-300 p-6">
            <h2 className="mb-2 text-2xl font-semibold">Next.js 15</h2>
            <p className="text-gray-600">App Router + TypeScript</p>
            <p className="mt-2 text-sm text-green-600">✓ Configured</p>
          </div>
          
          <div className="rounded-lg border border-gray-300 p-6">
            <h2 className="mb-2 text-2xl font-semibold">Tailwind CSS</h2>
            <p className="text-gray-600">Styling Framework</p>
            <p className="mt-2 text-sm text-green-600">✓ Ready</p>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Repository: github.com/webblabsorg/fri</p>
          <p className="mt-2">Phase 0: Sprint 0.1 - Project Initialization Complete</p>
        </div>
      </div>
    </main>
  )
}
