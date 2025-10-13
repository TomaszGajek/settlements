# API Endpoint Implementation Plan: PATCH /transactions/{id}

## Analysis

### Key Points from API Specification
- **Endpoint**: `PATCH /api/transactions/{id}`
- **Purpose**: Update an existing transaction (partial update)
- **Authentication**: Required (JWT-based via Supabase)
- **Request includes**:
  - Path parameter: transaction id (UUID)
  - Body: any combination of updatable fields (all optional)
- **Fields that can be updated**: amount, date, categoryId, type, note
- **Response**: Updated transaction with full details including category info
- **Success**: 200 OK
- **Errors**: 
  - 400 Bad Request (validation errors)
  - 401 Unauthorized (not authenticated)
  - 403 Forbidden (trying to update another user's transaction)
  - 404 Not Found (transaction doesn't exist)
  - 422 Unprocessable Entity (invalid categoryId)

### Required and Optional Parameters
**Path Parameters:**
- `id` (UUID, required): ID of the transaction to update

**Request Body Fields (all optional):**
- `amount` (number): New amount, must be positive, max 2 decimal places
- `date` (string): New date in ISO format (YYYY-MM-DD)
- `categoryId` (UUID): New category ID
- `type` (string): New type ("income" or "expense")
- `note` (string): New note, max 500 characters

### Necessary DTOs and Command Models
- `UpdateTransactionCommand` (already defined in `src/types.ts`):
  - Partial version of CreateTransactionCommand (all fields optional)
- `UpdateTransactionResponseDto` (already defined in `src/types.ts`):
  - Alias for `TransactionDto`
  - Contains: id, date, amount, type, note, category (nested), createdAt

### Service Layer Extraction
Service method to be added to: `src/lib/services/transactions.service.ts`

This service will:
- Accept `SupabaseClient`, transaction `id`, and `UpdateTransactionCommand`
- Validate that transaction exists and belongs to user (via RLS)
- If categoryId provided, validate it belongs to user
- Update only provided fields
- Fetch updated transaction with category details
- Return data in `UpdateTransactionResponseDto` format

### Input Validation Strategy
Using Zod schemas:
1. **Path Parameter Schema**: Validate id is valid UUID
2. **Request Body Schema**: Validate optional fields
   - amount: if provided, must be positive with max 2 decimals
   - date: if provided, must be valid ISO date
   - categoryId: if provided, must be valid UUID
   - type: if provided, must be "income" or "expense"
   - note: if provided, max 500 chars
3. **At Least One Field**: Ensure at least one field is provided for update
4. **Business Validation**: Verify transaction and category ownership via RLS

### Security Considerations
- **Authentication**: User must be authenticated
- **Authorization**: 
  - User can only update their own transactions (RLS enforces)
  - User can only assign their own categories (RLS enforces)
  - Return 403 if trying to update another user's transaction
  - Return 404 if transaction doesn't exist
- **Data Validation**: Strict validation prevents invalid updates
- **SQL Injection**: Prevented by Supabase parameterized queries

### Error Scenarios and Status Codes
1. **400 Bad Request**:
   - Invalid UUID format for id
   - Invalid field values (negative amount, invalid date, etc.)
   - No fields provided for update

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token

3. **403 Forbidden**:
   - Transaction exists but belongs to different user

4. **404 Not Found**:
   - Transaction with given id doesn't exist

5. **422 Unprocessable Entity**:
   - categoryId doesn't exist
   - categoryId belongs to different user

6. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during update

---

## 1. Endpoint Overview

The PATCH /transactions/{id} endpoint allows authenticated users to update their existing transactions. This is a partial update endpoint, meaning clients can send only the fields they want to update. The endpoint validates ownership, ensures data integrity, and returns the complete updated transaction object including category details.

**Key Features:**
- Partial update (PATCH semantics)
- Updates record in `transactions` table
- Validates ownership through RLS
- Validates all provided fields
- Ensures category ownership if categoryId is changed
- Returns complete updated transaction
- Maintains audit trail (created_at preserved)

---

## 2. Request Details

### HTTP Method
`PATCH`

### URL Structure
```
/api/transactions/{id}
```

### Path Parameters
- **id** (string, required)
  - Description: UUID of the transaction to update
  - Format: Valid UUID
  - Example: `c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d`

### Request Headers
- **Content-Type**: `application/json` (required)
- **Authorization**: `Bearer <JWT_TOKEN>` (required)

### Request Body

All fields are optional, but at least one field must be provided.

#### Structure
```json
{
  "amount": 205.00,
  "note": "New gaming headphones"
}
```

#### Field Descriptions
- **amount** (number, optional)
  - Description: New transaction amount
  - Constraints: Must be > 0, max 2 decimal places
  - Example: `205.00`

- **date** (string, optional)
  - Description: New transaction date
  - Format: ISO date (YYYY-MM-DD)
  - Example: `"2025-10-15"`

- **categoryId** (string, optional)
  - Description: New category UUID
  - Format: Valid UUID
  - Example: `"b2c3d4e5-f6a7-8901-2345-67890abcdef1"`

- **type** (string, optional)
  - Description: New transaction type
  - Allowed values: `"income"` or `"expense"`
  - Example: `"expense"`

- **note** (string, optional)
  - Description: New transaction note (can be null to clear)
  - Constraints: Max 500 characters
  - Example: `"New gaming headphones"`

### Example Requests

#### Update Amount and Note
```bash
curl -X PATCH "https://api.example.com/api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "amount": 205.00,
    "note": "New gaming headphones"
  }'
```

#### Change Category Only
```bash
curl -X PATCH "https://api.example.com/api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "categoryId": "b2c3d4e5-f6a7-8901-2345-67890abcdef1"
  }'
```

#### Clear Note (Set to Null)
```bash
curl -X PATCH "https://api.example.com/api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "note": null
  }'
```

#### Change Type from Expense to Income
```bash
curl -X PATCH "https://api.example.com/api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "type": "income"
  }'
```

---

## 3. Utilized Types

### Command Model
**UpdateTransactionCommand** (defined in `src/types.ts`):
```typescript
export type UpdateTransactionCommand = Partial<CreateTransactionCommand>;

// Expands to:
{
  amount?: number;
  date?: string;
  categoryId?: string;
  type?: "income" | "expense";
  note?: string | null;
}
```

### Response DTO
**UpdateTransactionResponseDto** (defined in `src/types.ts`):
```typescript
export type UpdateTransactionResponseDto = TransactionDto;

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

### Validation Schemas
**Path Parameter Validation:**
```typescript
const TransactionIdSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
});
```

**Request Body Validation:**
```typescript
const UpdateTransactionSchema = z
  .object({
    amount: z
      .number()
      .positive("Amount must be positive")
      .refine((val) => {
        const decimals = val.toString().split(".")[1];
        return !decimals || decimals.length <= 2;
      }, "Amount can have at most 2 decimal places")
      .optional(),
    
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => !isNaN(Date.parse(date)), "Invalid date")
      .optional(),
    
    categoryId: z
      .string()
      .uuid("Category ID must be a valid UUID")
      .optional(),
    
    type: z
      .enum(["income", "expense"], {
        invalid_type_error: "Type must be either 'income' or 'expense'",
      })
      .optional(),
    
    note: z
      .string()
      .max(500, "Note must be at most 500 characters")
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

### Database Types
**TablesUpdate<"transactions">** (from `src/db/database.types.ts`):
```typescript
{
  amount?: number;
  category_id?: string | null;
  created_at?: string;
  date?: string;
  id?: string;
  note?: string | null;
  type?: "income" | "expense";
  user_id?: string;
}
```

---

## 4. Response Details

### Success Response (200 OK)

#### Structure
```json
{
  "id": "c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d",
  "date": "2025-10-12",
  "amount": 205.00,
  "type": "expense",
  "note": "New gaming headphones",
  "category": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Entertainment"
  },
  "createdAt": "2025-10-12T10:00:00Z"
}
```

#### Field Descriptions
- **id**: Transaction UUID (unchanged)
- **date**: Updated or original date
- **amount**: Updated or original amount
- **type**: Updated or original type
- **note**: Updated or original note
- **category**: Updated or original category with id and name
- **createdAt**: Original creation timestamp (unchanged)

### Error Responses

#### 400 Bad Request (Validation Errors)
**Scenarios:**
- Invalid UUID format for path parameter
- Invalid field values
- No fields provided for update

**Example Response:**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid transaction ID format",
    "amount": "Amount must be positive"
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

#### 403 Forbidden
**Scenarios:**
- Transaction exists but belongs to different user
- RLS prevents update

**Example Response:**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to update this transaction"
}
```

#### 404 Not Found
**Scenarios:**
- Transaction with given id doesn't exist

**Example Response:**
```json
{
  "error": "Not Found",
  "message": "Transaction not found"
}
```

#### 422 Unprocessable Entity
**Scenarios:**
- categoryId doesn't exist
- categoryId belongs to different user

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
- Unexpected errors during update

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
1. **Request Reception**: Astro API endpoint receives PATCH request
2. **Authentication Check**: Verify user is authenticated via Supabase
3. **Path Validation**: Validate transaction ID from URL
4. **Body Parsing**: Parse JSON request body
5. **Input Validation**: Validate request body using Zod schema
6. **Service Invocation**: Call `TransactionsService.updateTransaction()`
7. **Existence Check**: Verify transaction exists and belongs to user
8. **Category Verification**: If categoryId provided, verify it belongs to user
9. **Database Update**: Update transaction with provided fields
10. **Fetch Updated Data**: Query updated transaction with category details
11. **Response Formation**: Format data into `UpdateTransactionResponseDto`
12. **Response Delivery**: Return JSON response with 200 status

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/transactions/[id].ts`)
```
1. Check HTTP method is PATCH
2. Extract id from path params
3. Validate id is valid UUID
4. Get authenticated user from context.locals.supabase
5. If user not authenticated → return 401 error
6. Parse request body as JSON
7. Validate request body using Zod schema
8. If no fields provided → return 400 error
9. If validation fails → return 400 error with details
10. If validation passes → proceed to service layer
```

