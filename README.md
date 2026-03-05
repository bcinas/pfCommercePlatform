# pfCommercePlatform

A full-stack e-commerce platform built as a 5-day case study. Features a customer-facing storefront with cart, checkout, and order management, plus an admin dashboard with analytics and inventory control.

---

## Features

- Product browsing with full-text search, category filtering, price/rating filters, sort options, and pagination
- Shopping cart with quantity management (React context + reducer)
- 3-step checkout: Shipping address → Payment (simulated) → Order confirmation
- Order history with per-order cancel (automatically restores stock)
- Review system: one review per user per product, requires a delivered order
- JWT authentication with role-based access control (customer / admin)
- Admin dashboard: sales stats, revenue charts, order status management, product CRUD, bulk product toggle, stock management
- Rate limiting on auth endpoints (10 requests per 15 minutes)
- Database seeder with 5 categories, 20 products, sample reviews, and orders

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4 |
| UI components | shadcn/ui, Radix UI primitives, Lucide React, Recharts |
| Backend | Express 5, TypeScript |
| Database | MongoDB with Mongoose 9 |
| Auth | JSON Web Tokens (bcryptjs + jsonwebtoken) |
| Security | express-rate-limit, CORS |

---

## Prerequisites

- Node.js v18 or later
- npm v9 or later
- MongoDB running locally on the default port (`27017`)

Verify your setup:

```bash
node -v      # should print v18.x.x or higher
mongosh --version
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd pfCommercePlatform
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Environment Variable Setup

### Backend

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pfcommerce
JWT_SECRET=your_super_secret_key_change_this
```

> **Important:** Change `JWT_SECRET` to a long random string before any deployment.

### Frontend

The API base URL is configured in `frontend/app/lib/api.ts` and defaults to `http://localhost:5000/api`. No `.env` file is required for local development.

For production, update the file to read from `NEXT_PUBLIC_API_URL`:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

---

## Running the Application

Open two terminal windows from the project root.

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

The API server starts at `http://localhost:5000`.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

The frontend starts at `http://localhost:3000`.

---

## Database Seeding

To populate the database with sample categories, products, users, reviews, and orders:

```bash
cd backend
npm run seed
```

The seeder drops the existing database, then inserts fresh data. Run this once before first use or any time you want to reset to the demo state.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@test.com | 123456 |
| Customer | john@test.com | 123456 |

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, category grid, top-rated and most-popular products |
| `/products` | All products with search, filter, sort, and pagination |
| `/products/[id]` | Product detail page with reviews |
| `/categories` | All categories grid |
| `/category/[slug]` | Category-filtered product listing |
| `/cart` | Shopping cart with quantity management |
| `/checkout` | 3-step checkout: Shipping → Payment → Confirm |
| `/orders/[id]` | Order confirmation page (post-purchase) |
| `/profile` | User profile editor and order history |
| `/profile/orders/[id]` | Order detail with cancel option |
| `/login` | Login form |
| `/register` | Registration form |
| `/admin` | Admin dashboard with stats and charts |
| `/admin/products` | Product CRUD with stock management |
| `/admin/categories` | Category CRUD |
| `/admin/orders` | Order list with status updates |

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new account |
| POST | `/auth/login` | No | Log in, receive JWT |
| GET | `/auth/profile` | Yes | Get current user profile |
| PUT | `/auth/profile` | Yes | Update name, email, or password |

**POST /api/auth/register**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

**POST /api/auth/login**

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Response includes a `token` field. Send it as a Bearer token in subsequent requests:

```
Authorization: Bearer <token>
```

---

### Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/categories` | No | List all categories |
| GET | `/categories/:id` | No | Get single category |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |

**Category body:**

```json
{
  "name": "Electronics",
  "slug": "electronics",
  "image": "/images/cat-electronics.jpg",
  "isActive": true
}
```

---

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | No | List products (supports query params) |
| GET | `/products/:id` | No | Get single product |
| GET | `/products/:id/reviews` | No | Get reviews for a product |
| POST | `/products/:id/reviews` | Yes | Submit a review |
| POST | `/products` | Admin | Create product |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Delete product |

**GET /api/products — query parameters**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Full-text search on name and description |
| `category` | string | Filter by category ID |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `minRating` | number | Minimum average rating |
| `sort` | string | `price_asc`, `price_desc`, `rating`, `newest` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 12) |

Public listings always filter to `isActive: true` and `stock > 0`.

**Response shape:**

```json
{
  "products": [...],
  "page": 1,
  "totalPages": 3,
  "totalProducts": 34
}
```

**POST /api/products/:id/reviews**

```json
{
  "rating": 4,
  "comment": "Great product, fast shipping."
}
```

