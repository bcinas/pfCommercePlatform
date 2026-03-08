import jwt from 'jsonwebtoken'

export function makeToken(userId: string, role: 'customer' | 'admin' = 'customer'): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return jwt.sign({ id: userId, role }, secret, { expiresIn: '1h' })
}