#### Step 2: Service Layer (`src/lib/services/transactions.service.ts`)
```
1. Receive supabase client, transaction id, and UpdateTransactionCommand
2. Prepare update data:
   - Map categoryId → category_id (if provided)
   - Only include provided fields
3. Execute UPDATE query:
   - UPDATE transactions SET ... WHERE id = ? AND user_id = ?
   - RLS automatically filters by user_id
4. Check affected row count:
   - 0 rows → transaction doesn't exist or doesn't belong to user
   - Check if transaction exists at all → 404 vs 403
5. If categoryId provided and FK fails → throw 422 error
6. Fetch updated transaction with category JOIN
7. Transform to DTO (category_id → category object)
8. Return UpdateTransactionResponseDto
```

#### Step 3: Database Interaction (Supabase)

**Update Query:**
```sql
UPDATE transactions
SET 
  amount = 205.00,
  note = 'New gaming headphones'
WHERE 
  id = 'c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d'
  AND user_id = '<authenticated_user_id>'; -- Applied by RLS
```

**RLS Check (automatic):**
```sql
-- RLS UPDATE policy on transactions:
-- auth.uid() = user_id

-- If categoryId is being updated, FK constraint verifies:
-- category_id exists in categories table
-- AND that category belongs to same user (via RLS on categories)
```

