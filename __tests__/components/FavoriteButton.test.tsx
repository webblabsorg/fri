import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FavoriteButton } from '@/components/tools/FavoriteButton'

// Mock fetch
global.fetch = jest.fn()

describe('FavoriteButton', () => {
  const mockToolId = 'test-tool-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with correct initial state when not favorited', () => {
      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={false} />)

      const button = screen.getByRole('button', { name: /add to favorites/i })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })

    it('should render with correct initial state when favorited', () => {
      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={true} />)

      const button = screen.getByRole('button', { name: /remove from favorites/i })
      expect(button).toBeInTheDocument()
    })

    it('should show label when showLabel is true', () => {
      render(<FavoriteButton toolId={mockToolId} showLabel={true} initialIsFavorited={false} />)

      expect(screen.getByText('Favorite')).toBeInTheDocument()
    })

    it('should show "Favorited" label when favorited and showLabel is true', () => {
      render(<FavoriteButton toolId={mockToolId} showLabel={true} initialIsFavorited={true} />)

      expect(screen.getByText('Favorited')).toBeInTheDocument()
    })

    it('should apply correct size classes', () => {
      const { container } = render(
        <FavoriteButton toolId={mockToolId} size="lg" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('w-6', 'h-6')
    })
  })

  describe('Adding to favorites', () => {
    it('should call POST API when clicking unfavorited button', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ favorite: { id: '123', toolId: mockToolId } }),
      })

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={false} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: mockToolId }),
        })
      })
    })

    it('should update UI state after successful POST', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ favorite: { id: '123', toolId: mockToolId } }),
      })

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={false} showLabel={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Favorited')).toBeInTheDocument()
      })

      // Should now show remove title
      expect(button).toHaveAttribute('title', 'Remove from favorites')
    })

    it('should handle 409 conflict gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Already favorited' }),
      })

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={false} showLabel={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // Should still update UI to favorited state
      await waitFor(() => {
        expect(screen.getByText('Favorited')).toBeInTheDocument()
      })
    })

    it('should handle POST failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={false} showLabel={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      // Should remain unfavorited
      expect(screen.getByText('Favorite')).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Removing from favorites', () => {
    it('should call DELETE API when clicking favorited button', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/favorites?toolId=${mockToolId}`,
          { method: 'DELETE' }
        )
      })
    })

    it('should update UI state after successful DELETE', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={true} showLabel={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Favorite')).toBeInTheDocument()
      })

      // Should now show add title
      expect(button).toHaveAttribute('title', 'Add to favorites')
    })

    it('should handle DELETE failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={true} showLabel={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      // Should remain favorited
      expect(screen.getByText('Favorited')).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Loading state', () => {
    it('should disable button and show loading state during API call', async () => {
      let resolvePromise: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as jest.Mock).mockReturnValue(fetchPromise)

      render(<FavoriteButton toolId={mockToolId} initialIsFavorited={false} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // Button should be disabled during loading
      await waitFor(() => {
        expect(button).toBeDisabled()
        expect(button).toHaveClass('opacity-50', 'cursor-wait')
      })

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ favorite: { id: '123' } }),
      })

      // Button should be enabled again
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Event handling', () => {
    it('should prevent default and stop propagation on click', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ favorite: { id: '123' } }),
      })

      render(
        <div onClick={jest.fn()}>
          <FavoriteButton toolId={mockToolId} initialIsFavorited={false} />
        </div>
      )

      const button = screen.getByRole('button')
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault')
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation')

      fireEvent(button, clickEvent)

      await waitFor(() => {
        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(stopPropagationSpy).toHaveBeenCalled()
      })
    })
  })
})
