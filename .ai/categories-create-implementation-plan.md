# API Endpoint Implementation Plan: POST /categories

## Analysis

### Key Points from API Specification
- **Endpoint**: `POST /api/categories`
- **Purpose**: Create a new category
- **Authentication**: Required (JWT-based via Supabase)
- **Request includes**:
  - Body: { name: string }
- **Response**: Newly created category with id, name, isDeletable
- **Success**: 201 Created
- **Errors**: 
  - 400 Bad Request (validation errors)
  - 401 Unauthorized (not authenticated)
  - 409 Conflict (category name already exists for user)

### Required and Optional Parameters
**Required Request Body Fields:**
- `name` (string): Category name, max 100 characters, must be unique per user

**Optional Request Body Fields:** None

### Necessary DTOs and Command Models
- `CreateCategoryCommand` (already defined in `src/types.ts`):
  - Contains: name
- `CreateCategoryResponseDto` (already defined in `src/types.ts`):
  - Alias for `CategoryDto`
  - Contains: id, name, isDeletable

### Service Layer Extraction
Service method to be added to: `src/lib/services/categories.service.ts`

This service will:
- Accept `SupabaseClient` and `CreateCategoryCommand`
- Validate category name
- Insert new category into database
- Return data in `CreateCategoryResponseDto` format

### Input Validation Strategy
Using Zod schemas:
1. **Request Body Schema**: Validate name field
   - name: required, non-empty string, max 100 characters
   - trim whitespace
   - prevent empty string after trimming
2. **Business Validation**:
   - Uniqueness enforced by database UNIQUE constraint
   - Return 409 on duplicate name

### Security Considerations
- **Authentication**: User must be authenticated
- **Authorization**: 
  - User can only create categories for themselves
  - user_id automatically set from authenticated user
  - RLS enforces user_id matching
- **Data Validation**: Strict validation prevents invalid data
- **SQL Injection**: Prevented by Supabase parameterized queries

### Error Scenarios and Status Codes
1. **400 Bad Request**:
   - Missing name field
   - Empty name (or only whitespace)
   - Name too long (> 100 characters)

2. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token

3. **409 Conflict**:
   - Category with same name already exists for user
   - Case-sensitive duplicate check

4. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during insertion

---

## 1. Endpoint Overview

The POST /categories endpoint allows authenticated users to create new categories for organizing their transactions. Each category must have a unique name within the user's account. The endpoint validates the category name, ensures uniqueness, and returns the complete category object including the generated ID and deletable flag.

**Key Features:**
- Creates new record in `categories` table
- Validates category name (length, non-empty)
- Enforces uniqueness per user via database constraint
- Automatically sets user_id from authenticated user
- Automatically sets is_deletable to true
- Generates UUID and timestamps automatically
- Returns complete category object

---

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
```
/api/categories
```

### Request Headers
- **Content-Type**: `application/json` (required)
- **Authorization**: `Bearer <JWT_TOKEN>` (required)

### Request Body

#### Structure
```json
{
  "name": "Subscriptions"
}
```

#### Field Descriptions
- **name** (string, required)
  - Description: Category name
  - Constraints: Non-empty, max 100 characters, unique per user
  - Example: `"Subscriptions"`

### Example Requests

#### Create Category
```bash
curl -X POST "https://api.example.com/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "Subscriptions"
  }'
```

#### Create Category with Trimming
```bash
curl -X POST "https://api.example.com/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "  Travel  "
  }'
```

---

## 3. Utilized Types

### Command Model
**CreateCategoryCommand** (defined in `src/types.ts`):
```typescript
export type CreateCategoryCommand = Pick<TablesInsert<"categories">, "name">;

// Expands to:
{
  name: string;
}
```

### Response DTO
**CreateCategoryResponseDto** (defined in `src/types.ts`):
```typescript
export type CreateCategoryResponseDto = CategoryDto;

// Which is:
{
  id: string;
  name: string;
  isDeletable: boolean;
}
```

### Validation Schema
**Request Body Validation** (to be created with Zod):
```typescript
const CreateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
});
```

### Database Types
**TablesInsert<"categories">** (from `src/db/database.types.ts`):
```typescript
{
  created_at?: string;
  id?: string;
  is_deletable?: boolean;
  name: string;
  user_id: string;
}
```

---

## 4. Response Details

### Success Response (201 Created)

#### Structure
```json
{
  "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "name": "Subscriptions",
  "isDeletable": true
}
```

#### Field Descriptions
- **id**: Auto-generated UUID for the category
- **name**: Category name as provided (after trimming)
- **isDeletable**: Always `true` for user-created categories

### Error Responses

#### 400 Bad Request (Validation Errors)
**Scenarios:**
- Missing name field
- Empty name
- Name only whitespace
- Name exceeds 100 characters

