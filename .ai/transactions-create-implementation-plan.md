# API Endpoint Implementation Plan: POST /transactions

## Analysis

### Key Points from API Specification
- **Endpoint**: `POST /api/transactions`
- **Purpose**: Create a new transaction
- **Authentication**: Required (JWT-based via Supabase)
- **Request includes**:
  - amount (required)
  - date (required)
  - categoryId (required)
  - type (required: "income" or "expense")
  - note (optional)
- **Response**: Newly created transaction with full details including category info
- **Success**: 201 Created
- **Errors**: 
  - 400 Bad Request (validation errors)
  - 401 Unauthorized (not authenticated)
  - 422 Unprocessable Entity (categoryId doesn't exist or doesn't belong to user)

### Required and Optional Parameters
**Required Request Body Fields:**
- `amount` (number): Transaction amount, must be positive, max 2 decimal places
- `date` (string): Transaction date in ISO format (YYYY-MM-DD)
- `categoryId` (UUID): ID of the category to assign
- `type` (string): Either "income" or "expense"

**Optional Request Body Fields:**
- `note` (string): Optional description, max 500 characters

### Necessary DTOs and Command Models
- `CreateTransactionCommand` (already defined in `src/types.ts`):
  - Fields: amount, date, categoryId, type, note (optional)
- `CreateTransactionResponseDto` (already defined in `src/types.ts`):
  - Alias for `TransactionDto`
  - Contains: id, date, amount, type, note, category (nested), createdAt

### Service Layer Extraction
Service method to be added to: `src/lib/services/transactions.service.ts`

This service will:
- Accept `SupabaseClient` and `CreateTransactionCommand`
- Validate that categoryId belongs to the authenticated user
- Insert new transaction into database
- Fetch created transaction with category details
- Return data in `CreateTransactionResponseDto` format

### Input Validation Strategy
Using Zod schemas:
1. **Request Body Schema**: Validate all fields
   - amount: positive number, max 2 decimals
   - date: valid ISO date string
   - categoryId: valid UUID format
   - type: enum ("income" or "expense")
   - note: optional string, max 500 chars
2. **Business Validation**:
   - Verify categoryId exists and belongs to user (via RLS)
   - Ensure date is valid calendar date

### Security Considerations
- **Authentication**: User must be authenticated
- **Authorization**: 
  - User can only create transactions for themselves
  - User can only assign their own categories
  - RLS enforces user_id matching
- **Data Validation**: Strict validation prevents invalid data
- **SQL Injection**: Prevented by Supabase parameterized queries

### Error Scenarios and Status Codes
1. **400 Bad Request**:
   - Missing required fields
   - Invalid amount (negative, zero, or too many decimals)
   - Invalid date format
   - Invalid type value
   - Note too long (> 500 chars)
   - Invalid UUID format for categoryId

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token

3. **422 Unprocessable Entity**:
   - categoryId doesn't exist
   - categoryId belongs to different user (blocked by RLS)

4. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during insertion

---

## 1. Endpoint Overview

The POST /transactions endpoint allows authenticated users to create new financial transactions. Each transaction must be associated with a category, have a type (income or expense), an amount, and a date. The endpoint validates all input data, ensures the category belongs to the user, creates the transaction, and returns the complete transaction object including category details.

**Key Features:**
- Creates new record in `transactions` table
- Validates all input data thoroughly
- Verifies category ownership through RLS
- Automatically sets user_id from authenticated user
- Returns complete transaction object with category info
- Generates UUID and timestamps automatically

---

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
```
/api/transactions
```

### Request Headers
- **Content-Type**: `application/json` (required)
- **Authorization**: `Bearer <JWT_TOKEN>` (required)

### Request Body

#### Structure
```json
{
  "amount": 199.99,
  "date": "2025-10-13",
  "categoryId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "type": "expense",
  "note": "New headphones"
}
```

