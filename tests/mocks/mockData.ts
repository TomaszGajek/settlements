/**
 * Mock data dla testów
 */

export const mockUsers = {
  user1: {
    id: 'user-1-test-id',
    email: 'test1@example.com',
    created_at: '2025-01-01T00:00:00Z',
  },
  user2: {
    id: 'user-2-test-id',
    email: 'test2@example.com',
    created_at: '2025-01-02T00:00:00Z',
  },
};

export const mockCategories = {
  jedzenie: {
    id: 'cat-jedzenie-id',
    name: 'Jedzenie',
    user_id: mockUsers.user1.id,
    is_deletable: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  rachunki: {
    id: 'cat-rachunki-id',
    name: 'Rachunki',
    user_id: mockUsers.user1.id,
    is_deletable: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  wynagrodzenie: {
    id: 'cat-wynagrodzenie-id',
    name: 'Wynagrodzenie',
    user_id: mockUsers.user1.id,
    is_deletable: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  inne: {
    id: 'cat-inne-id',
    name: 'Inne',
    user_id: mockUsers.user1.id,
    is_deletable: false,
    created_at: '2025-01-01T00:00:00Z',
  },
};

export const mockTransactions = {
  expense1: {
    id: 'trans-expense-1',
    amount: 150.50,
    date: '2025-10-15',
    category_id: mockCategories.jedzenie.id,
    type: 'expense' as const,
    note: 'Zakupy spożywcze',
    user_id: mockUsers.user1.id,
    created_at: '2025-10-15T10:00:00Z',
    updated_at: '2025-10-15T10:00:00Z',
  },
  expense2: {
    id: 'trans-expense-2',
    amount: 500.00,
    date: '2025-10-10',
    category_id: mockCategories.rachunki.id,
    type: 'expense' as const,
    note: 'Prąd',
    user_id: mockUsers.user1.id,
    created_at: '2025-10-10T08:00:00Z',
    updated_at: '2025-10-10T08:00:00Z',
  },
  income1: {
    id: 'trans-income-1',
    amount: 5000.00,
    date: '2025-10-01',
    category_id: mockCategories.wynagrodzenie.id,
    type: 'income' as const,
    note: 'Wypłata',
    user_id: mockUsers.user1.id,
    created_at: '2025-10-01T12:00:00Z',
    updated_at: '2025-10-01T12:00:00Z',
  },
};

export const mockDashboardData = {
  summary: {
    totalIncome: 5000.00,
    totalExpenses: 650.50,
    balance: 4349.50,
  },
  dailyData: Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    income: i === 0 ? 5000 : 0,
    expenses: i === 14 ? 150.50 : i === 9 ? 500 : 0,
  })),
  month: 10,
  year: 2025,
};

/**
 * Factory function do tworzenia mock user
 */
export function createMockUser(overrides?: Partial<typeof mockUsers.user1>) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Factory function do tworzenia mock category
 */
export function createMockCategory(overrides?: Partial<typeof mockCategories.jedzenie>) {
  return {
    id: 'test-category-id',
    name: 'Test Category',
    user_id: 'test-user-id',
    is_deletable: true,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Factory function do tworzenia mock transaction
 */
export function createMockTransaction(overrides?: Partial<typeof mockTransactions.expense1>) {
  return {
    id: 'test-transaction-id',
    amount: 100.00,
    date: '2025-10-15',
    category_id: 'test-category-id',
    type: 'expense' as const,
    note: 'Test transaction',
    user_id: 'test-user-id',
    created_at: '2025-10-15T10:00:00Z',
    updated_at: '2025-10-15T10:00:00Z',
    ...overrides,
  };
}

