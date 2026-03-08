import mongoose from 'mongoose'
import User from '../../../models/User'
import { connectTestDb, clearTestDb, disconnectTestDb } from '../../helpers/db'

beforeAll(() => connectTestDb())
afterEach(() => clearTestDb())
afterAll(() => disconnectTestDb())

describe('User model', () => {
  it('hashes the password before saving', async () => {
    const user = await User.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'plainpassword',
    })
    expect(user.password).not.toBe('plainpassword')
    expect(user.password).toMatch(/^\$2[aby]\$/)
  })

  it('does not re-hash password when saving without modification', async () => {
    const user = await User.create({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'plainpassword',
    })
    const firstHash = user.password

    user.name = 'Bob Updated'
    await user.save()

    expect(user.password).toBe(firstHash)
  })

  it('comparePassword returns true for correct password', async () => {
    const user = await User.create({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'mypassword',
    })
    const result = await user.comparePassword('mypassword')
    expect(result).toBe(true)
  })

  it('comparePassword returns false for wrong password', async () => {
    const user = await User.create({
      name: 'Dave',
      email: 'dave@example.com',
      password: 'correctpassword',
    })
    const result = await user.comparePassword('wrongpassword')
    expect(result).toBe(false)
  })

  it('stores email in lowercase', async () => {
    const user = await User.create({
      name: 'Eve',
      email: 'EVE@EXAMPLE.COM',
      password: 'password123',
    })
    expect(user.email).toBe('eve@example.com')
  })

  it('rejects duplicate email', async () => {
    await User.create({ name: 'Frank', email: 'frank@example.com', password: 'password123' })
    await expect(
      User.create({ name: 'Frank2', email: 'frank@example.com', password: 'password123' })
    ).rejects.toMatchObject({ code: 11000 })
  })

  it('defaults role to customer', async () => {
    const user = await User.create({ name: 'Guest', email: 'guest@example.com', password: 'password123' })
    expect(user.role).toBe('customer')
  })

  it('requires a minimum password length of 6', async () => {
    await expect(
      User.create({ name: 'Short', email: 'short@example.com', password: '123' })
    ).rejects.toThrow()
  })
})
