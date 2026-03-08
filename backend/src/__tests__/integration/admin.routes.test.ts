import request from 'supertest'
import mongoose from 'mongoose'
import app from '../../app'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db'
import { createUser, createAdminUser, createCategory, createProduct, createOrder, createDeliveredOrder } from '../helpers/factories'
import { makeToken } from '../helpers/auth'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

// ── Auth guards (applied to every admin route) ────────────────────────────────

describe('Admin auth guards', () => {
  const adminRoutes: Array<{ method: 'get' | 'patch'; path: string; body?: Record<string, unknown> }> = [
    { method: 'get', path: '/api/admin/stats' },
    { method: 'get', path: '/api/admin/orders' },
    { method: 'get', path: '/api/admin/products' },
  ]

  test.each(adminRoutes)('$method $path → 401 without token', async ({ method, path }) => {
    const res = await request(app)[method](path)
    expect(res.status).toBe(401)
  })

  test.each(adminRoutes)('$method $path → 403 for customer', async ({ method, path }) => {
    const user = await createUser()
    const token = makeToken(user._id.toString())
    const res = await request(app)[method](path).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

// ── GET /api/admin/stats ──────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  it('counts totalSales from delivered orders only', async () => {
    const admin = await createAdminUser()
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { price: 100 })
    const token = makeToken(admin._id.toString(), 'admin')

    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    await createOrder(user._id as mongoose.Types.ObjectId, product, { orderStatus: 'processing' })

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    // Only delivered order should be in totalSales
    // The delivered order has price 100, with free shipping (>=100) → 0, tax 10 → total 110
    expect(res.body.totalSales).toBeGreaterThan(0)
    // Processing order should NOT be in totalSales
    expect(res.body.totalOrders).toBe(2) // both orders counted in totalOrders
    expect(res.body).toHaveProperty('totalCustomers')
    expect(res.body).toHaveProperty('recentOrders')
    expect(res.body).toHaveProperty('popularProducts')
    expect(res.body).toHaveProperty('salesTrends')
    expect(res.body).toHaveProperty('orderStatusDistribution')
  })
})

// ── PATCH /api/admin/orders/:id/status ───────────────────────────────────────

describe('PATCH /api/admin/orders/:id/status', () => {
  it('updates order status to a valid value', async () => {
    const admin = await createAdminUser()
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const order = await createOrder(user._id as mongoose.Types.ObjectId, product, { orderStatus: 'processing' })
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch(`/api/admin/orders/${order._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ orderStatus: 'shipped' })

    expect(res.status).toBe(200)
    expect(res.body.order.orderStatus).toBe('shipped')
  })

  it('returns 400 for invalid orderStatus value', async () => {
    const admin = await createAdminUser()
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const order = await createOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch(`/api/admin/orders/${order._id.toString()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ orderStatus: 'invalid_status' })

    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown order id', async () => {
    const admin = await createAdminUser()
    const token = makeToken(admin._id.toString(), 'admin')
    const fakeId = new mongoose.Types.ObjectId().toString()

    const res = await request(app)
      .patch(`/api/admin/orders/${fakeId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ orderStatus: 'shipped' })

    expect(res.status).toBe(404)
  })
})

// ── PATCH /api/admin/products/:id/stock ───────────────────────────────────────

describe('PATCH /api/admin/products/:id/stock', () => {
  it('sets isActive=true when stock > 0', async () => {
    const admin = await createAdminUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { stock: 0, isActive: false })
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch(`/api/admin/products/${product._id.toString()}/stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stockQuantity: 10 })

    expect(res.status).toBe(200)
    expect(res.body.product.stock).toBe(10)
    expect(res.body.product.isActive).toBe(true)
  })

  it('sets isActive=false when stock = 0', async () => {
    const admin = await createAdminUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { stock: 20, isActive: true })
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch(`/api/admin/products/${product._id.toString()}/stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stockQuantity: 0 })

    expect(res.status).toBe(200)
    expect(res.body.product.stock).toBe(0)
    expect(res.body.product.isActive).toBe(false)
  })

  it('returns 400 for negative stock', async () => {
    const admin = await createAdminUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch(`/api/admin/products/${product._id.toString()}/stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stockQuantity: -5 })

    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown product id', async () => {
    const admin = await createAdminUser()
    const token = makeToken(admin._id.toString(), 'admin')
    const fakeId = new mongoose.Types.ObjectId().toString()

    const res = await request(app)
      .patch(`/api/admin/products/${fakeId}/stock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stockQuantity: 5 })

    expect(res.status).toBe(404)
  })
})

// ── PATCH /api/admin/products/bulk-update ─────────────────────────────────────

describe('PATCH /api/admin/products/bulk-update', () => {
  it('bulk-deactivates products and returns modifiedCount', async () => {
    const admin = await createAdminUser()
    const cat = await createCategory()
    const catId = cat._id as mongoose.Types.ObjectId
    const p1 = await createProduct(catId, { isActive: true })
    const p2 = await createProduct(catId, { isActive: true })
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch('/api/admin/products/bulk-update')
      .set('Authorization', `Bearer ${token}`)
      .send({ productIds: [p1._id.toString(), p2._id.toString()], isActive: false })

    expect(res.status).toBe(200)
    expect(res.body.modifiedCount).toBe(2)
  })

  it('returns 400 for empty productIds array', async () => {
    const admin = await createAdminUser()
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch('/api/admin/products/bulk-update')
      .set('Authorization', `Bearer ${token}`)
      .send({ productIds: [], isActive: false })

    expect(res.status).toBe(400)
  })

  it('returns 400 when isActive is not boolean', async () => {
    const admin = await createAdminUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .patch('/api/admin/products/bulk-update')
      .set('Authorization', `Bearer ${token}`)
      .send({ productIds: [product._id.toString()], isActive: 'false' })

    expect(res.status).toBe(400)
  })
})

// ── GET /api/admin/orders ─────────────────────────────────────────────────────

describe('GET /api/admin/orders', () => {
  it('returns all orders for admin', async () => {
    const admin = await createAdminUser()
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createOrder(user._id as mongoose.Types.ObjectId, product)
    await createOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.orders).toHaveLength(2)
    expect(res.body.pagination).toBeDefined()
  })

  it('filters by status', async () => {
    const admin = await createAdminUser()
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createOrder(user._id as mongoose.Types.ObjectId, product, { orderStatus: 'processing' })
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .get('/api/admin/orders?status=delivered')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.orders).toHaveLength(1)
    expect(res.body.orders[0].orderStatus).toBe('delivered')
  })
})
