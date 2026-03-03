import { Request, Response } from 'express'
import Product from '../models/Product'

// GET /api/products — public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, minRating, search, sort, page, limit } = req.query

    const filter: Record<string, any> = { isActive: true, stock: { $gt: 0 } }

    if (category) filter.category = category
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (minRating) filter.rating = { $gte: Number(minRating) }
    if (search) filter.$text = { $search: search as string }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { rating: -1 },
      newest:     { createdAt: -1 },
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
    const product = await Product.create(req.body)
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/products/:id — admin only
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
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
