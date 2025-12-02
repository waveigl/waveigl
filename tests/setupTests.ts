import '@testing-library/jest-dom'

// MSW in tests (node) - server started per test file that imports server.ts
// For unit tests that need fetch, jsdom provides a minimal fetch; if needed, polyfill here.

// Silence React 19 act() warnings in tests where appropriate
// (left intentionally minimal)


