import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// Typical lifecycle helpers (opt-in per test file)
export function setupMswServer(): void {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}


