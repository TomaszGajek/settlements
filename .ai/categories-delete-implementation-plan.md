# API Endpoint Implementation Plan: DELETE /categories/{id}

## Analysis

### Key Points from API Specification
- **Endpoint**: `DELETE /api/categories/{id}`
- **Purpose**: Delete a specific category
- **Authentication**: Required (JWT-based via Supabase)
- **Request includes**:
  - Path parameter: category id (UUID)
  - No request body
- **Response**: No content (empty response)
- **Business Logic**: Database trigger automatically reassigns associated transactions to "Other" category before deletion
- **Success**: 204 No Content
- **Errors**: 
  - 400 Bad Request (invalid UUID format)
  - 401 Unauthorized (not authenticated)
  - 403 Forbidden (trying to delete "Other" category or another user's category)
  - 404 Not Found (category doesn't exist)

### Required and Optional Parameters
**Path Parameters:**
- `id` (UUID, required): ID of the category to delete

**Request Body:** None

**Response Body:** None (204 No Content)

### Necessary DTOs and Command Models
- No DTOs or command models needed (delete operation)
- Only path parameter validation required

### Service Layer Extraction
Service method to be added to: `src/lib/services/categories.service.ts`

This service will:
- Accept `SupabaseClient` and category `id`
- Verify category exists and belongs to user (via RLS)
- Verify category is deletable (is_deletable = true)
- Delete category from database
- Database trigger handles reassigning transactions to "Other"
- Return void (or throw error if failed)

### Input Validation Strategy
Using Zod schemas:
1. **Path Parameter Schema**: Validate id is valid UUID
2. **No Body Validation**: DELETE requests have no body
3. **Business Validation**: 
   - Verify category ownership via RLS
   - Verify category is deletable (is_deletable = true)

### Security Considerations
- **Authentication**: User must be authenticated
- **Authorization**: 
  - User can only delete their own categories (RLS enforces)
  - User cannot delete "Other" category (is_deletable = false)
  - Return 403 if trying to delete another user's category
  - Return 403 if trying to delete "Other" category
  - Return 404 if category doesn't exist
- **Data Integrity**: Database trigger ensures transactions are reassigned before deletion
- **SQL Injection**: Prevented by Supabase parameterized queries

### Error Scenarios and Status Codes
1. **400 Bad Request**:
   - Invalid UUID format for id

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token

3. **403 Forbidden**:
   - Category exists but belongs to different user
   - Category is not deletable (is_deletable = false, i.e., "Other")

4. **404 Not Found**:
   - Category with given id doesn't exist

5. **500 Internal Server Error**:
   - Database connection failure
   - Trigger execution failure
   - Unexpected errors during deletion

---

## 1. Endpoint Overview

The DELETE /categories/{id} endpoint allows authenticated users to permanently delete their own deletable categories. The system "Other" category cannot be deleted. Before deletion, a database trigger automatically reassigns all transactions associated with the deleted category to the user's "Other" category, ensuring no transactions are orphaned. The endpoint validates ownership and deletability through RLS policies and application logic.

**Key Features:**
- Permanent deletion from `categories` table
- Cannot delete "Other" category (is_deletable = false)
- Database trigger reassigns transactions to "Other" before deletion
- Validates ownership through RLS
- Returns 204 No Content on success
- Idempotent from user perspective (deleting non-existent category returns 404)
- No request body or response body

---

## 2. Request Details

### HTTP Method
`DELETE`

### URL Structure
```
/api/categories/{id}
```

### Path Parameters
- **id** (string, required)
  - Description: UUID of the category to delete
  - Format: Valid UUID
  - Example: `c3d4e5f6-a7b8-9012-3456-7890abcdef12`

### Request Headers
- **Authorization**: `Bearer <JWT_TOKEN>` (required)

### Request Body
None

### Example Requests

#### Delete Category
```bash
curl -X DELETE "https://api.example.com/api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Delete with Verbose Output
```bash
curl -X DELETE "https://api.example.com/api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -v
```

---

## 3. Utilized Types

### Path Parameter Validation
**Category ID Schema** (to be created with Zod):
```typescript
const CategoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});
```

### No DTOs Required
- No request body DTO
- No response body DTO
- DELETE returns 204 No Content (empty response)

### Database Types
Only database row identification:
- `categories.id` (UUID)
- `categories.user_id` (UUID, for RLS)
- `categories.is_deletable` (boolean, for validation)

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
    "id": "Invalid category ID format"
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
- Category exists but belongs to different user
- Category is not deletable (is_deletable = false)

**Example Response (Other User's Category):**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to delete this category"
}
```

