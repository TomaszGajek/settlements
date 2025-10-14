# API Endpoint Implementation Plan: GET /categories

## Analysis

### Key Points from API Specification
- **Endpoint**: `GET /api/categories`
- **Purpose**: Retrieve a list of all categories for the authenticated user
- **Authentication**: Required (JWT-based via Supabase)
- **Response includes**:
  - Array of category objects
  - Each category has: id, name, isDeletable
- **No pagination**: Returns all categories at once
- **Success**: 200 OK
- **Errors**: 
  - 401 Unauthorized (not authenticated)

### Required and Optional Parameters
**Query Parameters:** None

**Request Body:** None (GET request)

### Necessary DTOs and Command Models
- `CategoryDto` (already defined in `src/types.ts`):
  - Contains: id, name, isDeletable
- `ListCategoriesResponseDto` (already defined in `src/types.ts`):
  - Array of CategoryDto

### Service Layer Extraction
A new service will be created: `src/lib/services/categories.service.ts`

This service will:
- Accept `SupabaseClient` as parameter
- Query categories for authenticated user
- Transform database rows to DTOs (is_deletable → isDeletable)
- Return data in `ListCategoriesResponseDto` format

### Input Validation Strategy
Minimal validation needed:
1. **Authentication**: Verify user is authenticated
2. **No query parameters**: No validation needed
3. **RLS**: Database automatically filters by user_id

### Security Considerations
- **Authentication**: User must be authenticated (checked via `context.locals.supabase.auth.getUser()`)
- **RLS Policies**: Database RLS automatically filters categories by user_id
- **No SQL Injection Risk**: Using Supabase client with parameterized queries
- **Authorization**: Users can only access their own categories (enforced by RLS)

### Error Scenarios and Status Codes
1. **401 Unauthorized**:
   - No JWT token provided
   - Invalid or expired JWT token
   - User not authenticated

2. **500 Internal Server Error**:
   - Database connection failure
   - Unexpected errors during data retrieval

---

## 1. Endpoint Overview

The GET /categories endpoint provides users with a complete list of their categories. This includes both user-created categories and the default categories (including the system "Other" category which cannot be deleted). The endpoint is simple and straightforward, requiring no pagination as the number of categories per user is expected to be small (typically < 50).

**Key Features:**
- Retrieves all categories from the `categories` table
- Filters by authenticated user (via RLS)
- Transforms database field names to DTO format
- Returns complete list (no pagination needed)
- Includes deletable flag for each category
- Read-only operation with no side effects

---

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/categories
```

### Query Parameters
None

### Request Headers
- **Authorization**: `Bearer <JWT_TOKEN>` (required)

### Request Body
None (GET request)

### Example Request
```bash
curl -X GET "https://api.example.com/api/categories" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 3. Utilized Types

### Response DTOs
**CategoryDto** (defined in `src/types.ts`):
```typescript
export type CategoryDto = NestedCategoryDto & {
  isDeletable: Tables<"categories">["is_deletable"];
};

// Which expands to:
{
  id: string;
  name: string;
  isDeletable: boolean;
}
```

**ListCategoriesResponseDto** (defined in `src/types.ts`):
```typescript
export type ListCategoriesResponseDto = CategoryDto[];

// Which is simply an array:
CategoryDto[]
```

### Database Types
**Tables<"categories">** (from `src/db/database.types.ts`):
```typescript
{
  id: string;
  user_id: string;
  name: string;
  is_deletable: boolean;
  created_at: string;
}
```

---

## 4. Response Details

### Success Response (200 OK)

