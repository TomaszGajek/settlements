# API Documentation

The application exposes several REST API endpoints for managing financial data. All endpoints require authentication via JWT token (obtained through Supabase Auth).

## Authentication

All API requests must include a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Categories

### GET /api/categories

Retrieve a list of all categories for the authenticated user.

**Endpoint:** `GET /api/categories`

**Request:**

```http
GET /api/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Response (200 OK):**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Rachunki",
    "isDeletable": true
  },
  {
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "name": "Rozrywka",
    "isDeletable": true
  },
  {
    "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "name": "Jedzenie",
    "isDeletable": true
  },
  {
    "id": "d4e6f2g7-d8g1-6c3b-bc3b-b1h9c9f9g9g9",
    "name": "Inne",
    "isDeletable": false
  },
  {
    "id": "e5f7g3h8-e9h2-7d4c-cd4c-c2i0d0g0h0h0",
    "name": "Wynagrodzenie",
    "isDeletable": true
  }
]
```

**Fields:**

- `id` (string): Unique category identifier (UUID)
- `name` (string): Category name (unique per user)
- `isDeletable` (boolean): Whether the category can be deleted (`false` for system "Inne" category)

**Features:**

- Results are sorted alphabetically by name
- Includes both user-created and default categories
- The "Inne" category is a system category that cannot be deleted
- RLS (Row-Level Security) ensures users only see their own categories

**Error Responses:**

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Performance:**

- Average response time: < 10ms (local development)
- Throughput: ~100+ requests/second
- No pagination needed (typically < 50 categories per user)

**Example using cURL:**

```bash
curl -X GET "http://localhost:3000/api/categories" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example using JavaScript (fetch):**

```javascript
const response = await fetch("http://localhost:3000/api/categories", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
});

const categories = await response.json();
console.log(categories);
```

### POST /api/categories

Create a new category for the authenticated user.

**Endpoint:** `POST /api/categories`

**Request:**

```http
POST /api/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Subscriptions"
}
```

**Request Body:**

- `name` (string, required): Category name, max 100 characters, must be unique per user

**Response (201 Created):**

```json
{
  "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "name": "Subscriptions",
  "isDeletable": true
}
```

**Fields:**

- `id` (string): Unique category identifier (UUID)
- `name` (string): Category name (trimmed of whitespace)
- `isDeletable` (boolean): Always `true` for user-created categories

**Features:**

- Category names are trimmed of leading/trailing whitespace
- Names must be unique per user (case-sensitive)
- User-created categories are always deletable
- Maximum name length: 100 characters

**Error Responses:**

400 Bad Request - Invalid JSON:

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

400 Bad Request - Validation errors:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "name": "Name is required"
  }
}
```

Possible validation errors:

- "Name is required" - Missing name field
- "Name cannot be empty" - Empty string or whitespace only
- "Name must be at most 100 characters" - Name exceeds maximum length

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

409 Conflict - Category name already exists:

```json
{
  "error": "Conflict",
  "message": "A category with this name already exists"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Example using cURL:**

```bash
curl -X POST "http://localhost:3000/api/categories" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Subscriptions"
  }'
```

**Example using JavaScript (fetch):**

```javascript
const response = await fetch("http://localhost:3000/api/categories", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Subscriptions",
  }),
});

if (response.status === 201) {
  const category = await response.json();
  console.log("Category created:", category);
} else if (response.status === 409) {
  console.error("Category already exists");
} else {
  const error = await response.json();
  console.error("Error:", error);
}
```

### PATCH /api/categories/{id}

Update a category's name for the authenticated user.

**Endpoint:** `PATCH /api/categories/{id}`

**Path Parameters:**

- `id` (string, required): UUID of the category to update

**Request:**

```http
PATCH /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Monthly Subscriptions"
}
```

**Request Body:**

- `name` (string, required): New category name, max 100 characters, must be unique per user

**Response (200 OK):**

```json
{
  "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "name": "Monthly Subscriptions",
  "isDeletable": true
}
```

**Fields:**

- `id` (string): Unique category identifier (UUID)
- `name` (string): Updated category name (trimmed of whitespace)
- `isDeletable` (boolean): Whether the category can be deleted

**Features:**

- Category names are trimmed of leading/trailing whitespace
- New name must be unique per user (case-sensitive)
- Cannot rename the "Inne" category (system category with `isDeletable: false`)
- If name is unchanged, returns current category (optimization)

**Error Responses:**

400 Bad Request - Invalid UUID format:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid category ID format"
  }
}
```