**Example Response (Non-Deletable Category):**
```json
{
  "error": "Forbidden",
  "message": "Cannot delete non-deletable category"
}
```

#### 404 Not Found
**Scenarios:**
- Category with given id doesn't exist
- Category was already deleted

**Example Response:**
```json
{
  "error": "Not Found",
  "message": "Category not found"
}
```

#### 500 Internal Server Error
**Scenarios:**
- Database connection failure
- Trigger execution failure
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
3. **Path Validation**: Validate category ID from URL
4. **Service Invocation**: Call `CategoriesService.deleteCategory()`
5. **Existence & Ownership Check**: Verify category exists and belongs to user
6. **Deletability Check**: Verify category is deletable (is_deletable = true)
7. **Database Delete**: Delete category from database
8. **Trigger Execution**: Database trigger reassigns transactions to "Other"
9. **Response Delivery**: Return 204 No Content

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/categories/[id].ts`)
```
1. Check HTTP method is DELETE
2. Extract id from path params
3. Validate id is valid UUID
4. If invalid UUID → return 400 error
5. Get authenticated user from context.locals.supabase
6. If user not authenticated → return 401 error
7. Call service layer to delete category
8. If successful → return 204 No Content
9. Handle errors (404, 403, 500)
```

#### Step 2: Service Layer (`src/lib/services/categories.service.ts`)
```
1. Receive supabase client and category id
2. Check if category exists and get its data:
   - SELECT id, user_id, is_deletable WHERE id = ?
   - RLS ensures user can only see their own categories
3. If not found → throw NOT_FOUND
4. If user_id doesn't match → throw FORBIDDEN (shouldn't happen with RLS)
5. If is_deletable = false → throw NOT_DELETABLE (403)
6. Execute DELETE query:
   - DELETE FROM categories WHERE id = ? AND user_id = ?
   - RLS automatically filters by user_id
   - BEFORE DELETE trigger executes:
     a. Find user's "Other" category
     b. UPDATE transactions SET category_id = other_id WHERE category_id = id
     c. Then proceed with deletion
7. Return void on success
8. Throw appropriate error on failure
```

#### Step 3: Database Interaction (Supabase)

**Check Category Existence and Deletability:**
```sql
SELECT id, user_id, is_deletable
FROM categories
WHERE 
  id = 'c3d4e5f6-a7b8-9012-3456-7890abcdef12'
  AND user_id = '<authenticated_user_id>'; -- Applied by RLS
```

**Delete Query:**
```sql
DELETE FROM categories
WHERE 
  id = 'c3d4e5f6-a7b8-9012-3456-7890abcdef12'
  AND user_id = '<authenticated_user_id>'; -- Applied by RLS
```

**BEFORE DELETE Trigger (automatic):**
```sql
-- Trigger: reassign_transactions_before_category_delete
-- Executes BEFORE DELETE on categories table

CREATE OR REPLACE FUNCTION reassign_transactions_to_other()
RETURNS TRIGGER AS $$
DECLARE
  other_category_id UUID;
BEGIN
  -- Find the user's "Other" category
  SELECT id INTO other_category_id
  FROM categories
  WHERE user_id = OLD.user_id
    AND is_deletable = false
  LIMIT 1;

  -- Update all transactions from deleted category to "Other"
  UPDATE transactions
  SET category_id = other_category_id
  WHERE category_id = OLD.id;

  -- Allow the deletion to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reassign_transactions_before_category_delete
BEFORE DELETE ON categories
FOR EACH ROW
EXECUTE FUNCTION reassign_transactions_to_other();
```

**RLS Check (automatic):**
```sql
-- RLS DELETE policy on categories:
-- auth.uid() = user_id AND is_deletable = true

-- Application also checks is_deletable before attempting delete
```

#### Step 4: Determining Error Codes
```typescript
// Category not found or belongs to other user
if (!existingCategory) {
  throw new Error("NOT_FOUND");
}