**Fetch Updated Transaction:**
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
WHERE t.id = 'c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d'
  AND t.user_id = '<authenticated_user_id>'; -- RLS
```

#### Step 4: Determining 404 vs 403
```typescript
// After update returns 0 rows affected
// Check if transaction exists at all (without user filter)
const { data: exists } = await supabase
  .from("transactions")
  .select("id, user_id")
  .eq("id", transactionId)
  .single();

if (!exists) {
  // Transaction doesn't exist → 404
  throw new Error("NOT_FOUND");
} else if (exists.user_id !== userId) {
  // Transaction exists but belongs to other user → 403
  throw new Error("FORBIDDEN");
}
```

---

## 6. Security Considerations

### Authentication
- **Method**: JWT-based authentication via Supabase
- **Implementation**: 
  - Extract user from `context.locals.supabase.auth.getUser()`
  - Reject request with 401 if user is null or token is invalid
  - Use authenticated user's ID for ownership verification

### Authorization
- **Transaction Ownership**: 
  - RLS UPDATE policy verifies `auth.uid() = user_id`
  - User cannot update other users' transactions
  - Distinguish between 404 (doesn't exist) and 403 (exists but not yours)
- **Category Ownership**:
  - If categoryId is updated, FK + RLS verify category belongs to user
  - Cannot assign another user's category
  - If violation, return 422 error

### Input Validation
- **Path Parameter**: UUID format validation
- **Request Body Sanitization**:
  - Strict Zod schema validation
  - Optional field validation
  - At least one field required
  - Same constraints as create endpoint
- **Partial Update Safety**:
  - Only update provided fields
  - Cannot accidentally clear fields not intended

### Data Integrity
- **Database Constraints**: Same as create
  - Amount CHECK constraint
  - Type ENUM constraint
  - Foreign key on category_id
- **Immutable Fields**:
  - `id` cannot be changed
  - `user_id` cannot be changed
  - `created_at` cannot be changed

### Preventing Common Attacks
- **SQL Injection**: Supabase uses parameterized queries
- **Mass Assignment**: Only accept defined fields from UpdateTransactionCommand
- **Privilege Escalation**: RLS prevents updating other users' transactions
- **ID Enumeration**: 404 response doesn't leak existence to unauthorized users

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Invalid Transaction ID
```typescript
// URL: PATCH /api/transactions/invalid-id

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    id: "Invalid transaction ID format"
  }
}
```

#### Scenario 2: No Fields Provided
```typescript
// Request body: {}

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    _errors: ["At least one field must be provided for update"]
  }
}
```

#### Scenario 3: Invalid Amount
```typescript
// Request body: { "amount": -50 }

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    amount: "Amount must be positive"
  }
}
```

#### Scenario 4: Invalid Date
```typescript
// Request body: { "date": "2025-13-45" }

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    date: "Invalid date"
  }
}
```

#### Scenario 5: Invalid Category UUID
```typescript
// Request body: { "categoryId": "not-a-uuid" }

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
// Request body: { "type": "transfer" }

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
// Request body: { "note": "<501 characters>" }

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

