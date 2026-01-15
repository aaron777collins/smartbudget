# SmartBudget API Documentation

Complete API reference for SmartBudget's REST API. This documentation is intended for developers building integrations or extending SmartBudget's functionality.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Conventions](#api-conventions)
4. [Rate Limiting](#rate-limiting)
5. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Accounts](#accounts-endpoints)
   - [Transactions](#transactions-endpoints)
   - [Categories](#categories-endpoints)
   - [Budgets](#budgets-endpoints)
   - [Goals](#goals-endpoints)
   - [Insights](#insights-endpoints)
   - [Dashboard](#dashboard-endpoints)
6. [Webhooks](#webhooks)
7. [Error Handling](#error-handling)
8. [Code Examples](#code-examples)

---

## Overview

### Base URL

```
Production: https://api.smartbudget.app
Development: http://localhost:3000/api
```

### API Version

Current version: **v1**

All API endpoints are prefixed with `/api`.

### Content Type

All requests and responses use JSON:

```
Content-Type: application/json
Accept: application/json
```

---

## Authentication

SmartBudget uses **NextAuth.js** (Auth.js) for authentication with session-based authentication.

### Authentication Methods

1. **Username/Password**: Standard credentials-based authentication
2. **OAuth**: Google, Apple Sign-In (coming soon)
3. **API Keys**: For server-to-server integrations (future feature)

### Session Management

Authentication state is managed via HTTP-only cookies. Include credentials in requests:

```javascript
fetch('https://api.smartbudget.app/api/transactions', {
  credentials: 'include', // Important: include cookies
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### Getting Session Information

**Endpoint**: `GET /api/auth/session`

**Response**:
```json
{
  "user": {
    "id": "usr_1234567890",
    "username": "johndoe",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://example.com/avatar.jpg"
  },
  "expires": "2026-02-14T12:00:00.000Z"
}
```

If not authenticated:
```json
{}
```

---

## API Conventions

### Request Format

**Headers**:
```
Content-Type: application/json
Accept: application/json
```

**Body** (for POST/PATCH):
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Response Format

**Success Response**:
```json
{
  "data": { /* response data */ },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

**Error Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be a positive number"
      }
    ]
  }
}
```

### HTTP Methods

- **GET**: Retrieve resources
- **POST**: Create new resources
- **PATCH**: Update existing resources (partial update)
- **DELETE**: Remove resources

### Date Format

All dates are in ISO 8601 format:

```
2026-01-14T12:30:00.000Z
```

### Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by (default: varies by endpoint)
- `sortOrder`: `asc` or `desc` (default: `desc`)

**Example**:
```
GET /api/transactions?page=2&perPage=50&sortBy=date&sortOrder=desc
```

**Response**:
```json
{
  "data": [ /* items */ ],
  "meta": {
    "page": 2,
    "perPage": 50,
    "total": 1250,
    "totalPages": 25
  }
}
```

### Filtering

Use query parameters for filtering:

```
GET /api/transactions?accountId=acc_123&categoryId=cat_456&startDate=2026-01-01&endDate=2026-01-31
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse.

### Limits

- **Authenticated users**: 1,000 requests per hour
- **Unauthenticated**: 100 requests per hour per IP

### Rate Limit Headers

Response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 842
X-RateLimit-Reset: 1736859600
```

### Exceeding Rate Limits

**Response** (HTTP 429):
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 3600
  }
}
```

---

## Endpoints

### Authentication Endpoints

#### Sign Up

Create a new user account.

**Endpoint**: `POST /api/auth/signup`

**Request**:
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "user": {
      "id": "usr_1234567890",
      "username": "johndoe",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false
    }
  }
}
```

**Errors**:
- `400`: Invalid username or weak password
- `409`: Username or email already registered

---

#### Sign In

Authenticate with username and password.

**Endpoint**: `POST /api/auth/signin`

**Request**:
```json
{
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "usr_1234567890",
      "username": "johndoe",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "session": {
      "expires": "2026-02-14T12:00:00.000Z"
    }
  }
}
```

**Errors**:
- `401`: Invalid credentials

---

#### Sign Out

End the current session.

**Endpoint**: `POST /api/auth/signout`

**Response** (200 OK):
```json
{
  "data": {
    "message": "Signed out successfully"
  }
}
```

---

### Accounts Endpoints

#### List Accounts

Retrieve all accounts for the authenticated user.

**Endpoint**: `GET /api/accounts`

**Query Parameters**:
- `isActive`: Filter by active status (`true` or `false`)
- `accountType`: Filter by type (e.g., `CHECKING`, `SAVINGS`, `CREDIT_CARD`)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "acc_1234567890",
      "userId": "usr_1234567890",
      "name": "CIBC Chequing",
      "institution": "CIBC",
      "accountType": "CHECKING",
      "accountNumber": "1234",
      "currency": "CAD",
      "currentBalance": "5432.10",
      "availableBalance": "5432.10",
      "color": "#2563EB",
      "icon": "wallet",
      "isActive": true,
      "createdAt": "2026-01-01T12:00:00.000Z",
      "updatedAt": "2026-01-14T12:00:00.000Z"
    }
  ]
}
```

---

#### Create Account

Create a new account.

**Endpoint**: `POST /api/accounts`

**Request**:
```json
{
  "name": "CIBC Chequing",
  "institution": "CIBC",
  "accountType": "CHECKING",
  "accountNumber": "1234",
  "currency": "CAD",
  "currentBalance": 5000.00,
  "availableBalance": 5000.00,
  "color": "#2563EB",
  "icon": "wallet"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "acc_1234567890",
    "userId": "usr_1234567890",
    "name": "CIBC Chequing",
    "institution": "CIBC",
    "accountType": "CHECKING",
    "accountNumber": "1234",
    "currency": "CAD",
    "currentBalance": "5000.00",
    "availableBalance": "5000.00",
    "color": "#2563EB",
    "icon": "wallet",
    "isActive": true,
    "createdAt": "2026-01-14T12:00:00.000Z",
    "updatedAt": "2026-01-14T12:00:00.000Z"
  }
}
```

**Errors**:
- `400`: Invalid request parameters
- `401`: Unauthenticated

---

#### Get Account

Retrieve a specific account by ID.

**Endpoint**: `GET /api/accounts/:id`

**Response** (200 OK):
```json
{
  "data": {
    "id": "acc_1234567890",
    "userId": "usr_1234567890",
    "name": "CIBC Chequing",
    "institution": "CIBC",
    "accountType": "CHECKING",
    "accountNumber": "1234",
    "currency": "CAD",
    "currentBalance": "5432.10",
    "availableBalance": "5432.10",
    "color": "#2563EB",
    "icon": "wallet",
    "isActive": true,
    "createdAt": "2026-01-01T12:00:00.000Z",
    "updatedAt": "2026-01-14T12:00:00.000Z"
  }
}
```

**Errors**:
- `404`: Account not found
- `403`: Not authorized to access this account

---

#### Update Account

Update an existing account.

**Endpoint**: `PATCH /api/accounts/:id`

**Request**:
```json
{
  "name": "CIBC Chequing (Joint)",
  "currentBalance": 6000.00,
  "color": "#10B981"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "acc_1234567890",
    "name": "CIBC Chequing (Joint)",
    "currentBalance": "6000.00",
    "color": "#10B981",
    "updatedAt": "2026-01-14T13:00:00.000Z"
  }
}
```

**Errors**:
- `404`: Account not found
- `403`: Not authorized
- `400`: Invalid parameters

---

#### Delete Account

Delete an account and all associated transactions.

**Endpoint**: `DELETE /api/accounts/:id`

**Response** (200 OK):
```json
{
  "data": {
    "message": "Account deleted successfully",
    "id": "acc_1234567890"
  }
}
```

**Errors**:
- `404`: Account not found
- `403`: Not authorized

---

#### Get Account Balance History

Retrieve balance history for an account.

**Endpoint**: `GET /api/accounts/:id/balance-history`

**Query Parameters**:
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `interval`: `day`, `week`, `month` (default: `day`)

**Response** (200 OK):
```json
{
  "data": {
    "accountId": "acc_1234567890",
    "history": [
      {
        "date": "2026-01-01T00:00:00.000Z",
        "balance": "5000.00"
      },
      {
        "date": "2026-01-02T00:00:00.000Z",
        "balance": "4875.50"
      }
    ]
  }
}
```

---

### Transactions Endpoints

#### List Transactions

Retrieve transactions with optional filtering.

**Endpoint**: `GET /api/transactions`

**Query Parameters**:
- `accountId`: Filter by account
- `categoryId`: Filter by category
- `startDate`: Filter by date range (start)
- `endDate`: Filter by date range (end)
- `minAmount`: Minimum amount
- `maxAmount`: Maximum amount
- `type`: Filter by type (`DEBIT`, `CREDIT`, `TRANSFER`)
- `search`: Search merchant names and descriptions
- `page`: Page number
- `perPage`: Items per page (max 100)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "txn_1234567890",
      "accountId": "acc_1234567890",
      "userId": "usr_1234567890",
      "date": "2026-01-14T10:30:00.000Z",
      "postedDate": "2026-01-14T12:00:00.000Z",
      "description": "STARBUCKS #1234",
      "merchantName": "Starbucks",
      "amount": "-5.75",
      "type": "DEBIT",
      "categoryId": "cat_food_and_drink",
      "subcategoryId": "subcat_coffee_shops",
      "category": {
        "id": "cat_food_and_drink",
        "name": "Food & Drink",
        "icon": "utensils",
        "color": "#F59E0B"
      },
      "tags": [],
      "notes": null,
      "fitid": "20260114STARBUCKS1234",
      "isReconciled": false,
      "isRecurring": false,
      "confidenceScore": 0.98,
      "userCorrected": false,
      "createdAt": "2026-01-14T12:00:00.000Z",
      "updatedAt": "2026-01-14T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 543,
    "totalPages": 28
  }
}
```

---

#### Create Transaction

Manually create a transaction.

**Endpoint**: `POST /api/transactions`

**Request**:
```json
{
  "accountId": "acc_1234567890",
  "date": "2026-01-14T10:30:00.000Z",
  "description": "Coffee at Starbucks",
  "merchantName": "Starbucks",
  "amount": -5.75,
  "type": "DEBIT",
  "categoryId": "cat_food_and_drink",
  "subcategoryId": "subcat_coffee_shops",
  "notes": "Quick meeting with client"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "txn_1234567890",
    "accountId": "acc_1234567890",
    "userId": "usr_1234567890",
    "date": "2026-01-14T10:30:00.000Z",
    "description": "Coffee at Starbucks",
    "merchantName": "Starbucks",
    "amount": "-5.75",
    "type": "DEBIT",
    "categoryId": "cat_food_and_drink",
    "subcategoryId": "subcat_coffee_shops",
    "notes": "Quick meeting with client",
    "createdAt": "2026-01-14T12:00:00.000Z",
    "updatedAt": "2026-01-14T12:00:00.000Z"
  }
}
```

**Errors**:
- `400`: Invalid parameters
- `401`: Unauthenticated
- `404`: Account not found

---

#### Import Transactions

Import transactions from CSV or OFX files.

**Endpoint**: `POST /api/transactions/import`

**Request** (multipart/form-data):
```
Content-Type: multipart/form-data

file: [File]
accountId: acc_1234567890
format: csv | ofx | qfx
skipDuplicates: true
```

**Response** (200 OK):
```json
{
  "data": {
    "imported": 145,
    "skipped": 12,
    "errors": 0,
    "transactions": [
      /* Array of imported transaction objects */
    ]
  }
}
```

**Errors**:
- `400`: Invalid file format or missing accountId
- `413`: File too large (max 10 MB)

---

#### Get Transaction

Retrieve a specific transaction.

**Endpoint**: `GET /api/transactions/:id`

**Response** (200 OK):
```json
{
  "data": {
    "id": "txn_1234567890",
    "accountId": "acc_1234567890",
    "date": "2026-01-14T10:30:00.000Z",
    "description": "STARBUCKS #1234",
    "merchantName": "Starbucks",
    "amount": "-5.75",
    "type": "DEBIT",
    "category": {
      "id": "cat_food_and_drink",
      "name": "Food & Drink",
      "icon": "utensils",
      "color": "#F59E0B"
    },
    "createdAt": "2026-01-14T12:00:00.000Z",
    "updatedAt": "2026-01-14T12:00:00.000Z"
  }
}
```

**Errors**:
- `404`: Transaction not found
- `403`: Not authorized

---

#### Update Transaction

Update a transaction (including recategorization).

**Endpoint**: `PATCH /api/transactions/:id`

**Request**:
```json
{
  "categoryId": "cat_entertainment",
  "subcategoryId": "subcat_movies",
  "notes": "Watched Inception",
  "tags": ["entertainment", "weekend"]
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "txn_1234567890",
    "categoryId": "cat_entertainment",
    "subcategoryId": "subcat_movies",
    "notes": "Watched Inception",
    "tags": ["entertainment", "weekend"],
    "userCorrected": true,
    "updatedAt": "2026-01-14T13:00:00.000Z"
  }
}
```

**Errors**:
- `404`: Transaction not found
- `403`: Not authorized
- `400`: Invalid parameters

---

#### Delete Transaction

Delete a transaction.

**Endpoint**: `DELETE /api/transactions/:id`

**Response** (200 OK):
```json
{
  "data": {
    "message": "Transaction deleted successfully",
    "id": "txn_1234567890"
  }
}
```

---

#### Split Transaction

Split a transaction across multiple categories.

**Endpoint**: `POST /api/transactions/:id/split`

**Request**:
```json
{
  "splits": [
    {
      "categoryId": "cat_food_and_drink",
      "amount": 80.00,
      "notes": "Groceries"
    },
    {
      "categoryId": "cat_home_improvement",
      "amount": 20.00,
      "notes": "Household items"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "data": {
    "transactionId": "txn_1234567890",
    "splits": [
      {
        "id": "split_1234567890",
        "categoryId": "cat_food_and_drink",
        "amount": "80.00",
        "percentage": "80.00",
        "notes": "Groceries"
      },
      {
        "id": "split_1234567891",
        "categoryId": "cat_home_improvement",
        "amount": "20.00",
        "percentage": "20.00",
        "notes": "Household items"
      }
    ]
  }
}
```

**Errors**:
- `400`: Split amounts don't sum to transaction total

---

#### Bulk Categorize

Categorize multiple transactions at once.

**Endpoint**: `POST /api/transactions/bulk-categorize`

**Request**:
```json
{
  "transactionIds": [
    "txn_1234567890",
    "txn_1234567891",
    "txn_1234567892"
  ],
  "categoryId": "cat_transportation",
  "subcategoryId": "subcat_gas"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "updated": 3,
    "transactionIds": [
      "txn_1234567890",
      "txn_1234567891",
      "txn_1234567892"
    ]
  }
}
```

---

#### Research Merchant

Use AI to research an unknown merchant.

**Endpoint**: `POST /api/transactions/:id/research-merchant`

**Request**:
```json
{
  "merchantName": "XYZ STORES INC"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "merchantName": "XYZ Stores Inc",
    "normalizedName": "XYZ Stores",
    "businessType": "Retail - Electronics",
    "suggestedCategory": {
      "id": "cat_general_merchandise",
      "name": "General Merchandise",
      "subcategoryId": "subcat_electronics"
    },
    "confidence": 0.92,
    "sources": [
      "https://www.xyzstores.com",
      "https://maps.google.com/..."
    ],
    "metadata": {
      "location": "Toronto, ON",
      "description": "Consumer electronics retailer"
    }
  }
}
```

**Errors**:
- `404`: Transaction not found
- `429`: Rate limit exceeded (AI requests)

---

#### Export Transactions

Export transactions to CSV, Excel, or PDF.

**Endpoint**: `POST /api/transactions/export`

**Request**:
```json
{
  "format": "csv",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T23:59:59.999Z",
  "accountId": "acc_1234567890",
  "categoryId": "cat_food_and_drink"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "downloadUrl": "https://api.smartbudget.app/downloads/export_1234567890.csv",
    "expiresAt": "2026-01-14T13:00:00.000Z",
    "fileName": "transactions_2026-01.csv",
    "fileSize": 45678
  }
}
```

---

### Categories Endpoints

#### List Categories

Retrieve all available categories.

**Endpoint**: `GET /api/categories`

**Query Parameters**:
- `isSystemCategory`: Filter system vs. custom categories

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "cat_food_and_drink",
      "name": "Food & Drink",
      "slug": "food-and-drink",
      "icon": "utensils",
      "color": "#F59E0B",
      "description": "Groceries, restaurants, coffee shops",
      "isSystemCategory": true,
      "subcategories": [
        {
          "id": "subcat_groceries",
          "name": "Groceries",
          "slug": "groceries",
          "icon": "shopping-cart"
        },
        {
          "id": "subcat_restaurants",
          "name": "Restaurants",
          "slug": "restaurants",
          "icon": "utensils"
        }
      ]
    }
  ]
}
```