// Category is not deletable ("Other" category)
if (!existingCategory.is_deletable) {
  throw new Error("NOT_DELETABLE"); // 403
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
- **Category Ownership**: 
  - RLS DELETE policy verifies `auth.uid() = user_id`
  - User cannot delete other users' categories
  - Distinguish between 404 (doesn't exist) and 403 (not deletable/not owned)
- **Deletability Control**:
  - Check is_deletable flag before allowing deletion
  - "Other" category has is_deletable = false
  - RLS also includes `is_deletable = true` condition
  - Return 403 for non-deletable categories

### Data Integrity
- **Trigger Safety**: 
  - Database trigger ensures transactions are reassigned atomically
  - No orphaned transactions after category deletion
  - Trigger executes in same transaction as DELETE
- **"Other" Category Protection**:
  - Cannot delete "Other" category
  - Ensures there's always a fallback category
  - Trigger relies on "Other" category existing

### Preventing Common Attacks
- **SQL Injection**: Supabase uses parameterized queries
- **ID Enumeration**: 404 response doesn't leak existence to unauthorized users
- **Privilege Escalation**: RLS prevents deleting other users' categories
- **System Category Bypass**: Multiple layers prevent "Other" deletion

### Privacy Considerations
- **Permanent Deletion**: Category permanently removed
- **Transaction Preservation**: Transactions preserved, reassigned to "Other"
- **Compliance**: Ensure deletion complies with data retention policies

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Invalid Category ID Format
```typescript
// URL: DELETE /api/categories/invalid-uuid

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    id: "Invalid category ID format"
  }
}
```

#### Scenario 2: Malformed UUID
```typescript
// URL: DELETE /api/categories/123

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    id: "Invalid category ID format"
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

#### Scenario 1: Category Belongs to Another User
```typescript
// Category exists but user_id doesn't match

Response: {
  statusCode: 403,
  error: "Forbidden",
  message: "You do not have permission to delete this category"
}
```

#### Scenario 2: Non-Deletable Category ("Other")
```typescript
// is_deletable = false

Response: {
  statusCode: 403,
  error: "Forbidden",
  message: "Cannot delete non-deletable category"
}
```

### Not Found Errors (404 Not Found)

#### Scenario 1: Category Doesn't Exist
```typescript
// No category with given ID in database

Response: {
  statusCode: 404,
  error: "Not Found",
  message: "Category not found"
}
```

#### Scenario 2: Category Already Deleted
```typescript
// Category was deleted in previous request

Response: {
  statusCode: 404,
  error: "Not Found",
  message: "Category not found"
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
console.error("[Delete Category API] Database error:", error)
```

#### Scenario 2: Trigger Execution Failure
```typescript
// If "Other" category somehow doesn't exist

Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Delete Category API] Trigger failed:", error)
```

### Error Handling Best Practices
1. **Distinguish 403 Types**: Not deletable vs not owned
2. **No Information Leakage**: Don't reveal category existence to unauthorized users
3. **Consistent Format**: Same error structure across all endpoints
4. **Detailed Logging**: Log all errors with context for debugging
5. **Idempotency**: Second DELETE of same category returns 404 (not error)

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Two-Step Process
- **Issue**: SELECT to check deletability + DELETE
- **Impact**: Two database round-trips
- **Mitigation**:
  - Could use single DELETE with complex WHERE
  - Current approach is clearer for error handling

#### 2. Trigger Execution
- **Issue**: Trigger must update potentially many transactions
- **Impact**: Deletion slower if category has many transactions
- **Mitigation**:
  - Index on transactions.category_id exists
  - Update is efficient with proper indexes
  - Acceptable for typical use case

#### 3. RLS Policy Evaluation
- **Issue**: RLS policy evaluated on DELETE
- **Impact**: Slight overhead per request
- **Mitigation**:
  - Simple equality check on user_id
  - Negligible performance impact

### Optimization Strategies

#### 1. Index Usage
```sql
-- Ensure indexes exist:
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_categories_id_user ON categories(id, user_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_categories_user_deletable ON categories(user_id, is_deletable);
```

#### 2. Efficient Trigger
```sql
-- Trigger already optimized:
-- 1. Single SELECT to find "Other" category
-- 2. Single UPDATE for all transactions
-- 3. Executes in same transaction
```

#### 3. Batch Deletion (Future)
- Support deleting multiple categories at once
- Single transaction for consistency
- Reduces network round-trips

### Expected Performance

#### Best Case (Category with Few Transactions)
- **Total Response Time**: < 150ms
- **Validation Time**: < 5ms
- **Check Query**: < 30ms
- **Delete + Trigger**: < 50ms
- **Response**: < 5ms

#### Typical Case (Category with ~50 Transactions)
- **Total Response Time**: < 200ms
- **Check Query**: < 30ms
- **Delete + Trigger**: < 100ms (trigger updates transactions)

#### Worst Case (Category with 1000+ Transactions)
- **Total Response Time**: < 500ms
- **Check Query**: < 30ms
- **Delete + Trigger**: < 400ms (many transactions to reassign)

#### Failure Case (404/403)
- **Total Response Time**: < 100ms
- **Check Query**: < 30ms
- **No deletion executed**
- **Error Response**: < 5ms

### Monitoring Recommendations
- **Log Deletion Times**: Track slow deletions (> 200ms)
- **Track Error Rates**: Monitor 403, 404, 500 errors
- **Trigger Performance**: Monitor trigger execution time
- **Transaction Count**: Track categories with many transactions

---

## 9. Implementation Steps

### Step 1: Add Validation Schema
**File**: `src/pages/api/categories/[id].ts`

```typescript
import { z } from "zod";

const CategoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});
```

### Step 2: Add Service Method
**File**: `src/lib/services/categories.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";

export class CategoriesService {
  // ... existing methods ...

  /**
   * Delete a category
   * Associated transactions are automatically reassigned to "Other" category by database trigger
   * @param supabase - Authenticated Supabase client
   * @param categoryId - ID of category to delete
   * @returns void
   * @throws Error if not found, forbidden, or not deletable
   */
  static async deleteCategory(
    supabase: SupabaseClient,
    categoryId: string
  ): Promise<void> {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if category exists and get its current state
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select("id, user_id, is_deletable")
      .eq("id", categoryId)
      .single();

    if (fetchError || !existingCategory) {
      throw new Error("NOT_FOUND");
    }

    // Verify category belongs to user (RLS should handle this, but double-check)
    if (existingCategory.user_id !== user.id) {
      throw new Error("FORBIDDEN");
    }

    // Check if category is deletable
    if (!existingCategory.is_deletable) {
      throw new Error("NOT_DELETABLE");
    }

    // Delete category (trigger will reassign transactions)
    const { error, count } = await supabase
      .from("categories")
      .delete({ count: "exact" })
      .eq("id", categoryId);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    // Verify deletion occurred
    if (count === 0) {
      // This shouldn't happen since we already checked existence
      throw new Error("DELETE_FAILED");
    }

    // Success - category deleted, transactions reassigned by trigger
  }
}
```

### Step 3: Add DELETE Handler to API Route
**File**: `src/pages/api/categories/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { CategoriesService } from "@/lib/services/categories.service";

const CategoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});

