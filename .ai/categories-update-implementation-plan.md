# API Endpoint Implementation Plan: PATCH /categories/{id}

## Analysis

### Key Points from API Specification

- **Endpoint**: `PATCH /api/categories/{id}`
- **Purpose**: Update an existing category's name
- **Authentication**: Required (JWT-based via Supabase)
- **Request includes**:
  - Path parameter: category id (UUID)
  - Body: { name: string }
- **Response**: Updated category with id, name, isDeletable
- **Success**: 200 OK
- **Errors**:
  - 400 Bad Request (validation errors)
  - 401 Unauthorized (not authenticated)
  - 403 Forbidden (trying to update non-editable category like "Other" or another user's category)
  - 404 Not Found (category doesn't exist)
  - 409 Conflict (new name already exists for user)

### Required and Optional Parameters

**Path Parameters:**

- `id` (UUID, required): ID of the category to update

**Request Body Fields:**

- `name` (string, required): New category name, max 100 characters, must be unique per user

### Necessary DTOs and Command Models

- `UpdateCategoryCommand` (already defined in `src/types.ts`):
  - Contains: name
- `UpdateCategoryResponseDto` (already defined in `src/types.ts`):
  - Alias for `CategoryDto`
  - Contains: id, name, isDeletable

### Service Layer Extraction

Service method to be added to: `src/lib/services/categories.service.ts`

This service will:

- Accept `SupabaseClient`, category `id`, and `UpdateCategoryCommand`
- Validate that category exists and belongs to user
- Validate that category is editable (is_deletable = true)
- Check for duplicate name
- Update category name
- Return data in `UpdateCategoryResponseDto` format

### Input Validation Strategy

Using Zod schemas:

1. **Path Parameter Schema**: Validate id is valid UUID
2. **Request Body Schema**: Validate name field
   - name: required, non-empty string, max 100 characters
   - trim whitespace
3. **Business Validation**:
   - Verify category exists and belongs to user (via RLS)
   - Verify category is editable (is_deletable = true)
   - Verify new name is unique for user
   - Return 403 if trying to edit "Other" category

### Security Considerations

- **Authentication**: User must be authenticated
- **Authorization**:
  - User can only update their own categories (RLS enforces)
  - User cannot update non-editable categories (is_deletable = false)
  - Return 403 if trying to update another user's category
  - Return 403 if trying to update "Other" category
  - Return 404 if category doesn't exist
- **Data Validation**: Strict validation prevents invalid updates
- **SQL Injection**: Prevented by Supabase parameterized queries

### Error Scenarios and Status Codes

1. **400 Bad Request**:
   - Invalid UUID format for id
   - Missing name field
   - Empty name
   - Name too long (> 100 characters)

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token

3. **403 Forbidden**:
   - Category exists but belongs to different user
   - Category is non-editable (is_deletable = false, i.e., "Other")

4. **404 Not Found**:
   - Category with given id doesn't exist

5. **409 Conflict**:
   - New name already exists for user (except if renaming to same name)

6. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during update

---

## 1. Endpoint Overview

The PATCH /categories/{id} endpoint allows authenticated users to rename their editable categories. Users cannot rename the system "Other" category or categories belonging to other users. The endpoint validates ownership, ensures the category is editable, checks for name uniqueness, and returns the updated category object.

**Key Features:**

- Updates category name in `categories` table
- Validates ownership through RLS
- Prevents editing non-deletable categories ("Other")
- Enforces name uniqueness per user
- Validates all provided data
- Returns complete updated category
- Preserves immutable fields (id, user_id, is_deletable, created_at)

---

## 2. Request Details

### HTTP Method

`PATCH`

### URL Structure

```
/api/categories/{id}
```

### Path Parameters

- **id** (string, required)
  - Description: UUID of the category to update
  - Format: Valid UUID
  - Example: `c3d4e5f6-a7b8-9012-3456-7890abcdef12`

### Request Headers

- **Content-Type**: `application/json` (required)
- **Authorization**: `Bearer <JWT_TOKEN>` (required)

### Request Body

#### Structure

```json
{
  "name": "Monthly Subscriptions"
}
```

#### Field Descriptions

- **name** (string, required)
  - Description: New category name
  - Constraints: Non-empty, max 100 characters, unique per user
  - Example: `"Monthly Subscriptions"`

### Example Requests

#### Rename Category

```bash
curl -X PATCH "https://api.example.com/api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "Monthly Subscriptions"
  }'
```

#### Rename with Trimming

```bash
curl -X PATCH "https://api.example.com/api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "  Travel Expenses  "
  }'
```

---

## 3. Utilized Types

### Command Model

**UpdateCategoryCommand** (defined in `src/types.ts`):

```typescript
export type UpdateCategoryCommand = Pick<TablesUpdate<"categories"], "name">;

// Expands to:
{
  name: string;
}
```

### Response DTO

**UpdateCategoryResponseDto** (defined in `src/types.ts`):

```typescript
export type UpdateCategoryResponseDto = CategoryDto;

// Which is:
{
  id: string;
  name: string;
  isDeletable: boolean;
}
```

### Validation Schemas

**Path Parameter Validation:**

```typescript
const CategoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});
```

**Request Body Validation:**

```typescript
const UpdateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .max(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
});
```

### Database Types

**TablesUpdate<"categories">** (from `src/db/database.types.ts`):

```typescript
{
  created_at?: string;
  id?: string;
  is_deletable?: boolean;
  name?: string;
  user_id?: string;
}
```

---

## 4. Response Details

### Success Response (200 OK)

#### Structure

```json
{
  "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "name": "Monthly Subscriptions",
  "isDeletable": true
}
```

#### Field Descriptions

- **id**: Category UUID (unchanged)
- **name**: Updated category name
- **isDeletable**: Whether category is deletable (unchanged)

### Error Responses

#### 400 Bad Request (Validation Errors)

**Scenarios:**

- Invalid UUID format for path parameter
- Missing name field
- Empty name
- Name too long

**Example Response:**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid category ID format",
    "name": "Name cannot be empty"
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
- Category is not editable (is_deletable = false)

**Example Response:**

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to update this category"
}
```

**For Non-Editable Category:**

```json
{
  "error": "Forbidden",
  "message": "Cannot update non-editable category"
}
```

#### 404 Not Found

**Scenarios:**

- Category with given id doesn't exist

**Example Response:**

```json
{
  "error": "Not Found",
  "message": "Category not found"
}
```

#### 409 Conflict

**Scenarios:**

- New name already exists for user

**Example Response:**

```json
{
  "error": "Conflict",
  "message": "A category with this name already exists"
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
3. **Path Validation**: Validate category ID from URL
4. **Body Parsing**: Parse JSON request body
5. **Input Validation**: Validate request body using Zod schema
6. **Service Invocation**: Call `CategoriesService.updateCategory()`
7. **Existence & Ownership Check**: Verify category exists and belongs to user
8. **Editability Check**: Verify category is editable (is_deletable = true)
9. **Uniqueness Check**: Verify new name doesn't conflict
10. **Database Update**: Update category name
11. **Response Formation**: Format data into `UpdateCategoryResponseDto`
12. **Response Delivery**: Return JSON response with 200 status

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/categories/[id].ts`)

```
1. Check HTTP method is PATCH
2. Extract id from path params
3. Validate id is valid UUID
4. If invalid UUID → return 400 error
5. Get authenticated user from context.locals.supabase
6. If user not authenticated → return 401 error
7. Parse request body as JSON
8. Validate request body using Zod schema
9. If validation fails → return 400 error with details
10. If validation passes → proceed to service layer
```

#### Step 2: Service Layer (`src/lib/services/categories.service.ts`)

```
1. Receive supabase client, category id, and UpdateCategoryCommand
2. Check if category exists and get its data:
   - SELECT id, user_id, is_deletable, name WHERE id = ?
   - RLS ensures user can only see their own categories
3. If not found → throw NOT_FOUND
4. If user_id doesn't match → throw FORBIDDEN (shouldn't happen with RLS)
5. If is_deletable = false → throw NOT_EDITABLE (403)
6. If new name equals current name → return current category (no-op)
7. Execute UPDATE query:
   - UPDATE categories SET name = ? WHERE id = ? AND user_id = ?
   - UNIQUE constraint checks (user_id, name)
8. If unique constraint violation → throw DUPLICATE_NAME (409)
9. Fetch updated category
10. Transform to DTO (is_deletable → isDeletable)
11. Return UpdateCategoryResponseDto
```

#### Step 3: Database Interaction (Supabase)

**Check Category Existence and Editability:**

```sql
SELECT id, user_id, is_deletable, name
FROM categories
WHERE
  id = 'c3d4e5f6-a7b8-9012-3456-7890abcdef12'
  AND user_id = '<authenticated_user_id>'; -- Applied by RLS
```

**Update Query:**

```sql
UPDATE categories
SET name = 'Monthly Subscriptions'
WHERE
  id = 'c3d4e5f6-a7b8-9012-3456-7890abcdef12'
  AND user_id = '<authenticated_user_id>' -- Applied by RLS
  AND is_deletable = true; -- Additional safety check
```

**Unique Constraint Check (automatic):**

```sql
-- UNIQUE (user_id, name) constraint
-- Ensures new name is unique per user
-- Violation returns error code 23505
```

#### Step 4: Determining Error Codes

```typescript
// Category not found or belongs to other user
if (!existingCategory) {
  throw new Error("NOT_FOUND");
}

// Category is not editable
if (!existingCategory.is_deletable) {
  throw new Error("NOT_EDITABLE"); // 403
}

// New name already exists
if (error.code === "23505") {
  throw new Error("DUPLICATE_NAME"); // 409
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
  - RLS ensures user can only see/update their own categories
  - Cannot update categories belonging to other users
  - Distinguish between 404 (doesn't exist) and 403 (not editable)
- **Editability Control**:
  - Check is_deletable flag before allowing update
  - "Other" category has is_deletable = false
  - Return 403 for non-editable categories

### Input Validation

- **Path Parameter**: UUID format validation
- **Request Body Sanitization**:
  - Strict Zod schema validation
  - Type checking for name field
  - Length validation (max 100 chars)
  - Whitespace trimming
  - Empty string prevention

### Data Integrity

- **Database Constraints**:
  - UNIQUE constraint on (user_id, name)
  - NOT NULL constraint on name
  - CHECK constraint on name length
- **Immutable Fields**:
  - id cannot be changed
  - user_id cannot be changed
  - is_deletable cannot be changed
  - created_at cannot be changed

### Preventing Common Attacks

- **SQL Injection**: Supabase uses parameterized queries
- **Mass Assignment**: Only accept name from UpdateCategoryCommand
- **Privilege Escalation**: RLS prevents updating other users' categories
- **Protected Category Bypass**: Check is_deletable flag

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Invalid Category ID

```typescript
// URL: PATCH /api/categories/invalid-id

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    id: "Invalid category ID format"
  }
}
```

#### Scenario 2: Missing Name Field

```typescript
// Request body: {}

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    name: "Name is required"
  }
}
```

#### Scenario 3: Empty Name

```typescript
// Request body: { "name": "" }

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    name: "Name cannot be empty"
  }
}
```

#### Scenario 4: Name Too Long

```typescript
// Request body: { "name": "<101 characters>" }

Response: {
  statusCode: 400,
  error: "Bad Request",
  message: "Validation failed",
  details: {
    name: "Name must be at most 100 characters"
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

#### Scenario 1: Category Belongs to Another User

```typescript
// Category exists but user_id doesn't match

Response: {
  statusCode: 403,
  error: "Forbidden",
  message: "You do not have permission to update this category"
}
```

#### Scenario 2: Non-Editable Category ("Other")

```typescript
// is_deletable = false

Response: {
  statusCode: 403,
  error: "Forbidden",
  message: "Cannot update non-editable category"
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

### Conflict Errors (409 Conflict)

#### Scenario 1: Duplicate Name

```typescript
// User already has a category with new name
// Request: { "name": "Food" }

Response: {
  statusCode: 409,
  error: "Conflict",
  message: "A category with this name already exists"
}
```

#### Scenario 2: Duplicate After Trimming

```typescript
// User has category "Travel"
// Request: { "name": "  Travel  " }

Response: {
  statusCode: 409,
  error: "Conflict",
  message: "A category with this name already exists"
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
console.error("[Update Category API] Database error:", error)
```

### Error Handling Best Practices

1. **Distinguish Error Types**: 403 for not editable vs not owned
2. **Specific Error Messages**: Help client understand what's wrong
3. **Security**: Don't leak info about other users' categories
4. **Logging**: Log all errors with context
5. **Consistent Format**: Same error structure across endpoints

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Two Database Queries

- **Issue**: SELECT to check editability + UPDATE
- **Impact**: Two database round-trips
- **Mitigation**:
  - Could use single UPDATE with WHERE clause
  - Current approach is clearer for error handling

#### 2. Unique Constraint Check

- **Issue**: Database must check for duplicate name during update
- **Impact**: Additional lookup
- **Mitigation**:
  - UNIQUE index makes this check fast
  - Skip check if name unchanged

#### 3. RLS Policy Evaluation

- **Issue**: RLS evaluated on SELECT and UPDATE
- **Impact**: Slight overhead per request
- **Mitigation**:
  - Simple equality checks
  - Indexed user_id
  - Negligible impact

### Optimization Strategies

#### 1. Skip Update if Name Unchanged

```typescript
// In service layer
if (existingCategory.name === command.name) {
  // Name unchanged, return current category
  return {
    id: existingCategory.id,
    name: existingCategory.name,
    isDeletable: existingCategory.is_deletable,
  };
}
```

#### 2. Combined Query Approach (Alternative)

```typescript
// Single UPDATE with complex WHERE clause
const { data, error } = await supabase
  .from("categories")
  .update({ name: command.name })
  .eq("id", categoryId)
  .eq("is_deletable", true)
  .select()
  .single();

// Returns 0 rows if category not found or not editable
```

#### 3. Index Optimization

```sql
-- Ensure indexes exist:
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE UNIQUE INDEX idx_categories_user_name ON categories(user_id, name);
CREATE INDEX idx_categories_id_user ON categories(id, user_id);
```

### Expected Performance

#### Best Case (Valid Update, No Duplicate)

- **Total Response Time**: < 150ms
- **Validation Time**: < 5ms
- **Check Query**: < 30ms
- **Update Query**: < 50ms
- **JSON Serialization**: < 5ms

#### No-Op Case (Name Unchanged)

- **Total Response Time**: < 100ms
- **Check Query**: < 30ms
- **No update executed**
- **Fast return**

#### Conflict Case (409)

- **Total Response Time**: < 150ms
- **Check Query**: < 30ms
- **Update Attempt**: < 50ms (fails on constraint)
- **Error Response**: < 5ms

#### Worst Case (Validation Error)

- **Total Response Time**: < 50ms
- **Fails Fast**: No database interaction
- **Validation Only**: Quick Zod schema check

### Monitoring Recommendations

- **Log Update Times**: Track slow updates (> 200ms)
- **Track Error Rates**: Monitor 400, 403, 404, 409, 500 errors
- **No-Op Updates**: Track how often name unchanged
- **Non-Editable Attempts**: Monitor 403 for "Other" category

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schemas

**File**: `src/pages/api/categories/[id].ts`

```typescript
import { z } from "zod";

const CategoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});

const UpdateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
});

type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
```

### Step 2: Add Service Method

**File**: `src/lib/services/categories.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { UpdateCategoryCommand, UpdateCategoryResponseDto } from "@/types";

export class CategoriesService {
  // ... existing methods ...

  /**
   * Update a category's name
   * @param supabase - Authenticated Supabase client
   * @param categoryId - ID of category to update
   * @param command - Update data
   * @returns Updated category
   * @throws Error if not found, forbidden, or duplicate name
   */
  static async updateCategory(
    supabase: SupabaseClient,
    categoryId: string,
    command: UpdateCategoryCommand
  ): Promise<UpdateCategoryResponseDto> {
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
      .select("id, user_id, is_deletable, name")
      .eq("id", categoryId)
      .single();

    if (fetchError || !existingCategory) {
      throw new Error("NOT_FOUND");
    }

    // Verify category belongs to user (RLS should handle this, but double-check)
    if (existingCategory.user_id !== user.id) {
      throw new Error("FORBIDDEN");
    }

    // Check if category is editable
    if (!existingCategory.is_deletable) {
      throw new Error("NOT_EDITABLE");
    }

    // If name unchanged, return current category (no-op)
    if (existingCategory.name === command.name) {
      return {
        id: existingCategory.id,
        name: existingCategory.name,
        isDeletable: existingCategory.is_deletable,
      };
    }

    // Update category name
    const { data, error } = await supabase
      .from("categories")
      .update({ name: command.name })
      .eq("id", categoryId)
      .select("id, name, is_deletable")
      .single();

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === "23505") {
        throw new Error("DUPLICATE_NAME");
      }
      throw new Error(`Failed to update category: ${error.message}`);
    }

    if (!data) {
      throw new Error("Category updated but could not be retrieved");
    }

    // Transform to DTO
    return {
      id: data.id,
      name: data.name,
      isDeletable: data.is_deletable,
    };
  }
}
```

### Step 3: Create Dynamic API Route Handler

**File**: `src/pages/api/categories/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { CategoriesService } from "@/lib/services/categories.service";

const CategoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});

const UpdateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
});

export const PATCH: APIRoute = async ({ params, request, locals }) => {
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
    const validationResult = UpdateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: {
            name: errors.name?._errors[0],
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
    const category = await CategoriesService.updateCategory(locals.supabase, categoryId, {
      name: validData.name,
    });

    // 6. Return success response
    return new Response(JSON.stringify(category), {
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
            message: "You do not have permission to update this category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "NOT_EDITABLE") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "Cannot update non-editable category",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "DUPLICATE_NAME") {
        return new Response(
          JSON.stringify({
            error: "Conflict",
            message: "A category with this name already exists",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 8. Handle unexpected errors
    console.error("[Update Category API] Unexpected error:", error);

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
- Valid UUID → proceeds to body validation

### Step 5: Test Request Body Validation

- Missing name → 400
- Empty name → 400
- Whitespace only → 400
- Name too long → 400
- Valid name → proceeds to service

### Step 6: Test Authentication

- No token → 401
- Invalid token → 401
- Expired token → 401
- Valid token → proceeds

### Step 7: Test Authorization (403)

- User A tries to update User B's category → 403
- User tries to update "Other" category → 403 "Cannot update non-editable category"
- User updates own editable category → ✓ 200

### Step 8: Test Not Found (404)

- Update non-existent category → 404
- Update deleted category → 404

### Step 9: Test Duplicate Detection (409)

- User has categories "Food" and "Bills"
- Rename "Bills" to "Food" → 409
- Rename "Bills" to " Food " → 409 (after trim)
- Rename "Bills" to "bills" → ✓ 200 (case-sensitive)

### Step 10: Test No-Op Update

- Rename category to its current name → 200
- Verify no database UPDATE executed
- Verify response contains unchanged data

### Step 11: Test Response Format

- Status code is 200
- Response contains id, name, isDeletable
- name is updated
- id unchanged
- isDeletable unchanged

### Step 12: Test Database State

- Category name updated correctly
- Other fields unchanged (id, user_id, is_deletable, created_at)

### Step 13: Test Edge Cases

- Rename with special characters
- Rename to very long name (100 chars)
- Concurrent updates to same category
- Update category currently in use by transactions

### Step 14: Test "Other" Category Protection

- Try to rename "Other" category → 403
- Verify "Other" remains unchanged
- Verify error message is clear

### Step 15: Integration Testing

- Update category, then GET to verify
- Update category, verify transactions still linked
- Multiple updates to same category
- Concurrent updates from same user

---

## 10. Testing Checklist

### Unit Tests (Service Layer)

- [ ] Updates category successfully with valid data
- [ ] Returns unchanged category if name same (no-op)
- [ ] Throws NOT_FOUND for non-existent category
- [ ] Throws FORBIDDEN for other user's category
- [ ] Throws NOT_EDITABLE for "Other" category
- [ ] Throws DUPLICATE_NAME for duplicate name
- [ ] Preserves immutable fields
- [ ] Trims whitespace from name

### Integration Tests (API Route)

- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for invalid category ID
- [ ] Returns 400 for missing/invalid name
- [ ] Returns 403 for other user's category
- [ ] Returns 403 for "Other" category
- [ ] Returns 404 for non-existent category
- [ ] Returns 409 for duplicate name
- [ ] Returns 200 with updated data for valid request

### Database Tests

- [ ] Only name field updated in database
- [ ] Immutable fields unchanged
- [ ] UNIQUE constraint prevents duplicates
- [ ] is_deletable = false blocks update (via app logic)

### End-to-End Tests

- [ ] Full PATCH request updates category
- [ ] Updated category visible in GET /categories
- [ ] Transactions still linked to renamed category
- [ ] Multiple users update independently
- [ ] Response time acceptable (< 200ms)

---

## 11. Future Enhancements

### Optimistic Locking

1. **Version Field**: Add version for concurrency control
2. **Conflict Detection**: Detect concurrent modifications
3. **Conflict Resolution**: Return 409 if version mismatch

### Bulk Updates

1. **Rename Multiple**: Rename several categories at once
2. **Batch Operations**: Update with transaction safety

### Smart Features

1. **Case-Insensitive Names**: Prevent "Food" and "food"
2. **Name Suggestions**: Suggest similar names
3. **Rename History**: Track name changes

### API Improvements

1. **Partial Response**: Return only changed fields
2. **ETags**: Support conditional updates

---

## Appendix A: Example Requests and Responses

### Successful Update

**Request:**

```bash
PATCH /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "name": "Monthly Subscriptions"
}
```

**Response (200 OK):**

```json
{
  "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "name": "Monthly Subscriptions",
  "isDeletable": true
}
```

### Try to Rename "Other" Category

**Request:**

```bash
PATCH /api/categories/<other-category-id>

{
  "name": "Something Else"
}
```

**Response (403 Forbidden):**

```json
{
  "error": "Forbidden",
  "message": "Cannot update non-editable category"
}
```

### Duplicate Name

**Request:**

```bash
PATCH /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12

{
  "name": "Food"
}
```

**Response (409 Conflict):**

```json
{
  "error": "Conflict",
  "message": "A category with this name already exists"
}
```

### Category Not Found

**Request:**

```bash
PATCH /api/categories/00000000-0000-0000-0000-000000000000

{
  "name": "New Name"
}
```

**Response (404 Not Found):**

```json
{
  "error": "Not Found",
  "message": "Category not found"
}
```

---

This implementation plan provides comprehensive guidance for implementing the PATCH /categories/{id} endpoint. Follow the steps sequentially, test thoroughly, and ensure proper handling of the non-editable "Other" category.