### Authorization Errors (403 Forbidden)

#### Scenario 1: Transaction Belongs to Another User
```typescript
// Transaction exists but user_id doesn't match

Response: {
  statusCode: 403,
  error: "Forbidden",
  message: "You do not have permission to update this transaction"
}
```

### Not Found Errors (404 Not Found)

#### Scenario 1: Transaction Doesn't Exist
```typescript
// No transaction with given ID in database

Response: {
  statusCode: 404,
  error: "Not Found",
  message: "Transaction not found"
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
console.error("[Update Transaction API] Database error:", error)
```

#### Scenario 2: Update Failure
```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Update Transaction API] Update failed:", error)
```

### Error Handling Best Practices
1. **Distinguish 404 vs 403**: Prevent information leakage
2. **Specific Error Messages**: Help client understand what's wrong
3. **Security**: Don't leak sensitive info about other users
4. **Logging**: Log all errors with context
5. **Consistent Format**: Same error structure across endpoints

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Two Database Queries
- **Issue**: Update query + fetch updated transaction
- **Impact**: Two database round-trips
- **Mitigation**: 
  - Use RETURNING clause to get updated data
  - Minimal performance impact for single update

#### 2. Existence vs Ownership Check
- **Issue**: Additional query to distinguish 404 vs 403
- **Impact**: Extra database round-trip on failure
- **Mitigation**:
  - Only happens when update affects 0 rows
  - Failure case, not performance critical
  - Can be optimized with single query if needed

#### 3. Category Foreign Key Validation
- **Issue**: Database verifies category during update
- **Impact**: Additional lookup if category is being changed
- **Mitigation**:
  - Only when categoryId is being updated
  - Index on categories.id (PK)
  - Acceptable overhead for data integrity

### Optimization Strategies

#### 1. Use RETURNING Clause
```typescript
// In service layer
const { data, error } = await supabase
  .from("transactions")
  .update({
    amount: command.amount,
    note: command.note,
    // ... other fields
  })
  .eq("id", transactionId)
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

// Returns updated transaction with category in one query
```

#### 2. Efficient 404 vs 403 Check
```typescript
// Option 1: Separate query (current approach)
// Simple but requires extra query on failure

// Option 2: Check RLS policy result
// If update affects 0 rows, query without RLS filter
// More efficient but slightly more complex
```

