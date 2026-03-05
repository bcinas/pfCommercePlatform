import { Router } from 'express'
import { createOrder, getMyOrders, getOrderById, cancelOrder } from '../controllers/orderController'
import { protect } from '../middleware/auth'

const router = Router()

// Must be registered before /:id to avoid "my" being matched as a param
router.get('/my', protect, getMyOrders)

router.post('/', protect, createOrder)
router.patch('/:id/cancel', protect, cancelOrder)
router.get('/:id', protect, getOrderById)

export default router
