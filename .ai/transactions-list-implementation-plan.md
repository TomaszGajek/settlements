# API Endpoint Implementation Plan: GET /transactions

## Analysis

### Key Points from API Specification
- **Endpoint**: `GET /api/transactions`
- **Purpose**: Retrieve a paginated list of transactions for a specific month and year
- **Authentication**: Required (JWT-based via Supabase)
- **Response includes**:
  - Array of transactions with full details (including category information)
  - Pagination metadata (page, pageSize, totalItems, totalPages)
- **Sorting**: By date in descending order (newest first)
- **Success**: 200 OK
- **Errors**: 400 Bad Request (invalid params), 401 Unauthorized

### Required and Optional Parameters
**Required Query Parameters:**
- `month` (number): Month to retrieve data for (1-12)
- `year` (number): Year to retrieve data for (e.g., 2025)

**Optional Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `pageSize` (number): Number of items per page (default: 20)

### Necessary DTOs and Command Models
- `TransactionDto` (already defined in `src/types.ts`):
  - Contains: id, date, amount, type, note, category (nested), createdAt
  - Omits: category_id, user_id (replaced/hidden)
- `ListTransactionsResponseDto` (already defined in `src/types.ts`):
  - Contains: transactions array and pagination metadata
- `NestedCategoryDto` (already defined in `src/types.ts`):
  - Contains: id, name

### Service Layer Extraction
A new service will be created or added to: `src/lib/services/transactions.service.ts`

This service will:
- Accept `SupabaseClient`, `month`, `year`, `page`, and `pageSize` as parameters
- Query transactions for the specified period with pagination
- Join with categories table to get category details
- Calculate total count for pagination metadata
- Return data in `ListTransactionsResponseDto` format

### Input Validation Strategy
Using Zod schemas:
1. **Query Parameter Schema**: Validate month (1-12), year (valid year), page (>= 1), pageSize (1-100)
2. **Date Range Validation**: Ensure the month/year combination is valid
3. **Type Coercion**: Convert string query params to numbers
4. **Pagination Limits**: Enforce maximum pageSize to prevent abuse

### Security Considerations
- **Authentication**: User must be authenticated (checked via `context.locals.supabase.auth.getUser()`)
- **RLS Policies**: Database RLS automatically filters transactions by user_id
- **No SQL Injection Risk**: Using Supabase client with parameterized queries
- **Authorization**: Users can only access their own transactions (enforced by RLS)
- **Rate Limiting**: Consider limiting pageSize to reasonable maximum (e.g., 100)

### Error Scenarios and Status Codes
1. **400 Bad Request**:
   - Missing `month` or `year` parameter
   - Invalid `month` value (not 1-12)
   - Invalid `year` format
   - Invalid `page` (< 1)
   - Invalid `pageSize` (< 1 or > 100)

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token
   - User not authenticated

3. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during data retrieval

---

## 1. Endpoint Overview

The GET /transactions endpoint provides users with a paginated list of their transactions for a specific month and year. Each transaction includes full details such as amount, type, date, note, and associated category information. The endpoint supports pagination to handle large datasets efficiently and returns transactions sorted by date in descending order (newest first).

**Key Features:**
- Retrieves transactions from the `transactions` table
- Filters by authenticated user (via RLS) and date range
- Joins with `categories` table to include category name
- Supports pagination with configurable page size
- Returns total count for pagination UI
- Sorted by date descending (most recent first)
- Read-only operation with no side effects

