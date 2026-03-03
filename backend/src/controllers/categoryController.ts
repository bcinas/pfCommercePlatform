import { Request, Response } from 'express'
import Category from '../models/Category'

// GET /api/categories — public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/categories/:id — public
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.json(category)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/categories — admin only
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, image, isActive } = req.body

    const existing = await Category.findOne({ slug })
    if (existing) {
      return res.status(400).json({ message: 'Slug already in use' })
    }

    const category = await Category.create({ name, slug, image, isActive })
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/categories/:id — admin only
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.json(category)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /api/categories/:id — admin only
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.json({ message: 'Category deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
