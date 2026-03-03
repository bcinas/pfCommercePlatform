# pfCommercePlatform

A full-stack e-commerce platform with a Node.js/Express/MongoDB backend and a separate frontend.

---

## Project Structure

```
pfCommercePlatform/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── categoryController.ts
│   │   │   └── productController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── models/
│   │   │   ├── Category.ts
│   │   │   ├── Product.ts
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── categoryRoutes.ts
│   │   │   └── productRoutes.ts
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/
```

---

## Backend

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose 9
- **Language**: TypeScript (strict mode)
- **Auth**: JWT (`jsonwebtoken`) + bcrypt password hashing (`bcryptjs`)

### Environment Variables

Create a `.env` file inside `backend/`:

```env
MONGO_URI=mongodb://localhost:27017/pfcommerce
JWT_SECRET=your_secret_here
PORT=5000
```

### Getting Started

```bash
cd backend
npm install

# Development (hot reload)
npm run dev

# Seed the database
npm run seed

# Type check
npx tsc --noEmit

# Build for production
npm run build
npm start
```

---

## API Reference

Base URL: `http://localhost:5000/api`

### Auth — `/api/auth`

| Method | Endpoint    | Access | Description              |
|--------|-------------|--------|--------------------------|
| POST   | `/register` | Public | Register a new user      |
| POST   | `/login`    | Public | Login and receive a JWT  |

**Register / Login request body:**
```json
{ "name": "John Doe", "email": "john@test.com", "password": "123456" }
```

**Response includes a JWT token** — pass it in subsequent requests:
```
Authorization: Bearer <token>
```

---

### Categories — `/api/categories`

| Method | Endpoint | Access     | Description                              |
|--------|----------|------------|------------------------------------------|
| GET    | `/`      | Public     | List active categories (sorted by name)  |
| GET    | `/:id`   | Public     | Get a single category by ID              |
| POST   | `/`      | Admin only | Create a category                        |
| PUT    | `/:id`   | Admin only | Update a category                        |
| DELETE | `/:id`   | Admin only | Delete a category                        |

**Category shape:**
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "image": "/images/cat-electronics.jpg",
  "isActive": true
}
```

---

### Products — `/api/products`

| Method | Endpoint     | Access     | Description                                      |
|--------|--------------|------------|--------------------------------------------------|
| GET    | `/`          | Public     | List products (filters, sort, pagination)        |
| GET    | `/:id`       | Public     | Get a single product (active + in-stock only)    |
| GET    | `/admin/all` | Admin only | List all products including inactive/out-of-stock|
| POST   | `/`          | Admin only | Create a product                                 |
| PUT    | `/:id`       | Admin only | Update a product                                 |
| DELETE | `/:id`       | Admin only | Delete a product                                 |

**Public `GET /` query parameters:**

| Param      | Type   | Description                                             |
|------------|--------|---------------------------------------------------------|
| `category` | string | Filter by category ID                                   |
| `minPrice` | number | Minimum price                                           |
| `maxPrice` | number | Maximum price                                           |
| `minRating`| number | Minimum rating (0–5)                                    |
| `search`   | string | Full-text search on name and description                |
| `sort`     | string | `price_asc`, `price_desc`, `rating`, `newest`           |
| `page`     | number | Page number (default: 1)                                |
| `limit`    | number | Results per page (default: 12)                          |

Public listings always filter to `isActive: true` and `stock > 0`.

**Response shape:**
```json
{
  "products": [...],
  "page": 1,
  "totalPages": 3,
  "totalProducts": 20
}
```

---

## Data Models

### User
| Field     | Type                      | Notes                          |
|-----------|---------------------------|--------------------------------|
| name      | String                    | Required                       |
| email     | String                    | Required, unique, lowercase    |
| password  | String                    | Bcrypt hashed via pre-save hook|
| role      | `'customer'` \| `'admin'` | Default: `customer`            |

### Category
| Field    | Type    | Notes                     |
|----------|---------|---------------------------|
| name     | String  | Required, unique           |
| slug     | String  | Required, unique, lowercase|
| image    | String  | Default: `''`              |
| isActive | Boolean | Default: `true`            |

### Product
| Field          | Type              | Notes                                   |
|----------------|-------------------|-----------------------------------------|
| name           | String            | Required; text-indexed                  |
| description    | String            | Required; text-indexed                  |
| price          | Number            | Required, min 0                         |
| images         | String[]          |                                         |
| category       | ObjectId → Category | Required, populated on detail view    |
| stock          | Number            | Default 0, min 0                        |
| isActive       | Boolean           | Default `true`                          |
| rating         | Number            | 0–5                                     |
| numReviews     | Number            |                                         |
| specifications | `{key, value}`[]  | Category-specific attributes            |
| orderCount     | Number            |                                         |

A **compound text index** on `name` + `description` powers the `search` query param.

---

## Middleware

### `protect`
Validates the JWT from the `Authorization: Bearer <token>` header and attaches the user to `req.user`.

### `adminOnly`
Must be used after `protect`. Returns `403` if `req.user.role !== 'admin'`.

---

## Database Seed

```bash
npm run seed
```

Clears and repopulates `User`, `Category`, and `Product` collections with:

| Collection | Count | Notes                                                         |
|------------|-------|---------------------------------------------------------------|
| Users      | 2     | `admin@test.com` / `john@test.com` — password `123456`        |
| Categories | 5     | Electronics, Clothing, Home & Kitchen, Sports & Outdoors, Books |
| Products   | 20    | 4 per category; 1 inactive, 1 out-of-stock (for filter testing)|
