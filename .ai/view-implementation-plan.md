# API Endpoint Implementation Plan: GET /dashboard

## Analysis

### Key Points from API Specification
- **Endpoint**: `GET /api/dashboard`
- **Purpose**: Retrieve aggregated financial summary for a specific month and year
- **Authentication**: Required (JWT-based via Supabase)
- **Response includes**:
  - Summary totals (income, expenses, balance)
  - Daily breakdown of income/expenses for the period
- **Success**: 200 OK
- **Errors**: 400 Bad Request (invalid params), 401 Unauthorized

### Required and Optional Parameters
**Required Query Parameters:**
- `month` (number): Month to retrieve data for (1-12)
- `year` (number): Year to retrieve data for (e.g., 2025)

**Optional Parameters:** None

### Necessary DTOs and Command Models
- `DashboardSummaryDto` (already defined in `src/types.ts`):
  - Contains `summary` object with income, expenses, balance
  - Contains `dailyBreakdown` array with date, income, expenses per day

### Service Layer Extraction
A new service will be created: `src/lib/services/dashboard.service.ts`

This service will:
- Accept `SupabaseClient`, `month`, and `year` as parameters
- Query transactions for the specified period
- Aggregate data to compute totals and daily breakdown
- Return data in `DashboardSummaryDto` format

### Input Validation Strategy
Using Zod schemas:
1. **Query Parameter Schema**: Validate month (1-12) and year (valid 4-digit year)
2. **Date Range Validation**: Ensure the month/year combination is valid
3. **Type Coercion**: Convert string query params to numbers

### Security Considerations
- **Authentication**: User must be authenticated (checked via `context.locals.supabase.auth.getUser()`)
- **RLS Policies**: Database RLS automatically filters transactions by user_id
- **No SQL Injection Risk**: Using Supabase client with parameterized queries
- **Authorization**: Users can only access their own data (enforced by RLS)

### Error Scenarios and Status Codes
1. **400 Bad Request**:
   - Missing `month` or `year` parameter
   - Invalid `month` value (not 1-12)
   - Invalid `year` format
   - Invalid date range

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token
   - User not authenticated

3. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during data aggregation

---

## 1. Endpoint Overview

The GET /dashboard endpoint provides users with a comprehensive financial overview for a specific month and year. It aggregates all transactions within the specified period to calculate total income, total expenses, and current balance. Additionally, it provides a daily breakdown showing income and expenses for each day that has transactions, enabling visualization of spending patterns over time.

**Key Features:**
- Aggregates financial data from the `transactions` table
- Filters by authenticated user (via RLS)
- Computes summary statistics (income, expenses, balance)
- Generates daily breakdown for chart visualization
- Read-only operation with no side effects

---

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/dashboard?month={month}&year={year}
```

### Query Parameters

#### Required Parameters
- **month** (number)
  - Description: The month to retrieve data for
  - Constraints: Must be between 1 and 12 (inclusive)
  - Example: `10` (October)

- **year** (number)
  - Description: The year to retrieve data for
  - Constraints: Must be a valid 4-digit year
  - Example: `2025`

#### Optional Parameters
None

### Request Headers
- **Authorization**: `Bearer <JWT_TOKEN>` (required)
  - JWT token obtained from Supabase authentication

### Request Body
None (GET request)

### Example Request
```
GET /api/dashboard?month=10&year=2025
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Utilized Types

### Response DTO
**DashboardSummaryDto** (defined in `src/types.ts`):
```typescript
export interface DashboardSummaryDto {
  summary: {
    income: number;
    expenses: number;
    balance: number;
  };
  dailyBreakdown: {
    date: string;
    income: number;
    expenses: number;
  }[];
}
```

### Validation Schema
**Query Parameters Validation** (to be created with Zod):
```typescript
const DashboardQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1900).max(2100),
});
```

### Database Types
**Tables** (from `src/db/database.types.ts`):
- `Tables<"transactions">` - Used to query transaction data
  - Relevant fields: `amount`, `type`, `date`, `user_id`

**Enums**:
- `transaction_type`: "income" | "expense"

---

## 4. Response Details

### Success Response (200 OK)

#### Structure
```json
{
  "summary": {
    "income": 10000.0,
    "expenses": 4500.5,
    "balance": 5499.5
  },
  "dailyBreakdown": [
    {
      "date": "2025-10-01",
      "income": 5000.0,
      "expenses": 250.0
    },
    {
      "date": "2025-10-05",
      "income": 0,
      "expenses": 800.5
    }
  ]
}
```

