import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SubscriberStatsDisplay from '@/components/SubscriberStats'
import { SubscriberStats } from '@/types/twitch.types'

describe('SubscriberStats', () => {
  const mockStats: SubscriberStats = {
    total: 100,
    sent: 60,
    notSent: 25,
    failed: 10,
    blocked: 3,
    banned: 2,
  }

  describe('Rendering', () => {
    it('should render all stat cards', () => {
      render(<SubscriberStatsDisplay stats={mockStats} />)

      expect(screen.getByText('Total Subscribers')).toBeInTheDocument()
      expect(screen.getByText('Contacted')).toBeInTheDocument()
      expect(screen.getByText('Not Contacted')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
      expect(screen.getByText('Blocked')).toBeInTheDocument()
      expect(screen.getByText('Banned')).toBeInTheDocument()
    })

    it('should display correct values for each stat', () => {
      render(<SubscriberStatsDisplay stats={mockStats} />)

      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should display icons for each stat', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      expect(container.textContent).toContain('👥')
      expect(container.textContent).toContain('✅')
      expect(container.textContent).toContain('⏳')
      expect(container.textContent).toContain('❌')
      expect(container.textContent).toContain('🚫')
      expect(container.textContent).toContain('⛔')
    })
  })

  describe('Styling', () => {
    it('should have correct color classes for total stat', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const totalCard = container.querySelector('.bg-blue-100')
      expect(totalCard).toBeInTheDocument()
      expect(totalCard).toHaveClass('text-blue-800')
    })

    it('should have correct color classes for sent stat', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const sentCard = container.querySelector('.bg-green-100')
      expect(sentCard).toBeInTheDocument()
      expect(sentCard).toHaveClass('text-green-800')
    })

    it('should have correct color classes for not sent stat', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const notSentCard = container.querySelector('.bg-gray-100')
      expect(notSentCard).toBeInTheDocument()
      expect(notSentCard).toHaveClass('text-gray-800')
    })

    it('should have correct color classes for failed stat', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const failedCard = container.querySelector('.bg-red-100')
      expect(failedCard).toBeInTheDocument()
      expect(failedCard).toHaveClass('text-red-800')
    })

    it('should have correct color classes for blocked stat', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const blockedCard = container.querySelector('.bg-yellow-100')
      expect(blockedCard).toBeInTheDocument()
      expect(blockedCard).toHaveClass('text-yellow-800')
    })

    it('should have correct color classes for banned stat', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const bannedCard = container.querySelector('.bg-purple-100')
      expect(bannedCard).toBeInTheDocument()
      expect(bannedCard).toHaveClass('text-purple-800')
    })

    it('should use grid layout', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const zeroStats: SubscriberStats = {
        total: 0,
        sent: 0,
        notSent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
      }

      render(<SubscriberStatsDisplay stats={zeroStats} />)

      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBe(6)
    })

    it('should handle large numbers', () => {
      const largeStats: SubscriberStats = {
        total: 10000,
        sent: 8500,
        notSent: 1200,
        failed: 250,
        blocked: 40,
        banned: 10,
      }

      render(<SubscriberStatsDisplay stats={largeStats} />)

      expect(screen.getByText('10000')).toBeInTheDocument()
      expect(screen.getByText('8500')).toBeInTheDocument()
      expect(screen.getByText('1200')).toBeInTheDocument()
    })

    it('should handle all subscribers in one status', () => {
      const allSentStats: SubscriberStats = {
        total: 100,
        sent: 100,
        notSent: 0,
        failed: 0,
        blocked: 0,
        banned: 0,
      }

      render(<SubscriberStatsDisplay stats={allSentStats} />)

      const allValues = screen.getAllByText('100')
      expect(allValues.length).toBeGreaterThan(0)
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBe(4)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<SubscriberStatsDisplay stats={mockStats} />)

      const labels = container.querySelectorAll('p')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('should display labels for each stat', () => {
      render(<SubscriberStatsDisplay stats={mockStats} />)

      expect(screen.getByText('Total Subscribers')).toBeInTheDocument()
      expect(screen.getByText('Contacted')).toBeInTheDocument()
      expect(screen.getByText('Not Contacted')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
      expect(screen.getByText('Blocked')).toBeInTheDocument()
      expect(screen.getByText('Banned')).toBeInTheDocument()
    })
  })
})
