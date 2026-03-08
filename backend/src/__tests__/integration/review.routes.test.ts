import request from 'supertest'
import mongoose from 'mongoose'
import app from '../../app'
import Product from '../../models/Product'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db'
import { createUser, createCategory, createProduct, createOrder, createDeliveredOrder } from '../helpers/factories'
import { makeToken } from '../helpers/auth'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

// ── POST /api/products/:id/reviews ────────────────────────────────────────────

describe('POST /api/products/:id/reviews', () => {
  it('creates a review when user has a delivered order for the product', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, comment: 'Really good product' })

    expect(res.status).toBe(201)
    expect(res.body.rating).toBe(4)
    expect(res.body.comment).toBe('Really good product')
  })

  it('returns 403 when user has no delivered order for the product', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, comment: 'Never bought it' })

    expect(res.status).toBe(403)
  })

  it('returns 403 when order status is processing (not delivered)', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createOrder(user._id as mongoose.Types.ObjectId, product, { orderStatus: 'processing' })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, comment: 'Not delivered yet' })

    expect(res.status).toBe(403)
  })

  it('returns 400 for rating 0', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 0, comment: 'Zero stars' })

    expect(res.status).toBe(400)
  })

  it('returns 400 for rating 6', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 6, comment: 'Over the limit' })

    expect(res.status).toBe(400)
  })

  it('returns 400 for non-integer rating', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3.5, comment: 'Half star' })

    expect(res.status).toBe(400)
  })

  it('returns 400 for empty comment', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 3, comment: '   ' })

    expect(res.status).toBe(400)
  })

  it('returns 400 on duplicate review (same user + product)', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)
    const token = makeToken(user._id.toString())

    await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, comment: 'First review' })

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, comment: 'Second review' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/already reviewed/i)
  })

  it('recalculates product rating and numReviews after creating a review', async () => {
    const user1 = await createUser()
    const user2 = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user1._id as mongoose.Types.ObjectId, product)
    await createDeliveredOrder(user2._id as mongoose.Types.ObjectId, product)

    await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${makeToken(user1._id.toString())}`)
      .send({ rating: 4, comment: 'Good' })

    await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${makeToken(user2._id.toString())}`)
      .send({ rating: 2, comment: 'Not great' })

    const updated = await Product.findById(product._id)
    expect(updated!.numReviews).toBe(2)
    expect(updated!.rating).toBe(3.0) // (4+2)/2 = 3.0
  })

  it('returns 401 without token', async () => {
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    const res = await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .send({ rating: 4, comment: 'No auth' })

    expect(res.status).toBe(401)
  })
})

// ── GET /api/products/:id/reviews ─────────────────────────────────────────────

describe('GET /api/products/:id/reviews', () => {
  it('returns populated user.name for each review', async () => {
    const user = await createUser({ name: 'Reviewer Name' })
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)
    await createDeliveredOrder(user._id as mongoose.Types.ObjectId, product)

    await request(app)
      .post(`/api/products/${product._id.toString()}/reviews`)
      .set('Authorization', `Bearer ${makeToken(user._id.toString())}`)
      .send({ rating: 5, comment: 'Excellent' })

    const res = await request(app).get(`/api/products/${product._id.toString()}/reviews`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0].user.name).toBe('Reviewer Name')
  })

  it('returns empty array when product has no reviews', async () => {
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    const res = await request(app).get(`/api/products/${product._id.toString()}/reviews`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})
