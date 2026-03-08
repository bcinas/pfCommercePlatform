import {
  fetchCategories,
  fetchProducts,
  fetchProductById,
  fetchProductReviews,
  createOrder,
  fetchOrderById,
  fetchMyOrders,
  cancelOrder,
  createReview,
  updateProfile,
} from '@/app/lib/api'
import { mockProduct, mockOrder } from '../fixtures'
import type { ICategory, IProductResponse, IReview, IOrder } from '@/app/types'

const BASE_URL = 'http://localhost:5000/api'

const mockFetch = (body: unknown, ok = true, status = 200) => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  } as Response)
}

afterEach(() => {
  jest.resetAllMocks()
})

// ── fetchCategories ───────────────────────────────────────────────────────────

describe('fetchCategories()', () => {
  it('calls GET /api/categories and returns data', async () => {
    const cats: ICategory[] = []
    mockFetch(cats)

    const result = await fetchCategories()

    expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/categories`)
    expect(result).toBe(cats)
  })

  it('throws on non-ok response', async () => {
    mockFetch({ message: 'error' }, false)
    await expect(fetchCategories()).rejects.toThrow()
  })
})

// ── fetchProducts ─────────────────────────────────────────────────────────────

describe('fetchProducts()', () => {
  it('calls GET /api/products without params', async () => {
    const payload: IProductResponse = { products: [], page: 1, totalPages: 1, totalProducts: 0 }
    mockFetch(payload)

    await fetchProducts()

    expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/products`)
  })

  it('appends query params when provided', async () => {
    const payload: IProductResponse = { products: [], page: 1, totalPages: 1, totalProducts: 0 }
    mockFetch(payload)

    await fetchProducts({ category: 'cat-001', minPrice: 10, sort: 'price_asc', page: 2 })

    const call = (global.fetch as jest.Mock).mock.calls[0][0] as string
    expect(call).toContain('category=cat-001')
    expect(call).toContain('minPrice=10')
    expect(call).toContain('sort=price_asc')
    expect(call).toContain('page=2')
  })
})

// ── fetchProductById ──────────────────────────────────────────────────────────

describe('fetchProductById()', () => {
  it('calls GET /api/products/:id', async () => {
    mockFetch(mockProduct)

    await fetchProductById('prod-001')

    expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/products/prod-001`)
  })
})

// ── fetchProductReviews ───────────────────────────────────────────────────────

describe('fetchProductReviews()', () => {
  it('calls GET /api/products/:id/reviews', async () => {
    const reviews: IReview[] = []
    mockFetch(reviews)

    await fetchProductReviews('prod-001')

    expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/products/prod-001/reviews`)
  })
})

// ── createOrder ───────────────────────────────────────────────────────────────

describe('createOrder()', () => {
  it('calls POST /api/orders with Authorization header', async () => {
    mockFetch(mockOrder)

    const items = [{ productId: 'prod-001', quantity: 1 }]
    const addr = { fullName: 'Test', address: '123 St', city: 'Town', postalCode: '00000', country: 'US' }

    await createOrder('my-token', items, addr)

    const call = (global.fetch as jest.Mock).mock.calls[0]
    expect(call[0]).toBe(`${BASE_URL}/orders`)
    expect(call[1].method).toBe('POST')
    expect(call[1].headers['Authorization']).toBe('Bearer my-token')
  })

  it('throws with server message on error', async () => {
    mockFetch({ message: 'Product not found' }, false)
    await expect(
      createOrder('token', [], { fullName: '', address: '', city: '', postalCode: '', country: '' })
    ).rejects.toThrow('Product not found')
  })
})

// ── fetchOrderById ────────────────────────────────────────────────────────────

describe('fetchOrderById()', () => {
  it('calls GET /api/orders/:id with Authorization header', async () => {
    mockFetch(mockOrder)

    await fetchOrderById('my-token', 'order-001')

    const call = (global.fetch as jest.Mock).mock.calls[0]
    expect(call[0]).toBe(`${BASE_URL}/orders/order-001`)
    expect(call[1].headers['Authorization']).toBe('Bearer my-token')
  })
})

// ── fetchMyOrders ─────────────────────────────────────────────────────────────

describe('fetchMyOrders()', () => {
  it('calls GET /api/orders/my with Authorization header', async () => {
    const orders: IOrder[] = []
    mockFetch(orders)

    await fetchMyOrders('my-token')

    const call = (global.fetch as jest.Mock).mock.calls[0]
    expect(call[0]).toBe(`${BASE_URL}/orders/my`)
    expect(call[1].headers['Authorization']).toBe('Bearer my-token')
  })
})

// ── cancelOrder ───────────────────────────────────────────────────────────────

describe('cancelOrder()', () => {
  it('calls PATCH /api/orders/:id/cancel with Authorization header', async () => {
    mockFetch(mockOrder)

    await cancelOrder('my-token', 'order-001')

    const call = (global.fetch as jest.Mock).mock.calls[0]
    expect(call[0]).toBe(`${BASE_URL}/orders/order-001/cancel`)
    expect(call[1].method).toBe('PATCH')
    expect(call[1].headers['Authorization']).toBe('Bearer my-token')
  })
})

// ── createReview ──────────────────────────────────────────────────────────────

describe('createReview()', () => {
  it('calls POST /api/products/:id/reviews with Authorization header', async () => {
    const review: IReview = { _id: 'r-1', user: { _id: 'u-1', name: 'Test' }, product: 'prod-001', rating: 4, comment: 'Good', createdAt: '' }
    mockFetch(review)

    await createReview('prod-001', 4, 'Good', 'my-token')

    const call = (global.fetch as jest.Mock).mock.calls[0]
    expect(call[0]).toBe(`${BASE_URL}/products/prod-001/reviews`)
    expect(call[1].method).toBe('POST')
    expect(call[1].headers['Authorization']).toBe('Bearer my-token')
  })
})

// ── updateProfile ─────────────────────────────────────────────────────────────

describe('updateProfile()', () => {
  it('calls PUT /api/auth/profile with Authorization header', async () => {
    const response = { _id: 'u-1', name: 'New Name', email: 'e@e.com', role: 'customer', token: 't' }
    mockFetch(response)

    await updateProfile('my-token', { name: 'New Name' })

    const call = (global.fetch as jest.Mock).mock.calls[0]
    expect(call[0]).toBe(`${BASE_URL}/auth/profile`)
    expect(call[1].method).toBe('PUT')
    expect(call[1].headers['Authorization']).toBe('Bearer my-token')
  })
})