---

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/transactions?month={month}&year={year}&page={page}&pageSize={pageSize}
```

### Query Parameters

#### Required Parameters
- **month** (number)
  - Description: The month to retrieve data for
  - Constraints: Must be between 1 and 12 (inclusive)
  - Example: `10` (October)

- **year** (number)
  - Description: The year to retrieve data for
  - Constraints: Must be a valid 4-digit year (1900-2100)
  - Example: `2025`

#### Optional Parameters
- **page** (number)
  - Description: The page number for pagination
  - Constraints: Must be >= 1
  - Default: `1`
  - Example: `2`

- **pageSize** (number)
  - Description: The number of items per page
  - Constraints: Must be between 1 and 100
  - Default: `20`
  - Example: `50`

### Request Headers
- **Authorization**: `Bearer <JWT_TOKEN>` (required)
  - JWT token obtained from Supabase authentication

### Request Body
None (GET request)

### Example Requests

#### Basic Request
```
GET /api/transactions?month=10&year=2025
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### With Pagination
```
GET /api/transactions?month=10&year=2025&page=2&pageSize=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Utilized Types

### Response DTOs
**TransactionDto** (defined in `src/types.ts`):
```typescript
export type TransactionDto = Omit<Tables<"transactions">, "created_at" | "category_id" | "user_id"> & {
  createdAt: Tables<"transactions">["created_at"];
  category: NestedCategoryDto | null;
};
```

**NestedCategoryDto** (defined in `src/types.ts`):
```typescript
export type NestedCategoryDto = Pick<Tables<"categories">, "id" | "name">;
```

**ListTransactionsResponseDto** (defined in `src/types.ts`):
```typescript
export interface ListTransactionsResponseDto {
  transactions: TransactionDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### Validation Schema
**Query Parameters Validation** (to be created with Zod):
```typescript
const TransactionsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1900).max(2100),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Database Types
**Tables** (from `src/db/database.types.ts`):
- `Tables<"transactions">` - Main transaction data
  - Fields: id, amount, type, date, note, category_id, user_id, created_at
- `Tables<"categories">` - Category data for joining
  - Fields: id, name, description, user_id

**Enums**:
- `transaction_type`: "income" | "expense"

---

## 4. Response Details

### Success Response (200 OK)

#### Structure
```json
{
  "transactions": [
    {
      "id": "c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d",
      "date": "2025-10-12",
      "amount": 150.75,
      "type": "expense",
      "note": "Weekly groceries",
      "category": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Food"
      },
      "createdAt": "2025-10-12T10:00:00Z"
    },
    {
      "id": "d5f9c2e6-c9f1-5c2b-ab2b-a0g8b8e8f8f8",
      "date": "2025-10-10",
      "amount": 50.00,
      "type": "income",
      "note": "Freelance work",
      "category": {
        "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
        "name": "Salary"
      },
      "createdAt": "2025-10-10T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

#### Field Descriptions
**Transaction Object:**
- **id**: Unique identifier (UUID)
- **date**: Transaction date (ISO date string, YYYY-MM-DD)
- **amount**: Transaction amount (number with max 2 decimals)
- **type**: Transaction type ("income" or "expense")
- **note**: Optional note/description (may be null)
- **category**: Nested category object (may be null if category was deleted)
  - **id**: Category UUID
  - **name**: Category name
- **createdAt**: Timestamp when transaction was created (ISO 8601)

**Pagination Object:**
- **page**: Current page number (starts at 1)
- **pageSize**: Number of items per page
- **totalItems**: Total number of transactions in the period
- **totalPages**: Total number of pages (calculated as `Math.ceil(totalItems / pageSize)`)

### Edge Cases
- **Empty Result**: When no transactions exist for the period
  ```json
  {
    "transactions": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 0,
      "totalPages": 0
    }
  }
  ```

- **Page Beyond Total**: Requesting page 5 when only 2 pages exist
  - Returns empty transactions array
  - Pagination metadata still accurate

### Error Responses

#### 400 Bad Request
**Scenarios:**
- Missing required query parameters
- Invalid month value (not 1-12)
- Invalid year format
- Invalid page (< 1)
- Invalid pageSize (< 1 or > 100)

**Example Response:**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "month": "Must be between 1 and 12",
    "pageSize": "Must be at most 100"
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
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Data Flow

### High-Level Flow
1. **Request Reception**: Astro API endpoint receives GET request
2. **Authentication Check**: Verify user is authenticated via Supabase
3. **Input Validation**: Validate query parameters using Zod schema
4. **Service Invocation**: Call `TransactionsService.listTransactions()`
5. **Data Retrieval**: Service queries transactions with category join
6. **Count Query**: Get total count for pagination
7. **Data Transformation**: Map database rows to DTOs
8. **Response Formation**: Format data into `ListTransactionsResponseDto`
9. **Response Delivery**: Return JSON response with 200 status

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/transactions.ts`)
```
1. Extract month, year, page, pageSize from URL query params
2. Validate query parameters using Zod schema
3. Apply default values for optional params (page=1, pageSize=20)
4. Get authenticated user from context.locals.supabase
5. If validation fails → return 400 error
6. If user not authenticated → return 401 error
7. If validation passes → proceed to service layer
```

#### Step 2: Service Layer (`src/lib/services/transactions.service.ts`)
```
1. Receive supabase client, month, year, page, pageSize
2. Calculate date range (first day to last day of month)
3. Calculate pagination offset: (page - 1) * pageSize
4. Execute COUNT query to get total items:
   - Filter by date range
   - RLS automatically filters by user_id
5. Execute main query with JOIN:
   - Select transactions with category details
   - Filter by date range
   - Order by date DESC
   - Apply LIMIT and OFFSET for pagination
   - RLS automatically filters by user_id
6. Transform database rows to DTOs:
   - Map category_id → category object { id, name }
   - Map created_at → createdAt
   - Remove user_id from response
7. Calculate pagination metadata:
   - totalPages = Math.ceil(totalItems / pageSize)
8. Return formatted ListTransactionsResponseDto
```

#### Step 3: Database Interaction (Supabase)

**Count Query:**
```sql
SELECT COUNT(*) as total
FROM transactions
WHERE 
  date >= '2025-10-01' 
  AND date <= '2025-10-31'
  AND user_id = <authenticated_user_id> -- Applied by RLS
```

**Main Query:**
```sql
SELECT 
  t.id,
  t.date,
  t.amount,
  t.type,
  t.note,
  t.created_at,
  c.id as category_id,
  c.name as category_name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE 
  t.date >= '2025-10-01' 
  AND t.date <= '2025-10-31'
  AND t.user_id = <authenticated_user_id> -- Applied by RLS
ORDER BY t.date DESC
LIMIT 20 OFFSET 0
```

#### Step 4: Data Transformation
```typescript
// Pseudo-code for transformation
const transactionDtos = dbRows.map(row => ({
  id: row.id,
  date: row.date,
  amount: row.amount,
  type: row.type,
  note: row.note,
  category: row.category_id ? {
    id: row.category_id,
    name: row.category_name
  } : null,
  createdAt: row.created_at
}));

const totalPages = Math.ceil(totalCount / pageSize);

return {
  transactions: transactionDtos,
  pagination: {
    page,
    pageSize,
    totalItems: totalCount,
    totalPages
  }
};
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
  - JOIN with categories also protected by RLS on categories table
  - No explicit WHERE clause needed in application code
- **Scope**: Read-only operation with SELECT permission

### Input Validation
- **Query Parameter Sanitization**:
  - Use Zod schema validation to ensure type safety
  - Coerce string params to numbers
  - Validate ranges (month: 1-12, year: reasonable range, page >= 1, pageSize: 1-100)
  - Prevent injection attacks through type validation
  - Use prepared statements via Supabase client

### Data Exposure Prevention
- **No Sensitive Data Leakage**:
  - Remove `user_id` from transaction responses
  - Category details limited to id and name only
  - Error messages don't reveal system internals
  - No internal database structure exposed

### Pagination Abuse Prevention
- **Maximum Page Size**: Enforce maximum pageSize of 100
- **Reasonable Defaults**: Default pageSize of 20 prevents excessive data transfer
- **Rate Limiting (Future)**: Consider implementing rate limiting to prevent abuse

### Category Access Control
- **JOIN Security**: LEFT JOIN with categories ensures:
  - Only categories belonging to the user are accessible
  - RLS on categories table enforces user_id filtering
  - Deleted/null categories handled gracefully

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Missing Required Parameters
```typescript
// Request: GET /api/transactions?month=10
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
// Request: GET /api/transactions?month=13&year=2025
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

#### Scenario 3: Invalid Page Number
```typescript
// Request: GET /api/transactions?month=10&year=2025&page=0
// page must be >= 1

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    page: "Number must be greater than or equal to 1"
  }
}
```

#### Scenario 4: Invalid Page Size
```typescript
// Request: GET /api/transactions?month=10&year=2025&pageSize=200
// pageSize exceeds maximum

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    pageSize: "Number must be less than or equal to 100"
  }
}
```

#### Scenario 5: Invalid Data Types
```typescript
// Request: GET /api/transactions?month=October&year=2025
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
console.error("[Transactions API] Database error:", error)
```

#### Scenario 2: Query Execution Error
```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Transactions API] Query error:", error)
```

### Edge Case Handling

#### Scenario 1: Page Beyond Total Pages
```typescript
// Request: page=10 when only 3 pages exist
// Not an error - return empty array