---

#### Get Category

Retrieve a specific category with subcategories.

**Endpoint**: `GET /api/categories/:id`

**Response** (200 OK):
```json
{
  "data": {
    "id": "cat_food_and_drink",
    "name": "Food & Drink",
    "slug": "food-and-drink",
    "icon": "utensils",
    "color": "#F59E0B",
    "description": "Groceries, restaurants, coffee shops",
    "isSystemCategory": true,
    "subcategories": [
      {
        "id": "subcat_groceries",
        "name": "Groceries",
        "slug": "groceries"
      }
    ]
  }
}
```

---

#### Get Category Spending

Retrieve spending totals for a category.

**Endpoint**: `GET /api/categories/:id/spending`

**Query Parameters**:
- `startDate`: Start date for calculation
- `endDate`: End date for calculation

**Response** (200 OK):
```json
{
  "data": {
    "categoryId": "cat_food_and_drink",
    "categoryName": "Food & Drink",
    "totalSpent": "1234.56",
    "transactionCount": 87,
    "averageTransaction": "14.19",
    "subcategories": [
      {
        "subcategoryId": "subcat_groceries",
        "subcategoryName": "Groceries",
        "totalSpent": "654.32",
        "transactionCount": 12
      },
      {
        "subcategoryId": "subcat_restaurants",
        "subcategoryName": "Restaurants",
        "totalSpent": "580.24",
        "transactionCount": 75
      }
    ]
  }
}
```

