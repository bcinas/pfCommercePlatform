import { Router } from 'express'
import { register, login, updateProfile } from '../controllers/authController'
import { protect } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.put('/profile', protect, updateProfile)

export default router