// ... existing PATCH handler ...

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate path parameter
    const idValidation = CategoryIdSchema.safeParse({ id: params.id });

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

    const { id: categoryId } = idValidation.data;

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
    await CategoriesService.deleteCategory(locals.supabase, categoryId);

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
            message: "Category not found",
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
            message: "You do not have permission to delete this category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "NOT_DELETABLE") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Cannot delete non-deletable category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 6. Handle unexpected errors
    console.error("[Delete Category API] Unexpected error:", error);

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
- Invalid UUID → 400
- Missing id → 404 (Astro routing)
- Valid UUID → proceeds to authentication

### Step 5: Test Authentication
- No token → 401
- Invalid token → 401
- Expired token → 401
- Valid token → proceeds to deletion

### Step 6: Test Successful Deletion
- Delete own deletable category → 204 No Content
- Verify category removed from database
- Verify empty response body
- Verify Content-Length: 0

### Step 7: Test Transaction Reassignment
- Create category with transactions
- Delete category
- Verify transactions reassigned to "Other" category
- Verify transaction data otherwise unchanged

### Step 8: Test Authorization (403)
- User A tries to delete User B's category → 403
- User tries to delete "Other" category → 403 "Cannot delete non-deletable category"
- Verify category still exists after failed attempt

### Step 9: Test Not Found (404)
- Delete non-existent category → 404
- Delete already-deleted category → 404

### Step 10: Test Idempotency
- Delete category twice
- First request → 204 No Content
- Second request → 404 Not Found

### Step 11: Test Database State
- Category removed from database
- Transactions preserved and reassigned
- "Other" category unchanged
- Other users' categories unaffected

