import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Product from '../models/Product'
import Review from '../models/Review'
import Order from '../models/Order'
import { AuthRequest } from '../middleware/auth'

// GET /api/products — public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, minRating, search, sort, page, limit } = req.query

    const filter: Record<string, any> = { isActive: true, stock: { $gt: 0 } } // eslint-disable-line @typescript-eslint/no-explicit-any -- Mongoose dynamic filter

    if (category) filter.category = category
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (minRating) filter.rating = { $gte: Number(minRating) }
    if (search) filter.$text = { $search: search as string }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc:    { price: 1 },
      price_desc:   { price: -1 },
      rating:       { rating: -1 },
      newest:       { createdAt: -1 },
      most_ordered: { orderCount: -1 },
    }
    const sortOption = sortMap[sort as string] ?? { createdAt: -1 }

    const pageNum  = Math.max(1, Number(page)  || 1)
    const limitNum = Math.max(1, Number(limit) || 12)
    const skip = (pageNum - 1) * limitNum

    const [products, totalProducts] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ])

    res.json({
      products,
      page: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/products/:id — public
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      stock: { $gt: 0 },
    }).populate('category')

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/products — admin only
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, images, category, stock, isActive, specifications } = req.body
    const product = await Product.create({ name, description, price, images, category, stock, isActive, specifications })
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/products/:id — admin only
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, images, category, stock, isActive, specifications } = req.body
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, images, category, stock, isActive, specifications },
      { new: true, runValidators: true }
    )
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /api/products/:id — admin only
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/products/:id/reviews — public
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/products/:id/reviews — protected (customers)
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body

    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' })
    }
    if (!comment || typeof comment !== 'string' || comment.trim() === '') {
      return res.status(400).json({ message: 'Comment is required' })
    }

    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    const eligibleOrder = await Order.findOne({
      user: req.user._id,
      orderStatus: 'delivered',
      'items.product': new mongoose.Types.ObjectId(req.params.id as string),
    })
    if (!eligibleOrder) {
      return res.status(403).json({
        message: 'You can only review products you have purchased and received',
      })
    }

    let review
    try {
      review = await Review.create({
        user: req.user._id,
        product: req.params.id,
        rating: ratingNum,
        comment: comment.trim(),
      })
    } catch (err: unknown) {
      const mongoErr = err as { code?: number }
      if (mongoErr.code === 11000) {
        return res.status(400).json({ message: 'You have already reviewed this product' })
      }
      throw err
    }

    const agg = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.id as string) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    if (agg.length > 0) {
      await Product.findByIdAndUpdate(req.params.id, {
        rating: Math.round(agg[0].avgRating * 10) / 10,
        numReviews: agg[0].count,
      })
    }

    try {
      await review.populate('user', 'name')
    } catch {
      // populate failure is non-fatal — the review is already saved
    }
    return res.status(201).json(review)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/products/admin/all — admin only
export const getAdminProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query

    const pageNum  = Math.max(1, Number(page)  || 1)
    const limitNum = Math.max(1, Number(limit) || 12)
    const skip = (pageNum - 1) * limitNum

    const [products, totalProducts] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(),
    ])

    res.json({
      products,
      page: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      totalProducts,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
