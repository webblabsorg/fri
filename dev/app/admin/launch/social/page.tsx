'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Clock,
  Share2,
  RefreshCw,
  X,
  Twitter,
  Linkedin
} from 'lucide-react'
import { toast } from 'sonner'

interface SocialPost {
  id: string
  platform: string
  content: string
  mediaUrl: string | null
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  externalId: string | null
  errorMsg: string | null
  createdAt: string
}

const PLATFORM_LIMITS = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  facebook: <Share2 className="h-4 w-4" />,
}

export default function SocialAdminPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [stats, setStats] = useState<Record<string, Record<string, number>>>({})

  // Form state
  const [formData, setFormData] = useState({
    platform: 'twitter',
    content: '',
    mediaUrl: '',
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [platformFilter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const url = platformFilter 
        ? `/api/admin/launch/social?platform=${platformFilter}` 
        : '/api/admin/launch/social'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setStats(data.stats)
      }
    } catch (error) {
      toast.error('Failed to load social posts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const payload = {
        ...formData,
        mediaUrl: formData.mediaUrl || null,
      }

      let response
      if (editingPost) {
        response = await fetch('/api/admin/launch/social', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost.id, ...payload }),
        })
      } else {
        response = await fetch('/api/admin/launch/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (response.ok) {
        toast.success(editingPost ? 'Post updated' : 'Post created')
        resetForm()
        fetchPosts()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save post')
      }
    } catch (error) {
      toast.error('Failed to save post')
    } finally {
      setFormLoading(false)
    }
  }

  const handleMarkPublished = async (postId: string) => {
    try {
      const response = await fetch('/api/admin/launch/social', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action: 'mark_published' }),
      })

      if (response.ok) {
        toast.success('Post marked as published')
        fetchPosts()
      }
    } catch (error) {
      toast.error('Failed to update post')
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/admin/launch/social?id=${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Post deleted')
        fetchPosts()
      }
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }

  const resetForm = () => {
    setFormData({
      platform: 'twitter',
      content: '',
      mediaUrl: '',
    })
    setEditingPost(null)
    setShowForm(false)
  }

  const startEdit = (post: SocialPost) => {
    setFormData({
      platform: post.platform,
      content: post.content,
      mediaUrl: post.mediaUrl || '',
    })
    setEditingPost(post)
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
    }
  }

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-sky-100 text-sky-800',
      linkedin: 'bg-blue-100 text-blue-800',
      facebook: 'bg-indigo-100 text-indigo-800',
    }
    return (
      <Badge className={colors[platform] || 'bg-gray-100 text-gray-800'}>
        {PLATFORM_ICONS[platform]} <span className="ml-1 capitalize">{platform}</span>
      </Badge>
    )
  }

  const currentLimit = PLATFORM_LIMITS[formData.platform as keyof typeof PLATFORM_LIMITS] || 2000
  const contentLength = formData.content.length
  const isOverLimit = contentLength > currentLimit

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/launch">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6" />
              Social Media Posts
            </h1>
            <p className="text-gray-600">Manage launch social media content</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={platformFilter === '' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setPlatformFilter('')}
        >
          All
        </Button>
        <Button 
          variant={platformFilter === 'twitter' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setPlatformFilter('twitter')}
        >
          <Twitter className="h-4 w-4 mr-1" /> Twitter
        </Button>
        <Button 
          variant={platformFilter === 'linkedin' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setPlatformFilter('linkedin')}
        >
          <Linkedin className="h-4 w-4 mr-1" /> LinkedIn
        </Button>
        <Button 
          variant={platformFilter === 'facebook' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setPlatformFilter('facebook')}
        >
          <Share2 className="h-4 w-4 mr-1" /> Facebook
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingPost ? 'Edit Post' : 'New Social Post'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform *</Label>
                  <div className="flex gap-2">
                    {['twitter', 'linkedin', 'facebook'].map((platform) => (
                      <Button
                        key={platform}
                        type="button"
                        variant={formData.platform === platform ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, platform })}
                      >
                        {PLATFORM_ICONS[platform]}
                        <span className="ml-1 capitalize">{platform}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Content *</Label>
                    <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                      {contentLength} / {currentLimit}
                    </span>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your post..."
                    rows={5}
                    required
                    className={isOverLimit ? 'border-red-500' : ''}
                  />
                  {isOverLimit && (
                    <p className="text-xs text-red-500">
                      Content exceeds {formData.platform} character limit
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mediaUrl">Media URL (optional)</Label>
                  <input
                    id="mediaUrl"
                    type="url"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={formLoading || isOverLimit}>
                    {formLoading ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Posts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Posts</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchPosts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No posts found. Create your first social post!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPlatformBadge(post.platform)}
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                      {post.errorMsg && (
                        <p className="text-xs text-red-500 mt-2">Error: {post.errorMsg}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                        {post.publishedAt && ` • Published: ${new Date(post.publishedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.status === 'draft' && (
                        <Button size="sm" onClick={() => handleMarkPublished(post.id)}>
                          <Send className="h-4 w-4 mr-1" />
                          Mark Published
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => startEdit(post)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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