#### Field Descriptions
- **amount** (number, required)
  - Description: Transaction amount
  - Constraints: Must be > 0, max 2 decimal places
  - Example: `199.99`

- **date** (string, required)
  - Description: Transaction date
  - Format: ISO date (YYYY-MM-DD)
  - Example: `"2025-10-13"`

- **categoryId** (string, required)
  - Description: UUID of the category
  - Format: Valid UUID
  - Example: `"a1b2c3d4-e5f6-7890-1234-567890abcdef"`

- **type** (string, required)
  - Description: Transaction type
  - Allowed values: `"income"` or `"expense"`
  - Example: `"expense"`

- **note** (string, optional)
  - Description: Optional transaction note
  - Constraints: Max 500 characters
  - Example: `"New headphones"`

### Example Requests

#### Create Expense
```bash
curl -X POST "https://api.example.com/api/transactions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "amount": 150.75,
    "date": "2025-10-13",
    "categoryId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "type": "expense",
    "note": "Weekly groceries"
  }'
```

#### Create Income Without Note
```bash
curl -X POST "https://api.example.com/api/transactions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "amount": 2500.00,
    "date": "2025-10-01",
    "categoryId": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "type": "income"
  }'
```

---

## 3. Utilized Types

### Command Model
**CreateTransactionCommand** (defined in `src/types.ts`):
```typescript
export type CreateTransactionCommand = Pick<
  TablesInsert<"transactions">,
  "amount" | "date" | "note" | "type"
> & {
  categoryId: Tables<"transactions">["category_id"];
};

// Expands to:
{
  amount: number;
  date: string;
  categoryId: string;
  type: "income" | "expense";
  note?: string | null;
}
```

### Response DTO
**CreateTransactionResponseDto** (defined in `src/types.ts`):
```typescript
export type CreateTransactionResponseDto = TransactionDto;

// Which is:
{
  id: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  note: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}
```

### Validation Schema
**Request Body Validation** (to be created with Zod):
```typescript
const CreateTransactionSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be positive")
    .refine((val) => {
      const decimals = val.toString().split(".")[1];
      return !decimals || decimals.length <= 2;
    }, "Amount can have at most 2 decimal places"),
  date: z
    .string({ required_error: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  categoryId: z
    .string({ required_error: "Category ID is required" })
    .uuid("Category ID must be a valid UUID"),
  type: z.enum(["income", "expense"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be either 'income' or 'expense'",
  }),
  note: z
    .string()
    .max(500, "Note must be at most 500 characters")
    .optional()
    .nullable(),
});
```

### Database Types
**TablesInsert<"transactions">** (from `src/db/database.types.ts`):
```typescript
{
  amount: number;
  category_id?: string | null;
  created_at?: string;
  date: string;
  id?: string;
  note?: string | null;
  type: "income" | "expense";
  user_id: string;
}
```

---

## 4. Response Details

### Success Response (201 Created)

#### Structure
```json
{
  "id": "d4e9b2e5-c9f1-5c2b-ab2b-a0g8b8e8f8f8",
  "date": "2025-10-13",
  "amount": 199.99,
  "type": "expense",
  "note": "New headphones",
  "category": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Entertainment"
  },
  "createdAt": "2025-10-13T14:30:00Z"
}
```

#### Field Descriptions
- **id**: Auto-generated UUID for the transaction
- **date**: Transaction date as provided (ISO date string)
- **amount**: Transaction amount as provided
- **type**: Transaction type as provided
- **note**: Note as provided (or null)
- **category**: Object containing category id and name
- **createdAt**: Auto-generated timestamp (ISO 8601)

### Error Responses

#### 400 Bad Request (Validation Errors)
**Scenarios:**
- Missing required fields
- Invalid data types
- Amount is zero or negative
- Amount has more than 2 decimals
- Invalid date format
- Invalid UUID format
- Type not "income" or "expense"
- Note exceeds 500 characters