---

### Budgets Endpoints

#### List Budgets

Retrieve all budgets for the authenticated user.

**Endpoint**: `GET /api/budgets`

**Query Parameters**:
- `isActive`: Filter by active status

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "bgt_1234567890",
      "userId": "usr_1234567890",
      "name": "January 2026 Budget",
      "type": "FIXED_AMOUNT",
      "period": "MONTHLY",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.999Z",
      "totalAmount": "3000.00",
      "isActive": true,
      "rollover": false,
      "categories": [
        {
          "categoryId": "cat_food_and_drink",
          "categoryName": "Food & Drink",
          "amount": "500.00",
          "spent": "234.56",
          "remaining": "265.44",
          "percentUsed": 46.91
        }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-14T12:00:00.000Z"
    }
  ]
}
```

---

#### Create Budget

Create a new budget.

**Endpoint**: `POST /api/budgets`

**Request**:
```json
{
  "name": "February 2026 Budget",
  "type": "FIXED_AMOUNT",
  "period": "MONTHLY",
  "startDate": "2026-02-01T00:00:00.000Z",
  "totalAmount": 3000.00,
  "categories": [
    {
      "categoryId": "cat_food_and_drink",
      "amount": 500.00
    },
    {
      "categoryId": "cat_transportation",
      "amount": 300.00
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "bgt_1234567891",
    "name": "February 2026 Budget",
    "type": "FIXED_AMOUNT",
    "period": "MONTHLY",
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-28T23:59:59.999Z",
    "totalAmount": "3000.00",
    "categories": [
      {
        "categoryId": "cat_food_and_drink",
        "amount": "500.00"
      }
    ],
    "createdAt": "2026-01-14T12:00:00.000Z"
  }
}
```

---

#### Get Budget Progress

Retrieve current progress for a budget.

**Endpoint**: `GET /api/budgets/:id/progress`

**Response** (200 OK):
```json
{
  "data": {
    "budgetId": "bgt_1234567890",
    "budgetName": "January 2026 Budget",
    "totalBudget": "3000.00",
    "totalSpent": "1456.78",
    "totalRemaining": "1543.22",
    "percentUsed": 48.56,
    "daysInPeriod": 31,
    "daysRemaining": 17,
    "categories": [
      {
        "categoryId": "cat_food_and_drink",
        "categoryName": "Food & Drink",
        "budgeted": "500.00",
        "spent": "234.56",
        "remaining": "265.44",
        "percentUsed": 46.91,
        "status": "ON_TRACK"
      }
    ]
  }
}
```

---

#### Get Budget Forecast

Get spending forecast for budget period.

**Endpoint**: `GET /api/budgets/:id/forecast`

**Response** (200 OK):
```json
{
  "data": {
    "budgetId": "bgt_1234567890",
    "projectedSpending": "3124.56",
    "projectedOverage": "124.56",
    "categories": [
      {
        "categoryId": "cat_food_and_drink",
        "budgeted": "500.00",
        "currentSpent": "234.56",
        "projectedTotal": "522.78",
        "projectedOverage": "22.78",
        "dailyAverageSpend": "16.76",
        "recommendation": "REDUCE_SPENDING"
      }
    ]
  }
}
```

---

### Goals Endpoints

#### List Goals

Retrieve all goals for the authenticated user.

**Endpoint**: `GET /api/goals`

**Query Parameters**:
- `type`: Filter by goal type (SAVINGS, DEBT_PAYOFF, NET_WORTH, INVESTMENT)
- `isCompleted`: Filter by completion status

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "goal_1234567890",
      "userId": "usr_1234567890",
      "name": "Emergency Fund",
      "type": "SAVINGS",
      "targetAmount": "10000.00",
      "currentAmount": "3456.78",
      "targetDate": "2026-12-31T23:59:59.999Z",
      "isCompleted": false,
      "percentComplete": 34.57,
      "icon": "piggy-bank",
      "color": "#10B981",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-14T12:00:00.000Z"
    }
  ]
}
```

---

#### Create Goal

Create a new financial goal.

**Endpoint**: `POST /api/goals`

**Request**:
```json
{
  "name": "Vacation Fund",
  "type": "SAVINGS",
  "targetAmount": 5000.00,
  "currentAmount": 0,
  "targetDate": "2026-07-01T00:00:00.000Z",
  "icon": "plane",
  "color": "#3B82F6"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "goal_1234567891",
    "name": "Vacation Fund",
    "type": "SAVINGS",
    "targetAmount": "5000.00",
    "currentAmount": "0.00",
    "targetDate": "2026-07-01T00:00:00.000Z",
    "monthlyContributionNeeded": "833.33",
    "createdAt": "2026-01-14T12:00:00.000Z"
  }
}
```

---

#### Get Goal Progress

Retrieve detailed progress for a goal.

**Endpoint**: `GET /api/goals/:id/progress`

**Response** (200 OK):
```json
{
  "data": {
    "goalId": "goal_1234567890",
    "goalName": "Emergency Fund",
    "targetAmount": "10000.00",
    "currentAmount": "3456.78",
    "percentComplete": 34.57,
    "amountRemaining": "6543.22",
    "targetDate": "2026-12-31T23:59:59.999Z",
    "daysRemaining": 351,
    "projectedCompletionDate": "2027-08-15T00:00:00.000Z",
    "monthlyContributionNeeded": "595.75",
    "currentMonthlyContribution": "350.00",
    "status": "BEHIND_SCHEDULE"
  }
}
```

---

### Insights Endpoints

#### Get Spending Patterns

Retrieve AI-powered spending pattern insights.

**Endpoint**: `GET /api/insights/spending-patterns`

**Query Parameters**:
- `timeframe`: `week`, `month`, `quarter`, `year`

**Response** (200 OK):
```json
{
  "data": {
    "insights": [
      {
        "type": "PATTERN",
        "title": "Higher weekend spending",
        "description": "You spend 35% more on weekends compared to weekdays",
        "category": "Food & Drink",
        "impact": "MODERATE",
        "recommendation": "Consider meal prepping to reduce weekend dining out",
        "amount": "245.67"
      },
      {
        "type": "TREND",
        "title": "Increasing transportation costs",
        "description": "Transportation spending has increased 22% over the past 3 months",
        "category": "Transportation",
        "impact": "HIGH",
        "recommendation": "Explore public transit or carpooling options"
      }
    ]
  }
}
```

---

#### Get Anomalies

Detect unusual spending transactions.

**Endpoint**: `GET /api/insights/anomalies`

**Response** (200 OK):
```json
{
  "data": {
    "anomalies": [
      {
        "transactionId": "txn_9876543210",
        "merchantName": "Luxury Hotel",
        "amount": "450.00",
        "category": "Travel",
        "date": "2026-01-10T00:00:00.000Z",
        "reason": "Amount is 300% higher than average travel spending",
        "averageAmount": "112.50",
        "standardDeviations": 3.2
      }
    ]
  }
}
```

---

#### Get Savings Opportunities

Identify potential ways to save money.

**Endpoint**: `GET /api/insights/savings-opportunities`

**Response** (200 OK):
```json
{
  "data": {
    "opportunities": [
      {
        "type": "SUBSCRIPTION_OPTIMIZATION",
        "title": "Unused streaming services",
        "description": "You're paying for 3 streaming services but only use 1 regularly",
        "potentialSavings": "25.00",
        "frequency": "MONTHLY",
        "recommendation": "Cancel Netflix and Disney+ (unused for 90+ days)",
        "confidence": 0.89
      },
      {
        "type": "MERCHANT_ALTERNATIVE",
        "title": "Generic brand alternatives",
        "description": "Switching to generic brands could save on groceries",
        "potentialSavings": "120.00",
        "frequency": "MONTHLY",
        "recommendation": "Try store brands for staples at your regular grocery store"
      }
    ]
  }
}
```

---

### Dashboard Endpoints

#### Get Dashboard Overview

Retrieve dashboard summary data.

**Endpoint**: `GET /api/dashboard/overview`

**Query Parameters**:
- `timeframe`: `today`, `this-week`, `this-month`, `this-year`, `all-time`

**Response** (200 OK):
```json
{
  "data": {
    "netWorth": {
      "current": "45678.90",
      "change": "1234.56",
      "percentChange": 2.78,
      "trend": "UP"
    },
    "monthlySpending": {
      "amount": "2345.67",
      "budget": "3000.00",
      "percentUsed": 78.19,
      "daysRemaining": 17
    },
    "monthlyIncome": {
      "amount": "4500.00",
      "average": "4200.00",
      "change": "300.00",
      "percentChange": 7.14
    },
    "cashFlow": {
      "income": "4500.00",
      "expenses": "2345.67",
      "netCashFlow": "2154.33",
      "trend": "UP"
    }
  }
}
```

---

#### Get Spending Trends

Retrieve spending trends over time.

**Endpoint**: `GET /api/dashboard/spending-trends`

**Query Parameters**:
- `timeframe`: Timeframe for data
- `groupBy`: `day`, `week`, `month` (default: auto)

**Response** (200 OK):
```json
{
  "data": {
    "trends": [
      {
        "period": "2026-01",
        "total": "2345.67",
        "categories": {
          "cat_food_and_drink": "567.89",
          "cat_transportation": "234.56",
          "cat_entertainment": "123.45"
        }
      }
    ]
  }
}
```

---

#### Get Category Breakdown

Retrieve spending breakdown by category.

**Endpoint**: `GET /api/dashboard/category-breakdown`

**Query Parameters**:
- `timeframe`: Timeframe for data

**Response** (200 OK):
```json
{
  "data": {
    "totalSpending": "2345.67",
    "categories": [
      {
        "categoryId": "cat_food_and_drink",
        "categoryName": "Food & Drink",
        "amount": "567.89",
        "percentage": 24.21,
        "transactionCount": 45,
        "color": "#F59E0B"
      },
      {
        "categoryId": "cat_transportation",
        "categoryName": "Transportation",
        "amount": "234.56",
        "percentage": 10.00,
        "transactionCount": 12,
        "color": "#6366F1"
      }
    ]
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [] // Optional additional details
  }
}
```

### HTTP Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate)
- **413 Payload Too Large**: Request body or file too large
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Temporary outage

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHENTICATED` | User not logged in |
| `UNAUTHORIZED` | Insufficient permissions |
| `VALIDATION_ERROR` | Invalid request parameters |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `FILE_TOO_LARGE` | Upload file exceeds size limit |
| `INVALID_FILE_FORMAT` | Unsupported file format |
| `DATABASE_ERROR` | Internal database error |
| `EXTERNAL_SERVICE_ERROR` | Third-party service error |

### Error Handling Examples

```javascript
try {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(transactionData),
  });

  if (!response.ok) {
    const errorData = await response.json();

    switch (response.status) {
      case 401:
        // Redirect to login
        window.location.href = '/auth/signin';
        break;
      case 400:
        // Show validation errors
        console.error('Validation errors:', errorData.error.details);
        break;
      default:
        // Generic error handling
        console.error('Error:', errorData.error.message);
    }
  } else {
    const data = await response.json();
    console.log('Success:', data);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Code Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Get all transactions
async function getTransactions(startDate: string, endDate: string) {
  const params = new URLSearchParams({
    startDate,
    endDate,
    page: '1',
    perPage: '50',
  });

  const response = await fetch(`/api/transactions?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  const data = await response.json();
  return data.data;
}

// Create a transaction
async function createTransaction(transaction: Transaction) {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}

// Update a transaction category
async function updateCategory(transactionId: string, categoryId: string) {
  const response = await fetch(`/api/transactions/${transactionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ categoryId }),
  });

  return await response.json();
}
```

### React Hooks Example

```typescript
import { useState, useEffect } from 'react';

