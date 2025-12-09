export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <div className="text-xl font-semibold text-gray-900">Loading...</div>
        <p className="text-gray-600 mt-2">Please wait while we load your content</p>
      </div>
    </div>
  )
}