**Example Response:**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "amount": "Amount must be positive",
    "date": "Date must be in YYYY-MM-DD format"
  }
}
```

#### 401 Unauthorized
**Scenarios:**
- Missing Authorization header
- Invalid or expired JWT token

**Example Response:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 422 Unprocessable Entity
**Scenarios:**
- categoryId doesn't exist in database
- categoryId belongs to different user (RLS blocks insert)

**Example Response:**
```json
{
  "error": "Unprocessable Entity",
  "message": "Invalid category ID or category does not belong to user"
}
```

#### 500 Internal Server Error
**Scenarios:**
- Database connection failure
- Unexpected errors during insert
- Failed to fetch created transaction

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
1. **Request Reception**: Astro API endpoint receives POST request
2. **Authentication Check**: Verify user is authenticated via Supabase
3. **Body Parsing**: Parse JSON request body
4. **Input Validation**: Validate request body using Zod schema
5. **Service Invocation**: Call `TransactionsService.createTransaction()`
6. **Category Verification**: RLS ensures category belongs to user during insert
7. **Database Insert**: Insert new transaction record
8. **Fetch Created Data**: Query inserted transaction with category details
9. **Response Formation**: Format data into `CreateTransactionResponseDto`
10. **Response Delivery**: Return JSON response with 201 status

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/transactions.ts`)
```
1. Check HTTP method is POST
2. Get authenticated user from context.locals.supabase
3. If user not authenticated → return 401 error
4. Parse request body as JSON
5. Validate request body using Zod schema
6. If validation fails → return 400 error with details
7. If validation passes → proceed to service layer
```

#### Step 2: Service Layer (`src/lib/services/transactions.service.ts`)
```
1. Receive supabase client and CreateTransactionCommand
2. Extract user_id from authenticated session
3. Prepare insert data:
   - Map categoryId → category_id
   - Add user_id from authenticated user
   - Include amount, date, type, note
4. Execute INSERT query:
   - INSERT INTO transactions
   - Let database generate id and created_at
   - RLS will verify category_id belongs to user
5. If insert fails due to FK constraint → throw 422 error
6. Get ID of inserted transaction
7. Fetch complete transaction with category JOIN
8. Transform to DTO (category_id → category object)
9. Return CreateTransactionResponseDto
```

#### Step 3: Database Interaction (Supabase)

**Insert Query:**
```sql
INSERT INTO transactions (
  user_id,
  category_id,
  amount,
  date,
  type,
  note
) VALUES (
  '<authenticated_user_id>',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  199.99,
  '2025-10-13',
  'expense',
  'New headphones'
)
RETURNING id;
```

**RLS Check (automatic):**
```sql
-- RLS INSERT policy on transactions:
-- auth.uid() = user_id ✓

-- RLS SELECT policy on categories (via FK):
-- auth.uid() = user_id
-- If category doesn't belong to user, FK constraint will fail
```

**Fetch Created Transaction:**
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
WHERE t.id = '<new_transaction_id>'
  AND t.user_id = '<authenticated_user_id>'; -- RLS
