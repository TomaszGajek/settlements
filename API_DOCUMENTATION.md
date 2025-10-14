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
    "name": "Bills",
    "isDeletable": true
  },
  {
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "name": "Entertainment",
    "isDeletable": true
  },
  {
    "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "name": "Food",
    "isDeletable": true
  },
  {
    "id": "d4e6f2g7-d8g1-6c3b-bc3b-b1h9c9f9g9g9",
    "name": "Other",
    "isDeletable": false
  },
  {
    "id": "e5f7g3h8-e9h2-7d4c-cd4c-c2i0d0g0h0h0",
    "name": "Salary",
    "isDeletable": true
  }
]
```

**Fields:**

- `id` (string): Unique category identifier (UUID)
- `name` (string): Category name (unique per user)
- `isDeletable` (boolean): Whether the category can be deleted (`false` for system "Other" category)

**Features:**

- Results are sorted alphabetically by name
- Includes both user-created and default categories
- The "Other" category is a system category that cannot be deleted
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
const response = await fetch('http://localhost:3000/api/categories', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const categories = await response.json();
console.log(categories);
```

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
  "totalIncome": 5000.00,
  "totalExpenses": 3200.50,
  "balance": 1799.50,
  "dailyData": [
    {
      "day": 1,
      "income": 0,
      "expenses": 150.00
    },
    {
      "day": 2,
      "income": 5000.00,
      "expenses": 0
    },
    {
      "day": 3,
      "income": 0,
      "expenses": 450.50
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
const response = await fetch('http://localhost:3000/api/dashboard?month=10&year=2025', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
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
      "amount": 150.00,
      "date": "2025-10-15",
      "type": "expense",
      "note": "Grocery shopping",
      "categoryId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
      "categoryName": "Food",
      "createdAt": "2025-10-15T10:30:00Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "amount": 5000.00,
      "date": "2025-10-01",
      "type": "income",
      "note": "Monthly salary",
      "categoryId": "e5f7g3h8-e9h2-7d4c-cd4c-c2i0d0g0h0h0",
      "categoryName": "Salary",
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
const response = await fetch('http://localhost:3000/api/transactions?month=10&year=2025&page=1&pageSize=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
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
  "amount": 150.00,
  "date": "2025-10-15",
  "type": "expense",
  "note": "Grocery shopping",
  "categoryId": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
  "categoryName": "Food",
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
const response = await fetch('http://localhost:3000/api/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 150.00,
    date: '2025-10-15',
    categoryId: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12',
    type: 'expense',
    note: 'Grocery shopping'
  })
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
  "amount": 175.50,
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
const response = await fetch('http://localhost:3000/api/transactions/a1b2c3d4-e5f6-7890-1234-567890abcdef', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 175.50,
    note: 'Updated grocery shopping'
  })
});

const updatedTransaction = await response.json();
console.log(updatedTransaction);
```