#### Field Descriptions
- **summary.income**: Total income for the period (sum of all "income" transactions)
- **summary.expenses**: Total expenses for the period (sum of all "expense" transactions)
- **summary.balance**: Calculated as `income - expenses`
- **dailyBreakdown**: Array of daily aggregates, sorted by date ascending
  - **date**: ISO date string (YYYY-MM-DD)
  - **income**: Total income for that specific day
  - **expenses**: Total expenses for that specific day

### Error Responses

#### 400 Bad Request
**Scenarios:**
- Missing required query parameters
- Invalid month value (not 1-12)
- Invalid year format
- Invalid data types

**Example Response:**
```json
{
  "error": "Invalid query parameters",
  "details": {
    "month": "Must be between 1 and 12"
  }
}
```

#### 401 Unauthorized
**Scenarios:**
- Missing Authorization header
- Invalid or expired JWT token
- User not authenticated

**Example Response:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 500 Internal Server Error
**Scenarios:**
- Database connection failure
- Unexpected server errors

**Example Response:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Data Flow

### High-Level Flow
1. **Request Reception**: Astro API endpoint receives GET request
2. **Authentication Check**: Verify user is authenticated via Supabase
3. **Input Validation**: Validate query parameters using Zod schema
4. **Service Invocation**: Call `DashboardService.getDashboardSummary()`
5. **Data Retrieval**: Service queries transactions from Supabase
6. **Data Aggregation**: Compute summary totals and daily breakdown
7. **Response Formation**: Format data into `DashboardSummaryDto`
8. **Response Delivery**: Return JSON response with 200 status

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/dashboard.ts`)
```
1. Extract month and year from URL query params
2. Validate query parameters using Zod schema
3. Get authenticated user from context.locals.supabase
4. If validation fails → return 400 error
5. If user not authenticated → return 401 error
6. If validation passes → proceed to service layer
```

#### Step 2: Service Layer (`src/lib/services/dashboard.service.ts`)
```
1. Receive supabase client, month, and year
2. Calculate date range (first day to last day of month)
3. Query transactions table:
   - Filter by date range (date >= startDate AND date <= endDate)
   - Select: id, amount, type, date
   - RLS automatically filters by user_id
4. Process query results:
   - Group transactions by type (income vs expense)
   - Sum amounts for each type
   - Calculate balance (income - expenses)
   - Group by date for daily breakdown
   - Sort daily data by date ascending
5. Format data into DashboardSummaryDto structure
6. Return formatted data
```

#### Step 3: Database Interaction (Supabase)
```
SELECT 
  date,
  type,
  amount
FROM transactions
WHERE 
  date >= '2025-10-01' 
  AND date <= '2025-10-31'
  AND user_id = <authenticated_user_id> -- Applied by RLS
ORDER BY date ASC
```

#### Step 4: Data Aggregation Logic
```typescript
// Pseudo-code for aggregation
summary.income = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + t.amount, 0)

summary.expenses = transactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + t.amount, 0)

summary.balance = summary.income - summary.expenses

dailyBreakdown = groupByDate(transactions).map(group => ({
  date: group.date,
  income: group.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0),
  expenses: group.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
}))
```

---

## 6. Security Considerations

### Authentication
- **Method**: JWT-based authentication via Supabase
- **Implementation**: 
  - Extract user from `context.locals.supabase.auth.getUser()`
  - Reject request with 401 if user is null or token is invalid
  - JWT token must be included in `Authorization` header as Bearer token

### Authorization
- **User Data Isolation**: 
  - Database RLS policies ensure users only access their own transactions
  - Policy: `auth.uid() = user_id` on transactions table
  - No explicit WHERE clause needed in application code
- **Scope**: Read-only operation with SELECT permission

### Input Validation
- **Query Parameter Sanitization**:
  - Use Zod schema validation to ensure type safety
  - Coerce string params to numbers
  - Validate ranges (month: 1-12, year: reasonable range)
  - Prevent injection attacks through type validation

### Data Exposure Prevention
- **No Sensitive Data Leakage**:
  - Only return aggregated financial data
  - No user_id or internal IDs exposed in response
  - Error messages don't reveal system internals

### Rate Limiting (Future Consideration)
- Consider implementing rate limiting to prevent abuse
- Recommended: 100 requests per minute per user

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Missing Required Parameters
```typescript
// Request: GET /api/dashboard?month=10
// Missing: year parameter

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    year: "Required"
  }
}
```

#### Scenario 2: Invalid Month Value
```typescript
// Request: GET /api/dashboard?month=13&year=2025
// month is out of range