#### Structure
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Food",
    "isDeletable": true
  },
  {
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "name": "Bills",
    "isDeletable": true
  },
  {
    "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "name": "Other",
    "isDeletable": false
  }
]
```

#### Field Descriptions
- **id**: Unique category identifier (UUID)
- **name**: Category name (unique per user)
- **isDeletable**: Whether the category can be deleted (false for "Other")

### Edge Cases
- **No Categories**: Empty array `[]` (shouldn't happen due to default categories)
- **Only Default Categories**: User has only system-created categories

**Example - New User with Default Categories:**
```json
[
  {
    "id": "uuid-1",
    "name": "Food",
    "isDeletable": true
  },
  {
    "id": "uuid-2",
    "name": "Bills",
    "isDeletable": true
  },
  {
    "id": "uuid-3",
    "name": "Salary",
    "isDeletable": true
  },
  {
    "id": "uuid-4",
    "name": "Entertainment",
    "isDeletable": true
  },
  {
    "id": "uuid-5",
    "name": "Other",
    "isDeletable": false
  }
]
```

### Error Responses

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
3. **Service Invocation**: Call `CategoriesService.listCategories()`
4. **Data Retrieval**: Service queries categories from Supabase
5. **Data Transformation**: Map database rows to DTOs
6. **Response Formation**: Format data into `ListCategoriesResponseDto`
7. **Response Delivery**: Return JSON response with 200 status

### Detailed Data Flow

#### Step 1: API Route Handler (`src/pages/api/categories.ts`)
```
1. Get authenticated user from context.locals.supabase
2. If user not authenticated → return 401 error
3. If authentication passes → proceed to service layer
```

#### Step 2: Service Layer (`src/lib/services/categories.service.ts`)
```
1. Receive supabase client
2. Query categories table:
   - Select: id, name, is_deletable
   - RLS automatically filters by user_id
   - Order by name ASC (alphabetical)
3. Transform database rows to DTOs:
   - Map is_deletable → isDeletable
   - Keep id and name as-is
4. Return array of CategoryDto
```

#### Step 3: Database Interaction (Supabase)
```sql
SELECT 
  id,
  name,
  is_deletable
FROM categories
WHERE 
  user_id = <authenticated_user_id> -- Applied by RLS
ORDER BY name ASC
```

#### Step 4: Data Transformation
```typescript
// Pseudo-code for transformation
const categoryDtos = dbRows.map(row => ({
  id: row.id,
  name: row.name,
  isDeletable: row.is_deletable
}));
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
  - Database RLS policies ensure users only access their own categories
  - Policy: `auth.uid() = user_id` on categories table
  - No explicit WHERE clause needed in application code
- **Scope**: Read-only operation with SELECT permission

### Input Validation
- **No User Input**: GET request with no parameters
- **Authentication Only**: Only need to verify JWT token

### Data Exposure Prevention
- **No Sensitive Data Leakage**:
  - Only return id, name, isDeletable
  - No user_id in response
  - No created_at timestamp (not needed by client)
  - Error messages don't reveal system internals

### Rate Limiting (Future Consideration)
- Consider implementing rate limiting to prevent abuse
- Recommended: 100 requests per minute per user

---

## 7. Error Handling

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
console.error("[Categories API] Database error:", error)
```

#### Scenario 2: Unexpected Data Format
```typescript
Response: {
  statusCode: 500,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}

// Log to server console:
console.error("[Categories API] Data processing error:", error)
```

### Error Handling Best Practices
1. **Never expose internal error details** to client in production
2. **Log all errors** with context for debugging
3. **Return consistent error format** across all endpoints
4. **Use try-catch blocks** around database operations

---

## 8. Performance Considerations

### Potential Bottlenecks

#### 1. Large Number of Categories
- **Issue**: User with many categories (> 100)
- **Impact**: Larger response payload
- **Mitigation**: 
  - Expected to be rare (most users have < 20 categories)
  - If needed, implement pagination in future
  - Consider limit warning in UI

#### 2. Database Query Performance
- **Issue**: Full table scan if user_id index is missing
- **Impact**: Slow response times
- **Mitigation**: 
  - Index on `user_id` should exist
  - Query will use this index efficiently
  - RLS policy automatically filters

### Optimization Strategies

#### 1. Database-Level Optimizations
```sql
-- Ensure index exists (should be in migrations):
CREATE INDEX idx_categories_user ON categories(user_id);

-- For ordered results:
CREATE INDEX idx_categories_user_name ON categories(user_id, name);
```

#### 2. Query Optimization
- Select only required fields (id, name, is_deletable)
- Let RLS handle user filtering (indexed)
- Order by name for consistent, user-friendly results

#### 3. Caching Strategy (Future Enhancement)
- Cache categories list for 5-10 minutes
- Invalidate cache on category create/update/delete
- Use Redis or in-memory cache
- Add `Cache-Control` headers to response

#### 4. Response Size Optimization
- Minimal data transfer (only 3 fields per category)
- No pagination overhead for small lists
- Efficient JSON serialization

### Expected Performance
- **Response Time**: < 100ms for typical user (< 50 categories)
- **Database Query Time**: < 30ms with proper index
- **JSON Serialization**: < 5ms
- **Network Transfer**: < 5ms (small payload)

### Monitoring Recommendations
- Log query execution times
- Monitor endpoint response times
- Alert on responses > 500ms
- Track error rates

---

## 9. Implementation Steps

### Step 1: Create Categories Service
**File**: `src/lib/services/categories.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { ListCategoriesResponseDto, CategoryDto } from "@/types";

