/**
 * Utilities dla testów - custom render, helpers, itp.
 */

import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Custom render z providerami
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

/**
 * Helper do czekania na zakończenie wszystkich Promise'ów
 */
export const waitForPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Helper do mockowania Supabase client
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  };
}

/**
 * Helper do tworzenia mock user
 */
export function createMockUser() {
  return {
    id: "test-user-id",
    email: "test@example.com",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };
}

/**
 * Helper do tworzenia mock category
 */
export function createMockCategory(overrides?: Partial<any>) {
  return {
    id: "category-id-1",
    name: "Test Category",
    user_id: "test-user-id",
    is_deletable: true,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

/**
 * Helper do tworzenia mock transaction
 */
export function createMockTransaction(overrides?: Partial<any>) {
  return {
    id: "transaction-id-1",
    amount: 100.5,
    date: "2025-10-15",
    category_id: "category-id-1",
    type: "expense" as const,
    note: "Test transaction",
    user_id: "test-user-id",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// Re-export wszystkiego z testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