```

#### Step 4: Data Transformation
```typescript
// Pseudo-code for transformation
const transactionDto = {
  id: dbRow.id,
  date: dbRow.date,
  amount: dbRow.amount,
  type: dbRow.type,
  note: dbRow.note,
  category: {
    id: dbRow.category_id,
    name: dbRow.category_name
  },
  createdAt: dbRow.created_at
};
```

---

## 6. Security Considerations

### Authentication
- **Method**: JWT-based authentication via Supabase
- **Implementation**: 
  - Extract user from `context.locals.supabase.auth.getUser()`
  - Reject request with 401 if user is null or token is invalid
  - Use authenticated user's ID for `user_id` field

### Authorization
- **Transaction Ownership**: 
  - `user_id` automatically set to authenticated user
  - User cannot create transactions for other users
  - RLS INSERT policy verifies `auth.uid() = user_id`
- **Category Ownership**:
  - Foreign key ensures category exists
  - RLS on categories table ensures category belongs to user
  - If category doesn't belong to user, INSERT fails with FK violation

### Input Validation
- **Request Body Sanitization**:
  - Strict Zod schema validation
  - Type checking for all fields
  - Range validation for amount (> 0)
  - Format validation for date and UUID
  - Length validation for note (max 500 chars)
  - Enum validation for type

### Data Integrity
- **Database Constraints**:
  - Amount CHECK constraint: `amount > 0`
  - Type ENUM constraint: only 'income' or 'expense'
  - Foreign key on category_id
  - NOT NULL constraints on required fields
- **Validation Layers**:
  - Application layer (Zod)
  - Database layer (constraints)
  - RLS layer (ownership)

### Preventing Common Attacks
- **SQL Injection**: Supabase uses parameterized queries
- **Mass Assignment**: Only accept defined fields from CreateTransactionCommand
- **Privilege Escalation**: RLS prevents assigning other users' categories
- **Data Tampering**: user_id set from auth token, not request body

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Missing Required Fields
```typescript
// Request body: { "amount": 100 }
// Missing: date, categoryId, type

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    date: "Date is required",
    categoryId: "Category ID is required",
    type: "Type is required"
  }
}
```

#### Scenario 2: Invalid Amount
```typescript
// Request body: { "amount": -50, ... }
// Amount is negative

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    amount: "Amount must be positive"
  }
}
```

#### Scenario 3: Too Many Decimal Places
```typescript
// Request body: { "amount": 99.999, ... }
// More than 2 decimals

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    amount: "Amount can have at most 2 decimal places"
  }
}
```

#### Scenario 4: Invalid Date Format
```typescript
// Request body: { "date": "13/10/2025", ... }
// Wrong date format

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    date: "Date must be in YYYY-MM-DD format"
  }
}
```

#### Scenario 5: Invalid UUID
```typescript
// Request body: { "categoryId": "invalid-uuid", ... }

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    categoryId: "Category ID must be a valid UUID"
  }
}
```

#### Scenario 6: Invalid Type
```typescript
// Request body: { "type": "payment", ... }

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    type: "Type must be either 'income' or 'expense'"
  }
}
```

#### Scenario 7: Note Too Long
```typescript
// Request body: { "note": "<501 characters>", ... }

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    note: "Note must be at most 500 characters"
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

#### Scenario 2: Invalid Token
```typescript
Response: {
  statusCode: 401,
  error: "Unauthorized",
  message: "Invalid or expired authentication token"
}
```

### Business Logic Errors (422 Unprocessable Entity)

#### Scenario 1: Category Doesn't Exist
```typescript
// categoryId not found in database

Response: {
  statusCode: 422,
  error: "Unprocessable Entity",
  message: "Invalid category ID or category does not belong to user"
}
```

#### Scenario 2: Category Belongs to Different User
```typescript
// categoryId exists but belongs to another user
// RLS on categories blocks the FK reference

Response: {
  statusCode: 422,
  error: "Unprocessable Entity",
  message: "Invalid category ID or category does not belong to user"
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
console.error("[Create Transaction API] Database error:", error)
```

#### Scenario 2: Insert Failure
```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Create Transaction API] Insert failed:", error)
```

### Error Handling Best Practices
1. **Distinguish Error Types**: 400 vs 422 vs 500
2. **Specific Error Messages**: Help client understand what's wrong
3. **Security**: Don't leak sensitive info about other users
4. **Logging**: Log all errors with context
5. **Consistent Format**: Same error structure across endpoints

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Two-Step Process (Insert + Fetch)
- **Issue**: Insert transaction, then fetch with JOIN
- **Impact**: Two database round-trips
- **Mitigation**: 
  - Use RETURNING clause to get basic data immediately
  - Consider using database function for atomic operation
  - Performance impact minimal for single insert