**Example Response:**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
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

#### 409 Conflict
**Scenarios:**
- Category with same name already exists for user

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
- Unexpected errors during insert

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
5. **Service Invocation**: Call `CategoriesService.createCategory()`
6. **Database Insert**: Insert new category record
7. **Uniqueness Check**: Database enforces UNIQUE constraint
8. **Response Formation**: Format data into `CreateCategoryResponseDto`
9. **Response Delivery**: Return JSON response with 201 status

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/categories.ts`)
```
1. Check HTTP method is POST
2. Get authenticated user from context.locals.supabase
3. If user not authenticated → return 401 error
4. Parse request body as JSON
5. Validate request body using Zod schema (trim name)
6. If validation fails → return 400 error with details
7. If validation passes → proceed to service layer
```

#### Step 2: Service Layer (`src/lib/services/categories.service.ts`)
```
1. Receive supabase client and CreateCategoryCommand
2. Extract user_id from authenticated session
3. Prepare insert data:
   - name from command (already trimmed by Zod)
   - user_id from authenticated user
   - is_deletable defaults to true
4. Execute INSERT query:
   - INSERT INTO categories
   - Database generates id and created_at
   - UNIQUE constraint checks (user_id, name)
5. If unique constraint violation → throw CONFLICT error
6. Transform to DTO (is_deletable → isDeletable)
7. Return CreateCategoryResponseDto
```

#### Step 3: Database Interaction (Supabase)

**Insert Query:**
```sql
INSERT INTO categories (
  user_id,
  name,
  is_deletable
) VALUES (
  '<authenticated_user_id>',
  'Subscriptions',
  true
)
RETURNING id, name, is_deletable;
```

**Unique Constraint Check (automatic):**
```sql
-- UNIQUE (user_id, name) constraint
-- Ensures category names are unique per user
-- Violation returns error code 23505
```

**RLS Check (automatic):**
```sql
-- RLS INSERT policy on categories:
-- auth.uid() = user_id ✓
```

#### Step 4: Data Transformation
```typescript
// Pseudo-code for transformation
const categoryDto = {
  id: dbRow.id,
  name: dbRow.name,
  isDeletable: dbRow.is_deletable // true for user-created
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
- **Category Ownership**: 
  - `user_id` automatically set to authenticated user
  - User cannot create categories for other users
  - RLS INSERT policy verifies `auth.uid() = user_id`

### Input Validation
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
- **Validation Layers**:
  - Application layer (Zod)
  - Database layer (constraints)
  - RLS layer (ownership)

### Preventing Common Attacks
- **SQL Injection**: Supabase uses parameterized queries
- **Mass Assignment**: Only accept name from CreateCategoryCommand
- **Privilege Escalation**: RLS prevents creating for other users
- **Data Tampering**: user_id set from auth token, not request body

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

#### Scenario 1: Missing Name Field
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

#### Scenario 2: Empty Name
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

#### Scenario 3: Name Only Whitespace
```typescript
// Request body: { "name": "   " }
// After trim: ""

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

### Conflict Errors (409 Conflict)

#### Scenario 1: Duplicate Category Name
```typescript
// User already has a category named "Food"
// Request body: { "name": "Food" }

Response: {
  statusCode: 409,
  error: "Conflict",
  message: "A category with this name already exists"
}
```

#### Scenario 2: Duplicate After Trimming
```typescript
// User has category "Travel"
// Request body: { "name": "  Travel  " }
// After trim: "Travel"

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
console.error("[Create Category API] Database error:", error)
```

#### Scenario 2: Insert Failure
```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Create Category API] Insert failed:", error)
```

### Error Handling Best Practices
1. **Distinguish Error Types**: 400 vs 409 vs 500
2. **Specific Error Messages**: Help client understand what's wrong
3. **Security**: Don't leak sensitive info
4. **Logging**: Log all errors with context
5. **Consistent Format**: Same error structure across endpoints

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Unique Constraint Check
- **Issue**: Database must check for duplicate name
- **Impact**: Additional lookup during insert
- **Mitigation**: 
  - UNIQUE index makes this check fast (O(log n))
  - Minimal performance impact

#### 2. RLS Policy Evaluation
- **Issue**: RLS policy evaluated on INSERT
- **Impact**: Slight overhead per request
- **Mitigation**:
  - Simple equality check on user_id
  - Negligible performance impact

### Optimization Strategies

#### 1. Database-Level Optimizations
```sql
-- Ensure unique index exists (created by UNIQUE constraint):
UNIQUE INDEX categories_user_id_name_key ON categories(user_id, name);

