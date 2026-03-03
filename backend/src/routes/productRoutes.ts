import { Router } from 'express'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
} from '../controllers/productController'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

// Admin-only — must be registered before /:id to avoid "admin" being matched as a param
router.get('/admin/all', protect, adminOnly, getAdminProducts)

// Public
router.get('/', getProducts)
router.get('/:id', getProductById)

// Admin-only mutations
router.post('/', protect, adminOnly, createProduct)
router.put('/:id', protect, adminOnly, updateProduct)
router.delete('/:id', protect, adminOnly, deleteProduct)

export default router
