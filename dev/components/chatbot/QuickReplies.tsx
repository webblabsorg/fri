'use client'

import { Button } from '@/components/ui/button'

interface QuickRepliesProps {
  replies: string[]
  onSelect: (reply: string) => void
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (replies.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {replies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          className="text-xs h-8 px-3 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
        >
          {reply}
        </Button>
      ))}
    </div>
  )
}
