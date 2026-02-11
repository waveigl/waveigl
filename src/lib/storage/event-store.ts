/**
 * Event Storage for Failed Operations
 * Persists failed webhook events for later retry
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'

export type EventStatus = 'pending' | 'processed' | 'failed'

export interface StoredEvent {
  /** Unique event ID */
  id: string
  /** Type of event (e.g., 'subscription_webhook', 'payment_webhook') */
  eventType: string
  /** The webhook payload */
  payload: unknown
  /** When the event was created */
  createdAt: Date
  /** Number of retry attempts */
  attempts: number
  /** Last error message */
  lastError?: string
  /** Event status */
  status: EventStatus
  /** When the event was last updated */
  updatedAt: Date
}

export interface EventStoreInterface {
  store(event: Omit<StoredEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredEvent>
  retrieve(id: string): Promise<StoredEvent | null>
  list(status: EventStatus, limit?: number): Promise<StoredEvent[]>
  markProcessed(id: string): Promise<void>
  markFailed(id: string, error: string): Promise<void>
  incrementAttempts(id: string): Promise<void>
  delete(id: string): Promise<void>
}

/**
 * Event Store implementation using Supabase
 */
class SupabaseEventStore implements EventStoreInterface {
  private tableName = 'webhook_events'

  /**
   * Stores a failed event for later retry
   */
  async store(event: Omit<StoredEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredEvent> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        event_type: event.eventType,
        payload: event.payload,
        attempts: event.attempts,
        last_error: event.lastError,
        status: event.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to store event: ${error.message}`)
    }

    return this.mapFromDatabase(data)
  }

  /**
   * Retrieves a stored event by ID
   */
  async retrieve(id: string): Promise<StoredEvent | null> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new Error(`Failed to retrieve event: ${error.message}`)
    }

    return this.mapFromDatabase(data)
  }

  /**
   * Lists events by status
   */
  async list(status: EventStatus, limit: number = 100): Promise<StoredEvent[]> {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to list events: ${error.message}`)
    }

    return (data || []).map(item => this.mapFromDatabase(item))
  }

  /**
   * Marks an event as processed
   */
  async markProcessed(id: string): Promise<void> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from(this.tableName)
      .update({
        status: 'processed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to mark event as processed: ${error.message}`)
    }
  }

  /**
   * Marks an event as failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    const supabase = getSupabaseAdmin()

    const { data: event } = await supabase
      .from(this.tableName)
      .select('attempts')
      .eq('id', id)
      .single()

    const attempts = (event?.attempts || 0) + 1

    const { error: updateError } = await supabase
      .from(this.tableName)
      .update({
        status: 'failed',
        last_error: error,
        attempts,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(`Failed to mark event as failed: ${updateError.message}`)
    }
  }

  /**
   * Increments the attempt count for an event
   */
  async incrementAttempts(id: string): Promise<void> {
    const supabase = getSupabaseAdmin()

    const { data: event } = await supabase
      .from(this.tableName)
      .select('attempts')
      .eq('id', id)
      .single()

    const attempts = (event?.attempts || 0) + 1

    const { error } = await supabase
      .from(this.tableName)
      .update({
        attempts,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to increment attempts: ${error.message}`)
    }
  }

  /**
   * Deletes an event
   */
  async delete(id: string): Promise<void> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`)
    }
  }

  /**
   * Maps database row to StoredEvent
   */
  private mapFromDatabase(data: any): StoredEvent {
    return {
      id: data.id,
      eventType: data.event_type,
      payload: data.payload,
      createdAt: new Date(data.created_at),
      attempts: data.attempts,
      lastError: data.last_error,
      status: data.status,
      updatedAt: new Date(data.updated_at)
    }
  }
}

// Singleton instance
let eventStore: EventStoreInterface | null = null

/**
 * Gets the event store instance
 */
export function getEventStore(): EventStoreInterface {
  if (!eventStore) {
    eventStore = new SupabaseEventStore()
  }
  return eventStore
}

/**
 * Sets the event store instance (for testing)
 */
export function setEventStore(store: EventStoreInterface): void {
  eventStore = store
}
