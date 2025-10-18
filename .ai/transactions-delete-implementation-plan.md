# API Endpoint Implementation Plan: DELETE /transactions/{id}

## Analysis

### Key Points from API Specification

- **Endpoint**: `DELETE /api/transactions/{id}`
- **Purpose**: Delete a specific transaction
- **Authentication**: Required (JWT-based via Supabase)
- **Request includes**:
  - Path parameter: transaction id (UUID)
  - No request body
- **Response**: No content (empty response)
- **Success**: 204 No Content
- **Errors**:
  - 400 Bad Request (invalid UUID format)
  - 401 Unauthorized (not authenticated)
  - 403 Forbidden (trying to delete another user's transaction)
  - 404 Not Found (transaction doesn't exist)

### Required and Optional Parameters

**Path Parameters:**

- `id` (UUID, required): ID of the transaction to delete

**Request Body:** None

**Response Body:** None (204 No Content)

### Necessary DTOs and Command Models

- No DTOs or command models needed (delete operation)
- Only path parameter validation required

### Service Layer Extraction

Service method to be added to: `src/lib/services/transactions.service.ts`

This service will:

- Accept `SupabaseClient` and transaction `id`
- Verify transaction exists and belongs to user (via RLS)
- Delete transaction from database
- Return void (or throw error if failed)

### Input Validation Strategy

Using Zod schemas:

1. **Path Parameter Schema**: Validate id is valid UUID
2. **No Body Validation**: DELETE requests have no body
3. **Business Validation**: Verify transaction ownership via RLS

### Security Considerations

- **Authentication**: User must be authenticated
- **Authorization**:
  - User can only delete their own transactions (RLS enforces)
  - Return 403 if trying to delete another user's transaction
  - Return 404 if transaction doesn't exist
- **Cascading Effects**: None (transactions are leaf nodes in data model)
- **SQL Injection**: Prevented by Supabase parameterized queries

### Error Scenarios and Status Codes

1. **400 Bad Request**:
   - Invalid UUID format for id

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token

3. **403 Forbidden**:
   - Transaction exists but belongs to different user

4. **404 Not Found**:
   - Transaction with given id doesn't exist

5. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during deletion

---

## 1. Endpoint Overview

The DELETE /transactions/{id} endpoint allows authenticated users to permanently delete their own transactions. This is a destructive operation that cannot be undone. The endpoint validates ownership through RLS policies and returns no content on success. Proper error responses distinguish between non-existent transactions (404) and unauthorized access attempts (403).

**Key Features:**

- Permanent deletion from `transactions` table
- No cascading deletions (transactions have no dependents)
- Validates ownership through RLS
- Returns 204 No Content on success
- Idempotent from user perspective (deleting non-existent transaction returns 404)
- No request body or response body

---

## 2. Request Details

### HTTP Method

`DELETE`

### URL Structure

```
/api/transactions/{id}
```

### Path Parameters

- **id** (string, required)
  - Description: UUID of the transaction to delete
  - Format: Valid UUID
  - Example: `c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d`

### Request Headers

- **Authorization**: `Bearer <JWT_TOKEN>` (required)

### Request Body

None

### Example Requests

#### Delete Transaction

```bash
curl -X DELETE "https://api.example.com/api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Delete with Verbose Output

```bash
curl -X DELETE "https://api.example.com/api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -v
```

---

## 3. Utilized Types

### Path Parameter Validation

**Transaction ID Schema** (to be created with Zod):

```typescript
const TransactionIdSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
});
```

### No DTOs Required

- No request body DTO
- No response body DTO
- DELETE returns 204 No Content (empty response)

### Database Types

Only database row identification:

- `transactions.id` (UUID)
- `transactions.user_id` (UUID, for RLS)

---

## 4. Response Details

### Success Response (204 No Content)

#### Structure

- **Status Code**: 204
- **Response Body**: Empty (no content)
- **Content-Length**: 0

#### Example

```
HTTP/1.1 204 No Content
Content-Length: 0
```

### Error Responses

#### 400 Bad Request (Invalid UUID)

**Scenarios:**

- Path parameter is not a valid UUID

**Example Response:**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid transaction ID format"
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
- User attempting to delete another user's transaction

**Example Response:**

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to delete this transaction"
}
```

