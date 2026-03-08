import mongoose from 'mongoose'
import User, { type IUser } from '../../models/User'
import Product, { type IProduct } from '../../models/Product'
import Category, { type ICategory } from '../../models/Category'
import Order, { type IOrder } from '../../models/Order'

let _counter = 0
const next = () => ++_counter

// ── User ─────────────────────────────────────────────────────────────────────

export async function createUser(overrides: {
  name?: string
  email?: string
  password?: string
  role?: 'customer' | 'admin'
} = {}): Promise<IUser> {
  const n = next()
  return User.create({
    name: overrides.name ?? `Test User ${n}`,
    email: overrides.email ?? `testuser${n}@example.com`,
    password: overrides.password ?? 'password123',
    role: overrides.role ?? 'customer',
  })
}

export async function createAdminUser(overrides: {
  name?: string
  email?: string
  password?: string
} = {}): Promise<IUser> {
  return createUser({ ...overrides, role: 'admin' })
}

// ── Category ──────────────────────────────────────────────────────────────────

export async function createCategory(overrides: {
  name?: string
  slug?: string
  image?: string
} = {}): Promise<ICategory> {
  const n = next()
  return Category.create({
    name: overrides.name ?? `Category ${n}`,
    slug: overrides.slug ?? `category-${n}`,
    image: overrides.image ?? '',
  })
}

// ── Product ───────────────────────────────────────────────────────────────────

export async function createProduct(
  categoryId: mongoose.Types.ObjectId,
  overrides: {
    name?: string
    description?: string
    price?: number
    stock?: number
    isActive?: boolean
    images?: string[]
  } = {}
): Promise<IProduct> {
  const n = next()
  return Product.create({
    name: overrides.name ?? `Product ${n}`,
    description: overrides.description ?? `Description for product ${n}`,
    price: overrides.price ?? 29.99,
    images: overrides.images ?? ['/images/test.jpg'],
    category: categoryId,
    stock: overrides.stock ?? 10,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    specifications: [],
  })
}

// ── Order ─────────────────────────────────────────────────────────────────────

export async function createOrder(
  userId: mongoose.Types.ObjectId,
  product: IProduct,
  overrides: {
    orderStatus?: 'processing' | 'shipped' | 'delivered' | 'cancelled'
    paymentStatus?: 'pending' | 'paid'
    quantity?: number
  } = {}
): Promise<IOrder> {
  const quantity = overrides.quantity ?? 1
  const itemsPrice = product.price * quantity
  const shippingPrice = itemsPrice >= 100 ? 0 : 10
  const taxPrice = parseFloat((itemsPrice * 0.1).toFixed(2))
  const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2))

  return Order.create({
    user: userId,
    items: [{
      product: product._id,
      name: product.name,
      image: product.images[0] ?? '',
      price: product.price,
      quantity,
    }],
    shippingAddress: {
      fullName: 'Test User',
      address: '123 Test St',
      city: 'Testville',
      postalCode: '12345',
      country: 'US',
    },
    paymentStatus: overrides.paymentStatus ?? 'pending',
    orderStatus: overrides.orderStatus ?? 'processing',
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  })
}

export async function createDeliveredOrder(
  userId: mongoose.Types.ObjectId,
  product: IProduct
): Promise<IOrder> {
  return createOrder(userId, product, { orderStatus: 'delivered', paymentStatus: 'paid' })
}
