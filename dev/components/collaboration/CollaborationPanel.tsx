'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  MessageSquare, 
  Share, 
  Activity, 
  Send, 
  Reply, 
  AtSign, 
  Users, 
  Globe, 
  Lock, 
  Calendar,
  MoreVertical,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    email: string
    image?: string
  }
  replies?: Comment[]
  mentions?: string[]
}

interface Share {
  id: string
  shareType: string
  shareWith?: string[]
  permissions?: any
  expiresAt?: string
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
    image?: string
  }
}

interface ActivityItem {
  id: string
  action: string
  description: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
  workspace?: {
    id: string
    name: string
  }
}

interface CollaborationPanelProps {
  targetType: string
  targetId: string
  workspaceId?: string
}

export default function CollaborationPanel({ targetType, targetId, workspaceId }: CollaborationPanelProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [shares, setShares] = useState<Share[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareType, setShareType] = useState('workspace')
  const [shareEmails, setShareEmails] = useState('')
  const [sharePermissions, setSharePermissions] = useState('read')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [targetType, targetId])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchComments(),
        fetchShares(),
        fetchActivity()
      ])
    } catch (error) {
      console.error('Error fetching collaboration data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const fetchShares = async () => {
    try {
      const response = await fetch(`/api/shares?targetType=${targetType}&targetId=${targetId}`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares)
      }
    } catch (error) {
      console.error('Error fetching shares:', error)
    }
  }

  const fetchActivity = async () => {
    try {
      const url = workspaceId 
        ? `/api/activity?workspaceId=${workspaceId}&limit=20`
        : `/api/activity?limit=20`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          targetType,
          targetId,
          mentions: extractMentions(newComment)
        })
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
        toast.success('Comment added')
      } else {
        toast.error('Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const addReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          targetType,
          targetId,
          parentId,
          mentions: extractMentions(replyContent)
        })
      })

      if (response.ok) {
        setReplyContent('')
        setReplyingTo(null)
        fetchComments()
        toast.success('Reply added')
      } else {
        toast.error('Failed to add reply')
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    }
  }

  const createShare = async () => {
    try {
      const shareData: any = {
        targetType,
        targetId,
        shareType,
        permissions: { [sharePermissions]: true }
      }

      if (shareType === 'specific_users' && shareEmails) {
        // Convert emails to user IDs (simplified - in real app, you'd validate emails)
        shareData.shareWith = shareEmails.split(',').map(email => email.trim())
      }

      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData)
      })

      if (response.ok) {
        setShowShareModal(false)
        setShareEmails('')
        setShareType('workspace')
        setSharePermissions('read')
        fetchShares()
        toast.success('Content shared successfully')
      } else {
        toast.error('Failed to share content')
      }
    } catch (error) {
      console.error('Error sharing content:', error)
      toast.error('Failed to share content')
    }
  }

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }
    return mentions
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getShareTypeIcon = (type: string) => {
    switch (type) {
      case 'public': return <Globe className="w-4 h-4" />
      case 'workspace': return <Users className="w-4 h-4" />
      case 'specific_users': return <Lock className="w-4 h-4" />
      default: return <Lock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="sharing" className="flex items-center gap-2">
            <Share className="w-4 h-4" />
            Sharing ({shares.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comments</CardTitle>
              <CardDescription>
                Discuss and collaborate on this {targetType}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment... Use @username to mention someone"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Tip: Use @username to mention team members
                  </p>
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.author.image} />
                        <AvatarFallback>
                          {comment.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{comment.author.name}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        
                        {/* Reply Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(comment.id)}
                          className="mt-2 h-6 px-2 text-xs"
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Reply
                        </Button>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Write a reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => addReply(comment.id)}
                                disabled={!replyContent.trim()}
                              >
                                Reply
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyContent('')
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-100 pl-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={reply.author.image} />
                                  <AvatarFallback className="text-xs">
                                    {reply.author.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">{reply.author.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {formatTimeAgo(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No comments yet. Start the conversation!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Sharing</CardTitle>
                  <CardDescription>
                    Control who can access this {targetType}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowShareModal(true)}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getShareTypeIcon(share.shareType)}
                      <div>
                        <p className="font-medium capitalize">{share.shareType.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">
                          Shared {formatTimeAgo(share.createdAt)}
                          {share.expiresAt && ` • Expires ${new Date(share.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {Object.keys(share.permissions || {}).join(', ')}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {shares.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Share className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Not shared with anyone yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Feed</CardTitle>
              <CardDescription>
                Recent activity in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={activity.user.image} />
                      <AvatarFallback>
                        {activity.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{' '}
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                        {activity.workspace && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {activity.workspace.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent activity.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {targetType}</DialogTitle>
            <DialogDescription>
              Choose how you want to share this content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Share with</label>
              <Select value={shareType} onValueChange={setShareType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">Workspace members</SelectItem>
                  <SelectItem value="specific_users">Specific people</SelectItem>
                  <SelectItem value="public">Public (anyone with link)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shareType === 'specific_users' && (
              <div>
                <label className="text-sm font-medium">Email addresses</label>
                <Input
                  placeholder="Enter email addresses separated by commas"
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Permissions</label>
              <Select value={sharePermissions} onValueChange={setSharePermissions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Can view</SelectItem>
                  <SelectItem value="comment">Can comment</SelectItem>
                  <SelectItem value="write">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareModal(false)}>
              Cancel
            </Button>
            <Button onClick={createShare}>
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
