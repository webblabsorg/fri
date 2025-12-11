'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FileText,
  RefreshCw,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  coverImage: string | null
  status: string
  publishedAt: string | null
  scheduledAt: string | null
  tags: string[] | null
  seoTitle: string | null
  seoDescription: string | null
  createdAt: string
  updatedAt: string
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [stats, setStats] = useState({ total: 0, draft: 0, scheduled: 0, published: 0 })

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: '',
    seoTitle: '',
    seoDescription: '',
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [statusFilter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const url = statusFilter 
        ? `/api/admin/launch/blog?status=${statusFilter}` 
        : '/api/admin/launch/blog'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setStats(data.stats)
      }
    } catch (error) {
      toast.error('Failed to load blog posts')
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
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        coverImage: formData.coverImage || null,
      }

      let response
      if (editingPost) {
        response = await fetch('/api/admin/launch/blog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost.id, ...payload }),
        })
      } else {
        response = await fetch('/api/admin/launch/blog', {
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

  const handlePublish = async (postId: string) => {
    try {
      const response = await fetch('/api/admin/launch/blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action: 'publish' }),
      })

      if (response.ok) {
        toast.success('Post published')
        fetchPosts()
      }
    } catch (error) {
      toast.error('Failed to publish post')
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/admin/launch/blog?id=${postId}`, {
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
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      tags: '',
      seoTitle: '',
      seoDescription: '',
    })
    setEditingPost(null)
    setShowForm(false)
  }

  const startEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      tags: post.tags?.join(', ') || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
    })
    setEditingPost(post)
    setShowForm(true)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
    }
  }

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
              <FileText className="h-6 w-6" />
              Blog Posts
            </h1>
            <p className="text-gray-600">Manage launch announcements and blog content</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('')}>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('draft')}>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-2xl font-bold">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('scheduled')}>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold">{stats.scheduled}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('published')}>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-2xl font-bold">{stats.published}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingPost ? 'Edit Post' : 'New Post'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        title: e.target.value,
                        slug: formData.slug || generateSlug(e.target.value),
                      })
                    }}
                    placeholder="Launch Announcement"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="launch-announcement"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief summary of the post..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Full blog post content..."
                    rows={10}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="launch, announcement, legal-tech"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="SEO optimized title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">SEO Description</Label>
                    <Input
                      id="seoDescription"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Meta description"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={formLoading}>
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
              No posts found. Create your first post!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{post.title}</h3>
                      {getStatusBadge(post.status)}
                    </div>
                    <p className="text-sm text-gray-600">/blog/{post.slug}</p>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.excerpt}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(post.createdAt).toLocaleDateString()}
                      {post.publishedAt && ` • Published: ${new Date(post.publishedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status === 'draft' && (
                      <Button size="sm" onClick={() => handlePublish(post.id)}>
                        <Send className="h-4 w-4 mr-1" />
                        Publish
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
