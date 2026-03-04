import { Router } from 'express'
import { getStats, getOrders, updateProductStock, bulkUpdateProducts } from '../controllers/adminController'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

router.get('/stats', protect, adminOnly, getStats)
router.get('/orders', protect, adminOnly, getOrders)
router.patch('/products/:id/stock', protect, adminOnly, updateProductStock)
router.patch('/products/bulk-update', protect, adminOnly, bulkUpdateProducts)

export default router
