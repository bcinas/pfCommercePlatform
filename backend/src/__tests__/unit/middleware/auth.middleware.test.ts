import jwt from 'jsonwebtoken'
import { protect, adminOnly, type AuthRequest } from '../../../middleware/auth'
import type { Response, NextFunction } from 'express'

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

function makeNext(): NextFunction {
  return jest.fn()
}

// ── protect ───────────────────────────────────────────────────────────────────

describe('protect middleware', () => {
  const secret = 'test-jwt-secret-32-chars-minimum!!'

  beforeAll(() => {
    process.env.JWT_SECRET = secret
  })

  it('calls next() when a valid token references an existing user', async () => {
    const userId = '507f1f77bcf86cd799439011'
    const token = jwt.sign({ id: userId, role: 'customer' }, secret, { expiresIn: '1h' })

    const mockUser = { _id: userId, name: 'Test', role: 'customer' }

    jest.spyOn(require('../../../models/User').default, 'findById').mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(mockUser),
    })

    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest
    const res = makeRes()
    const next = makeNext()

    await protect(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.user).toBe(mockUser)
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} } as AuthRequest
    const res = makeRes()
    const next = makeNext()

    await protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }))
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for a token signed with the wrong secret', async () => {
    const token = jwt.sign({ id: 'someId', role: 'customer' }, 'wrong-secret')

    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest
    const res = makeRes()
    const next = makeNext()

    await protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when user no longer exists in DB', async () => {
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'customer' }, secret)

    jest.spyOn(require('../../../models/User').default, 'findById').mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(null),
    })

    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest
    const res = makeRes()
    const next = makeNext()

    await protect(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})

// ── adminOnly ─────────────────────────────────────────────────────────────────

describe('adminOnly middleware', () => {
  it('calls next() when user role is admin', () => {
    const req = { user: { role: 'admin' } } as AuthRequest
    const res = makeRes()
    const next = makeNext()

    adminOnly(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('returns 403 when user role is customer', () => {
    const req = { user: { role: 'customer' } } as AuthRequest
    const res = makeRes()
    const next = makeNext()

    adminOnly(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 403 when user is undefined', () => {
    const req = {} as AuthRequest
    const res = makeRes()
    const next = makeNext()

    adminOnly(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
