import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, updateProfile, getProfile } from '../controllers/authController'
import { protect } from '../middleware/auth'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)

export default router