Response: {
  statusCode: 200,
  data: {
    transactions: [],
    pagination: {
      page: 10,
      pageSize: 20,
      totalItems: 45,
      totalPages: 3
    }
  }
}
```

#### Scenario 2: No Transactions for Period
```typescript
// No transactions found for the month
// Not an error - return empty array

Response: {
  statusCode: 200,
  data: {
    transactions: [],
    pagination: {
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0
    }
  }
}
```

### Error Handling Best Practices
1. **Never expose internal error details** to client in production
2. **Log all errors** with context for debugging
3. **Return consistent error format** across all endpoints
4. **Use try-catch blocks** around database operations
5. **Validate early** to fail fast on invalid input
6. **Handle null categories gracefully** (when category is deleted)

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. JOIN Performance
- **Issue**: LEFT JOIN with categories could be slow without proper indexes
- **Impact**: Slower response times as dataset grows
- **Solution**: 
  - Index on `transactions.category_id` (should exist from FK)
  - Index on `categories.id` (PK, already indexed)
  - Database query planner should use nested loop join efficiently

#### 2. COUNT Query Performance
- **Issue**: COUNT(*) can be slow on large tables
- **Impact**: Additional latency for pagination metadata
- **Solution**:
  - Index on `(user_id, date)` enables efficient count
  - Consider caching count for 1-2 minutes if needed
  - For very large datasets, consider approximate counts

#### 3. Large Page Sizes
- **Issue**: Requesting 100 items returns large JSON payloads
- **Impact**: Increased memory, serialization time, network transfer
- **Solution**:
  - Enforce maximum pageSize of 100
  - Default to reasonable pageSize of 20
  - Consider pagination limits based on user tier

#### 4. OFFSET Performance
- **Issue**: Large OFFSET values (e.g., page 100) can be slow
- **Impact**: Later pages load slower than first pages
- **Solution**:
  - For typical use: monthly data rarely exceeds 100 transactions
  - For power users: consider cursor-based pagination in future
  - Document that performance degrades for very high page numbers

### Optimization Strategies

#### 1. Database-Level Optimizations
```sql
-- Ensure composite index exists (should be in migrations):
CREATE INDEX idx_transactions_user_date 
ON transactions(user_id, date DESC);