-- This index serves dual purpose:
-- 1. Enforces uniqueness
-- 2. Speeds up duplicate checks
```

#### 2. Efficient Duplicate Check
- UNIQUE constraint provides fastest duplicate detection
- Index-based lookup is O(log n)
- No need for separate SELECT query

#### 3. Minimal Data Transfer
- Only send name in request
- Only return id, name, isDeletable in response

### Expected Performance

#### Best Case (Valid Request, No Duplicate)
- **Total Response Time**: < 100ms
- **Validation Time**: < 5ms
- **Database Insert**: < 50ms
- **JSON Serialization**: < 5ms

#### Typical Case
- **Total Response Time**: < 150ms
- **Similar to best case**

#### Worst Case (Validation Error)
- **Total Response Time**: < 50ms
- **Fails Fast**: No database interaction
- **Validation Only**: Quick Zod schema check

#### Conflict Case (409)
- **Total Response Time**: < 100ms
- **Unique Check**: Fast index lookup
- **Returns early with 409**

### Monitoring Recommendations
- **Log Insert Times**: Track slow inserts (> 100ms)
- **Track Error Rates**: Monitor 400, 409, 500 errors
- **Validation Failures**: Track common validation errors
- **Naming Patterns**: Monitor category name trends

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
**File**: `src/pages/api/categories.ts` (or separate validation file)

```typescript
import { z } from "zod";

const CreateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
});

type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
```

### Step 2: Add Service Method
**File**: `src/lib/services/categories.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateCategoryCommand, CreateCategoryResponseDto } from "@/types";

export class CategoriesService {
  // ... existing listCategories method ...