### Step 12: Test Trigger Execution
- Verify trigger reassigns all transactions
- Verify trigger executes atomically
- Verify transactions.category_id updated correctly
- No transactions left with deleted category_id

### Step 13: Test "Other" Category Protection
- Try to delete "Other" category → 403
- Verify "Other" remains in database
- Verify error message is clear
- Verify RLS policy blocks deletion

### Step 14: Test Edge Cases
- Delete category with 0 transactions
- Delete category with 1 transaction
- Delete category with 1000+ transactions
- Concurrent deletion requests
- Delete category while transactions being created

### Step 15: Integration Testing
- Create category, add transactions, delete category
- Verify complete lifecycle
- Test with multiple users simultaneously
- Verify no race conditions

---

## 10. Testing Checklist

### Unit Tests (Service Layer)
- [ ] Deletes category successfully
- [ ] Throws NOT_FOUND for non-existent category
- [ ] Throws FORBIDDEN for other user's category
- [ ] Throws NOT_DELETABLE for "Other" category
- [ ] Returns void on success
- [ ] Verifies user authentication

### Integration Tests (API Route)
- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for invalid category ID
- [ ] Returns 403 for other user's category
- [ ] Returns 403 for "Other" category
- [ ] Returns 404 for non-existent category
- [ ] Returns 204 with no content for successful deletion
- [ ] Response has no body
- [ ] Content-Length is 0

### Database Tests
- [ ] Category removed from database
- [ ] DELETE affects exactly 1 row (success case)
- [ ] Trigger reassigns all associated transactions
- [ ] Transactions updated to "Other" category
- [ ] "Other" category remains in database
- [ ] RLS prevents deleting other user's categories

### Trigger Tests
- [ ] Trigger executes before deletion
- [ ] Trigger finds correct "Other" category
- [ ] Trigger updates all transactions atomically
- [ ] Trigger allows deletion to proceed
- [ ] Trigger doesn't affect other users' data

### Side Effects Tests
- [ ] Deleted category not in GET /categories
- [ ] Transactions still visible in GET /transactions
- [ ] Transactions show "Other" as category
- [ ] Dashboard reflects reassigned transactions
- [ ] Other user's data unaffected

### End-to-End Tests
- [ ] Full DELETE request removes category
- [ ] Transactions preserved and reassigned
- [ ] Second DELETE returns 404
- [ ] Multiple users delete independently
- [ ] Response time acceptable (< 200ms)
- [ ] Concurrent deletions handled correctly

---

## 11. Future Enhancements

### Soft Delete
1. **Add deleted_at Column**: Timestamp for soft deletion
2. **Filter Queries**: Exclude soft-deleted categories
3. **Permanent Deletion**: Admin endpoint for hard delete
4. **Recovery**: Endpoint to undelete categories

### Audit Trail
1. **Deletion Log**: Record who deleted what and when
2. **Retention**: Keep deleted category data for X days
3. **Compliance**: Meet data retention requirements

### Bulk Operations
1. **Bulk Delete**: Delete multiple categories at once
2. **Delete All Custom**: Delete all user-created categories
3. **Reset to Default**: Delete all custom, keep defaults

### Confirmation
1. **Require Confirmation**: Two-step deletion for categories with many transactions
2. **Confirmation Token**: Time-limited token for deletion
3. **Preview**: Show how many transactions will be reassigned

### API Improvements
1. **Return Affected Count**: Return number of transactions reassigned
2. **Return Statistics**: Include deletion summary in response (as 200 instead of 204)
3. **Async Processing**: For categories with many transactions, process deletion asynchronously

---

## Appendix A: Example Requests and Responses

### Successful Deletion
**Request:**
```bash
DELETE /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12
Authorization: Bearer <JWT_TOKEN>
```

**Response (204 No Content):**
```
HTTP/1.1 204 No Content
Content-Length: 0
```

**Side Effect:**
- Category "Subscriptions" deleted
- 5 transactions reassigned from "Subscriptions" to "Other"

### Invalid Category ID
**Request:**
```bash
DELETE /api/categories/invalid-uuid
Authorization: Bearer <JWT_TOKEN>
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid category ID format"
  }
}
```

### Try to Delete "Other" Category
**Request:**
```bash
DELETE /api/categories/<other-category-id>
Authorization: Bearer <JWT_TOKEN>
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden",
  "message": "Cannot delete non-deletable category"
}
```