#### 2. Category Foreign Key Validation
- **Issue**: Database must verify category exists and belongs to user
- **Impact**: Additional lookup during insert
- **Mitigation**:
  - Index on categories.id (already exists as PK)
  - RLS policies optimized
  - Acceptable overhead for data integrity

#### 3. RLS Policy Evaluation
- **Issue**: RLS policies evaluated on both insert and category lookup
- **Impact**: Slight overhead per request
- **Mitigation**:
  - RLS uses indexes efficiently
  - Policies are simple equality checks
  - Negligible performance impact

### Optimization Strategies

#### 1. Database-Level Optimizations
```sql
-- Ensure indexes exist (should be in migrations):
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_categories_user ON categories(user_id);
```

#### 2. Use RETURNING Clause
```typescript
// In service layer
const { data, error } = await supabase
  .from("transactions")
  .insert({
    user_id: userId,
    category_id: command.categoryId,
    amount: command.amount,
    date: command.date,
    type: command.type,
    note: command.note
  })
  .select(`
    id,
    date,
    amount,
    type,
    note,
    created_at,
    category:categories (id, name)
  `)
  .single();

// Returns created transaction with category in one query
```

#### 3. Validation Efficiency
- **Early Returns**: Validate authentication first
- **Fast Failures**: Schema validation happens before DB call
- **Minimal Data Transfer**: Only send necessary fields to DB

#### 4. Connection Pooling
- Supabase handles connection pooling automatically
- Reuse same client instance from `context.locals.supabase`

### Expected Performance

#### Best Case (Valid Request)
- **Total Response Time**: < 100ms
- **Validation Time**: < 5ms
- **Database Insert + Fetch**: < 50ms
- **JSON Serialization**: < 5ms
- **Network Transfer**: < 10ms

#### Typical Case
- **Total Response Time**: < 200ms
- **All Operations**: Similar to best case
- **Variability**: Network latency, DB load

#### Worst Case (Validation Errors)
- **Total Response Time**: < 50ms
- **Fails Fast**: No database interaction
- **Validation Only**: Quick Zod schema check

### Monitoring Recommendations
- **Log Insert Times**: Track slow inserts (> 100ms)
- **Track Error Rates**: Monitor 400, 422, 500 errors
- **Validation Failures**: Track common validation errors
- **Category Usage**: Monitor which categories used most

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File**: `src/pages/api/transactions.ts` (or separate validation file)

```typescript
import { z } from "zod";

const CreateTransactionSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be positive")
    .refine((val) => {
      // Validate max 2 decimal places
      const decimals = val.toString().split(".")[1];
      return !decimals || decimals.length <= 2;
    }, "Amount can have at most 2 decimal places"),
  
  date: z
    .string({ required_error: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  
  categoryId: z
    .string({ required_error: "Category ID is required" })
    .uuid("Category ID must be a valid UUID"),
  
  type: z.enum(["income", "expense"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be either 'income' or 'expense'",
  }),
  
  note: z
    .string()
    .max(500, "Note must be at most 500 characters")
    .optional()
    .nullable(),
});

type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
```

### Step 2: Add Service Method
**File**: `src/lib/services/transactions.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateTransactionCommand, CreateTransactionResponseDto } from "@/types";

export class TransactionsService {
  // ... existing listTransactions method ...

  /**
   * Create a new transaction
   * @param supabase - Authenticated Supabase client
   * @param command - Transaction creation data
   * @returns Newly created transaction with category details
   * @throws Error if category doesn't exist or doesn't belong to user
   */
  static async createTransaction(
    supabase: SupabaseClient,
    command: CreateTransactionCommand
  ): Promise<CreateTransactionResponseDto> {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Insert transaction with category join in response
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        category_id: command.categoryId,
        amount: command.amount,
        date: command.date,
        type: command.type,
        note: command.note || null,
      })
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
      .single();

    if (error) {
      // Check if it's a foreign key violation (category doesn't exist or belong to user)
      if (error.code === "23503") {
        throw new Error("INVALID_CATEGORY");
      }
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    if (!data) {
      throw new Error("Transaction created but could not be retrieved");
    }

    // Transform to DTO
    return {
      id: data.id,
      date: data.date,
      amount: data.amount,
      type: data.type,
      note: data.note,
      category: data.category
        ? {
            id: data.category.id,
            name: data.category.name,
          }
        : null,
      createdAt: data.created_at,
    };
  }
}
```

