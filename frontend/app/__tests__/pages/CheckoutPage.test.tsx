import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckoutPage from '@/app/checkout/page'
import { mockProduct, mockOrder } from '../fixtures'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

jest.mock('@/app/context/CartContext', () => ({
  useCart: jest.fn(),
}))

jest.mock('@/app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/app/lib/api', () => ({
  createOrder: jest.fn(),
}))

import { useCart } from '@/app/context/CartContext'
import { useAuth } from '@/app/context/AuthContext'
import { createOrder } from '@/app/lib/api'

const mockUseCart = useCart as jest.MockedFunction<typeof useCart>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>

const mockClearCart = jest.fn()

const baseCart = {
  items: [{ product: mockProduct, quantity: 1 }],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: mockClearCart,
  subtotal: mockProduct.price,
  tax: mockProduct.price * 0.1,
  shipping: 0,
  total: mockProduct.price * 1.1,
}

const baseAuth = {
  user: { id: 'u-1', name: 'John Doe', email: 'john@test.com', role: 'customer', token: 'test-token' },
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockUseCart.mockReturnValue(baseCart)
  mockUseAuth.mockReturnValue(baseAuth)
})

describe('CheckoutPage', () => {
  it('redirects to /cart when cart is empty', async () => {
    mockUseCart.mockReturnValue({ ...baseCart, items: [] })

    render(<CheckoutPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/cart')
    })
  })

  it('shows sign-in message when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ ...baseAuth, user: null })

    render(<CheckoutPage />)

    expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument()
  })

  it('renders shipping form on initial render', () => {
    render(<CheckoutPage />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
  })

  it('shows validation error when shipping fields are empty', async () => {
    render(<CheckoutPage />)

    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }))

    await waitFor(() => {
      expect(screen.getByText(/is required/i)).toBeInTheDocument()
    })
  })

  it('advances to payment step after filling shipping form', async () => {
    render(<CheckoutPage />)

    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/street address/i), '123 Main St')
    await userEvent.type(screen.getByLabelText(/city/i), 'Testville')
    await userEvent.type(screen.getByLabelText(/postal code/i), '12345')
    await userEvent.type(screen.getByLabelText(/country/i), 'US')

    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }))

    await waitFor(() => {
      expect(screen.getByText(/payment details/i)).toBeInTheDocument()
    })
  })

  it('advances from shipping to payment after filling all fields', async () => {
    render(<CheckoutPage />)

    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/street address/i), '123 Main St')
    await userEvent.type(screen.getByLabelText(/city/i), 'Testville')
    await userEvent.type(screen.getByLabelText(/postal code/i), '12345')
    await userEvent.type(screen.getByLabelText(/country/i), 'US')

    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }))

    await waitFor(() => {
      expect(screen.getByText(/payment details/i)).toBeInTheDocument()
    })
  })

  it('calls createOrder with correct args and redirects after order is placed on confirm step', async () => {
    mockCreateOrder.mockResolvedValueOnce(mockOrder)

    // Patch handlePaymentSubmit's setTimeout to 0ms so test doesn't wait 1500ms
    const origSetTimeout = global.setTimeout.bind(global)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: any, _delay?: any, ...args: any[]) =>
      origSetTimeout(fn, 0, ...args)
    )

    render(<CheckoutPage />)

    // Step 1 — Shipping
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/street address/i), '123 Main St')
    await userEvent.type(screen.getByLabelText(/city/i), 'Testville')
    await userEvent.type(screen.getByLabelText(/postal code/i), '12345')
    await userEvent.type(screen.getByLabelText(/country/i), 'US')
    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }))

    // Step 2 — Payment
    await waitFor(() => expect(screen.getByText(/payment details/i)).toBeInTheDocument())
    await userEvent.type(screen.getByLabelText(/card number/i), '4111111111111111')
    await userEvent.type(screen.getByLabelText(/cardholder name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/expiry date/i), '12/26')
    await userEvent.type(screen.getByLabelText(/cvv/i), '123')
    await userEvent.click(screen.getByRole('button', { name: /pay/i }))

    // Step 3 — Confirm
    await waitFor(() => expect(screen.getByText(/review & confirm/i)).toBeInTheDocument(), { timeout: 3000 })
    await userEvent.click(screen.getByRole('button', { name: /confirm & place order/i }))

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledWith(
        'test-token',
        [{ productId: mockProduct._id, quantity: 1 }],
        expect.objectContaining({ fullName: 'John Doe' }),
        'paid'
      )
      expect(mockClearCart).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith(`/orders/${mockOrder._id}`)
    })

    jest.restoreAllMocks()
  }, 20000)
})
