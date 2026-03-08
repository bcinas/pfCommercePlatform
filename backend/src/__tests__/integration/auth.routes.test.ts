// Mock rate limiter before importing app to avoid 429s during tests
jest.mock('express-rate-limit', () => () => (
  _req: unknown, _res: unknown, next: () => void
) => next())

import request from 'supertest'
import app from '../../app'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db'
import { createUser } from '../helpers/factories'
import { makeToken } from '../helpers/auth'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

const ADDR = {
  fullName: 'Test User',
  address: '123 Main St',
  city: 'Testville',
  postalCode: '12345',
  country: 'US',
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('returns 201 with a token on success', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.email).toBe('alice@example.com')
  })

  it('does not return password in response', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'password123' })

    expect(res.body.password).toBeUndefined()
  })

  it('stores email in lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'CAROL@EXAMPLE.COM', password: 'password123' })

    expect(res.body.email).toBe('carol@example.com')
  })

  it('returns 400 for duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dave', email: 'dave@example.com', password: 'password123' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dave2', email: 'dave@example.com', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/already in use/i)
  })
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 200 with a token for valid credentials', async () => {
    await createUser({ email: 'logintest@example.com', password: 'password123' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logintest@example.com', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('is case-insensitive for email', async () => {
    await createUser({ email: 'case@example.com', password: 'password123' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'CASE@EXAMPLE.COM', password: 'password123' })

    expect(res.status).toBe(200)
  })

  it('returns 401 for wrong password', async () => {
    await createUser({ email: 'wrongpw@example.com', password: 'correctpassword' })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    expect(res.status).toBe(401)
  })
})

// ── GET /api/auth/profile ─────────────────────────────────────────────────────

describe('GET /api/auth/profile', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/profile')
    expect(res.status).toBe(401)
  })

  it('returns user profile without password for authenticated user', async () => {
    const user = await createUser({ email: 'profile@example.com' })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('profile@example.com')
    expect(res.body.password).toBeUndefined()
  })
})

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────

describe('PUT /api/auth/profile', () => {
  it('updates name', async () => {
    const user = await createUser({ name: 'Original Name', email: 'update@example.com' })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Updated Name')
  })

  it('returns a fresh token after update', async () => {
    const user = await createUser({ email: 'tokenrefresh@example.com' })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' })

    expect(res.body.token).toBeDefined()
  })

  it('requires currentPassword to change password', async () => {
    const user = await createUser({ email: 'pw@example.com', password: 'oldpassword' })
    const token = makeToken(user._id.toString())

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'newpassword123' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/current password/i)
  })

  it('rejects new email that is already in use', async () => {
    const user1 = await createUser({ email: 'existing@example.com' })
    const user2 = await createUser({ email: 'mine@example.com' })
    const token = makeToken(user2._id.toString())

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: user1.email })

    expect(res.status).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/auth/profile').send({ name: 'X' })
    expect(res.status).toBe(401)
  })
})
