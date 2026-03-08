import request from 'supertest'
import mongoose from 'mongoose'
import app from '../../app'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db'
import { createUser, createAdminUser, createCategory, createProduct } from '../helpers/factories'
import { makeToken } from '../helpers/auth'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

// ── GET /api/products (public) ────────────────────────────────────────────────

describe('GET /api/products', () => {
  it('excludes inactive products', async () => {
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    await createProduct(catId, { name: 'Active', isActive: true, stock: 5 })
    await createProduct(catId, { name: 'Inactive', isActive: false, stock: 5 })

    const res = await request(app).get('/api/products')

    expect(res.status).toBe(200)
    const names: string[] = res.body.products.map((p: { name: string }) => p.name)
    expect(names).toContain('Active')
    expect(names).not.toContain('Inactive')
  })

  it('excludes out-of-stock products', async () => {
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    await createProduct(catId, { name: 'InStock', stock: 10 })
    await createProduct(catId, { name: 'OutOfStock', stock: 0 })

    const res = await request(app).get('/api/products')

    expect(res.status).toBe(200)
    const names: string[] = res.body.products.map((p: { name: string }) => p.name)
    expect(names).toContain('InStock')
    expect(names).not.toContain('OutOfStock')
  })

  it('filters by category', async () => {
    const cat1 = await createCategory()
    const cat2 = await createCategory()
    await createProduct(cat1._id as mongoose.Types.ObjectId, { name: 'Cat1Product' })
    await createProduct(cat2._id as mongoose.Types.ObjectId, { name: 'Cat2Product' })

    const res = await request(app).get(`/api/products?category=${cat1._id.toString()}`)

    expect(res.status).toBe(200)
    const names: string[] = res.body.products.map((p: { name: string }) => p.name)
    expect(names).toContain('Cat1Product')
    expect(names).not.toContain('Cat2Product')
  })

  it('filters by price range', async () => {
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    await createProduct(catId, { name: 'Cheap', price: 10 })
    await createProduct(catId, { name: 'Mid', price: 50 })
    await createProduct(catId, { name: 'Expensive', price: 200 })

    const res = await request(app).get('/api/products?minPrice=20&maxPrice=100')

    expect(res.status).toBe(200)
    const names: string[] = res.body.products.map((p: { name: string }) => p.name)
    expect(names).toContain('Mid')
    expect(names).not.toContain('Cheap')
    expect(names).not.toContain('Expensive')
  })

  it('returns paginated results with correct totalProducts', async () => {
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    for (let i = 0; i < 5; i++) {
      await createProduct(catId)
    }

    const res = await request(app).get('/api/products?page=1&limit=3')

    expect(res.status).toBe(200)
    expect(res.body.products).toHaveLength(3)
    expect(res.body.totalProducts).toBe(5)
    expect(res.body.totalPages).toBe(2)
    expect(res.body.page).toBe(1)
  })

  it('sorts by price ascending', async () => {
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    await createProduct(catId, { name: 'Expensive', price: 100 })
    await createProduct(catId, { name: 'Cheap', price: 10 })

    const res = await request(app).get('/api/products?sort=price_asc')

    expect(res.status).toBe(200)
    const prices: number[] = res.body.products.map((p: { price: number }) => p.price)
    expect(prices[0]).toBeLessThanOrEqual(prices[prices.length - 1])
  })

  it('defaults sort to createdAt desc for unknown sort value', async () => {
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    await createProduct(catId)

    const res = await request(app).get('/api/products?sort=unknown_sort')
    expect(res.status).toBe(200)
    expect(res.body.products).toBeDefined()
  })
})

// ── GET /api/products/:id ─────────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
  it('returns product by id', async () => {
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { name: 'Target' })

    const res = await request(app).get(`/api/products/${product._id.toString()}`)

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Target')
  })

  it('returns 404 for inactive product', async () => {
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { isActive: false })

    const res = await request(app).get(`/api/products/${product._id.toString()}`)
    expect(res.status).toBe(404)
  })

  it('returns 404 for out-of-stock product', async () => {
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { stock: 0 })

    const res = await request(app).get(`/api/products/${product._id.toString()}`)
    expect(res.status).toBe(404)
  })
})

// ── GET /api/products/admin/all ───────────────────────────────────────────────

describe('GET /api/products/admin/all', () => {
  it('returns all products including inactive for admin', async () => {
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    await createProduct(catId, { isActive: true })
    await createProduct(catId, { isActive: false })
    await createProduct(catId, { stock: 0 })

    const admin = await createAdminUser()
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .get('/api/products/admin/all')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.totalProducts).toBe(3)
  })

  it('returns 403 for customer', async () => {
    const user = await createUser()
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .get('/api/products/admin/all')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/products/admin/all')
    expect(res.status).toBe(401)
  })
})

// ── POST /api/products (admin) ────────────────────────────────────────────────

describe('POST /api/products', () => {
  it('creates a product as admin', async () => {
    const admin = await createAdminUser()
    const cat = await createCategory()
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Product',
        description: 'Description',
        price: 49.99,
        category: cat._id.toString(),
        stock: 15,
        images: ['/images/new.jpg'],
        specifications: [],
      })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('New Product')
  })

  it('returns 403 for customer', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', description: 'X', price: 10, category: cat._id.toString(), stock: 1 })

    expect(res.status).toBe(403)
  })
})

// ── DELETE /api/products/:id (admin) ─────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
  it('deletes a product as admin', async () => {
    const admin = await createAdminUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .delete(`/api/products/${product._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })

  it('returns 403 for customer', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .delete(`/api/products/${product._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