400 Bad Request - Invalid JSON:

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

400 Bad Request - Validation errors:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "name": "Name is required"
  }
}
```

Possible validation errors:

- "Name is required" - Missing name field
- "Name cannot be empty" - Empty string or whitespace only
- "Name must be at most 100 characters" - Name exceeds maximum length

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

403 Forbidden - Category belongs to another user:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to update this category"
}
```

403 Forbidden - Cannot update "Inne" category:

```json
{
  "error": "Forbidden",
  "message": "Cannot update non-editable category"
}
```

404 Not Found - Category doesn't exist:

```json
{
  "error": "Not Found",
  "message": "Category not found"
}
```

409 Conflict - New name already exists:

```json
{
  "error": "Conflict",
  "message": "A category with this name already exists"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Example using cURL:**

```bash
curl -X PATCH "http://localhost:3000/api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Subscriptions"
  }'
```

**Example using JavaScript (fetch):**

```javascript
const categoryId = "c3d4e5f6-a7b8-9012-3456-7890abcdef12";

const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Monthly Subscriptions",
  }),
});

if (response.status === 200) {
  const category = await response.json();
  console.log("Category updated:", category);
} else if (response.status === 403) {
  const error = await response.json();
  console.error("Cannot update:", error.message);
} else if (response.status === 409) {
  console.error("Category name already exists");
} else {
  const error = await response.json();
  console.error("Error:", error);
}
```

### DELETE /api/categories/{id}

Delete a specific category for the authenticated user.

**Endpoint:** `DELETE /api/categories/{id}`

**Path Parameters:**

- `id` (string, required): UUID of the category to delete

**Request:**

```http
DELETE /api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
```

**Response (204 No Content):**

```
HTTP/1.1 204 No Content
Content-Length: 0
```

**Features:**

- Permanently deletes the category from the database
- Cannot delete the "Inne" category (system category with `isDeletable: false`)
- Database trigger automatically reassigns all transactions from the deleted category to "Inne"
- No transactions are orphaned or lost
- Returns empty response body on success
- Idempotent from user perspective

**Business Logic:**

1. Validates category ID is a valid UUID
2. Verifies user is authenticated
3. Checks category exists and belongs to authenticated user (via RLS)
4. Verifies category is deletable (`isDeletable: true`)
5. Deletes category from database
6. Database trigger automatically reassigns associated transactions to "Inne" category
7. Returns 204 No Content

**Error Responses:**

400 Bad Request - Invalid UUID format:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid category ID format"
  }
}
```

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

403 Forbidden - Category belongs to another user:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to delete this category"
}
```

403 Forbidden - Cannot delete "Inne" category:

```json
{
  "error": "Forbidden",
  "message": "Cannot delete non-deletable category"
}
```

404 Not Found - Category doesn't exist:

```json
{
  "error": "Not Found",
  "message": "Category not found"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Example using cURL:**

```bash
curl -X DELETE "http://localhost:3000/api/categories/c3d4e5f6-a7b8-9012-3456-7890abcdef12" \
  -H "Authorization: Bearer your-jwt-token" \
  -v
```

**Example using JavaScript (fetch):**

```javascript
const categoryId = "c3d4e5f6-a7b8-9012-3456-7890abcdef12";

const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

if (response.status === 204) {
  console.log("Category deleted successfully");
  // Category deleted, transactions reassigned to "Inne"
} else if (response.status === 403) {
  const error = await response.json();
  console.error("Cannot delete:", error.message);
} else if (response.status === 404) {
  console.error("Category not found");
} else {
  const error = await response.json();
  console.error("Error:", error);
}
```

**Important Notes:**

- **Permanent Deletion**: This operation cannot be undone
- **Transaction Preservation**: All transactions are preserved and reassigned to "Inne" category
- **System Category Protection**: The "Inne" category cannot be deleted to ensure there's always a fallback category
- **Idempotency**: Deleting the same category twice returns 404 on the second attempt (not an error)

## Dashboard

### GET /api/dashboard

Retrieves aggregated financial summary for a specific month and year.

**Request:**

```http
GET /api/dashboard?month=10&year=2025 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Query Parameters:**

- `month` (number, required): Month to retrieve data for (1-12)
- `year` (number, required): Year to retrieve data for (e.g., 2025)

**Response (200 OK):**

```json
{
  "totalIncome": 5000.0,
  "totalExpenses": 3200.5,
  "balance": 1799.5,
  "dailyData": [
    {
      "day": 1,
      "income": 0,
      "expenses": 150.0
    },
    {
      "day": 2,
      "income": 5000.0,
      "expenses": 0
    },
    {
      "day": 3,
      "income": 0,
      "expenses": 450.5
    }
  ]
}
```

**Fields:**

- `totalIncome` (number): Sum of all income transactions for the month
- `totalExpenses` (number): Sum of all expense transactions for the month
- `balance` (number): Difference between total income and total expenses
- `dailyData` (array): Daily breakdown of income and expenses for each day of the month
  - `day` (number): Day of the month (1-31)
  - `income` (number): Total income for that day
  - `expenses` (number): Total expenses for that day

**Error Responses:**

400 Bad Request - Invalid query parameters:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "month": "Month must be at least 1",
    "year": "Year is required"
  }
}
```

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Example using cURL:**

```bash
curl -X GET "http://localhost:3000/api/dashboard?month=10&year=2025" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example using JavaScript (fetch):**

```javascript
const response = await fetch("http://localhost:3000/api/dashboard?month=10&year=2025", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
});

