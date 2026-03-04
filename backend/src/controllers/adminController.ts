import { Response } from 'express'
import Order from '../models/Order'
import User from '../models/User'
import Product from '../models/Product'
import { type AuthRequest } from '../middleware/auth'

interface PopularProductRaw {
  _id: string
  name: string
  timesOrdered: number
  revenue: number
}

interface SalesTrendRaw {
  _id: { year: number; month: number; day: number }
  sales: number
}

interface StatusDistRaw {
  _id: string
  count: number
}

interface RecentOrderRaw {
  _id: string
  customerName: string
  total: number
  orderStatus: string
  createdAt: Date
}

// GET /api/admin/stats
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalSalesResult,
      totalOrders,
      totalCustomers,
      recentOrdersRaw,
      popularProductsRaw,
      salesTrendsRaw,
      statusDistRaw,
    ] = await Promise.all([
      // 1. Total sales from delivered orders
      Order.aggregate<{ total: number }>([
        { $match: { orderStatus: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      // 2. Total order count
      Order.countDocuments(),

      // 3. Total customers
      User.countDocuments({ role: 'customer' }),

      // 4. Recent 10 orders with customer name
      Order.aggregate<RecentOrderRaw>([
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDoc',
          },
        },
        {
          $project: {
            _id: 1,
            customerName: { $ifNull: [{ $arrayElemAt: ['$userDoc.name', 0] }, 'Unknown'] },
            total: '$totalPrice',
            orderStatus: 1,
            createdAt: 1,
          },
        },
      ]),

      // 5. Top 5 products by times ordered
      Order.aggregate<PopularProductRaw>([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            timesOrdered: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { timesOrdered: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            productId: { $toString: '$_id' },
            name: 1,
            timesOrdered: 1,
            revenue: { $round: ['$revenue', 2] },
          },
        },
      ]),

      // 6. Daily sales for last 30 days
      Order.aggregate<SalesTrendRaw>([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            sales: { $sum: '$totalPrice' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),

      // 7. Order status distribution
      Order.aggregate<StatusDistRaw>([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),
    ])

    // Shape totalSales
    const totalSales = totalSalesResult[0]?.total ?? 0

    // Shape recentOrders
    const recentOrders = recentOrdersRaw.map((o) => ({
      _id: o._id.toString(),
      customerName: o.customerName,
      total: o.total,
      status: o.orderStatus,
      createdAt: o.createdAt,
    }))

    // Shape popularProducts (already projected correctly)
    const popularProducts = popularProductsRaw

    // Shape salesTrends
    const salesTrends = salesTrendsRaw.map((t) => ({
      date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
      sales: parseFloat(t.sales.toFixed(2)),
    }))

    // Shape orderStatusDistribution using actual model statuses
    const statusMap = new Map(statusDistRaw.map((s) => [s._id, s.count]))
    const orderStatusDistribution = {
      processing: statusMap.get('processing') ?? 0,
      shipped: statusMap.get('shipped') ?? 0,
      delivered: statusMap.get('delivered') ?? 0,
      cancelled: statusMap.get('cancelled') ?? 0,
    }

    res.json({
      totalSales,
      totalOrders,
      totalCustomers,
      recentOrders,
      popularProducts,
      salesTrends,
      orderStatusDistribution,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ message })
  }
}

// PATCH /api/admin/products/:id/stock
export const updateProductStock = async (req: AuthRequest, res: Response) => {
  try {
    const { stockQuantity } = req.body as { stockQuantity: unknown }

    if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
      return res.status(400).json({ message: 'stockQuantity must be a number >= 0' })
    }

    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    product.stock = stockQuantity
    product.isActive = stockQuantity > 0
    await product.save()

    res.json({
      success: true,
      message: 'Stock updated successfully',
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        isActive: product.isActive,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ message })
  }
}

// GET /api/admin/orders
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page, limit } = req.query as Record<string, string | undefined>

    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled']
    const filter: Record<string, string> = {}

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
      }
      filter.orderStatus = status
    }

    const currentPage = Math.max(1, parseInt(page ?? '1', 10))
    const perPage = Math.max(1, parseInt(limit ?? '20', 10))
    const skip = (currentPage - 1) * perPage

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage),
      Order.countDocuments(filter),
    ])

    res.json({
      orders,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalOrders / perPage),
        totalOrders,
        limit: perPage,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ message })
  }
}

// PATCH /api/admin/products/bulk-update
export const bulkUpdateProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { productIds, isActive } = req.body as { productIds: unknown; isActive: unknown }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'productIds must be a non-empty array' })
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' })
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { isActive } }
    )

    res.json({
      success: true,
      message: `${result.modifiedCount} product${result.modifiedCount === 1 ? '' : 's'} updated successfully`,
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ message })
  }
}
