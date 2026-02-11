import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getEventStore, setEventStore, EventStoreInterface, StoredEvent } from '@/lib/storage/event-store'

// Mock event store for testing
class MockEventStore implements EventStoreInterface {
  private events: Map<string, StoredEvent> = new Map()
  private idCounter = 0

  async store(event: Omit<StoredEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredEvent> {
    const id = `event-${++this.idCounter}`
    const storedEvent: StoredEvent = {
      ...event,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.events.set(id, storedEvent)
    return storedEvent
  }

  async retrieve(id: string): Promise<StoredEvent | null> {
    return this.events.get(id) || null
  }

  async list(status: string, limit: number = 100): Promise<StoredEvent[]> {
    return Array.from(this.events.values())
      .filter(e => e.status === status)
      .slice(0, limit)
  }

  async markProcessed(id: string): Promise<void> {
    const event = this.events.get(id)
    if (event) {
      event.status = 'processed'
      event.updatedAt = new Date()
    }
  }

  async markFailed(id: string, error: string): Promise<void> {
    const event = this.events.get(id)
    if (event) {
      event.status = 'failed'
      event.lastError = error
      event.attempts++
      event.updatedAt = new Date()
    }
  }

  async incrementAttempts(id: string): Promise<void> {
    const event = this.events.get(id)
    if (event) {
      event.attempts++
      event.updatedAt = new Date()
    }
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id)
  }

  clear(): void {
    this.events.clear()
    this.idCounter = 0
  }
}

describe('Event Store', () => {
  let mockStore: MockEventStore

  beforeEach(() => {
    mockStore = new MockEventStore()
    setEventStore(mockStore)
  })

  describe('store', () => {
    it('should store an event', async () => {
      const store = getEventStore()
      const event = {
        eventType: 'subscription_webhook',
        payload: { userId: 'user-123' },
        attempts: 0,
        status: 'pending' as const
      }

      const stored = await store.store(event)

      expect(stored.id).toBeDefined()
      expect(stored.eventType).toBe('subscription_webhook')
      expect(stored.payload).toEqual({ userId: 'user-123' })
      expect(stored.attempts).toBe(0)
      expect(stored.status).toBe('pending')
      expect(stored.createdAt).toBeDefined()
      expect(stored.updatedAt).toBeDefined()
    })

    it('should generate unique IDs', async () => {
      const store = getEventStore()
      const event = {
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending' as const
      }

      const stored1 = await store.store(event)
      const stored2 = await store.store(event)

      expect(stored1.id).not.toBe(stored2.id)
    })
  })

  describe('retrieve', () => {
    it('should retrieve a stored event', async () => {
      const store = getEventStore()
      const event = {
        eventType: 'test',
        payload: { data: 'test' },
        attempts: 0,
        status: 'pending' as const
      }

      const stored = await store.store(event)
      const retrieved = await store.retrieve(stored.id)

      expect(retrieved).toEqual(stored)
    })

    it('should return null for non-existent event', async () => {
      const store = getEventStore()
      const retrieved = await store.retrieve('non-existent')

      expect(retrieved).toBeNull()
    })
  })

  describe('list', () => {
    it('should list events by status', async () => {
      const store = getEventStore()

      await store.store({
        eventType: 'test1',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.store({
        eventType: 'test2',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.store({
        eventType: 'test3',
        payload: {},
        attempts: 0,
        status: 'processed'
      })

      const pending = await store.list('pending')
      const processed = await store.list('processed')

      expect(pending).toHaveLength(2)
      expect(processed).toHaveLength(1)
    })

    it('should respect limit parameter', async () => {
      const store = getEventStore()

      for (let i = 0; i < 5; i++) {
        await store.store({
          eventType: 'test',
          payload: {},
          attempts: 0,
          status: 'pending'
        })
      }

      const events = await store.list('pending', 3)

      expect(events).toHaveLength(3)
    })
  })

  describe('markProcessed', () => {
    it('should mark event as processed', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.markProcessed(stored.id)

      const retrieved = await store.retrieve(stored.id)
      expect(retrieved?.status).toBe('processed')
    })

    it('should update updatedAt timestamp', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      const originalUpdatedAt = stored.updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      await store.markProcessed(stored.id)

      const retrieved = await store.retrieve(stored.id)
      expect(retrieved?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('markFailed', () => {
    it('should mark event as failed', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.markFailed(stored.id, 'Network error')

      const retrieved = await store.retrieve(stored.id)
      expect(retrieved?.status).toBe('failed')
      expect(retrieved?.lastError).toBe('Network error')
    })

    it('should increment attempts when marking failed', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.markFailed(stored.id, 'Error 1')
      await store.markFailed(stored.id, 'Error 2')

      const retrieved = await store.retrieve(stored.id)
      expect(retrieved?.attempts).toBe(2)
    })
  })

  describe('incrementAttempts', () => {
    it('should increment attempt count', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.incrementAttempts(stored.id)
      await store.incrementAttempts(stored.id)

      const retrieved = await store.retrieve(stored.id)
      expect(retrieved?.attempts).toBe(2)
    })
  })

  describe('delete', () => {
    it('should delete an event', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.delete(stored.id)

      const retrieved = await store.retrieve(stored.id)
      expect(retrieved).toBeNull()
    })
  })

  describe('Property 11: Event Storage Round Trip', () => {
    it('should store and retrieve event identically', async () => {
      const store = getEventStore()
      const originalEvent = {
        eventType: 'subscription_webhook',
        payload: { userId: 'user-123', subscriptionId: 'sub-456' },
        attempts: 0,
        status: 'pending' as const
      }

      const stored = await store.store(originalEvent)
      const retrieved = await store.retrieve(stored.id)

      expect(retrieved?.eventType).toBe(originalEvent.eventType)
      expect(retrieved?.payload).toEqual(originalEvent.payload)
      expect(retrieved?.status).toBe(originalEvent.status)
    })

    it('should mark event as processed after successful retry', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 1,
        status: 'pending'
      })

      // Simulate successful retry
      await store.markProcessed(stored.id)

      const retrieved = await store.retrieve(stored.id)
      expect(retrieved?.status).toBe('processed')
    })

    it('should remove event from retry queue after processing', async () => {
      const store = getEventStore()

      const stored = await store.store({
        eventType: 'test',
        payload: {},
        attempts: 0,
        status: 'pending'
      })

      await store.markProcessed(stored.id)

      const pending = await store.list('pending')
      expect(pending.find(e => e.id === stored.id)).toBeUndefined()
    })
  })
})
