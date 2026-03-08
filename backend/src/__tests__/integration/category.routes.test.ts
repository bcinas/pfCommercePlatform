import request from 'supertest'
import app from '../../app'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db'
import { createCategory } from '../helpers/factories'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

describe('GET /api/categories', () => {
  it('returns all categories', async () => {
    await createCategory({ name: 'Electronics', slug: 'electronics' })
    await createCategory({ name: 'Clothing', slug: 'clothing' })

    const res = await request(app).get('/api/categories')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(2)
  })

  it('returns empty array when no categories exist', async () => {
    const res = await request(app).get('/api/categories')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns expected category fields', async () => {
    await createCategory({ name: 'Books', slug: 'books' })

    const res = await request(app).get('/api/categories')

    const cat = res.body[0]
    expect(cat).toHaveProperty('_id')
    expect(cat).toHaveProperty('name', 'Books')
    expect(cat).toHaveProperty('slug', 'books')
    expect(cat).toHaveProperty('isActive')
  })
})
