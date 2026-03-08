import mongoose from 'mongoose'
import Product from '../../../models/Product'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../../helpers/db'
import { createCategory } from '../../helpers/factories'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

describe('Product model', () => {
  it('creates a valid product with defaults', async () => {
    const cat = await createCategory()
    const product = await Product.create({
      name: 'Test Headphones',
      description: 'Great audio',
      price: 49.99,
      category: cat._id,
      stock: 20,
    })

    expect(product.name).toBe('Test Headphones')
    expect(product.isActive).toBe(true)
    expect(product.rating).toBe(0)
    expect(product.numReviews).toBe(0)
    expect(product.orderCount).toBe(0)
  })

  it('requires name', async () => {
    const cat = await createCategory()
    await expect(
      Product.create({ description: 'No name', price: 10, category: cat._id, stock: 5 })
    ).rejects.toThrow()
  })

  it('requires description', async () => {
    const cat = await createCategory()
    await expect(
      Product.create({ name: 'No desc', price: 10, category: cat._id, stock: 5 })
    ).rejects.toThrow()
  })

  it('rejects negative price', async () => {
    const cat = await createCategory()
    await expect(
      Product.create({ name: 'Negative', description: 'test', price: -5, category: cat._id, stock: 5 })
    ).rejects.toThrow()
  })

  it('rejects negative stock', async () => {
    const cat = await createCategory()
    await expect(
      Product.create({ name: 'NegStock', description: 'test', price: 10, category: cat._id, stock: -1 })
    ).rejects.toThrow()
  })

  it('text index exists on name and description fields', async () => {
    const indexes = await Product.collection.indexes()
    const textIndex = indexes.find(
      (idx) => idx.key && (idx.key._fts === 'text' || Object.values(idx.key as Record<string, unknown>).includes('text'))
    )
    expect(textIndex).toBeDefined()
  })
})
