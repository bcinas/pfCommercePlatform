import { Response } from 'express'
import Order from '../models/Order'
import Product from '../models/Product'
import { type AuthRequest } from '../middleware/auth'

interface OrderItemInput {
  productId: string
  quantity: number
}

interface ShippingAddressInput {
  fullName: string
  address: string
  city: string
  postalCode: string
  country: string
}

// POST /api/orders — protected customer
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, shippingAddress, paymentStatus } = req.body as {
      items: OrderItemInput[]
      shippingAddress: ShippingAddressInput
      paymentStatus?: 'pending' | 'paid'
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    const { fullName, address, city, postalCode, country } = shippingAddress ?? {}
    if (!fullName || !address || !city || !postalCode || !country) {
      return res.status(400).json({ message: 'All shipping address fields are required' })
    }

    // Fetch products from DB to get authoritative prices
    const productIds = items.map((i) => i.productId)
    const products = await Product.find({ _id: { $in: productIds } })

    const productMap = new Map(products.map((p) => [p._id.toString(), p]))

    const orderItems = items.map((i) => {
      const product = productMap.get(i.productId)
      if (!product) throw new Error(`Product not found: ${i.productId}`)
      return {
        product: product._id,
        name: product.name,
        image: product.images[0] ?? '',
        price: product.price,
        quantity: i.quantity,
      }
    })

    const itemsPrice = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const shippingPrice = itemsPrice >= 100 ? 0 : 10
    const taxPrice = parseFloat((itemsPrice * 0.1).toFixed(2))
    const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2))

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      ...(paymentStatus === 'paid' ? { paymentStatus: 'paid' } : {}),
    })

    res.status(201).json(order)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ message })
  }
}

// GET /api/orders/my — protected
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /api/orders/:id/cancel — protected, owner only, only if processing
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' })
    }

    if (order.orderStatus !== 'processing') {
      return res.status(400).json({ message: 'Only orders in processing status can be cancelled' })
    }

    order.orderStatus = 'cancelled'
    await order.save()

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/orders/:id — protected, owner or admin
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email')

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const isOwner = order.user._id.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' })
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
