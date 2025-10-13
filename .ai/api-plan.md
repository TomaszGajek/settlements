# REST API Plan

## 1. Resources

- **Dashboard**: Represents aggregated financial data for a specific period. Not a direct table mapping, but a computed resource.
- **Transactions**: Corresponds to the `transactions` table. Represents individual financial records.
- **Categories**: Corresponds to the `categories` table. Represents user-defined and default categories for transactions.

## 2. Endpoints

All endpoints are prefixed with `/api`.

### 2.1. Dashboard

#### Get Dashboard Summary

- **Method**: `GET`
- **Path**: `/dashboard`
- **Description**: Retrieves an aggregated summary of financial data for a given month and year. This includes total income, total expenses, balance, and data structured for a daily breakdown chart.
- **Query Parameters**:
  - `month` (number, required): The month to retrieve data for (1-12).
  - `year` (number, required): The year to retrieve data for.
- **Request Body**: None
- **Response Body**:
  ```json
  {
    "summary": {
      "income": 10000.0,
      "expenses": 4500.5,
      "balance": 5499.5
    },
    "dailyBreakdown": [
      {
        "date": "2025-10-01",
        "income": 5000.0,
        "expenses": 250.0
      },
      {
        "date": "2025-10-05",
        "income": 0,
        "expenses": 800.5
      }
    ]
  }
  ```
- **Success Response**: `200 OK`
- **Error Responses**:
  - `400 Bad Request`: If `month` or `year` parameters are missing or invalid.
  - `401 Unauthorized`: If the user is not authenticated.

---

### 2.2. Transactions

#### List Transactions

- **Method**: `GET`
- **Path**: `/transactions`
- **Description**: Retrieves a paginated list of transactions for a given month and year, sorted by date in descending order.
- **Query Parameters**:
  - `month` (number, required): The month to retrieve data for (1-12).
  - `year` (number, required): The year to retrieve data for.
  - `page` (number, optional, default: 1): The page number for pagination.
  - `pageSize` (number, optional, default: 20): The number of items per page.
- **Request Body**: None
- **Response Body**:
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
- **Success Response**: `200 OK`
- **Error Responses**:
  - `400 Bad Request`: If `month` or `year` parameters are missing or invalid.
  - `401 Unauthorized`: If the user is not authenticated.

#### Create Transaction

- **Method**: `POST`
- **Path**: `/transactions`
- **Description**: Creates a new transaction.
- **Request Body**:
  ```json
  {
    "amount": 199.99,
    "date": "2025-10-13",
    "categoryId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "type": "expense",
    "note": "New headphones"
  }
  ```
- **Response Body**: The newly created transaction object.
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
- **Success Response**: `201 Created`
- **Error Responses**:
  - `400 Bad Request`: For validation errors (e.g., negative amount, invalid date, missing fields).
  - `401 Unauthorized`: If the user is not authenticated.
  - `422 Unprocessable Entity`: If `categoryId` does not exist or does not belong to the user.

#### Update Transaction

- **Method**: `PATCH`
- **Path**: `/transactions/{id}`
- **Description**: Updates an existing transaction. All fields are optional.
- **Request Body**:
  ```json
  {
    "amount": 205.0,
    "note": "New gaming headphones"
  }
  ```
- **Response Body**: The updated transaction object.
- **Success Response**: `200 OK`
- **Error Responses**:
  - `400 Bad Request`: For validation errors.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user tries to update a transaction they do not own.
  - `404 Not Found`: If the transaction with the specified `id` does not exist.

#### Delete Transaction

- **Method**: `DELETE`
- **Path**: `/transactions/{id}`
- **Description**: Deletes a specific transaction.
- **Request Body**: None
- **Response Body**: None
- **Success Response**: `204 No Content`
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user tries to delete a transaction they do not own.
  - `404 Not Found`: If the transaction with the specified `id` does not exist.

---

### 2.3. Categories

#### List Categories