#### 404 Not Found

**Scenarios:**

- Transaction with given id doesn't exist
- Transaction was already deleted

**Example Response:**

```json
{
  "error": "Not Found",
  "message": "Transaction not found"
}
```

#### 500 Internal Server Error

**Scenarios:**

- Database connection failure
- Unexpected errors during deletion

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

1. **Request Reception**: Astro API endpoint receives DELETE request
2. **Authentication Check**: Verify user is authenticated via Supabase
3. **Path Validation**: Validate transaction ID from URL
4. **Service Invocation**: Call `TransactionsService.deleteTransaction()`
5. **Existence Check**: Verify transaction exists and belongs to user
6. **Database Delete**: Delete transaction from database
7. **Response Delivery**: Return 204 No Content

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/transactions/[id].ts`)

```
1. Check HTTP method is DELETE
2. Extract id from path params
3. Validate id is valid UUID
4. If invalid UUID → return 400 error
5. Get authenticated user from context.locals.supabase
6. If user not authenticated → return 401 error
7. Call service layer to delete transaction
8. If successful → return 204 No Content
9. Handle errors (404, 403, 500)
```

#### Step 2: Service Layer (`src/lib/services/transactions.service.ts`)

```
1. Receive supabase client and transaction id
2. Execute DELETE query:
   - DELETE FROM transactions WHERE id = ? AND user_id = ?
   - RLS automatically filters by user_id
3. Check affected row count:
   - 0 rows → transaction doesn't exist or doesn't belong to user
   - Check if transaction exists at all → 404 vs 403
   - 1 row → deletion successful
4. Return void on success
5. Throw appropriate error on failure
```

#### Step 3: Database Interaction (Supabase)

**Delete Query:**

```sql
DELETE FROM transactions
WHERE
  id = 'c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d'
  AND user_id = '<authenticated_user_id>'; -- Applied by RLS
```

**RLS Check (automatic):**

```sql
-- RLS DELETE policy on transactions:
-- auth.uid() = user_id

-- If transaction doesn't belong to user, DELETE affects 0 rows
```

**Existence Check (if delete affects 0 rows):**

```sql
SELECT id, user_id
FROM transactions
WHERE id = 'c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d';