export class CategoriesService {
  /**
   * Get all categories for the authenticated user
   * @param supabase - Authenticated Supabase client
   * @returns List of all user's categories
   */
  static async listCategories(
    supabase: SupabaseClient
  ): Promise<ListCategoriesResponseDto> {
    // Query categories for authenticated user
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, is_deletable")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Transform to DTOs
    const categoryDtos: CategoryDto[] = (categories || []).map((category) => ({
      id: category.id,
      name: category.name,
      isDeletable: category.is_deletable,
    }));

    return categoryDtos;
  }
}
```

### Step 2: Create API Route Handler
**File**: `src/pages/api/categories.ts`

```typescript
import type { APIRoute } from "astro";
import { CategoriesService } from "@/lib/services/categories.service";

export const GET: APIRoute = async ({ locals }) => {
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

    // 2. Call service layer
    const categories = await CategoriesService.listCategories(locals.supabase);

    // 3. Return success response
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 4. Handle unexpected errors
    console.error("[Categories API] Unexpected error:", error);

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

### Step 3: Test Authentication Flow
- **Valid Token**: Test with authenticated user → expect 200
- **Missing Token**: Test without Authorization header → expect 401
- **Invalid Token**: Test with malformed token → expect 401
- **Expired Token**: Test with expired token → expect 401

### Step 4: Test Service Layer

#### Basic Functionality
- Create test categories in database for user
- Query categories
- Verify response structure matches `ListCategoriesResponseDto`
- Verify array contains `CategoryDto` objects

#### Data Accuracy
- Verify all user's categories are returned
- Verify categories are sorted by name
- Verify `isDeletable` field is correct
- Verify "Other" category has `isDeletable: false`
- Verify user-created categories have `isDeletable: true`

#### Data Transformation
- Verify `is_deletable` mapped to `isDeletable`
- Verify `user_id` NOT in response
- Verify `created_at` NOT in response

### Step 5: Test RLS Policies

#### User Isolation
- Create categories for User A and User B
- Authenticate as User A
- Query categories
- Verify only User A's categories are returned
- Verify User B's categories are NOT visible

### Step 6: Test Edge Cases
- **New User**: Verify default categories present
- **No Custom Categories**: User has only defaults
- **Many Categories**: User with 50+ categories
- **Special Characters in Names**: Categories with unicode, quotes, etc.

### Step 7: Test Response Format

#### Success Response
- Status code is 200
- Response is valid JSON array
- Each category has id, name, isDeletable
- All fields are correct types

#### Error Responses
- 401 has error and message
- 500 has error and message
- No sensitive data leaked

### Step 8: Test Ordering
- Categories returned in alphabetical order by name
- "Other" may not be first alphabetically
- Consistent ordering across requests

### Step 9: Performance Testing

#### Query Performance
- Measure response time with various category counts
- Verify < 100ms for typical user
- Verify < 200ms for user with 100 categories

#### Index Usage
- Use database query planner to verify index usage
- Should use `idx_categories_user` or `idx_categories_user_name`

#### Memory Usage
- Monitor memory during request processing
- Should be minimal (small dataset)

### Step 10: Integration Testing

#### Full Request Flow
- Send request from client/Postman
- Verify complete request/response cycle
- Test with multiple users
- Verify each sees only their own categories

#### Response Validation
- Verify JSON is valid
- Verify array structure
- Verify data types are correct
- Verify no extra fields present

### Step 11: Test Default Categories

#### New User Setup
- Trigger that creates default categories should have run
- Verify default categories exist:
  - Food
  - Bills
  - Salary
  - Entertainment
  - Other (is_deletable = false)

#### "Other" Category
- Verify exactly one "Other" category per user
- Verify "Other" has `isDeletable: false`
- Verify cannot be confused with user-created "Other"

### Step 12: Code Quality

#### Type Safety
- Ensure all types are properly defined
- No `any` types used
- All DTOs match specification
- Service returns correct types

#### Code Organization
- Service layer is separate from route handler
- Clear separation of concerns
- Code is DRY (no duplication)

#### Documentation
- Add JSDoc comments to service methods
- Document return type
- Add usage examples

### Step 13: Deployment Checklist

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
- [ ] Monitor error logs
- [ ] Monitor response times
- [ ] Verify RLS policies are active

---

## 10. Testing Checklist

### Unit Tests (Service Layer)
- [ ] Returns all categories for authenticated user
- [ ] Transforms is_deletable to isDeletable correctly
- [ ] Returns empty array if no categories (shouldn't happen)
- [ ] Sorts categories by name alphabetically
- [ ] Removes user_id from response
- [ ] Removes created_at from response
- [ ] Throws error on database failure

### Integration Tests (API Route)
- [ ] Returns 401 when not authenticated
- [ ] Returns 200 with array for authenticated request
- [ ] Response matches ListCategoriesResponseDto structure
- [ ] Only returns authenticated user's categories (RLS)
- [ ] Returns default categories for new user

### Data Tests
- [ ] Default categories created for new user
- [ ] "Other" category has isDeletable: false
- [ ] User-created categories have isDeletable: true
- [ ] Category names are unique per user
- [ ] All categories have valid UUIDs

### End-to-End Tests
- [ ] Full request from client returns correct data
- [ ] Multiple users see only their own categories
- [ ] Response time is acceptable (< 100ms)
- [ ] Categories used in transactions appear in list

---

## 11. Future Enhancements

### Optimization Opportunities
1. **Caching**: Implement Redis caching for category lists
2. **Compression**: Enable gzip compression for response
3. **Pagination**: Add pagination if users have many categories
4. **Search**: Add query parameter to filter by name

### Feature Additions
1. **Category Statistics**: Include transaction count per category
2. **Last Used**: Include last transaction date per category
3. **Color/Icon**: Add color or icon field for UI customization
4. **Ordering**: Allow custom ordering/sorting
5. **Grouping**: Support category groups/hierarchies

### API Enhancements
1. **Sparse Fields**: Allow client to request specific fields only
2. **Include Archived**: Support soft-deleted categories
3. **Filtering**: Add filters (deletable only, recently used, etc.)
4. **ETags**: Implement ETags for efficient caching

---

## Appendix A: Example Queries

### Successful Request
```bash
curl -X GET "https://api.example.com/api/categories" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response (200 OK):**
```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "name": "Bills",
    "isDeletable": true
  },
  {
    "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "name": "Entertainment",
    "isDeletable": true
  },
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Food",
    "isDeletable": true
  },
  {
    "id": "e5f7g3h8-e9h2-7d4c-cd4c-c2i0d0g0h0h0",
    "name": "Other",
    "isDeletable": false
  },
  {
    "id": "d4e6f2g7-d8g1-6c3b-bc3b-b1h9c9f9g9g9",
    "name": "Salary",
    "isDeletable": true
  }
]
```

### Missing Authentication
```bash
curl -X GET "https://api.example.com/api/categories"
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
SELECT id, name, is_deletable
FROM categories
WHERE 
  user_id = '<authenticated_user_id>' -- Applied by RLS