### Category Not Found
**Request:**
```bash
DELETE /api/categories/00000000-0000-0000-0000-000000000000
Authorization: Bearer <JWT_TOKEN>
```

**Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Category not found"
}
```

### Forbidden (Other User's Category)
**Request:**
```bash
DELETE /api/categories/d5f9c2e6-c9f1-5c2b-ab2b-a0g8b8e8f8f8
Authorization: Bearer <JWT_TOKEN>
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to delete this category"
}
```

### Missing Authentication
**Request:**
```bash
DELETE /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12
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
DELETE /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12
Authorization: Bearer <JWT_TOKEN>
```

**Response (204 No Content):**
```
HTTP/1.1 204 No Content
```

**Request (second time - same ID):**
```bash
DELETE /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12
Authorization: Bearer <JWT_TOKEN>
```

**Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Category not found"
}
```

---

## Appendix B: Database Trigger Details

### Trigger Function
```sql
-- Function executed by trigger
CREATE OR REPLACE FUNCTION reassign_transactions_to_other()
RETURNS TRIGGER AS $$
DECLARE
  other_category_id UUID;
BEGIN
  -- Find the user's "Other" category (is_deletable = false)
  SELECT id INTO other_category_id
  FROM categories
  WHERE user_id = OLD.user_id
    AND is_deletable = false
  LIMIT 1;

  -- If "Other" category not found, raise exception
  IF other_category_id IS NULL THEN
    RAISE EXCEPTION 'Other category not found for user %', OLD.user_id;
  END IF;

  -- Update all transactions from deleted category to "Other"
  UPDATE transactions
  SET category_id = other_category_id
  WHERE category_id = OLD.id;

  -- Log for debugging (optional)
  RAISE NOTICE 'Reassigned % transactions from category % to Other category %', 
    (SELECT COUNT(*) FROM transactions WHERE category_id = other_category_id),
    OLD.id,
    other_category_id;

  -- Allow the deletion to proceed
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Definition
```sql
-- Create trigger on categories table
CREATE TRIGGER reassign_transactions_before_category_delete
BEFORE DELETE ON categories
FOR EACH ROW
EXECUTE FUNCTION reassign_transactions_to_other();
```

### Trigger Behavior
1. **Timing**: BEFORE DELETE (runs before category is actually deleted)
2. **Granularity**: FOR EACH ROW (runs once per deleted category)
3. **Process**:
   - Find user's "Other" category
   - Update all transactions with deleted category_id
   - Return OLD to allow deletion to proceed
4. **Atomicity**: Runs in same transaction as DELETE
5. **Rollback**: If trigger fails, entire deletion rolls back

---

## Appendix C: RLS Policy for Categories DELETE

### RLS Policy
```sql
-- RLS policy for deleting categories
CREATE POLICY "Users can delete their own deletable categories"
ON categories
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_deletable = true
);
```

### Policy Breakdown
- **Operation**: DELETE
- **Target**: authenticated users only
- **Conditions**:
  1. `auth.uid() = user_id` - User owns the category
  2. `is_deletable = true` - Category is deletable

### Multi-Layer Protection
1. **RLS Policy**: Database-level enforcement
2. **Application Logic**: Service layer checks is_deletable
3. **Both Required**: Defense in depth

---

## Appendix D: Security Checklist

### Authentication
- [ ] JWT token required
- [ ] Token validated before processing
- [ ] Invalid tokens rejected with 401

### Authorization
- [ ] RLS policies enforced
- [ ] User can only delete own categories
- [ ] Cannot delete "Other" category
- [ ] 403 returned for unauthorized access

### Information Disclosure
- [ ] 404 vs 403 properly distinguished
- [ ] Error messages don't leak sensitive info
- [ ] No category existence revealed to unauthorized users

### Data Integrity
- [ ] Trigger reassigns transactions before deletion
- [ ] Transactions preserved after category deletion
- [ ] "Other" category always exists
- [ ] No orphaned transactions

### Audit & Compliance
- [ ] Deletions logged for audit
- [ ] Transactions preserved (not deleted)
- [ ] Complies with data retention policies
- [ ] User aware deletion is permanent

---

This implementation plan provides comprehensive guidance for implementing the DELETE /categories/{id} endpoint. Follow the steps sequentially, test the trigger thoroughly, and ensure proper handling of the "Other" category protection and transaction reassignment.

