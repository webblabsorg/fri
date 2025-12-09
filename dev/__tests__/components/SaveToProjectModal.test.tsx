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
      json: async () => [],
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
      json: async () => mockProjects,
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
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    render(
      <SaveToProjectModal
        isOpen={true}
        onClose={mockOnClose}
        executionId={executionId}
        onSave={mockOnSave}
      />
    )

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading projects/i)).not.toBeInTheDocument()
    })

    const createButton = screen.getByText(/Create New Project/i)
    fireEvent.click(createButton)

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText(/Enter project name/i)
      expect(nameInput).toBeInTheDocument()
    })
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
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProjects,
    })

    mockOnSave.mockResolvedValue(undefined)

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

    const projectSelect = screen.getByRole('combobox')
    fireEvent.change(projectSelect, { target: { value: 'proj-1' } })

    const saveButton = screen.getByText(/Save to Selected Project/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('proj-1')
    })
  })
})
