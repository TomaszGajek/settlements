/**
 * Setup dla Mock Service Worker
 * Opcjonalny - do użycia w testach API
 */

import { setupServer } from 'msw/node';
import { handlers } from '../utils/msw-handlers';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Setup MSW server
export const server = setupServer(...handlers);

// Start server przed testami
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers po każdym teście
afterEach(() => {
  server.resetHandlers();
});

// Zamknij server po testach
afterAll(() => {
  server.close();
});