#### 3. Partial Update Optimization
- Only send changed fields to database
- Reduces data transfer
- Database only updates modified columns

#### 4. Index Usage
```sql
-- Ensure indexes exist:
CREATE INDEX idx_transactions_id_user ON transactions(id, user_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
```

### Expected Performance

#### Best Case (Valid Update, No Category Change)
- **Total Response Time**: < 150ms
- **Validation Time**: < 5ms
- **Database Update + Fetch**: < 100ms
- **JSON Serialization**: < 5ms

#### Typical Case
- **Total Response Time**: < 200ms
- **Similar to best case**

#### Worst Case (Validation Error)
- **Total Response Time**: < 50ms
- **Fails Fast**: No database interaction
- **Validation Only**: Quick Zod schema check

#### Failure Case (404/403)
- **Total Response Time**: < 150ms
- **Update Attempt**: < 50ms (affects 0 rows)
- **Existence Check**: < 50ms
- **Error Response**: < 5ms

### Monitoring Recommendations
- **Log Update Times**: Track slow updates (> 200ms)
- **Track Error Rates**: Monitor 400, 403, 404, 422, 500 errors
- **Field Update Patterns**: Track which fields updated most
- **Partial Update Size**: Monitor request body sizes

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schemas
**File**: `src/pages/api/transactions/[id].ts`

```typescript
import { z } from "zod";

const TransactionIdSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
});

const UpdateTransactionSchema = z
  .object({
    amount: z
      .number()
      .positive("Amount must be positive")
      .refine((val) => {
        const decimals = val.toString().split(".")[1];
        return !decimals || decimals.length <= 2;
      }, "Amount can have at most 2 decimal places")
      .optional(),
    
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => !isNaN(Date.parse(date)), "Invalid date")
      .optional(),
    
    categoryId: z
      .string()
      .uuid("Category ID must be a valid UUID")
      .optional(),
    
    type: z
      .enum(["income", "expense"], {
        invalid_type_error: "Type must be either 'income' or 'expense'",
      })
      .optional(),
    
    note: z
      .string()
      .max(500, "Note must be at most 500 characters")
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
```

### Step 2: Add Service Method
**File**: `src/lib/services/transactions.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { UpdateTransactionCommand, UpdateTransactionResponseDto } from "@/types";

export class TransactionsService {
  // ... existing methods ...

  /**
   * Update an existing transaction
   * @param supabase - Authenticated Supabase client
   * @param transactionId - ID of transaction to update
   * @param command - Fields to update
   * @returns Updated transaction with category details
   * @throws Error if transaction not found, forbidden, or invalid category
   */
  static async updateTransaction(
    supabase: SupabaseClient,
    transactionId: string,
    command: UpdateTransactionCommand
  ): Promise<UpdateTransactionResponseDto> {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Prepare update data (map categoryId to category_id)
    const updateData: any = {};
    if (command.amount !== undefined) updateData.amount = command.amount;
    if (command.date !== undefined) updateData.date = command.date;
    if (command.type !== undefined) updateData.type = command.type;
    if (command.note !== undefined) updateData.note = command.note;
    if (command.categoryId !== undefined) {
      updateData.category_id = command.categoryId;
    }

    // Update transaction with category join in response
    const { data, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId)
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
      // Check if it's a foreign key violation (invalid category)
      if (error.code === "23503") {
        throw new Error("INVALID_CATEGORY");
      }
      
      // Check if no rows were affected (404 or 403)
      if (error.code === "PGRST116") {
        // Query to check if transaction exists
        const { data: existingTransaction } = await supabase
          .from("transactions")
          .select("id, user_id")
          .eq("id", transactionId)
          .single();

        if (!existingTransaction) {
          throw new Error("NOT_FOUND");
        } else if (existingTransaction.user_id !== user.id) {
          throw new Error("FORBIDDEN");
        }
      }

      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    if (!data) {
      throw new Error("Transaction updated but could not be retrieved");
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

### Step 3: Create Dynamic API Route Handler
**File**: `src/pages/api/transactions/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { TransactionsService } from "@/lib/services/transactions.service";

const TransactionIdSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
});

