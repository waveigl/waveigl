import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SyncButton from '@/components/SyncButton'

describe('SyncButton', () => {
  describe('Rendering', () => {
    it('should render sync button with correct text', () => {
      const mockOnSync = vi.fn()
      render(<SyncButton onSync={mockOnSync} isLoading={false} />)

      expect(screen.getByText(/Sync with Twitch/i)).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      const mockOnSync = vi.fn()
      render(<SyncButton onSync={mockOnSync} isLoading={true} />)

      expect(screen.getByText(/Syncing.../i)).toBeInTheDocument()
    })

    it('should show spinner icon when loading', () => {
      const mockOnSync = vi.fn()
      const { container } = render(<SyncButton onSync={mockOnSync} isLoading={true} />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onSync when button is clicked', async () => {
      const mockOnSync = vi.fn().mockResolvedValue(undefined)
      render(<SyncButton onSync={mockOnSync} isLoading={false} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockOnSync).toHaveBeenCalledTimes(1)
      })
    })

    it('should disable button when isLoading is true', () => {
      const mockOnSync = vi.fn()
      render(<SyncButton onSync={mockOnSync} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not call onSync when button is disabled', () => {
      const mockOnSync = vi.fn()
      render(<SyncButton onSync={mockOnSync} isLoading={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(mockOnSync).not.toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('should have correct button classes', () => {
      const mockOnSync = vi.fn()
      const { container } = render(<SyncButton onSync={mockOnSync} isLoading={false} />)

      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-blue-600', 'text-white', 'rounded-lg')
    })

    it('should have hover effect when not loading', () => {
      const mockOnSync = vi.fn()
      const { container } = render(<SyncButton onSync={mockOnSync} isLoading={false} />)

      const button = container.querySelector('button')
      expect(button).toHaveClass('hover:bg-blue-700')
    })
  })
})