-- If returns no rows → 404 (transaction doesn't exist)
-- If returns row with different user_id → 403 (forbidden)
```

#### Step 4: Determining 404 vs 403

```typescript
// After delete returns 0 rows affected
// Check if transaction exists at all
const { data: exists } = await supabase.from("transactions").select("id, user_id").eq("id", transactionId).single();

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
  - RLS DELETE policy verifies `auth.uid() = user_id`
  - User cannot delete other users' transactions
  - Distinguish between 404 (doesn't exist) and 403 (exists but not yours)
  - Important for security: don't leak transaction existence to unauthorized users

### Data Integrity

- **Soft Delete vs Hard Delete**: This is a hard delete (permanent)
- **No Cascading Issues**: Transactions have no dependent records
- **Referential Integrity**: No foreign keys reference transactions
- **Audit Trail**: Consider logging deletions for audit purposes

### Preventing Common Attacks

- **SQL Injection**: Supabase uses parameterized queries
- **ID Enumeration**: 404 response doesn't leak existence to unauthorized users
- **Privilege Escalation**: RLS prevents deleting other users' transactions
- **Denial of Service**: Rate limiting should be implemented (future enhancement)

### Privacy Considerations

- **Permanent Deletion**: Data is permanently removed from database
- **No Recovery**: Deleted transactions cannot be recovered
- **Compliance**: Ensure deletion complies with data retention policies

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Invalid Transaction ID Format

```typescript
// URL: DELETE /api/transactions/invalid-uuid

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    id: "Invalid transaction ID format"
  }
}
```

#### Scenario 2: Malformed UUID

```typescript
// URL: DELETE /api/transactions/123

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    id: "Invalid transaction ID format"
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

### Authorization Errors (403 Forbidden)

#### Scenario 1: Transaction Belongs to Another User

```typescript
// Transaction exists but user_id doesn't match

Response: {
  statusCode: 403,
  error: "Forbidden",
  message: "You do not have permission to delete this transaction"
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

#### Scenario 2: Transaction Already Deleted

```typescript
// Transaction was deleted in previous request

Response: {
  statusCode: 404,
  error: "Not Found",
  message: "Transaction not found"
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
console.error("[Delete Transaction API] Database error:", error)
```

#### Scenario 2: Unexpected Deletion Error

```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Delete Transaction API] Deletion failed:", error)
```

### Error Handling Best Practices

1. **Distinguish 404 vs 403**: Critical for security and UX
2. **No Information Leakage**: Don't reveal transaction existence to unauthorized users
3. **Consistent Format**: Same error structure across all endpoints
4. **Detailed Logging**: Log all errors with context for debugging
5. **Idempotency**: Second DELETE of same transaction returns 404 (not error)

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Two-Step Process on Failure

- **Issue**: DELETE + existence check when delete affects 0 rows
- **Impact**: Extra database query on failure
- **Mitigation**:
  - Only happens when transaction not found or forbidden
  - Failure case, not performance critical
  - Can be optimized if needed

#### 2. RLS Policy Evaluation

- **Issue**: RLS policy evaluated on DELETE
- **Impact**: Slight overhead per request
- **Mitigation**:
  - RLS uses indexes efficiently
  - Simple equality check on user_id
  - Negligible performance impact

### Optimization Strategies

#### 1. Index Usage

```sql
-- Ensure composite index exists:
CREATE INDEX idx_transactions_id_user ON transactions(id, user_id);

-- Enables efficient DELETE with WHERE id = ? AND user_id = ?
```

#### 2. Efficient 404 vs 403 Check

```typescript
// Current approach: Two queries
// 1. DELETE with RLS
// 2. If 0 rows, SELECT to check existence

// Alternative: Single query with error handling
// Slightly more complex but potentially faster
```

#### 3. Batch Deletion (Future)

- Support deleting multiple transactions at once
- Single transaction for consistency
- Reduces network round-trips

### Expected Performance

#### Best Case (Successful Deletion)

- **Total Response Time**: < 100ms
- **Validation Time**: < 5ms
- **Database Delete**: < 50ms
- **Response**: < 5ms

#### Typical Case

- **Total Response Time**: < 150ms
- **Similar to best case**

#### Failure Case (404/403)

- **Total Response Time**: < 150ms
- **Delete Attempt**: < 50ms (affects 0 rows)
- **Existence Check**: < 50ms
- **Error Response**: < 5ms

#### Worst Case (Validation Error)

- **Total Response Time**: < 50ms
- **Fails Fast**: No database interaction
- **Validation Only**: Quick UUID format check

### Monitoring Recommendations

- **Log Deletion Times**: Track slow deletions (> 100ms)
- **Track Error Rates**: Monitor 403, 404, 500 errors
- **Deletion Patterns**: Track deletion frequency per user
- **Failed Deletions**: Monitor 404/403 ratio

---

## 9. Implementation Steps

### Step 1: Add Validation Schema

**File**: `src/pages/api/transactions/[id].ts`

```typescript
import { z } from "zod";

const TransactionIdSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
});
```

### Step 2: Add Service Method

**File**: `src/lib/services/transactions.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";

export class TransactionsService {
  // ... existing methods ...

  /**
   * Delete a transaction
   * @param supabase - Authenticated Supabase client
   * @param transactionId - ID of transaction to delete
   * @returns void
   * @throws Error if transaction not found or forbidden
   */
  static async deleteTransaction(supabase: SupabaseClient, transactionId: string): Promise<void> {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Delete transaction (RLS enforces user ownership)
    const { error, count } = await supabase.from("transactions").delete({ count: "exact" }).eq("id", transactionId);

    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }

    // Check if any rows were deleted
    if (count === 0) {
      // Check if transaction exists at all
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

      // If we get here, something unexpected happened
      throw new Error("DELETE_FAILED");
    }

    // Success - transaction deleted
  }
}
```

### Step 3: Add DELETE Handler to API Route

**File**: `src/pages/api/transactions/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { TransactionsService } from "@/lib/services/transactions.service";

const TransactionIdSchema = z.object({
  id: z.string().uuid("Invalid transaction ID format"),
});

// ... existing PATCH handler ...

export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // 3. Call service layer
    await TransactionsService.deleteTransaction(locals.supabase, transactionId);

    // 4. Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // 5. Handle specific errors
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
            message: "You do not have permission to delete this transaction",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 6. Handle unexpected errors
    console.error("[Delete Transaction API] Unexpected error:", error);

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

### Step 4: Test Path Parameter Validation

- Invalid UUID → 400 "Invalid transaction ID format"
- Malformed UUID → 400
- Valid UUID → proceeds to authentication

### Step 5: Test Authentication

- No token → 401 "Authentication required"
- Invalid token → 401
- Expired token → 401
- Valid token → proceeds to deletion

### Step 6: Test Successful Deletion

- Delete own transaction → 204 No Content
- Verify transaction removed from database
- Verify empty response body
- Verify Content-Length: 0

### Step 7: Test Authorization (403)

- User A tries to delete User B's transaction → 403
- Verify transaction still exists after failed attempt
- Verify error message doesn't leak transaction details

### Step 8: Test Not Found (404)

- Delete non-existent transaction → 404
- Delete already-deleted transaction → 404
- Verify consistent error response

### Step 9: Test Idempotency

- Delete transaction twice
- First request → 204 No Content
- Second request → 404 Not Found
- This is expected behavior (not true idempotency but acceptable)

### Step 10: Test Database State

- Transaction removed from database
- No orphaned records
- Other user's transactions unaffected

### Step 11: Test Side Effects

- Deleted transaction no longer in GET /transactions
- Deleted transaction no longer affects GET /dashboard
- Dashboard summary recalculated correctly

### Step 12: Integration Testing

- Create transaction, then delete it
- Verify complete lifecycle
- Test with multiple users simultaneously
- Verify no race conditions

### Step 13: Test Edge Cases

- Delete with concurrent requests
- Delete while transaction being updated
- Delete transaction with null category
- Delete oldest transaction
- Delete newest transaction

### Step 14: Performance Testing

- Measure deletion time
- Should be < 100ms
- Test with large number of deletions
- Verify index usage

### Step 15: Security Testing

- Try to delete other user's transaction → 403
- Try to enumerate transactions by ID → appropriate 404/403
- Verify RLS policies are enforced
- Verify no SQL injection possible

---

## 10. Testing Checklist

### Unit Tests (Service Layer)

- [ ] Deletes transaction successfully
- [ ] Throws NOT_FOUND for non-existent transaction
- [ ] Throws FORBIDDEN for other user's transaction
- [ ] Returns void on success
- [ ] Handles database errors gracefully
- [ ] Verifies user authentication

### Integration Tests (API Route)

- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for invalid transaction ID
- [ ] Returns 403 for other user's transaction
- [ ] Returns 404 for non-existent transaction
- [ ] Returns 204 with no content for successful deletion
- [ ] Response has no body
- [ ] Content-Length is 0

### Database Tests

- [ ] Transaction removed from database
- [ ] DELETE affects exactly 1 row (success case)
- [ ] DELETE affects 0 rows (404/403 case)
- [ ] RLS prevents deleting other user's transactions
- [ ] No orphaned records after deletion

### Side Effects Tests

- [ ] Deleted transaction not in GET /transactions
- [ ] Dashboard summary updated after deletion
- [ ] Daily breakdown recalculated correctly
- [ ] Other user's data unaffected

### End-to-End Tests

- [ ] Full DELETE request removes transaction
- [ ] Second DELETE returns 404
- [ ] Multiple users delete independently
- [ ] Response time acceptable (< 150ms)
- [ ] Concurrent deletions handled correctly

---

## 11. Future Enhancements

### Soft Delete

1. **Add deleted_at Column**: Timestamp for soft deletion
2. **Filter Queries**: Exclude soft-deleted transactions from queries
3. **Permanent Deletion**: Admin endpoint for hard delete
4. **Recovery**: Endpoint to undelete transactions

### Audit Trail

1. **Deletion Log**: Record who deleted what and when
2. **Retention**: Keep deleted transaction data for X days
3. **Compliance**: Meet data retention requirements

### Bulk Operations

1. **Bulk Delete**: Delete multiple transactions at once
2. **Delete by Filter**: Delete all transactions matching criteria
3. **Undo Delete**: Support undo within time window

### Confirmation

1. **Require Confirmation**: Two-step deletion for high-value transactions
2. **Confirmation Token**: Time-limited token for deletion
3. **Email Notification**: Notify user of deletion

### API Improvements

1. **Return Deleted Object**: Return 200 with deleted transaction details
2. **Cascade Options**: Specify cascade behavior (if dependencies added)
3. **Archive**: Move to archive instead of delete

---

## Appendix A: Example Requests and Responses

### Successful Deletion

**Request:**

```bash
DELETE /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d
Authorization: Bearer <JWT_TOKEN>
```

**Response (204 No Content):**

```
HTTP/1.1 204 No Content
Content-Length: 0
```

### Invalid Transaction ID

**Request:**

```bash
DELETE /api/transactions/invalid-uuid
Authorization: Bearer <JWT_TOKEN>
```

**Response (400 Bad Request):**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid transaction ID format"
  }
}
```

### Transaction Not Found

**Request:**

```bash
DELETE /api/transactions/00000000-0000-0000-0000-000000000000
Authorization: Bearer <JWT_TOKEN>
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
DELETE /api/transactions/d5f9c2e6-c9f1-5c2b-ab2b-a0g8b8e8f8f8
Authorization: Bearer <JWT_TOKEN>
```

**Response (403 Forbidden):**

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to delete this transaction"
}
```

### Missing Authentication

**Request:**

```bash
DELETE /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d
```

**Response (401 Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Second Delete (Idempotency)

**Request (first time):**

```bash
DELETE /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d
Authorization: Bearer <JWT_TOKEN>
```

**Response (204 No Content):**

```
HTTP/1.1 204 No Content
```

**Request (second time - same ID):**

```bash
DELETE /api/transactions/c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d
Authorization: Bearer <JWT_TOKEN>
```

**Response (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Transaction not found"
}
```

---

## Appendix B: Database Queries

### Delete Query (with RLS)

```sql
DELETE FROM transactions
WHERE
  id = 'c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d'
  AND user_id = '<authenticated_user_id>'; -- Applied by RLS

-- Returns: number of rows deleted (0 or 1)
```

### Existence Check (for 404 vs 403)

```sql
SELECT id, user_id
FROM transactions
WHERE id = 'c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d';

-- If no rows: transaction doesn't exist → 404
-- If user_id doesn't match: forbidden → 403
```

### Verify Deletion

```sql
SELECT COUNT(*) as remaining
FROM transactions
WHERE id = 'c3e8a1d4-b8e0-4b1a-9b1a-9f7a7d7f7e7d';

-- Should return 0 after successful deletion
```

---

## Appendix C: HTTP Status Codes Reference

### 204 No Content

- **When**: Successful deletion
- **Body**: None (empty)
- **Meaning**: Request processed, transaction deleted, no content to return

### 400 Bad Request

- **When**: Invalid UUID format
- **Body**: Error details
- **Meaning**: Client sent malformed request

### 401 Unauthorized

- **When**: Not authenticated
- **Body**: Error message
- **Meaning**: Authentication required

### 403 Forbidden

- **When**: Transaction belongs to other user
- **Body**: Error message
- **Meaning**: Authenticated but not authorized

### 404 Not Found

- **When**: Transaction doesn't exist
- **Body**: Error message
- **Meaning**: Resource not found

### 500 Internal Server Error

- **When**: Unexpected server error
- **Body**: Generic error message
- **Meaning**: Server encountered unexpected condition

---

## Appendix D: Security Checklist

### Authentication

- [ ] JWT token required
- [ ] Token validated before processing
- [ ] Invalid tokens rejected with 401

### Authorization

- [ ] RLS policies enforced
- [ ] User can only delete own transactions
- [ ] 403 returned for unauthorized access

### Information Disclosure

- [ ] 404 vs 403 properly distinguished
- [ ] Error messages don't leak sensitive info
- [ ] No transaction existence revealed to unauthorized users

### Data Integrity

- [ ] Transaction permanently deleted
- [ ] No orphaned records
- [ ] Database constraints maintained

### Audit & Compliance

- [ ] Deletions logged for audit
- [ ] Complies with data retention policies
- [ ] User aware deletion is permanent

---

This implementation plan provides comprehensive guidance for implementing the DELETE /transactions/{id} endpoint. Follow the steps sequentially, test thoroughly at each stage, and ensure proper handling of ownership verification, permanent deletion, and all error scenarios.