-- Ensure foreign key index exists:
CREATE INDEX idx_transactions_category 
ON transactions(category_id);
```

#### 2. Query Optimization
- **Single Connection**: Reuse same Supabase client for count and data query
- **Select Specific Fields**: Only select needed columns (avoid SELECT *)
- **Efficient JOIN**: LEFT JOIN is necessary but indexed properly
- **Prepared Statements**: Supabase client uses parameterized queries

#### 3. Response Optimization
- **Minimal Data Transfer**: Only return necessary fields
- **Efficient JSON Serialization**: Keep objects flat where possible
- **Compression**: Consider enabling gzip for responses > 1KB

#### 4. Caching Strategy (Future Enhancement)
- **Query Results**: Cache first page for 30-60 seconds
- **Count Results**: Cache total count for 1-2 minutes
- **Invalidation**: Clear cache on transaction create/update/delete
- **Implementation**: Use Redis or in-memory cache

### Expected Performance

#### Best Case (First Page, < 100 transactions/month)
- **Total Response Time**: < 150ms
- **Database Query Time**: < 30ms (count + data)
- **JSON Serialization**: < 5ms
- **Network Transfer**: < 10ms (local network)

#### Typical Case (Any Page, 100-500 transactions/month)
- **Total Response Time**: < 300ms
- **Database Query Time**: < 100ms
- **JSON Serialization**: < 10ms
- **Network Transfer**: < 20ms

#### Worst Case (High Page Number, > 1000 transactions/month)
- **Total Response Time**: < 500ms
- **Database Query Time**: < 200ms (due to large OFFSET)
- **JSON Serialization**: < 15ms
- **Network Transfer**: < 30ms

### Monitoring Recommendations
- **Query Performance**: Log slow queries (> 200ms)
- **Endpoint Metrics**: Track P50, P95, P99 response times
- **Error Rates**: Monitor 4xx and 5xx errors
- **Page Size Distribution**: Track what page sizes users request
- **Pagination Patterns**: Monitor which pages are most accessed

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File**: `src/pages/api/transactions.ts` (or separate validation file)

```typescript
import { z } from "zod";

