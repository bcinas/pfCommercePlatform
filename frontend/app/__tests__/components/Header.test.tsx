import React from 'react'
import { render, screen } from '@testing-library/react'
import Header from '@/app/components/Header'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/app/context/CartContext', () => ({
  useCart: jest.fn(),
}))

import { useAuth } from '@/app/context/AuthContext'
import { useCart } from '@/app/context/CartContext'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>

const baseCartValue = {
  items: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  subtotal: 0,
  tax: 0,
  shipping: 10,
  total: 0,
}

const baseAuthValue = {
  user: null,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Header', () => {
  beforeEach(() => {
    mockUseCart.mockReturnValue(baseCartValue)
  })

  it('shows Login and Register links when not authenticated', () => {
    mockUseAuth.mockReturnValue({ ...baseAuthValue, user: null, loading: false })

    render(<Header />)

    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
    expect(screen.queryByText(/Hi,/)).not.toBeInTheDocument()
  })

  it("shows user's first name and Logout when authenticated", () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 'u-1', name: 'John Doe', email: 'john@test.com', role: 'customer', token: 'tok' },
      loading: false,
    })

    render(<Header />)

    expect(screen.getByText(/Hi, John/)).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
  })

  it('shows Admin link when user role is admin', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 'a-1', name: 'Admin User', email: 'admin@test.com', role: 'admin', token: 'tok' },
      loading: false,
    })

    render(<Header />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('does not show Admin link for customer role', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthValue,
      user: { id: 'u-1', name: 'John', email: 'john@test.com', role: 'customer', token: 'tok' },
      loading: false,
    })

    render(<Header />)

    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('shows cart badge with correct count', () => {
    mockUseAuth.mockReturnValue({ ...baseAuthValue })
    mockUseCart.mockReturnValue({
      ...baseCartValue,
      items: [
        { product: { _id: 'p-1', name: 'P', description: '', price: 10, images: [], category: 'c', stock: 5, isActive: true, rating: 4, numReviews: 1, specifications: [], orderCount: 1, createdAt: '', updatedAt: '' }, quantity: 3 },
        { product: { _id: 'p-2', name: 'P2', description: '', price: 20, images: [], category: 'c', stock: 5, isActive: true, rating: 4, numReviews: 1, specifications: [], orderCount: 1, createdAt: '', updatedAt: '' }, quantity: 2 },
      ],
    })

    render(<Header />)

    // cart count = 3 + 2 = 5
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 99+ when cart count exceeds 99', () => {
    mockUseAuth.mockReturnValue({ ...baseAuthValue })
    mockUseCart.mockReturnValue({
      ...baseCartValue,
      items: [
        { product: { _id: 'p-1', name: 'P', description: '', price: 10, images: [], category: 'c', stock: 200, isActive: true, rating: 4, numReviews: 1, specifications: [], orderCount: 1, createdAt: '', updatedAt: '' }, quantity: 100 },
      ],
    })

    render(<Header />)

    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('hides cart badge when cart is empty', () => {
    mockUseAuth.mockReturnValue({ ...baseAuthValue })
    mockUseCart.mockReturnValue({ ...baseCartValue, items: [] })

    render(<Header />)

    // Badge span should not be in the document
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows loading skeleton during auth hydration', () => {
    mockUseAuth.mockReturnValue({ ...baseAuthValue, loading: true })

    render(<Header />)

    // Neither Login/Register nor user name should show
    expect(screen.queryByText('Login')).not.toBeInTheDocument()
    expect(screen.queryByText(/Hi,/)).not.toBeInTheDocument()
  })
})