const dashboardData = await response.json();
console.log(dashboardData);
```

## Transactions

### GET /api/transactions

Retrieve a paginated list of transactions for a specific month and year.

**Request:**

```http
GET /api/transactions?month=10&year=2025&page=1&pageSize=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Query Parameters:**

- `month` (number, required): Month to retrieve data for (1-12)
- `year` (number, required): Year to retrieve data for (e.g., 2025)
- `page` (number, optional): Page number for pagination (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "amount": 150.0,
      "date": "2025-10-15",
      "type": "expense",
      "note": "Grocery shopping",
      "categoryId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
      "categoryName": "Jedzenie",
      "createdAt": "2025-10-15T10:30:00Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "amount": 5000.0,
      "date": "2025-10-01",
      "type": "income",
      "note": "Monthly salary",
      "categoryId": "e5f7g3h8-e9h2-7d4c-cd4c-c2i0d0g0h0h0",
      "categoryName": "Wynagrodzenie",
      "createdAt": "2025-10-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Fields:**

- `data` (array): List of transactions
  - `id` (string): Unique transaction identifier (UUID)
  - `amount` (number): Transaction amount (positive number with max 2 decimal places)
  - `date` (string): Transaction date in YYYY-MM-DD format
  - `type` (string): Either "income" or "expense"
  - `note` (string|null): Optional description (max 500 characters)
  - `categoryId` (string): UUID of the assigned category
  - `categoryName` (string): Name of the assigned category
  - `createdAt` (string): ISO timestamp of when the transaction was created
- `pagination` (object): Pagination metadata
  - `page` (number): Current page number
  - `pageSize` (number): Number of items per page
  - `totalItems` (number): Total number of transactions
  - `totalPages` (number): Total number of pages
  - `hasNextPage` (boolean): Whether there's a next page
  - `hasPreviousPage` (boolean): Whether there's a previous page

**Error Responses:**

400 Bad Request - Invalid query parameters:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "month": "Month must be at least 1",
    "year": "Year is required",
    "page": "Page must be at least 1",
    "pageSize": "Page size must be at most 100"
  }
}
```

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Example using cURL:**

```bash
curl -X GET "http://localhost:3000/api/transactions?month=10&year=2025&page=1&pageSize=20" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

**Example using JavaScript (fetch):**

```javascript
const response = await fetch("http://localhost:3000/api/transactions?month=10&year=2025&page=1&pageSize=20", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
});

const transactions = await response.json();
console.log(transactions);
```

### POST /api/transactions

Create a new transaction.

**Request:**

```http
POST /api/transactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "amount": 150.00,
  "date": "2025-10-15",
  "categoryId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "type": "expense",
  "note": "Grocery shopping"
}
```

**Request Body:**

