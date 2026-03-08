import mongoose from 'mongoose'
import Review from '../../../models/Review'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../../helpers/db'
import { createUser, createCategory, createProduct } from '../../helpers/factories'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

describe('Review model', () => {
  it('creates a valid review', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    const review = await Review.create({
      user: user._id,
      product: product._id,
      rating: 4,
      comment: 'Great product!',
    })

    expect(review.rating).toBe(4)
    expect(review.comment).toBe('Great product!')
  })

  it('rejects rating below 1', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    await expect(
      Review.create({ user: user._id, product: product._id, rating: 0, comment: 'Bad' })
    ).rejects.toThrow()
  })

  it('rejects rating above 5', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    await expect(
      Review.create({ user: user._id, product: product._id, rating: 6, comment: 'Amazing' })
    ).rejects.toThrow()
  })

  it('requires comment', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    await expect(
      Review.create({ user: user._id, product: product._id, rating: 3 })
    ).rejects.toThrow()
  })

  it('enforces unique (user, product) constraint', async () => {
    const user = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    await Review.create({ user: user._id, product: product._id, rating: 4, comment: 'Good' })

    await expect(
      Review.create({ user: user._id, product: product._id, rating: 5, comment: 'Great' })
    ).rejects.toMatchObject({ code: 11000 })
  })

  it('allows different users to review the same product', async () => {
    const user1 = await createUser()
    const user2 = await createUser()
    const cat = await createCategory()
    const product = await createProduct(cat._id as mongoose.Types.ObjectId)

    await Review.create({ user: user1._id, product: product._id, rating: 4, comment: 'Good' })
    const r2 = await Review.create({ user: user2._id, product: product._id, rating: 5, comment: 'Excellent' })

    expect(r2.rating).toBe(5)
  })
})
