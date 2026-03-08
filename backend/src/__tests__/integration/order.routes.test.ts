import request from 'supertest'
import mongoose from 'mongoose'
import app from '../../app'
import Product from '../../models/Product'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db'
import { createUser, createAdminUser, createCategory, createProduct, createOrder } from '../helpers/factories'
import { makeToken } from '../helpers/auth'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

const SHIPPING = {
  fullName: 'Test User',
  address: '123 Main St',
  city: 'Testville',
  postalCode: '12345',
  country: 'US',
}

// ── POST /api/orders ──────────────────────────────────────────────────────────

describe('POST /api/orders', () => {
  it('calculates price breakdown correctly (itemsPrice < $100 → shipping = $10)', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { price: 30.00, stock: 10 })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 2 }],
        shippingAddress: SHIPPING,
      })

    expect(res.status).toBe(201)
    expect(res.body.itemsPrice).toBe(60.00)
    expect(res.body.shippingPrice).toBe(10)
    expect(res.body.taxPrice).toBe(6.00)
    expect(res.body.totalPrice).toBe(76.00)
  })

  it('gives free shipping when itemsPrice >= $100', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { price: 50.00, stock: 10 })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 2 }],
        shippingAddress: SHIPPING,
      })

    expect(res.status).toBe(201)
    expect(res.body.itemsPrice).toBe(100.00)
    expect(res.body.shippingPrice).toBe(0)
    expect(res.body.taxPrice).toBe(10.00)
    expect(res.body.totalPrice).toBe(110.00)
  })

  it('uses server-side price, ignoring any client-provided price', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { price: 29.99, stock: 10 })
    const token = makeToken(user._id.toString())

    // Client sends a tampered item (no price field accepted from client)
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 1, price: 0.01 }],
        shippingAddress: SHIPPING,
      })

    expect(res.status).toBe(201)
    expect(res.body.itemsPrice).toBe(29.99)
  })

  it('returns 400 when items array is empty', async () => {
    const user = await createUser()
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [], shippingAddress: SHIPPING })

    expect(res.status).toBe(400)
  })

  it('returns 400 when shipping address fields are missing', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: product._id.toString(), quantity: 1 }],
        shippingAddress: { fullName: 'Test', address: '123 St' }, // missing city, postalCode, country
      })

    expect(res.status).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [], shippingAddress: SHIPPING })

    expect(res.status).toBe(401)
  })
})

// ── PATCH /api/orders/:id/cancel ──────────────────────────────────────────────

describe('PATCH /api/orders/:id/cancel', () => {
  it('cancels a processing order and restores stock', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId, { stock: 20, price: 20 })
    const order = await createOrder(user._id as mongoose.Types.ObjectId, product, { orderStatus: 'processing', quantity: 3 })
    const token = makeToken(user._id.toString())

    // Update product stock as if items were reserved
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -3 } })
    const stockBefore = (await Product.findById(product._id))!.stock

    const res = await request(app)
      .patch(`/api/orders/${order._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.orderStatus).toBe('cancelled')

    const stockAfter = (await Product.findById(product._id))!.stock
    expect(stockAfter).toBe(stockBefore + 3)
  })

  it('returns 400 when order is not in processing status', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const order = await createOrder(user._id as mongoose.Types.ObjectId, product, { orderStatus: 'shipped' })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .patch(`/api/orders/${order._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 403 when a different user tries to cancel', async () => {
    const owner = await createUser()
    const other = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const order = await createOrder(owner._id as mongoose.Types.ObjectId, product, { orderStatus: 'processing' })
    const token = makeToken(other._id.toString())

    const res = await request(app)
      .patch(`/api/orders/${order._id.toString()}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('returns 404 for unknown order id', async () => {
    const user = await createUser()
    const token = makeToken(user._id.toString())
    const fakeId = new mongoose.Types.ObjectId().toString()

    const res = await request(app)
      .patch(`/api/orders/${fakeId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

// ── GET /api/orders/my ────────────────────────────────────────────────────────

describe('GET /api/orders/my', () => {
  it('returns only the authenticated user\'s orders', async () => {
    const user1 = await createUser()
    const user2 = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    await createOrder(user1._id as mongoose.Types.ObjectId, product)
    await createOrder(user1._id as mongoose.Types.ObjectId, product)
    await createOrder(user2._id as mongoose.Types.ObjectId, product)

    const token = makeToken(user1._id.toString())
    const res = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(2)
    res.body.forEach((o: { user: string }) => {
      expect(o.user.toString()).toBe(user1._id.toString())
    })
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders/my')
    expect(res.status).toBe(401)
  })
})

// ── GET /api/orders/:id ───────────────────────────────────────────────────────

describe('GET /api/orders/:id', () => {
  it('returns the order to its owner', async () => {
    const owner = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const order = await createOrder(owner._id as mongoose.Types.ObjectId, product)
    const token = makeToken(owner._id.toString())

    const res = await request(app)
      .get(`/api/orders/${order._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body._id).toBe(order._id.toString())
  })

  it('returns the order to an admin', async () => {
    const owner = await createUser()
    const admin = await createAdminUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const order = await createOrder(owner._id as mongoose.Types.ObjectId, product)
    const token = makeToken(admin._id.toString(), 'admin')

    const res = await request(app)
      .get(`/api/orders/${order._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })

  it('returns 403 when a different customer tries to view the order', async () => {
    const owner = await createUser()
    const other = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const order = await createOrder(owner._id as mongoose.Types.ObjectId, product)
    const token = makeToken(other._id.toString())

    const res = await request(app)
      .get(`/api/orders/${order._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
