'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAllToolConfigs } from '@/lib/tools/tool-configs'
import { Edit, Eye, Copy, BarChart } from 'lucide-react'

export default function AdminToolsPage() {
  const [tools, setTools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = () => {
    try {
      const allTools = getAllToolConfigs()
      setTools(allTools)
    } catch (error) {
      console.error('Failed to fetch tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Legal Research': 'bg-blue-100 text-blue-800',
      'Document Drafting': 'bg-green-100 text-green-800',
      'Contract Review': 'bg-purple-100 text-purple-800',
      'Client Communication': 'bg-orange-100 text-orange-800',
      'Litigation Support': 'bg-red-100 text-red-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tool Management</h1>
          <p className="text-gray-600">Manage AI tools and their configurations</p>
        </div>
        <Button className="gap-2">
          <Copy className="w-4 h-4" />
          Add New Tool
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tools.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tools.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Set(tools.map((t) => t.category)).size}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Tools List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tools</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tools...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="p-4 border rounded-md hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{tool.icon}</span>
                    <div>
                      <p className="font-semibold">{tool.name}</p>
                      <p className="text-sm text-gray-600">{tool.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(
                            tool.category
                          )}`}
                        >
                          {tool.category}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {tool.requiredTier}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {tool.complexity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <BarChart className="w-4 h-4" />
                      Stats
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
