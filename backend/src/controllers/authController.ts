import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import type { AuthRequest } from '../middleware/auth'

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  })
}

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const user = await User.create({ name, email, password })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString(), user.role),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const { name, email, currentPassword, newPassword } = req.body as {
      name?: string
      email?: string
      currentPassword?: string
      newPassword?: string
    }

    if (name && name.trim()) user.name = name.trim()

    if (email && email !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) return res.status(400).json({ message: 'Email already in use' })
      user.email = email.toLowerCase()
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new one' })
      }
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' })
      }
      user.password = newPassword
    }

    await user.save()

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString(), user.role),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString(), user.role),
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}