const TransactionsQuerySchema = z.object({
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
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(1)
    .optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must be at most 100")
    .default(20)
    .optional(),
});

type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;
```

### Step 2: Create Transactions Service
**File**: `src/lib/services/transactions.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { ListTransactionsResponseDto, TransactionDto } from "@/types";

export class TransactionsService {
  /**
   * Get paginated list of transactions for a specific month and year
   * @param supabase - Authenticated Supabase client
   * @param month - Month (1-12)
   * @param year - Year (e.g., 2025)
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 20)
   * @returns Paginated list of transactions with metadata
   */
  static async listTransactions(
    supabase: SupabaseClient,
    month: number,
    year: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ListTransactionsResponseDto> {
    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Calculate pagination
    const offset = (page - 1) * pageSize;

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (countError) {
      throw new Error(`Failed to count transactions: ${countError.message}`);
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Query transactions with category join
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        id,
        date,
        amount,
        type,
        note,
        created_at,
        category:categories (
          id,
          name
        )
      `)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Transform to DTOs
    const transactionDtos: TransactionDto[] = (transactions || []).map((t) => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      type: t.type,
      note: t.note,
      category: t.category
        ? {
            id: t.category.id,
            name: t.category.name,
          }
        : null,
      createdAt: t.created_at,
    }));

    // Return formatted response
    return {
      transactions: transactionDtos,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }
}
```

### Step 3: Create API Route Handler
**File**: `src/pages/api/transactions.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { TransactionsService } from "@/lib/services/transactions.service";

const TransactionsQuerySchema = z.object({
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
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(1)
    .optional(),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must be at most 100")
    .default(20)
    .optional(),
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
    const page = url.searchParams.get("page");
    const pageSize = url.searchParams.get("pageSize");

    const validationResult = TransactionsQuerySchema.safeParse({
      month,
      year,
      page,
      pageSize,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            month: errors.month?._errors[0],
            year: errors.year?._errors[0],
            page: errors.page?._errors[0],
            pageSize: errors.pageSize?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const {
      month: validMonth,
      year: validYear,
      page: validPage,
      pageSize: validPageSize,
    } = validationResult.data;

    // 3. Call service layer
    const result = await TransactionsService.listTransactions(
      locals.supabase,
      validMonth,
      validYear,
      validPage ?? 1,
      validPageSize ?? 20
    );

    // 4. Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Handle unexpected errors
    console.error("[Transactions API] Unexpected error:", error);

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

### Step 4: Verify Dependencies
```bash
# Zod should already be installed from dashboard endpoint
# If not:
npm install zod
```

### Step 5: Test Authentication Flow
- **Valid Token**: Test with authenticated user
- **Missing Token**: Test without Authorization header → expect 401
- **Invalid Token**: Test with malformed token → expect 401
- **Expired Token**: Test with expired token → expect 401

### Step 6: Test Validation

#### Required Parameters
- Missing `month` → expect 400 with error message
- Missing `year` → expect 400 with error message
- Missing both → expect 400 with both errors

#### Month Validation
- `month=0` → expect 400 ("at least 1")
- `month=13` → expect 400 ("at most 12")
- `month=-5` → expect 400
- `month=abc` → expect 400 ("expected number")

#### Year Validation
- `year=1899` → expect 400 ("at least 1900")
- `year=2101` → expect 400 ("at most 2100")
- `year=abc` → expect 400

#### Page Validation
- `page=0` → expect 400 ("at least 1")
- `page=-1` → expect 400
- `page=1.5` → expect 400 ("expected integer")
- No page parameter → should default to 1

#### PageSize Validation
- `pageSize=0` → expect 400 ("at least 1")
- `pageSize=101` → expect 400 ("at most 100")
- `pageSize=-10` → expect 400
- No pageSize parameter → should default to 20

### Step 7: Test Service Layer

#### Basic Functionality
- Create test transactions in database for specific month
- Query with valid parameters
- Verify response structure matches `ListTransactionsResponseDto`
- Verify transactions array contains `TransactionDto` objects

#### Data Accuracy
- Verify correct transactions are returned (filtered by date)
- Verify transactions are sorted by date DESC
- Verify category information is included
- Verify `createdAt` field is present
- Verify `user_id` is NOT in response

#### Pagination
- Test page 1 with default pageSize (20)
- Test page 2 to verify offset works
- Test custom pageSize (e.g., 5, 50, 100)
- Verify `totalItems` is correct
- Verify `totalPages` calculation: `Math.ceil(totalItems / pageSize)`

#### Edge Cases
- Empty month (no transactions) → empty array, totalItems=0
- Single transaction → array with one item
- Exactly pageSize transactions → totalPages=1
- pageSize+1 transactions → totalPages=2
- Page beyond totalPages → empty array, but pagination metadata accurate

### Step 8: Test Category JOIN

#### Normal Cases
- Transaction with category → category object present with id and name
- Multiple transactions with same category → category repeated correctly

#### Edge Cases
- Transaction with deleted category (category_id is null) → category: null
- Category exists but has no name → handle gracefully
- Verify only user's own categories are joined (RLS on categories)

### Step 9: Test RLS Policies

#### User Isolation
- Create transactions for User A and User B
- Authenticate as User A
- Query transactions
- Verify only User A's transactions are returned
- Verify User B's transactions are NOT visible

#### Category RLS
- Create category for User A
- Create transaction for User A with that category
- Authenticate as User B
- Verify User B cannot see User A's category details in join

### Step 10: Test Pagination Logic

#### Offset Calculation
- page=1, pageSize=20 → offset=0, range(0, 19)
- page=2, pageSize=20 → offset=20, range(20, 39)
- page=3, pageSize=10 → offset=20, range(20, 29)

#### Boundary Cases
- 19 items, pageSize=20, page=1 → all items, totalPages=1
- 20 items, pageSize=20, page=1 → all items, totalPages=1
- 21 items, pageSize=20, page=1 → 20 items, totalPages=2
- 21 items, pageSize=20, page=2 → 1 item, totalPages=2

#### Large Datasets
- Create 100+ transactions
- Test various page/pageSize combinations
- Verify no duplicates across pages
- Verify no missing items

### Step 11: Performance Testing

#### Query Performance
- Create 1000+ transactions for a single month
- Measure response time for first page
- Measure response time for last page
- Verify both are acceptable (< 500ms)

#### Index Usage
- Use database query planner to verify index usage
- Should use `idx_transactions_user_date` index
- JOIN should use index on `category_id` and `categories.id`

#### Memory Usage
- Test with maximum pageSize (100)
- Monitor memory during request processing
- Ensure no memory leaks

### Step 12: Integration Testing

#### Full Request Flow
- Send request from client/Postman
- Verify complete request/response cycle
- Test with various month/year combinations
- Test January (month=1)
- Test December (month=12)
- Test leap year February (month=2, year=2024)

#### Response Format
- Verify JSON is valid
- Verify all fields are present
- Verify data types are correct
- Verify date formats (ISO 8601)
- Verify numbers have proper precision

### Step 13: Error Handling Testing

#### Database Errors
- Simulate database connection failure
- Verify 500 error response
- Verify error is logged
- Verify no sensitive information leaked

#### Validation Errors
- Test all validation scenarios from Step 6
- Verify error messages are user-friendly
- Verify error format is consistent

#### Edge Cases
- Very old dates (year=1900)
- Future dates (year=2100)
- Leap years
- Different timezones

### Step 14: Code Quality

#### Type Safety
- Ensure all types are properly defined
- No `any` types used
- All DTOs match specification
- Service returns correct types

#### Code Organization
- Service layer is separate from route handler
- Validation schema is clearly defined
- Error handling is consistent
- Code is DRY (no duplication)

#### Documentation
- Add JSDoc comments to service methods
- Document query parameters
- Add usage examples
- Explain pagination calculation

### Step 15: Deployment Checklist

#### Pre-Deployment
- [ ] All tests pass
- [ ] Linter errors resolved
- [ ] TypeScript compiles without errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Indexes exist and are used

#### Post-Deployment
- [ ] Test in staging environment
- [ ] Smoke test: basic GET request works
- [ ] Authentication works
- [ ] Pagination works
- [ ] Monitor error logs
- [ ] Monitor response times
- [ ] Verify RLS policies are active

---

## 10. Testing Checklist

### Unit Tests (Service Layer)
- [ ] Returns correct transactions for given month/year
- [ ] Returns empty array for month with no transactions
- [ ] Correctly calculates pagination offset
- [ ] Correctly calculates totalPages
- [ ] Handles null categories gracefully
- [ ] Sorts transactions by date DESC
- [ ] Transforms database rows to DTOs correctly
- [ ] Removes user_id from response
- [ ] Maps created_at to correct createdAt
- [ ] Throws error on database failure

### Integration Tests (API Route)
- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for missing month
- [ ] Returns 400 for missing year
- [ ] Returns 400 for invalid month (< 1 or > 12)
- [ ] Returns 400 for invalid year
- [ ] Returns 400 for invalid page (< 1)
- [ ] Returns 400 for invalid pageSize (< 1 or > 100)
- [ ] Returns 200 with correct data for valid request
- [ ] Applies default page=1 when not provided
- [ ] Applies default pageSize=20 when not provided
- [ ] Response matches ListTransactionsResponseDto structure
- [ ] Only returns authenticated user's data (RLS)

### Pagination Tests
- [ ] Page 1 returns first pageSize items
- [ ] Page 2 returns next pageSize items
- [ ] No duplicates across pages
- [ ] No missing items across pages
- [ ] totalItems matches actual count
- [ ] totalPages calculated correctly
- [ ] Page beyond totalPages returns empty array
- [ ] Works with various pageSize values

### Category JOIN Tests
- [ ] Transactions with categories include category object
- [ ] Transactions without categories have category: null
- [ ] Category object has id and name
- [ ] Only user's own categories are included
- [ ] Multiple transactions share same category correctly

### End-to-End Tests
- [ ] Full request from client returns correct data
- [ ] Multiple users see only their own data
- [ ] Response time is acceptable
- [ ] Works for all months (Jan-Dec)
- [ ] Works for leap years
- [ ] Large datasets (1000+ transactions) perform well

---

## 11. Future Enhancements

### Optimization Opportunities
1. **Cursor-Based Pagination**: Replace offset with cursor for better performance on large datasets
2. **Query Caching**: Cache frequent queries (first page) for 30-60 seconds
3. **Count Caching**: Cache total count for 1-2 minutes, invalidate on changes
4. **Database Aggregation**: Explore using Supabase RPC for server-side aggregation
5. **Lazy Loading**: Implement infinite scroll with progressive loading

### Feature Additions
1. **Filtering**: Add filters by category, type (income/expense), amount range
2. **Search**: Full-text search in transaction notes
3. **Sorting**: Allow sorting by amount, date, category
4. **Date Range**: Support custom date ranges beyond single month
5. **Export**: Add CSV/PDF export for filtered results
6. **Bulk Operations**: Support selecting multiple transactions

### API Enhancements
1. **ETags**: Implement ETags for caching at HTTP level
2. **Compression**: Enable gzip compression for large responses
3. **Partial Responses**: Allow clients to request specific fields only
4. **Batch Requests**: Support requesting multiple months in one call
5. **GraphQL**: Consider GraphQL endpoint for flexible querying

### Monitoring and Analytics
1. **Query Performance**: Log slow queries for optimization
2. **Usage Analytics**: Track most common page sizes and page numbers
3. **Error Tracking**: Detailed error tracking with context
4. **Performance Metrics**: P50, P95, P99 response times
5. **User Behavior**: Track pagination patterns for UX improvements

---

## Appendix A: Example Queries

### Successful Request (Default Pagination)
```bash
curl -X GET "https://api.example.com/api/transactions?month=10&year=2025" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d",
      "date": "2025-10-12",
      "amount": 150.75,
      "type": "expense",
      "note": "Weekly groceries",
      "category": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Food"
      },
      "createdAt": "2025-10-12T10:00:00Z"
    },
    {
      "id": "d5f9c2e6-c9f1-5c2b-ab2b-a0g8b8e8f8f8",
      "date": "2025-10-10",
      "amount": 2500.00,
      "type": "income",
      "note": "Monthly salary",
      "category": {
        "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
        "name": "Salary"
      },
      "createdAt": "2025-10-10T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 2,
    "totalPages": 1
  }
}
```

### Request with Custom Pagination
```bash
curl -X GET "https://api.example.com/api/transactions?month=10&year=2025&page=2&pageSize=5" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "e6g0d3f7-d0g2-6d3c-bc3c-b1h9c9f9g9g9",
      "date": "2025-10-05",
      "amount": 45.00,
      "type": "expense",
      "note": "Coffee",
      "category": {
        "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
        "name": "Entertainment"
      },
      "createdAt": "2025-10-05T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 2,
    "pageSize": 5,
    "totalItems": 6,
    "totalPages": 2
  }
}
```

### Empty Result (No Transactions)
```bash
curl -X GET "https://api.example.com/api/transactions?month=1&year=2025" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (200 OK):**
```json
{
  "transactions": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

### Invalid Month
```bash
curl -X GET "https://api.example.com/api/transactions?month=13&year=2025" \
  -H "Authorization: Bearer <JWT_TOKEN>"
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

