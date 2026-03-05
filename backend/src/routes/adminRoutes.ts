import { Router } from 'express'
import { getStats, updateOrderStatus, getOrderById, getOrders, getAllProducts, updateProductStock, bulkUpdateProducts } from '../controllers/adminController'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

router.get('/stats', protect, adminOnly, getStats)
router.get('/orders', protect, adminOnly, getOrders)
router.get('/orders/:id', protect, adminOnly, getOrderById)
router.patch('/orders/:id/status', protect, adminOnly, updateOrderStatus)
router.get('/products', protect, adminOnly, getAllProducts)
router.patch('/products/bulk-update', protect, adminOnly, bulkUpdateProducts)
router.patch('/products/:id/stock', protect, adminOnly, updateProductStock)

export default router
