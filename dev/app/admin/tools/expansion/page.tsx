'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Upload,
  BarChart3,
  Target
} from 'lucide-react'

interface ToolWave {
  id: string
  waveNumber: number
  name: string
  description: string | null
  targetCount: number
  actualCount: number
  deployedCount: number
  status: string
  startDate: string | null
  endDate: string | null
  percentComplete: number
}

interface ToolExpansion {
  id: string
  waveId: string
  toolId: string | null
  name: string
  category: string
  priority: number
  status: string
  specSource: string | null
  complexity: string
  estimatedHours: number | null
  assignedTo: string | null
  startedAt: string | null
  completedAt: string | null
  evaluationScore: number | null
  evaluationPassed: boolean
  evaluationNotes: string | null
}

interface OverallStats {
  existingTools: number
  plannedExpansion: number
  deployedExpansion: number
  totalTarget: number
  percentToTarget: number
}

export default function ToolExpansionPage() {
  const [waves, setWaves] = useState<ToolWave[]>([])
  const [overall, setOverall] = useState<OverallStats | null>(null)
  const [selectedWave, setSelectedWave] = useState<string | null>(null)
  const [waveTools, setWaveTools] = useState<ToolExpansion[]>([])
  const [expandedWaves, setExpandedWaves] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreateWave, setShowCreateWave] = useState(false)
  const [showCreateTool, setShowCreateTool] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // New wave form
  const [newWave, setNewWave] = useState({
    waveNumber: 1,
    name: '',
    description: '',
    targetCount: 50,
    startDate: '',
    endDate: '',
  })

  // New tool form
  const [newTool, setNewTool] = useState({
    name: '',
    category: '',
    priority: 0,
    specSource: '',
    complexity: 'medium',
    estimatedHours: 0,
  })

  useEffect(() => {
    fetchWaves()
  }, [])

  useEffect(() => {
    if (selectedWave) {
      fetchWaveTools(selectedWave)
    }
  }, [selectedWave])

  async function fetchWaves() {
    try {
      const response = await fetch('/api/admin/tools/expansion')
      const data = await response.json()
      setWaves(data.waves || [])
      setOverall(data.overall || null)
    } catch (error) {
      console.error('Error fetching waves:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWaveTools(waveId: string) {
    try {
      const response = await fetch(`/api/admin/tools/expansion?waveId=${waveId}`)
      const data = await response.json()
      setWaveTools(data.wave?.tools || [])
    } catch (error) {
      console.error('Error fetching wave tools:', error)
    }
  }

  async function createWave() {
    try {
      const response = await fetch('/api/admin/tools/expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'wave',
          ...newWave,
          startDate: newWave.startDate || undefined,
          endDate: newWave.endDate || undefined,
        }),
      })
      
      if (response.ok) {
        setShowCreateWave(false)
        setNewWave({ waveNumber: 1, name: '', description: '', targetCount: 50, startDate: '', endDate: '' })
        fetchWaves()
      }
    } catch (error) {
      console.error('Error creating wave:', error)
    }
  }

  async function createTool() {
    if (!selectedWave) return
    
    try {
      const response = await fetch('/api/admin/tools/expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tool',
          waveId: selectedWave,
          ...newTool,
        }),
      })
      
      if (response.ok) {
        setShowCreateTool(false)
        setNewTool({ name: '', category: '', priority: 0, specSource: '', complexity: 'medium', estimatedHours: 0 })
        fetchWaveTools(selectedWave)
        fetchWaves()
      }
    } catch (error) {
      console.error('Error creating tool:', error)
    }
  }

  async function updateToolStatus(toolId: string, status: string) {
    try {
      await fetch('/api/admin/tools/expansion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tool', id: toolId, status }),
      })
      
      if (selectedWave) {
        fetchWaveTools(selectedWave)
        fetchWaves()
      }
    } catch (error) {
      console.error('Error updating tool status:', error)
    }
  }

  async function updateWaveStatus(waveId: string, status: string) {
    try {
      await fetch('/api/admin/tools/expansion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wave', id: waveId, status }),
      })
      fetchWaves()
    } catch (error) {
      console.error('Error updating wave status:', error)
    }
  }

  function toggleWaveExpand(waveId: string) {
    const newExpanded = new Set(expandedWaves)
    if (newExpanded.has(waveId)) {
      newExpanded.delete(waveId)
    } else {
      newExpanded.add(waveId)
      setSelectedWave(waveId)
    }
    setExpandedWaves(newExpanded)
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'deployed':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress':
      case 'in_development':
      case 'testing':
        return <Play className="w-4 h-4 text-blue-500" />
      case 'planned':
        return <Clock className="w-4 h-4 text-gray-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'deployed':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
      case 'in_development':
        return 'bg-blue-100 text-blue-800'
      case 'testing':
        return 'bg-purple-100 text-purple-800'
      case 'planned':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredTools = waveTools.filter(tool => {
    if (filterStatus !== 'all' && tool.status !== filterStatus) return false
    if (filterCategory !== 'all' && tool.category !== filterCategory) return false
    return true
  })

  const categories = [...new Set(waveTools.map(t => t.category))].filter(Boolean)

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tool Expansion</h1>
          <p className="text-gray-600 mt-1">
            Manage the expansion to 240 tools across development waves
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateWave(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Wave
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      {overall && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Target</span>
            </div>
            <p className="text-2xl font-bold">{overall.totalTarget}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Existing Tools</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{overall.existingTools}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Planned</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{overall.plannedExpansion}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Play className="w-4 h-4" />
              <span className="text-sm">Deployed</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{overall.deployedExpansion}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Progress</span>
            </div>
            <p className="text-2xl font-bold">{overall.percentToTarget}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${overall.percentToTarget}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Waves List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Development Waves</h2>
        </div>
        
        {waves.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No waves created yet. Create your first wave to start tracking tool expansion.</p>
          </div>
        ) : (
          <div className="divide-y">
            {waves.map((wave) => (
              <div key={wave.id} className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleWaveExpand(wave.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedWaves.has(wave.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Wave {wave.waveNumber}: {wave.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(wave.status)}`}>
                          {wave.status.replace('_', ' ')}
                        </span>
                      </div>
                      {wave.description && (
                        <p className="text-sm text-gray-500 mt-1">{wave.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Progress</p>
                      <p className="font-medium">{wave.deployedCount} / {wave.targetCount}</p>
                    </div>
                    <div className="w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${wave.percentComplete}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{wave.percentComplete}%</p>
                    </div>
                    <select
                      value={wave.status}
                      onChange={(e) => {
                        e.stopPropagation()
                        updateWaveStatus(wave.id, e.target.value)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Expanded Wave Details */}
                {expandedWaves.has(wave.id) && (
                  <div className="mt-4 ml-8 border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-4">
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="all">All Statuses</option>
                          <option value="planned">Planned</option>
                          <option value="in_development">In Development</option>
                          <option value="testing">Testing</option>
                          <option value="deployed">Deployed</option>
                        </select>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="all">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedWave(wave.id)
                          setShowCreateTool(true)
                        }}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Tool
                      </button>
                    </div>

                    {filteredTools.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">No tools in this wave yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredTools.map((tool) => (
                          <div 
                            key={tool.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(tool.status)}
                              <div>
                                <p className="font-medium text-sm">{tool.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{tool.category}</span>
                                  <span>•</span>
                                  <span className="capitalize">{tool.complexity}</span>
                                  {tool.estimatedHours && (
                                    <>
                                      <span>•</span>
                                      <span>{tool.estimatedHours}h est.</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {tool.evaluationScore !== null && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Eval Score</p>
                                  <p className={`text-sm font-medium ${tool.evaluationPassed ? 'text-green-600' : 'text-red-600'}`}>
                                    {tool.evaluationScore.toFixed(1)}
                                  </p>
                                </div>
                              )}
                              <select
                                value={tool.status}
                                onChange={(e) => updateToolStatus(tool.id, e.target.value)}
                                className="text-xs border rounded px-2 py-1"
                              >
                                <option value="planned">Planned</option>
                                <option value="in_development">In Development</option>
                                <option value="testing">Testing</option>
                                <option value="deployed">Deployed</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Wave Modal */}
      {showCreateWave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Wave</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wave Number</label>
                <input
                  type="number"
                  value={newWave.waveNumber}
                  onChange={(e) => setNewWave({ ...newWave, waveNumber: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newWave.name}
                  onChange={(e) => setNewWave({ ...newWave, name: e.target.value })}
                  placeholder="e.g., Core Legal Tools"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newWave.description}
                  onChange={(e) => setNewWave({ ...newWave, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Tool Count</label>
                <input
                  type="number"
                  value={newWave.targetCount}
                  onChange={(e) => setNewWave({ ...newWave, targetCount: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newWave.startDate}
                    onChange={(e) => setNewWave({ ...newWave, startDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newWave.endDate}
                    onChange={(e) => setNewWave({ ...newWave, endDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateWave(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createWave}
                disabled={!newWave.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Wave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tool Modal */}
      {showCreateTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Tool to Wave</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
                <input
                  type="text"
                  value={newTool.name}
                  onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                  placeholder="e.g., Contract Analyzer Pro"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newTool.category}
                  onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                  placeholder="e.g., Contract Analysis"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
                  <select
                    value={newTool.complexity}
                    onChange={(e) => setNewTool({ ...newTool, complexity: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    value={newTool.estimatedHours}
                    onChange={(e) => setNewTool({ ...newTool, estimatedHours: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spec Source</label>
                <input
                  type="text"
                  value={newTool.specSource}
                  onChange={(e) => setNewTool({ ...newTool, specSource: e.target.value })}
                  placeholder="e.g., ai-agents.md#contract-analysis"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <input
                  type="number"
                  value={newTool.priority}
                  onChange={(e) => setNewTool({ ...newTool, priority: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateTool(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createTool}
                disabled={!newTool.name || !newTool.category}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add Tool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
