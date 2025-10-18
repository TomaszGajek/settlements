/**
 * Mock Service Worker handlers dla testów API
 */

import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:4321";

export const handlers = [
  // GET /api/categories
  http.get(`${BASE_URL}/api/categories`, () => {
    return HttpResponse.json([
      {
        id: "cat-1",
        name: "Jedzenie",
        user_id: "user-1",
        is_deletable: true,
        created_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "cat-2",
        name: "Inne",
        user_id: "user-1",
        is_deletable: false,
        created_at: "2025-01-01T00:00:00Z",
      },
    ]);
  }),

  // POST /api/categories
  http.post(`${BASE_URL}/api/categories`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: "new-cat-id",
        ...(body as object),
        user_id: "user-1",
        is_deletable: true,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // GET /api/transactions
  http.get(`${BASE_URL}/api/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 0;

    return HttpResponse.json({
      data: [
        {
          id: `trans-${page}-1`,
          amount: 100,
          date: "2025-10-15",
          category_id: "cat-1",
          type: "expense",
          note: "Test transaction",
          user_id: "user-1",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ],
      page,
      pageSize: 20,
      hasMore: page < 2,
    });
  }),

  // POST /api/transactions
  http.post(`${BASE_URL}/api/transactions`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: "new-trans-id",
        ...(body as object),
        user_id: "user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // GET /api/dashboard
  http.get(`${BASE_URL}/api/dashboard`, ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get("month") || "10";
    const year = url.searchParams.get("year") || "2025";

    return HttpResponse.json({
      summary: {
        totalIncome: 5000,
        totalExpenses: 2000,
        balance: 3000,
      },
      dailyData: Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        income: i % 5 === 0 ? 500 : 0,
        expenses: i % 3 === 0 ? 150 : 0,
      })),
      month: Number(month),
      year: Number(year),
    });
  }),
];

export const errorHandlers = {
  // Handler dla błędów 401
  unauthorized: http.get(`${BASE_URL}/api/*`, () => {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }),

  // Handler dla błędów 500
  serverError: http.get(`${BASE_URL}/api/*`, () => {
    return HttpResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }),
};
