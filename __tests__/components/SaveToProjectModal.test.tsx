import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SaveToProjectModal } from '@/components/tools/SaveToProjectModal'

// Mock fetch
global.fetch = jest.fn()

describe('SaveToProjectModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSave = jest.fn()
  const executionId = 'exec-123'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: [] }),
    })
  })

  it('should render when open', () => {
    render(
      <SaveToProjectModal
        isOpen={true}
        onClose={mockOnClose}
        executionId={executionId}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText(/Save to Project/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(
      <SaveToProjectModal
        isOpen={false}
        onClose={mockOnClose}
        executionId={executionId}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByText(/Save to Project/i)).not.toBeInTheDocument()
  })

  it('should fetch projects on mount', async () => {
    const mockProjects = [
      { id: 'proj-1', name: 'Project 1' },
      { id: 'proj-2', name: 'Project 2' },
    ]
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: mockProjects }),
    })

    render(
      <SaveToProjectModal
        isOpen={true}
        onClose={mockOnClose}
        executionId={executionId}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/projects')
    })
  })

  it('should allow creating new project', async () => {
    render(
      <SaveToProjectModal
        isOpen={true}
        onClose={mockOnClose}
        executionId={executionId}
        onSave={mockOnSave}
      />
    )

    const createButton = screen.getByText(/Create New Project/i)
    fireEvent.click(createButton)

    const nameInput = screen.getByPlaceholderText(/Project name/i)
    expect(nameInput).toBeInTheDocument()
  })

  it('should call onClose when cancel is clicked', () => {
    render(
      <SaveToProjectModal
        isOpen={true}
        onClose={mockOnClose}
        executionId={executionId}
        onSave={mockOnSave}
      />
    )

    const cancelButton = screen.getByText(/Cancel/i)
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should save to existing project', async () => {
    const mockProjects = [{ id: 'proj-1', name: 'Project 1' }]
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    render(
      <SaveToProjectModal
        isOpen={true}
        onClose={mockOnClose}
        executionId={executionId}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
    })

    const projectOption = screen.getByText('Project 1')
    fireEvent.click(projectOption)

    const saveButton = screen.getByText(/^Save$/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })
})