Response: {
  statusCode: 400,
  error: "Bad Request", 
  message: "Validation failed",
  details: {
    month: "Number must be less than or equal to 12"
  }
}
```

#### Scenario 3: Invalid Data Type
```typescript
// Request: GET /api/dashboard?month=October&year=2025
// month should be a number

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    month: "Expected number, received string"
  }
}
```

### Authentication Errors (401 Unauthorized)

#### Scenario 1: Missing Authorization Header
```typescript
Response: {
  statusCode: 401,
  error: "Unauthorized",
  message: "Authentication required"
}
```

#### Scenario 2: Invalid or Expired Token
```typescript
Response: {
  statusCode: 401,
  error: "Unauthorized",
  message: "Invalid or expired authentication token"
}
```

### Database Errors (500 Internal Server Error)

#### Scenario 1: Database Connection Failure
```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Dashboard API] Database error:", error)
```

#### Scenario 2: Unexpected Data Format
```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Dashboard API] Data processing error:", error)
```

### Error Handling Best Practices
1. **Never expose internal error details** to client in production
2. **Log all errors** with context for debugging
3. **Return consistent error format** across all endpoints
4. **Use try-catch blocks** around database operations
5. **Validate early** to fail fast on invalid input

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Database Query Performance
- **Issue**: Full table scan if date index is missing
- **Impact**: Slow response times for users with many transactions
- **Mitigation**: 
  - Database already has composite index on `(user_id, date DESC)`
  - Query will use this index efficiently
  - RLS policy automatically filters by user_id

#### 2. Large Result Sets
- **Issue**: Users with many daily transactions could return large datasets
- **Impact**: Increased memory usage and JSON serialization time
- **Mitigation**:
  - Aggregation happens in application layer (minimal data transfer)
  - Daily breakdown is limited to max 31 days per month
  - Only necessary fields selected from database

#### 3. Multiple Database Queries
- **Issue**: Separate queries for summary and daily breakdown could be inefficient
- **Impact**: Increased latency due to multiple round-trips
- **Mitigation**:
  - Use single query to fetch all transactions for the period
  - Perform aggregation in application layer
  - Consider future optimization: database aggregation query

### Optimization Strategies

#### 1. Database-Level Optimizations
```sql
-- Ensure index exists (should be in migrations):
CREATE INDEX idx_transactions_user_date 
ON transactions(user_id, date DESC);
```

#### 2. Query Optimization
- Select only required fields (id, amount, type, date)
- Let RLS handle user filtering (indexed)
- Use date range filter (indexed)
- Order by date for efficient grouping

#### 3. Caching Strategy (Future Enhancement)
- Cache dashboard data for 5-10 minutes
- Invalidate cache on transaction create/update/delete
- Use Redis or in-memory cache
- Add `Cache-Control` headers to response

#### 4. Response Size Optimization
- Daily breakdown already minimal (only days with transactions)
- Numbers formatted with max 2 decimal places
- No unnecessary metadata in response

### Expected Performance
- **Response Time**: < 200ms for typical user (< 1000 transactions/month)
- **Database Query Time**: < 50ms with proper indexes
- **Aggregation Time**: < 10ms for monthly data
- **JSON Serialization**: < 5ms

### Monitoring Recommendations
- Log query execution times
- Monitor endpoint response times
- Alert on responses > 1 second
- Track error rates

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File**: `src/pages/api/dashboard.ts` (or separate validation file)

```typescript
import { z } from "zod";

const DashboardQuerySchema = z.object({
  month: z.coerce
    .number({ required_error: "Month is required" })
    .int()
    .min(1, "Month must be at least 1")
    .max(12, "Month must be at most 12"),
  year: z.coerce
    .number({ required_error: "Year is required" })
    .int()
    .min(1900, "Year must be at least 1900")
    .max(2100, "Year must be at most 2100"),
});

type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
```

### Step 2: Create Dashboard Service
**File**: `src/lib/services/dashboard.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { DashboardSummaryDto } from "@/types";