const UpdateTransactionSchema = z
  .object({
    amount: z
      .number()
      .positive("Amount must be positive")
      .refine((val) => {
        const decimals = val.toString().split(".")[1];
        return !decimals || decimals.length <= 2;
      }, "Amount can have at most 2 decimal places")
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => !isNaN(Date.parse(date)), "Invalid date")
      .optional(),
    categoryId: z.string().uuid("Category ID must be a valid UUID").optional(),
    type: z
      .enum(["income", "expense"], {
        invalid_type_error: "Type must be either 'income' or 'expense'",
      })
      .optional(),
    note: z
      .string()
      .max(500, "Note must be at most 500 characters")
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = TransactionIdSchema.safeParse({ id: params.id });

    if (!idValidation.success) {
      const errors = idValidation.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            id: errors.id?._errors[0],
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id: transactionId } = idValidation.data;

    // 2. Check authentication
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

    // 3. Parse request body
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

    // 4. Validate request body
    const validationResult = UpdateTransactionSchema.safeParse(body);

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
            _errors: errors._errors,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validData = validationResult.data;

    // 5. Call service layer
    const transaction = await TransactionsService.updateTransaction(
      locals.supabase,
      transactionId,
      {
        amount: validData.amount,
        date: validData.date,
        categoryId: validData.categoryId,
        type: validData.type,
        note: validData.note,
      }
    );

    // 6. Return success response
    return new Response(JSON.stringify(transaction), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 7. Handle specific errors
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Transaction not found",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "FORBIDDEN") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You do not have permission to update this transaction",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "INVALID_CATEGORY") {
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
    }

    // 8. Handle unexpected errors
    console.error("[Update Transaction API] Unexpected error:", error);

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

### Step 4: Create Dynamic Route File
**File structure**: Ensure the file is at `src/pages/api/transactions/[id].ts` for Astro dynamic routing.

### Step 5: Test Path Parameter Validation
- Invalid UUID → 400
- Missing id → 404 (Astro routing)
- Valid UUID → proceeds to body validation

### Step 6: Test Request Body Validation
- Empty body `{}` → 400 "at least one field"
- Invalid amount values → 400
- Invalid date format → 400
- Invalid categoryId format → 400
- Invalid type value → 400
- Note too long → 400
- Valid partial update → ✓

### Step 7: Test Authentication
- No token → 401
- Invalid token → 401
- Expired token → 401
- Valid token → ✓

### Step 8: Test Authorization (403)
- User A tries to update User B's transaction → 403
- User A updates own transaction → ✓ 200

### Step 9: Test Not Found (404)
- Update non-existent transaction → 404
- Update deleted transaction → 404

### Step 10: Test Category Validation (422)
- Update with non-existent categoryId → 422
- Update with another user's categoryId → 422
- Update with own categoryId → ✓ 200

### Step 11: Test Partial Updates
- Update only amount → verify only amount changed
- Update only note → verify only note changed
- Update multiple fields → verify all changed
- Clear note (set to null) → verify note is null
- Change type income↔expense → verify type changed

### Step 12: Test Response Format
- Status code is 200
- Response contains all fields
- Updated fields reflect new values
- Unchanged fields retain original values
- `createdAt` is unchanged
- Category object updated if categoryId changed

### Step 13: Test Database State
- Transaction updated correctly
- Only specified fields modified
- created_at unchanged
- user_id unchanged
- id unchanged

### Step 14: Test Edge Cases
- Update with same values (idempotent)
- Update amount with 2 decimals
- Update to different category
- Update date to today
- Update date to past/future

### Step 15: Integration Testing
- Update transaction, then GET to verify
- Update transaction, check in dashboard
- Multiple updates to same transaction
- Concurrent updates from same user

---

## 10. Testing Checklist

### Unit Tests (Service Layer)
- [ ] Updates transaction successfully with valid data
- [ ] Updates only provided fields
- [ ] Preserves unchanged fields
- [ ] Maps categoryId to category_id correctly
- [ ] Returns updated transaction with category
- [ ] Throws NOT_FOUND for non-existent transaction
- [ ] Throws FORBIDDEN for other user's transaction
- [ ] Throws INVALID_CATEGORY for invalid category
- [ ] Handles null note correctly
- [ ] Preserves decimal precision

### Integration Tests (API Route)
- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for invalid transaction ID
- [ ] Returns 400 for empty request body
- [ ] Returns 400 for invalid field values
- [ ] Returns 403 for other user's transaction
- [ ] Returns 404 for non-existent transaction
- [ ] Returns 422 for invalid category
- [ ] Returns 200 with updated data for valid request
- [ ] Response matches UpdateTransactionResponseDto structure

### Partial Update Tests
- [ ] Update single field (amount only)
- [ ] Update multiple fields
- [ ] Clear optional field (note to null)
- [ ] Change category
- [ ] Change type (income ↔ expense)
- [ ] Unchanged fields remain unchanged
- [ ] created_at never changes
- [ ] user_id never changes

### Database Tests
- [ ] Only specified fields updated in database
- [ ] Immutable fields (id, user_id, created_at) unchanged
- [ ] FK constraint prevents invalid category_id
- [ ] CHECK constraint prevents invalid amount
- [ ] ENUM constraint enforces valid type

### End-to-End Tests
- [ ] Full PATCH request updates transaction
- [ ] Updated transaction visible in GET /transactions
- [ ] Updated transaction affects GET /dashboard
- [ ] Multiple users update independently
- [ ] Response time acceptable (< 200ms)

---

## 11. Future Enhancements

### Optimistic Locking
1. **Version Field**: Add version/updated_at for concurrency control
2. **Conflict Detection**: Detect if transaction changed since last read
3. **Conflict Resolution**: Return 409 Conflict if concurrent update detected

### Audit Trail
1. **Update History**: Track all changes to transaction
2. **Change Log**: Record who changed what and when
3. **Rollback**: Ability to revert changes

### Batch Updates
1. **Multiple Transactions**: Update many transactions at once
2. **Bulk Category Change**: Reassign multiple transactions to new category
3. **Bulk Type Change**: Change multiple transactions from expense to income

### Smart Updates
1. **Validation Rules**: Prevent illogical updates (e.g., huge amount changes)
2. **Confirmation**: Require confirmation for major changes
3. **Undo**: Support undo within time window

### API Improvements
1. **Partial Response**: Return only updated fields
2. **Patch Operations**: JSON Patch (RFC 6902) support
3. **ETags**: Support conditional updates with If-Match

---

## Appendix A: Example Requests and Responses

### Update Amount and Note
**Request:**
```bash
PATCH /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "amount": 205.00,
  "note": "New gaming headphones"
}
```

**Response (200 OK):**
```json
{
  "id": "c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d",
  "date": "2025-10-12",
  "amount": 205.00,
  "type": "expense",
  "note": "New gaming headphones",
  "category": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Entertainment"
  },
  "createdAt": "2025-10-12T10:00:00Z"
}
```

### Change Category
**Request:**
```bash
PATCH /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d

{
  "categoryId": "b2c3d4e5-f6a7-8901-2345-67890abcdef1"
}
```

**Response (200 OK):**
```json
{
  "id": "c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d",
  "date": "2025-10-12",
  "amount": 205.00,
  "type": "expense",
  "note": "New gaming headphones",
  "category": {
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "name": "Shopping"
  },
  "createdAt": "2025-10-12T10:00:00Z"
}
```

### Empty Request Body
**Request:**
```bash
PATCH /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d

{}
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "_errors": ["At least one field must be provided for update"]
  }
}
```

### Transaction Not Found
**Request:**
```bash
PATCH /api/transactions/00000000-0000-0000-0000-000000000000

{
  "amount": 100
}
```

**Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Transaction not found"
}
```

### Forbidden (Other User's Transaction)
**Request:**
```bash
PATCH /api/transactions/d5f9c2e6-c9f1-5c2b-ab2b-a0g8b8e8f8f8

{
  "amount": 100
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to update this transaction"
}
```

### Invalid Category
**Request:**
```bash
PATCH /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d

{
  "categoryId": "11111111-1111-1111-1111-111111111111"
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

This implementation plan provides comprehensive guidance for implementing the PATCH /transactions/{id} endpoint. Follow the steps sequentially, test thoroughly at each stage, and ensure proper handling of partial updates, ownership verification, and all error scenarios.