ORDER BY name ASC;
```

### Index Usage
```sql
-- Should use this index:
idx_categories_user ON categories(user_id)

-- Or better, composite index:
idx_categories_user_name ON categories(user_id, name)

-- Query plan should show:
-- Index Scan using idx_categories_user_name
-- Order: name ASC (from index)
```

### Performance Expectations
- **Index Scan**: O(log n) for user_id lookup
- **Sort**: Already sorted by index (if composite index exists)
- **Typical Execution Time**: < 30ms for 50 categories

---

## Appendix C: Default Categories

### System-Created Categories
When a new user is created, the following default categories are automatically created by a database trigger:

1. **Food** (isDeletable: true)
2. **Bills** (isDeletable: true)
3. **Salary** (isDeletable: true)
4. **Entertainment** (isDeletable: true)
5. **Other** (isDeletable: false) - System category

### "Other" Category Characteristics
- **Purpose**: Fallback category for transactions when user deletes a category
- **is_deletable**: false (cannot be deleted via API)
- **Unique**: Each user has exactly one "Other" category
- **Trigger**: When a category is deleted, its transactions are reassigned to "Other"

---

This implementation plan provides comprehensive guidance for implementing the GET /categories endpoint. Follow the steps sequentially, test thoroughly at each stage, and ensure all security and performance considerations are properly addressed.