export class DashboardService {
  /**
   * Get dashboard summary for a specific month and year
   * @param supabase - Authenticated Supabase client
   * @param month - Month (1-12)
   * @param year - Year (e.g., 2025)
   * @returns Dashboard summary with totals and daily breakdown
   */
  static async getDashboardSummary(
    supabase: SupabaseClient,
    month: number,
    year: number
  ): Promise<DashboardSummaryDto> {
    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Query transactions for the period
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("id, amount, type, date")
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Initialize summary
    let totalIncome = 0;
    let totalExpenses = 0;

    // Initialize daily breakdown map
    const dailyMap = new Map<string, { income: number; expenses: number }>();

    // Process transactions
    for (const transaction of transactions || []) {
      const amount = Number(transaction.amount);
      
      // Update totals
      if (transaction.type === "income") {
        totalIncome += amount;
      } else if (transaction.type === "expense") {
        totalExpenses += amount;
      }

      // Update daily breakdown
      const dateKey = transaction.date;
      const dailyData = dailyMap.get(dateKey) || { income: 0, expenses: 0 };
      
      if (transaction.type === "income") {
        dailyData.income += amount;
      } else if (transaction.type === "expense") {
        dailyData.expenses += amount;
      }
      
      dailyMap.set(dateKey, dailyData);
    }

    // Convert daily map to array and sort
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Return formatted response
    return {
      summary: {
        income: Math.round(totalIncome * 100) / 100,
        expenses: Math.round(totalExpenses * 100) / 100,
        balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      },
      dailyBreakdown,
    };
  }
}
```

### Step 3: Create API Route Handler
**File**: `src/pages/api/dashboard.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { DashboardService } from "@/lib/services/dashboard.service";

