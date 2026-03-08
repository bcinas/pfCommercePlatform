import type { IProduct, ICategory, IOrder } from '@/app/types'

export const mockCategory: ICategory = {
  _id: 'cat-001',
  name: 'Electronics',
  slug: 'electronics',
  image: '/images/cat-electronics.jpg',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockProduct: IProduct = {
  _id: 'prod-001',
  name: 'Wireless Headphones',
  description: 'Premium noise-cancelling headphones',
  price: 149.99,
  images: ['/images/product-1.jpg'],
  category: mockCategory,
  stock: 50,
  isActive: true,
  rating: 4.5,
  numReviews: 25,
  specifications: [{ key: 'Color', value: 'Black' }],
  orderCount: 120,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockProductB: IProduct = {
  _id: 'prod-002',
  name: 'Smart TV 55"',
  description: '4K Ultra HD Smart TV',
  price: 699.99,
  images: ['/images/product-2.jpg'],
  category: mockCategory,
  stock: 10,
  isActive: true,
  rating: 4.2,
  numReviews: 15,
  specifications: [],
  orderCount: 55,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockOrder: IOrder = {
  _id: 'order-001',
  user: { _id: 'user-001', name: 'John Doe', email: 'john@test.com' },
  items: [
    {
      product: 'prod-001',
      name: 'Wireless Headphones',
      image: '/images/product-1.jpg',
      price: 149.99,
      quantity: 1,
    },
  ],
  shippingAddress: {
    fullName: 'John Doe',
    address: '123 Main St',
    city: 'Testville',
    postalCode: '12345',
    country: 'US',
  },
  paymentStatus: 'paid',
  orderStatus: 'processing',
  itemsPrice: 149.99,
  shippingPrice: 0,
  taxPrice: 15.0,
  totalPrice: 164.99,
  createdAt: '2024-01-01T00:00:00.000Z',
}