### Invalid Page Size
```bash
curl -X GET "https://api.example.com/api/transactions?month=10&year=2025&pageSize=200" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "pageSize": "Page size must be at most 100"
  }
}
```

### Missing Authentication
```bash
curl -X GET "https://api.example.com/api/transactions?month=10&year=2025"
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

## Appendix B: Database Query Examples

### Count Query (for Pagination Metadata)
```sql
SELECT COUNT(*) as total
FROM transactions
WHERE 
  date >= '2025-10-01' 
  AND date <= '2025-10-31'
  AND user_id = '123e4567-e89b-12d3-a456-426614174000' -- Applied by RLS
```

### Main Query with JOIN (Page 1, PageSize 20)
```sql
SELECT 
  t.id,
  t.date,
  t.amount,
  t.type,
  t.note,
  t.created_at,
  c.id as category_id,
  c.name as category_name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE 
  t.date >= '2025-10-01' 
  AND t.date <= '2025-10-31'
  AND t.user_id = '123e4567-e89b-12d3-a456-426614174000' -- Applied by RLS
ORDER BY t.date DESC
LIMIT 20 OFFSET 0
```

### Query Plan Analysis
```sql
EXPLAIN ANALYZE
SELECT t.id, t.date, t.amount, t.type, t.note, t.created_at, c.id, c.name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.date >= '2025-10-01' AND t.date <= '2025-10-31'
  AND t.user_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY t.date DESC