const DashboardQuerySchema = z.object({
  month: z.coerce
    .number({ required_error: "Month is required" })
    .int()
    .min(1, "Month must be at least 1")
    .max(12, "Month must be at most 12"),
  year: z.coerce
    .number({ required_error: "Year is required" })
    .int()
    .min(1900, "Year must be at least 1900")
    .max(2100, "Year must be at most 2100"),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Extract and validate query parameters
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");

    const validationResult = DashboardQuerySchema.safeParse({ month, year });

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            month: errors.month?._errors[0],
            year: errors.year?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { month: validMonth, year: validYear } = validationResult.data;

    // 3. Call service layer
    const dashboardData = await DashboardService.getDashboardSummary(
      locals.supabase,
      validMonth,
      validYear
    );

    // 4. Return success response
    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Handle unexpected errors
    console.error("[Dashboard API] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Step 4: Install Dependencies (if needed)
```bash
npm install zod
```

### Step 5: Test Authentication Flow
- Verify middleware is properly setting `context.locals.supabase`
- Test with valid JWT token
- Test with missing/invalid token
- Verify 401 responses are returned correctly

### Step 6: Test Validation
- Test with missing parameters (should return 400)
- Test with invalid month values (0, 13, -1, etc.)
- Test with invalid year values
- Test with non-numeric values
- Verify error messages are helpful

### Step 7: Test Service Layer
- Create test transactions in database
- Query for a specific month/year
- Verify summary calculations are correct:
  - Income total
  - Expense total
  - Balance (income - expenses)
- Verify daily breakdown:
  - Correct grouping by date
  - Correct daily totals
  - Sorted by date ascending
  - Days with no transactions are excluded

### Step 8: Test RLS Policies
- Create transactions for multiple users
- Verify each user only sees their own data
- Verify dashboard returns empty data for months with no transactions

### Step 9: Test Edge Cases
- Empty month (no transactions)
- Month with only income
- Month with only expenses
- Large amounts (verify decimal precision)
- Leap year February (29 days)
- Different timezones (verify date handling)

### Step 10: Performance Testing
- Create large dataset (1000+ transactions)
- Measure response time
- Verify query uses proper index (check query plan)
- Monitor memory usage during aggregation

### Step 11: Integration Testing
- Test full request/response cycle
- Verify response matches `DashboardSummaryDto` type
- Test from frontend or API client
- Verify CORS headers if needed

### Step 12: Error Handling Testing
- Simulate database connection failure
- Simulate Supabase API errors
- Verify error responses don't leak sensitive info
- Verify errors are logged properly

### Step 13: Documentation
- Add JSDoc comments to service methods
- Document query parameters in code
- Add usage examples in comments
- Update API documentation if exists

### Step 14: Code Review Checklist
- [ ] Validation schema covers all edge cases
- [ ] Authentication is properly checked
- [ ] RLS policies are trusted (no explicit user_id filtering)
- [ ] Error messages are user-friendly
- [ ] Sensitive data is not exposed in errors
- [ ] Code follows TypeScript best practices
- [ ] Service is properly typed
- [ ] Response matches DTO structure
- [ ] Numbers are properly rounded (2 decimals)
- [ ] Date calculations are correct
- [ ] Code is DRY (no duplication)
- [ ] Performance is acceptable

### Step 15: Deployment
- Ensure environment variables are set (SUPABASE_URL, SUPABASE_KEY)
- Verify database migrations are applied
- Verify indexes exist
- Verify RLS policies are enabled
- Test in staging environment
- Monitor logs after deployment
- Monitor performance metrics

---

## 10. Testing Checklist

### Unit Tests (Service Layer)
- [ ] Returns correct summary for month with transactions
- [ ] Returns zeros for month with no transactions
- [ ] Calculates balance correctly (income - expenses)
- [ ] Groups transactions by date correctly
- [ ] Sorts daily breakdown by date ascending
- [ ] Handles decimal precision correctly
- [ ] Handles month boundaries correctly
- [ ] Throws error on database failure

### Integration Tests (API Route)
- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for missing month parameter
- [ ] Returns 400 for missing year parameter
- [ ] Returns 400 for invalid month (< 1 or > 12)
- [ ] Returns 400 for invalid year
- [ ] Returns 200 with correct data for valid request
- [ ] Response matches DashboardSummaryDto structure
- [ ] Only returns authenticated user's data (RLS)

### End-to-End Tests
- [ ] Full request from client returns correct data
- [ ] Multiple users see only their own data
- [ ] Response time is acceptable (< 500ms)
- [ ] Works for all months (1-12)
- [ ] Works for leap years
- [ ] Works for months with many transactions

---

## 11. Future Enhancements

### Optimization Opportunities
1. **Database Aggregation**: Move aggregation to PostgreSQL using GROUP BY
2. **Caching**: Implement Redis caching for frequently accessed months
3. **Pagination**: Add pagination if daily breakdown becomes too large
4. **Compression**: Enable gzip compression for response
5. **CDN**: Cache responses at CDN edge for recent months

### Feature Additions
1. **Year-to-Date Summary**: Add YTD calculations to response
2. **Comparison**: Include previous month/year comparison
3. **Category Breakdown**: Add breakdown by category
4. **Trends**: Calculate spending trends (up/down from previous period)
5. **Export**: Add CSV/PDF export functionality

### Monitoring
1. **Logging**: Add structured logging for debugging
2. **Metrics**: Track response times, error rates
3. **Alerts**: Set up alerts for high error rates or slow responses
4. **Analytics**: Track most queried months for caching strategy

---

## Appendix A: Example Queries

### Successful Request
```bash
curl -X GET "https://api.example.com/api/dashboard?month=10&year=2025" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (200 OK):**
```json
{
  "summary": {
    "income": 5000.00,
    "expenses": 2345.67,
    "balance": 2654.33
  },
  "dailyBreakdown": [
    {
      "date": "2025-10-01",
      "income": 5000.00,
      "expenses": 0
    },
    {
      "date": "2025-10-05",
      "income": 0,
      "expenses": 50.00
    },
    {
      "date": "2025-10-12",
      "income": 0,
      "expenses": 150.75
    }
  ]
}
```

### Invalid Month
```bash
curl -X GET "https://api.example.com/api/dashboard?month=13&year=2025"
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "month": "Month must be at most 12"
  }
}
```

### Missing Authentication
```bash
curl -X GET "https://api.example.com/api/dashboard?month=10&year=2025"
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

## Appendix B: Database Query Plan

### Expected Query (Generated by Supabase Client)
```sql
SELECT id, amount, type, date
FROM transactions
WHERE 
  date >= '2025-10-01' 
  AND date <= '2025-10-31'
  AND user_id = '<authenticated_user_id>' -- Applied by RLS
ORDER BY date ASC;
```

### Index Usage
```sql
-- Should use this index:
idx_transactions_user_date ON transactions(user_id, date DESC)

-- Query plan should show:
-- Index Scan using idx_transactions_user_date
-- Filter: (date >= '2025-10-01' AND date <= '2025-10-31')
```

### Performance Expectations
- **Index Scan**: O(log n) for user_id lookup
- **Date Filter**: Linear scan within user's transactions
- **Sort**: Already sorted by index (DESC), minimal work to reverse
- **Typical Execution Time**: < 50ms for 1000 transactions

---

This implementation plan provides comprehensive guidance for implementing the GET /dashboard endpoint. Follow the steps sequentially, test thoroughly at each stage, and ensure all security and performance considerations are addressed.