- **Method**: `GET`
- **Path**: `/categories`
- **Description**: Retrieves a list of all categories for the authenticated user.
- **Request Body**: None
- **Response Body**:
  ```json
  [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Food",
      "isDeletable": true
    },
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "name": "Other",
      "isDeletable": false
    }
  ]
  ```
- **Success Response**: `200 OK`
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.

#### Create Category

- **Method**: `POST`
- **Path**: `/categories`
- **Description**: Creates a new category.
- **Request Body**:
  ```json
  {
    "name": "Subscriptions"
  }
  ```
- **Response Body**: The newly created category object.
  ```json
  {
    "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "name": "Subscriptions",
    "isDeletable": true
  }
  ```
- **Success Response**: `201 Created`
- **Error Responses**:
  - `400 Bad Request`: For validation errors (e.g., name too long).
  - `401 Unauthorized`: If the user is not authenticated.
  - `409 Conflict`: If a category with the same name already exists for the user.

#### Update Category

- **Method**: `PATCH`
- **Path**: `/categories/{id}`
- **Description**: Updates an existing category's name.
- **Request Body**:
  ```json
  {
    "name": "Monthly Subscriptions"
  }
  ```
- **Response Body**: The updated category object.
- **Success Response**: `200 OK`
- **Error Responses**:
  - `400 Bad Request`: For validation errors.
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user tries to update a category they do not own, or a non-editable category like "Other".
  - `404 Not Found`: If the category with the specified `id` does not exist.
  - `409 Conflict`: If renaming to a name that already exists.

#### Delete Category

- **Method**: `DELETE`
- **Path**: `/categories/{id}`
- **Description**: Deletes a specific category. Associated transactions will be reassigned as per business logic.
- **Request Body**: None
- **Response Body**: None
- **Success Response**: `204 No Content`
- **Error Responses**:
  - `401 Unauthorized`: If the user is not authenticated.
  - `403 Forbidden`: If the user tries to delete a category they do not own or one that is not deletable (e.g., "Other").
  - `404 Not Found`: If the category with the specified `id` does not exist.

## 3. Authentication and Authorization

- **Authentication**: The API will use JWT-based authentication provided by Supabase. The client is responsible for acquiring a JWT upon user login/signup and including it in the `Authorization` header of every subsequent request as a Bearer token (`Authorization: Bearer <SUPABASE_JWT>`).
- **Authorization**: All endpoints are protected and require an authenticated user. Authorization is enforced at the database level using PostgreSQL Row-Level Security (RLS) policies, as defined in the database plan. The policies ensure that users can only access and manipulate their own data (profiles, categories, transactions). The API layer will rely on these RLS policies and will not need to add explicit `WHERE user_id = ...` clauses.

## 4. Validation and Business Logic

### Validation

Validation will be enforced at the API level before data is sent to the database.

- **Transactions**:
  - `amount`: Must be a positive number (`> 0`), with a maximum of 2 decimal places.
  - `type`: Must be either `income` or `expense`.
  - `date`: Must be a valid date.
  - `note`: Must be a string with a maximum length of 500 characters.
  - `categoryId`: Must be a valid UUID corresponding to one of the user's existing categories.
- **Categories**:
  - `name`: Required, must be a non-empty string with a maximum length of 100 characters. Must be unique per user.

### Business Logic

- **Automatic Profile Creation**: Handled by a database trigger on `auth.users` insertion. No API endpoint needed.
- **Default Categories for New Users**: Handled by the same database trigger that creates the user profile. A set of default categories, including the non-deletable "Other" category, is created automatically. No API endpoint needed.
- **Safe Category Deletion**: Handled by a `BEFORE DELETE` trigger on the `categories` table. Before a category is deleted, the trigger reassigns all associated transactions to that user's "Other" category. This makes the `DELETE /api/categories/{id}` operation safe and atomic from the API's perspective.
- **Cascading Deletes on Account Removal**: Handled by `ON DELETE CASCADE` foreign key constraints in the database. When a user is deleted from `auth.users`, all their related data (profile, categories, transactions) is automatically removed. The API only needs to interact with the Supabase `auth` endpoint for user deletion.