function useTransactions(accountId: string) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/transactions?accountId=${accountId}`,
          { credentials: 'include' }
        );

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setTransactions(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [accountId]);

  return { transactions, loading, error };
}
```

### Python Example

```python
import requests

BASE_URL = "https://api.smartbudget.app"
session = requests.Session()

# Sign in
def sign_in(username: str, password: str):
    response = session.post(
        f"{BASE_URL}/api/auth/signin",
        json={"username": username, "password": password}
    )
    response.raise_for_status()
    return response.json()

# Get transactions
def get_transactions(start_date: str, end_date: str):
    response = session.get(
        f"{BASE_URL}/api/transactions",
        params={"startDate": start_date, "endDate": end_date}
    )
    response.raise_for_status()
    return response.json()["data"]

# Create transaction
def create_transaction(transaction_data: dict):
    response = session.post(
        f"{BASE_URL}/api/transactions",
        json=transaction_data
    )
    response.raise_for_status()
    return response.json()["data"]
```

---

## Webhooks

Webhooks allow SmartBudget to send real-time notifications to your application when events occur.

### Webhook Events

| Event | Description |
|-------|-------------|
| `transaction.created` | New transaction added |
| `transaction.updated` | Transaction modified |
| `transaction.deleted` | Transaction removed |
| `budget.exceeded` | Budget limit exceeded |
| `goal.completed` | Financial goal achieved |
| `account.balance_updated` | Account balance changed |

### Webhook Payload

```json
{
  "event": "transaction.created",
  "timestamp": "2026-01-14T12:00:00.000Z",
  "data": {
    "transactionId": "txn_1234567890",
    "accountId": "acc_1234567890",
    "amount": "-45.67",
    "merchantName": "Grocery Store",
    "categoryId": "cat_food_and_drink"
  }
}
```

### Webhook Security

Webhooks include an `X-SmartBudget-Signature` header for verification:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Support

### API Support

- **Email**: api-support@smartbudget.app
- **Documentation**: https://docs.smartbudget.app
- **Status Page**: https://status.smartbudget.app
- **Developer Forum**: https://forum.smartbudget.app

### API Changelog

Track API changes and updates:
- https://docs.smartbudget.app/changelog

### SDKs and Libraries

Official SDKs:
- JavaScript/TypeScript: `npm install @smartbudget/js-sdk`
- Python: `pip install smartbudget-sdk`
- Ruby: `gem install smartbudget`

---

*API Version 1.0 | Last Updated: January 2026*