- `amount` (number, required): Transaction amount, must be positive with max 2 decimal places
- `date` (string, required): Transaction date in YYYY-MM-DD format
- `categoryId` (string, required): UUID of the category to assign
- `type` (string, required): Either "income" or "expense"
- `note` (string, optional): Optional description, max 500 characters (can be null)

**Response (201 Created):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "amount": 150.0,
  "date": "2025-10-15",
  "type": "expense",
  "note": "Grocery shopping",
  "categoryId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "categoryName": "Jedzenie",
  "createdAt": "2025-10-15T10:30:00Z"
}
```

**Error Responses:**

400 Bad Request - Invalid request body or JSON:

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

400 Bad Request - Validation errors:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "amount": "Amount must be positive",
    "date": "Date must be in YYYY-MM-DD format",
    "categoryId": "Category ID must be a valid UUID",
    "type": "Type must be either 'income' or 'expense'",
    "note": "Note must be at most 500 characters"
  }
}
```

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

422 Unprocessable Entity - Invalid category or category doesn't belong to user:

```json
{
  "error": "Unprocessable Entity",
  "message": "Invalid category ID or category does not belong to user"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Example using cURL:**

```bash
curl -X POST "http://localhost:3000/api/transactions" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "date": "2025-10-15",
    "categoryId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "type": "expense",
    "note": "Grocery shopping"
  }'
```

**Example using JavaScript (fetch):**

```javascript
const response = await fetch("http://localhost:3000/api/transactions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 150.0,
    date: "2025-10-15",
    categoryId: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    type: "expense",
    note: "Grocery shopping",
  }),
});

const transaction = await response.json();
console.log(transaction);
```

### PATCH /api/transactions/{id}

Update an existing transaction (partial update).

**Request:**

```http
PATCH /api/transactions/a1b2c3d4-e5f6-7890-1234-567890abcdef HTTP/1.1
Host: localhost:3000
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "amount": 175.50,
  "note": "Updated grocery shopping"
}
```

**Path Parameters:**

- `id` (string, required): UUID of the transaction to update

**Request Body (all fields optional, but at least one required):**

- `amount` (number, optional): Transaction amount, must be positive with max 2 decimal places
- `date` (string, optional): Transaction date in YYYY-MM-DD format
- `categoryId` (string, optional): UUID of the category to assign
- `type` (string, optional): Either "income" or "expense"
- `note` (string, optional, nullable): Optional description, max 500 characters

**Response (200 OK):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "amount": 175.5,
  "date": "2025-10-15",
  "type": "expense",
  "note": "Updated grocery shopping",
  "categoryId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "categoryName": "Food",
  "createdAt": "2025-10-15T10:30:00Z"
}
```

**Error Responses:**

400 Bad Request - Invalid transaction ID format:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "id": "Invalid transaction ID format"
  }
}
```

400 Bad Request - Invalid JSON or no fields provided:

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

400 Bad Request - Validation errors:

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "amount": "Amount must be positive",
    "date": "Date must be in YYYY-MM-DD format",
    "categoryId": "Category ID must be a valid UUID",
    "type": "Type must be either 'income' or 'expense'",
    "note": "Note must be at most 500 characters",
    "_errors": "At least one field must be provided for update"
  }
}
```

401 Unauthorized - Missing or invalid authentication token:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

403 Forbidden - Transaction belongs to another user:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to update this transaction"
}
```

404 Not Found - Transaction doesn't exist:

```json
{
  "error": "Not Found",
  "message": "Transaction not found"
}
```

422 Unprocessable Entity - Invalid category or category doesn't belong to user:

```json
{
  "error": "Unprocessable Entity",
  "message": "Invalid category ID or category does not belong to user"
}
```

500 Internal Server Error - Unexpected server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Example using cURL:**

```bash
curl -X PATCH "http://localhost:3000/api/transactions/a1b2c3d4-e5f6-7890-1234-567890abcdef" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 175.50,
    "note": "Updated grocery shopping"
  }'
```

**Example using JavaScript (fetch):**

```javascript
const response = await fetch("http://localhost:3000/api/transactions/a1b2c3d4-e5f6-7890-1234-567890abcdef", {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 175.5,
    note: "Updated grocery shopping",
  }),
});

const updatedTransaction = await response.json();
console.log(updatedTransaction);
```
