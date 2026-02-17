import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SendMessagesButton from '@/components/SendMessagesButton'

describe('SendMessagesButton', () => {
  describe('Rendering', () => {
    it('should render send messages button with correct text', () => {
      const mockOnSend = vi.fn()
      render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      expect(screen.getByText(/Send Messages/i)).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      const mockOnSend = vi.fn()
      render(<SendMessagesButton onSend={mockOnSend} isLoading={true} />)

      expect(screen.getByText(/Sending.../i)).toBeInTheDocument()
    })

    it('should not show modal initially', () => {
      const mockOnSend = vi.fn()
      render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      expect(screen.queryByText(/Send Messages to Uncontacted Subscribers/i)).not.toBeInTheDocument()
    })
  })

  describe('Modal Interactions', () => {
    it('should show modal when button is clicked', () => {
      const mockOnSend = vi.fn()
      const { container } = render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      const buttons = container.querySelectorAll('button')
      fireEvent.click(buttons[0])

      expect(screen.getByText(/Send Messages to Uncontacted Subscribers/i)).toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked', () => {
      const mockOnSend = vi.fn()
      const { container } = render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      const buttons = container.querySelectorAll('button')
      fireEvent.click(buttons[0])

      expect(screen.getByText(/Send Messages to Uncontacted Subscribers/i)).toBeInTheDocument()

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(screen.queryByText(/Send Messages to Uncontacted Subscribers/i)).not.toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should disable send button when message is empty', () => {
      const mockOnSend = vi.fn()
      const { container } = render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      const buttons = container.querySelectorAll('button')
      fireEvent.click(buttons[0])

      const sendButton = screen.getByRole('button', { name: /^Send$/i })
      expect(sendButton).toBeDisabled()
    })

    it('should have correct button classes', () => {
      const mockOnSend = vi.fn()
      const { container } = render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-green-600', 'text-white', 'rounded-lg')
    })
  })

  describe('Textarea', () => {
    it('should have textarea with max length 500', () => {
      const mockOnSend = vi.fn()
      const { container } = render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      const buttons = container.querySelectorAll('button')
      fireEvent.click(buttons[0])

      const textarea = screen.getByPlaceholderText(/Enter your message here/i) as HTMLTextAreaElement
      expect(textarea.maxLength).toBe(500)
    })

    it('should display character count', () => {
      const mockOnSend = vi.fn()
      const { container } = render(<SendMessagesButton onSend={mockOnSend} isLoading={false} />)

      const buttons = container.querySelectorAll('button')
      fireEvent.click(buttons[0])

      expect(screen.getByText(/0\/500 characters/i)).toBeInTheDocument()
    })
  })
})