### Step 3: Add POST Handler to API Route
**File**: `src/pages/api/transactions.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { TransactionsService } from "@/lib/services/transactions.service";

// ... existing GET handler and schemas ...

const CreateTransactionSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be positive")
    .refine((val) => {
      const decimals = val.toString().split(".")[1];
      return !decimals || decimals.length <= 2;
    }, "Amount can have at most 2 decimal places"),
  date: z
    .string({ required_error: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  categoryId: z
    .string({ required_error: "Category ID is required" })
    .uuid("Category ID must be a valid UUID"),
  type: z.enum(["income", "expense"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be either 'income' or 'expense'",
  }),
  note: z
    .string()
    .max(500, "Note must be at most 500 characters")
    .optional()
    .nullable(),
});

export const POST: APIRoute = async ({ request, locals }) => {
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

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Validate request body
    const validationResult = CreateTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            amount: errors.amount?._errors[0],
            date: errors.date?._errors[0],
            categoryId: errors.categoryId?._errors[0],
            type: errors.type?._errors[0],
            note: errors.note?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validData = validationResult.data;

    // 4. Call service layer
    const transaction = await TransactionsService.createTransaction(
      locals.supabase,
      {
        amount: validData.amount,
        date: validData.date,
        categoryId: validData.categoryId,
        type: validData.type,
        note: validData.note,
      }
    );

    // 5. Return success response
    return new Response(JSON.stringify(transaction), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle specific errors
    if (error instanceof Error && error.message === "INVALID_CATEGORY") {
      return new Response(
        JSON.stringify({
          error: "Unprocessable Entity",
          message: "Invalid category ID or category does not belong to user",
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 7. Handle unexpected errors
    console.error("[Create Transaction API] Unexpected error:", error);

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

### Step 4: Test Authentication
- **Valid Token**: Test with authenticated user → expect 201
- **Missing Token**: Test without Authorization header → expect 401
- **Invalid Token**: Test with malformed token → expect 401
- **Expired Token**: Test with expired token → expect 401

### Step 5: Test Validation

#### Amount Validation
- Missing amount → 400
- amount = 0 → 400 "must be positive"
- amount = -50 → 400 "must be positive"
- amount = 99.999 → 400 "at most 2 decimal places"
- amount = 99.99 → ✓
- amount = 100 → ✓

#### Date Validation
- Missing date → 400
- date = "13/10/2025" → 400 "must be in YYYY-MM-DD format"
- date = "2025-13-01" → 400 "Invalid date"
- date = "2025-02-30" → 400 "Invalid date"
- date = "2025-10-13" → ✓

#### CategoryId Validation
- Missing categoryId → 400
- categoryId = "invalid" → 400 "must be a valid UUID"
- categoryId = "123" → 400 "must be a valid UUID"
- categoryId = valid UUID → ✓

#### Type Validation
- Missing type → 400
- type = "payment" → 400 "must be either 'income' or 'expense'"
- type = "INCOME" → 400 (case sensitive)
- type = "income" → ✓
- type = "expense" → ✓

#### Note Validation
- note = 501 chars → 400 "at most 500 characters"
- note = 500 chars → ✓
- note = null → ✓
- note missing → ✓ (optional)

### Step 6: Test Business Logic

#### Category Ownership
- Create transaction with user's own category → ✓ 201
- Create transaction with non-existent categoryId → 422
- Create transaction with another user's category → 422

#### User Ownership
- Transaction is created with authenticated user's ID
- Verify user_id is not in response
- Verify only user can see their transaction

### Step 7: Test Response Format

#### Success Response
- Status code is 201
- Response contains all required fields
- `id` is a valid UUID
- `createdAt` is ISO 8601 timestamp
- `category` object has id and name
- `amount` preserved as sent
- `date` preserved as sent
- `type` preserved as sent
- `note` preserved as sent (or null)

#### Error Responses
- 400 has error, message, details
- 401 has error, message
- 422 has error, message
- 500 has error, message
- No sensitive data leaked

### Step 8: Test Database State

#### After Successful Creation
- Transaction exists in database
- `user_id` matches authenticated user
- `category_id` matches provided categoryId
- All fields stored correctly
- `created_at` is set automatically
- `id` is generated automatically

#### After Failed Creation
- No transaction created on validation failure
- No transaction created on 422 error
- Database state unchanged

### Step 9: Integration Testing

#### Complete Flow
- Send valid POST request
- Verify 201 response
- Verify transaction in database
- Query GET /transactions to verify it appears in list
- Verify it appears in GET /dashboard summary

#### Multiple Transactions
- Create multiple transactions
- Verify all are created independently
- Verify no interference between requests

### Step 10: Edge Cases

#### Boundary Values
- amount = 0.01 (minimum)
- amount = 99999999.99 (large value)
- note = empty string ""
- note = exactly 500 characters
- date = today
- date = far past (1900-01-01)
- date = far future (2099-12-31)

#### Special Characters
- note with unicode: "Coffee ☕"
- note with quotes: 'Buy "headphones"'
- note with newlines (should be allowed)

### Step 11: Performance Testing

#### Single Insert
- Measure time for single transaction creation
- Should be < 200ms

#### Concurrent Inserts
- Create multiple transactions simultaneously
- Verify all succeed
- Verify no race conditions
- Verify UUIDs are unique

#### Large Amounts
- Test with very large amounts (within NUMERIC(10,2) range)
- Verify precision maintained

### Step 12: Error Recovery

#### Database Errors
- Simulate database connection failure
- Verify 500 error returned
- Verify error logged
- Verify no partial data created

#### Network Errors
- Test with interrupted request
- Verify proper error handling

### Step 13: Security Testing

#### SQL Injection Attempts
- note = "'; DROP TABLE transactions; --"
- Verify parameterized query prevents injection

#### Category Hijacking
- Try to create transaction with another user's category
- Verify 422 error
- Verify transaction not created

#### User ID Manipulation
- Try to send user_id in request body
- Verify it's ignored (not in schema)
- Verify authenticated user's ID is used

### Step 14: Code Quality

#### Type Safety
- All types properly defined
- No `any` types
- DTOs match specification
- Service returns correct type

#### Error Handling
- All error paths covered
- Consistent error format
- Helpful error messages
- Proper logging

#### Code Organization
- Validation schema separate
- Service layer handles business logic
- Route handler handles HTTP concerns
- Clear separation of concerns

### Step 15: Documentation

#### Code Comments
- JSDoc for service method
- Explain validation rules
- Document error codes
- Add usage examples

#### API Documentation
- Update API docs with examples
- Document all error scenarios
- Include curl examples
- Specify all constraints

---

## 10. Testing Checklist

### Unit Tests (Service Layer)
- [ ] Creates transaction successfully with valid data
- [ ] Sets user_id from authenticated user
- [ ] Maps categoryId to category_id correctly
- [ ] Returns complete transaction with category
- [ ] Throws INVALID_CATEGORY error for non-existent category
- [ ] Throws INVALID_CATEGORY error for other user's category
- [ ] Handles null note correctly
- [ ] Preserves decimal precision (2 places)
- [ ] Throws error on database failure

### Integration Tests (API Route)
- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for invalid JSON body
- [ ] Returns 400 for missing required fields
- [ ] Returns 400 for invalid amount (negative, zero, too many decimals)
- [ ] Returns 400 for invalid date format
- [ ] Returns 400 for invalid UUID
- [ ] Returns 400 for invalid type
- [ ] Returns 400 for note > 500 chars
- [ ] Returns 422 for non-existent category
- [ ] Returns 422 for other user's category
- [ ] Returns 201 with correct data for valid request
- [ ] Response matches CreateTransactionResponseDto structure

### Database Tests
- [ ] Transaction inserted with correct user_id
- [ ] Transaction inserted with correct category_id
- [ ] All fields stored correctly
- [ ] created_at timestamp generated
- [ ] id UUID generated
- [ ] FK constraint prevents invalid category_id
- [ ] CHECK constraint prevents amount <= 0
- [ ] ENUM constraint enforces valid type

### End-to-End Tests
- [ ] Full request from client creates transaction
- [ ] Created transaction appears in GET /transactions
- [ ] Created transaction affects GET /dashboard summary
- [ ] Multiple users can create independent transactions
- [ ] Response time acceptable (< 200ms)

---

## 11. Future Enhancements

### Validation Improvements
1. **Date Range Validation**: Prevent future dates if desired
2. **Amount Limits**: Set reasonable max amounts per transaction
3. **Duplicate Detection**: Warn if similar transaction created recently
4. **Category Suggestions**: Suggest category based on note content

### Feature Additions
1. **Bulk Create**: Create multiple transactions at once
2. **Recurring Transactions**: Template for repeated transactions
3. **Attachments**: Support receipt/invoice attachments
4. **Tags**: Additional categorization beyond single category
5. **Geolocation**: Optional location data for transaction

### Business Logic
1. **Budget Warnings**: Check if transaction exceeds budget
2. **Category Auto-Assignment**: ML-based category suggestions
3. **Duplicate Prevention**: Detect and prevent duplicate transactions
4. **Audit Trail**: Track who created transaction and when

### API Improvements
1. **Batch Operations**: Create multiple transactions in one request
2. **Idempotency**: Support idempotency keys to prevent duplicates
3. **Webhooks**: Trigger webhooks on transaction creation
4. **Rate Limiting**: Prevent abuse of creation endpoint

---

## Appendix A: Example Requests and Responses

### Successful Creation
**Request:**
```bash
POST /api/transactions
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "amount": 150.75,
  "date": "2025-10-13",
  "categoryId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "type": "expense",
  "note": "Weekly groceries"
}
```

**Response (201 Created):**
```json
{
  "id": "d4e9b2e5-c9f1-5c2b-ab2b-a0g8b8e8f8f8",
  "date": "2025-10-13",
  "amount": 150.75,
  "type": "expense",
  "note": "Weekly groceries",
  "category": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Food"
  },
  "createdAt": "2025-10-13T14:30:00.000Z"
}
```

### Missing Required Field
**Request:**
```bash
POST /api/transactions

{
  "amount": 100,
  "type": "expense"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "date": "Date is required",
    "categoryId": "Category ID is required"
  }
}
```

### Invalid Amount
**Request:**
```bash
POST /api/transactions

{
  "amount": -50,
  "date": "2025-10-13",
  "categoryId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "type": "expense"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "amount": "Amount must be positive"
  }
}
```

### Invalid Category
**Request:**
```bash
POST /api/transactions

{
  "amount": 100,
  "date": "2025-10-13",
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "type": "expense"
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "error": "Unprocessable Entity",
  "message": "Invalid category ID or category does not belong to user"
}
```

---

This implementation plan provides comprehensive guidance for implementing the POST /transactions endpoint. Follow the steps sequentially, test thoroughly at each stage, and ensure all security and validation considerations are properly addressed.