LIMIT 20;

-- Expected plan:
-- Limit (cost=... rows=20)
--   -> Nested Loop Left Join (cost=...)
--        -> Index Scan using idx_transactions_user_date on transactions t
--             Index Cond: (user_id = '...' AND date >= '2025-10-01' AND date <= '2025-10-31')
--        -> Index Scan using categories_pkey on categories c
--             Index Cond: (id = t.category_id)
```

---

## Appendix C: Type Definitions Reference

### TransactionDto
```typescript
// From src/types.ts
export type TransactionDto = Omit<
  Tables<"transactions">,
  "created_at" | "category_id" | "user_id"
> & {
  createdAt: Tables<"transactions">["created_at"];
  category: NestedCategoryDto | null;
};

// Expands to:
{
  id: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  note: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
  } | null;
}
```

### ListTransactionsResponseDto
```typescript
// From src/types.ts
export interface ListTransactionsResponseDto {
  transactions: TransactionDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### Database Row Type (from Supabase)
```typescript
// What Supabase returns from database
{
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: "income" | "expense";
  date: string;
  note: string | null;
  created_at: string;
}
```

---

This implementation plan provides comprehensive guidance for implementing the GET /transactions endpoint with pagination support. Follow the steps sequentially, test thoroughly at each stage, and ensure all security, performance, and pagination considerations are properly addressed.