  /**
   * Create a new category
   * @param supabase - Authenticated Supabase client
   * @param command - Category creation data
   * @returns Newly created category
   * @throws Error if duplicate name or database failure
   */
  static async createCategory(
    supabase: SupabaseClient,
    command: CreateCategoryCommand
  ): Promise<CreateCategoryResponseDto> {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Insert category
    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: command.name,
        is_deletable: true, // User-created categories are deletable
      })
      .select("id, name, is_deletable")
      .single();

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === "23505") {
        throw new Error("DUPLICATE_NAME");
      }
      throw new Error(`Failed to create category: ${error.message}`);
    }

    if (!data) {
      throw new Error("Category created but could not be retrieved");
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

### Step 3: Add POST Handler to API Route
**File**: `src/pages/api/categories.ts`

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { CategoriesService } from "@/lib/services/categories.service";

// ... existing GET handler ...

const CreateCategorySchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name must be at most 100 characters"),
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
    const validationResult = CreateCategorySchema.safeParse(body);

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

    // 4. Call service layer
    const category = await CategoriesService.createCategory(
      locals.supabase,
      {
        name: validData.name,
      }
    );

    // 5. Return success response
    return new Response(JSON.stringify(category), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle specific errors
    if (error instanceof Error && error.message === "DUPLICATE_NAME") {
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

    // 7. Handle unexpected errors
    console.error("[Create Category API] Unexpected error:", error);

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
- Valid token → expect 201
- Missing token → expect 401
- Invalid token → expect 401
- Expired token → expect 401

### Step 5: Test Validation

#### Name Validation
- Missing name → 400 "Name is required"
- Empty name `""` → 400 "Name cannot be empty"
- Whitespace only `"   "` → 400 "Name cannot be empty"
- Name with 101 chars → 400 "Name must be at most 100 characters"
- Name with 100 chars → ✓ 201
- Valid name → ✓ 201

#### Whitespace Trimming
- `"  Travel  "` → trimmed to `"Travel"` ✓
- `"\n\tFood\t\n"` → trimmed to `"Food"` ✓

### Step 6: Test Duplicate Detection (409)
- Create category "Food"
- Try to create another "Food" → 409
- Try to create "  Food  " (trims to "Food") → 409
- Create "food" (lowercase) → ✓ 201 (case-sensitive)

### Step 7: Test Response Format

#### Success Response
- Status code is 201
- Response contains id, name, isDeletable
- id is a valid UUID
- name matches input (after trimming)
- isDeletable is true

#### Error Responses
- 400 has error, message, details
- 401 has error, message
- 409 has error, message
- 500 has error, message

### Step 8: Test Database State

#### After Successful Creation
- Category exists in database
- user_id matches authenticated user
- name stored correctly (trimmed)
- is_deletable is true
- created_at is set automatically
- id is generated automatically

#### After Failed Creation
- No category created on validation failure
- No category created on 409 error
- Database state unchanged

### Step 9: Integration Testing

#### Complete Flow
- Send valid POST request
- Verify 201 response
- Verify category in database
- Query GET /categories to verify it appears in list
- Use category in POST /transactions

#### Multiple Categories
- Create multiple categories with different names
- Verify all created independently
- Verify no interference between requests

### Step 10: Test Edge Cases

#### Special Characters
- Unicode: "Кафе ☕" → ✓
- Quotes: 'Books "Reading"' → ✓
- Apostrophe: "Children's toys" → ✓
- Ampersand: "Coffee & Tea" → ✓

#### Boundary Values
- 1 character name → ✓
- 100 character name → ✓
- 101 character name → 400

#### Concurrent Requests
- Two simultaneous requests with same name
- One should succeed (201)
- One should fail (409)

### Step 11: Test Performance
- Measure time for single category creation
- Should be < 100ms
- Test with many existing categories
- Verify duplicate check is fast

### Step 12: Security Testing

#### SQL Injection Attempts
- name = "'; DROP TABLE categories; --"
- Verify parameterized query prevents injection

#### User ID Manipulation
- Try to send user_id in request body
- Verify it's ignored (not in schema)
- Verify authenticated user's ID is used

### Step 13: Test Default Categories
- Verify new users have default categories
- Verify cannot create duplicate of default category
- Verify "Other" category exists and is not deletable

### Step 14: Code Quality
- All types properly defined
- No `any` types
- DTOs match specification
- Service returns correct type
- Error handling consistent
- Code is DRY

### Step 15: Documentation
- JSDoc for service method
- Document validation rules
- Document error codes
- Add usage examples

---

## 10. Testing Checklist

### Unit Tests (Service Layer)
- [ ] Creates category successfully with valid data
- [ ] Sets user_id from authenticated user
- [ ] Sets is_deletable to true
- [ ] Returns complete category with id
- [ ] Throws DUPLICATE_NAME error for duplicate
- [ ] Throws error on database failure
- [ ] Trims whitespace from name

### Integration Tests (API Route)
- [ ] Returns 401 when not authenticated
- [ ] Returns 400 for invalid JSON body
- [ ] Returns 400 for missing name
- [ ] Returns 400 for empty name
- [ ] Returns 400 for name > 100 characters
- [ ] Returns 409 for duplicate name
- [ ] Returns 201 with correct data for valid request
- [ ] Response matches CreateCategoryResponseDto structure
- [ ] Trims whitespace from name before insertion

### Database Tests
- [ ] Category inserted with correct user_id
- [ ] Category inserted with correct name
- [ ] is_deletable set to true
- [ ] created_at timestamp generated
- [ ] id UUID generated
- [ ] UNIQUE constraint prevents duplicates
- [ ] CHECK constraint enforces name length

### End-to-End Tests
- [ ] Full request from client creates category
- [ ] Created category appears in GET /categories
- [ ] Created category can be used in transactions
- [ ] Multiple users create independent categories
- [ ] Response time acceptable (< 150ms)

---

## 11. Future Enhancements

### Validation Improvements
1. **Name Normalization**: Lowercase or normalize names
2. **Forbidden Names**: Prevent certain reserved names
3. **Profanity Filter**: Optional profanity checking
4. **Suggestions**: Suggest similar existing categories

### Feature Additions
1. **Bulk Create**: Create multiple categories at once
2. **Category Color**: Add optional color field
3. **Category Icon**: Add optional icon field
4. **Category Description**: Add optional description
5. **Category Templates**: Predefined category sets

### Business Logic
1. **Limit Categories**: Set maximum categories per user
2. **Premium Features**: More categories for paid users
3. **Category Sharing**: Share categories between users
4. **Category Import**: Import from templates or other users

### API Improvements
1. **Batch Operations**: Create multiple categories in one request
2. **Idempotency**: Support idempotency keys
3. **Webhooks**: Trigger webhooks on category creation

---

## Appendix A: Example Requests and Responses

### Successful Creation
**Request:**
```bash
POST /api/categories
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "name": "Subscriptions"
}
```

**Response (201 Created):**
```json
{
  "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "name": "Subscriptions",
  "isDeletable": true
}
```

### Missing Name
**Request:**
```bash
POST /api/categories

{}
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "name": "Name is required"
  }
}
```

### Empty Name
**Request:**
```bash
POST /api/categories

{
  "name": ""
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "name": "Name cannot be empty"
  }
}
```

### Name Too Long
**Request:**
```bash
POST /api/categories

{
  "name": "<101 character string>"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "name": "Name must be at most 100 characters"
  }
}
```

### Duplicate Name
**Request:**
```bash
POST /api/categories

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

### Whitespace Trimming
**Request:**
```bash
POST /api/categories

{
  "name": "  Travel  "
}
```

**Response (201 Created):**
```json
{
  "id": "d4e6f2g7-b8c9-0123-4567-890abcdef123",
  "name": "Travel",
  "isDeletable": true
}
```

---

This implementation plan provides comprehensive guidance for implementing the POST /categories endpoint. Follow the steps sequentially, test thoroughly at each stage, and ensure proper handling of validation, uniqueness constraints, and all error scenarios.