---

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Yes | Create a new order |
| GET | `/orders/my` | Yes | Get current user's orders |
| GET | `/orders/:id` | Yes | Get single order |
| PATCH | `/orders/:id/cancel` | Yes | Cancel an order (restores stock) |

**POST /api/orders**

```json
{
  "items": [
    { "product": "<productId>", "quantity": 2 }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "postalCode": "12345",
    "country": "US"
  },
  "paymentMethod": "credit_card"
}
```

---

### Admin

All admin endpoints require an admin JWT (`role: "admin"`).

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats` | Dashboard stats (revenue, order counts, top products) |
| GET | `/admin/orders` | Paginated order list |
| GET | `/admin/orders/:id` | Order detail |
| PATCH | `/admin/orders/:id/status` | Update order status |
| GET | `/admin/products` | Product list with full inventory data |
| PATCH | `/admin/products/:id/stock` | Update product stock |
| PATCH | `/admin/products/bulk-update` | Bulk toggle product active status |

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| name | String | Required |
| email | String | Required, unique, lowercase |
| password | String | Bcrypt hashed via pre-save hook |
| role | `'customer'` \| `'admin'` | Default: `customer` |

### Category

| Field | Type | Notes |
|---|---|---|
| name | String | Required, unique |
| slug | String | Required, unique, lowercase |
| image | String | Default: `''` |
| isActive | Boolean | Default: `true` |

### Product

| Field | Type | Notes |
|---|---|---|
| name | String | Required; text-indexed |
| description | String | Required; text-indexed |
| price | Number | Required, min 0 |
| images | String[] | |
| category | ObjectId → Category | Required |
| stock | Number | Default 0, min 0 |
| isActive | Boolean | Default `true` |
| rating | Number | 0–5 |
| numReviews | Number | |
| specifications | `{key, value}`[] | Category-specific attributes |
| orderCount | Number | |

### Order

| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | Required |
| items | `{product, quantity, price}`[] | Snapshot price at purchase time |
| shippingAddress | Object | street, city, postalCode, country |
| paymentMethod | String | |
| paymentStatus | `'pending'` \| `'paid'` | |
| status | `'pending'` \| `'processing'` \| `'shipped'` \| `'delivered'` \| `'cancelled'` | |
| totalAmount | Number | |

---

## Middleware

### `protect`

Validates the JWT from the `Authorization: Bearer <token>` header and attaches the decoded user to `req.user`. Returns `401` if missing or invalid.

### `adminOnly`

Must be used after `protect`. Returns `403` if `req.user.role !== 'admin'`.

---

## Build for Production

### Backend

```bash
cd backend
npm run build   # compiles TypeScript to dist/
npm start       # runs dist/index.js
```

### Frontend

```bash
cd frontend
npm run build   # Next.js production build
npm start       # starts production server on port 3000
```

### Production checklist

- Set `JWT_SECRET` to a strong, randomly generated value (32+ characters)
- Set `MONGO_URI` to your production MongoDB connection string (e.g. MongoDB Atlas)
- Update the API base URL in `frontend/app/lib/api.ts` to point to the production backend, or introduce `NEXT_PUBLIC_API_URL` as an environment variable and read it there
- Ensure CORS in `backend/src/index.ts` allows your production frontend origin

---

## Project Structure

```
pfCommercePlatform/
├── backend/
│   └── src/
│       ├── index.ts              # Express entry point
│       ├── seed.ts               # Database seeder
│       ├── config/               # DB connection
│       ├── controllers/          # Route handlers
│       ├── middleware/           # JWT auth middleware (protect, adminOnly)
│       ├── models/               # Mongoose schemas (User, Product, Category, Order, Review)
│       └── routes/               # Route definitions
└── frontend/
    └── app/
        ├── page.tsx              # Homepage
        ├── layout.tsx            # Root layout with Header and Footer
        ├── globals.css           # Global styles (Tailwind v4 + shadcn tokens)
        ├── lib/
        │   ├── api.ts            # Public API client
        │   ├── adminApi.ts       # Admin API client
        │   └── admin-data.ts     # Admin TypeScript types and utility functions
        ├── types/index.ts        # Shared frontend TypeScript types
        ├── context/              # AuthContext, CartContext
        ├── components/           # Shared UI components
        │   └── admin/            # Admin-specific components (sidebar, charts, tables)
        ├── admin/                # Admin pages (dashboard, products, categories, orders)
        ├── products/             # Product listing and detail pages
        ├── categories/           # Categories grid page
        ├── category/[slug]/      # Category-filtered product listing
        ├── cart/                 # Cart page
        ├── checkout/             # Checkout flow
        ├── orders/[id]/          # Order confirmation
        ├── profile/              # User profile and order history
        │   └── orders/[id]/      # Order detail with cancel
        ├── login/
        └── register/
```
