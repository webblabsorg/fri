'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  toolId: string
  initialIsFavorited?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function FavoriteButton({ 
  toolId, 
  initialIsFavorited = false,
  size = 'md',
  showLabel = false 
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isLoading, setIsLoading] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if inside a link
    e.stopPropagation() // Prevent parent click handlers

    setIsLoading(true)

    try {
      if (isFavorited) {
        // Remove favorite
        const response = await fetch(`/api/favorites?toolId=${toolId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setIsFavorited(false)
        } else {
          throw new Error('Failed to remove favorite')
        }
      } else {
        // Add favorite
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId }),
        })

        if (response.ok) {
          setIsFavorited(true)
        } else if (response.status === 409) {
          // Already favorited
          setIsFavorited(true)
        } else {
          throw new Error('Failed to add favorite')
        }
      }
    } catch (error) {
      console.error('Favorite toggle error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 transition-all
        ${isLoading ? 'opacity-50 cursor-wait' : 'hover:scale-110'}
        ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}
      `}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`${sizeClasses[size]} transition-all ${isFavorited ? 'fill-current' : ''}`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorited ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </button>
  )
}
