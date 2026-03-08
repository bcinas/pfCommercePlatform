import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

jest.mock('@/app/context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '@/app/context/AuthContext'
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const mockLogin = jest.fn()

const baseAuth = {
  user: null,
  loading: false,
  login: mockLogin,
  register: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAuth.mockReturnValue(baseAuth)
})

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(document.getElementById('password')).toBeInTheDocument()
  })

  it('redirects to / when already logged in', async () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      user: { id: 'u-1', name: 'John', email: 'j@j.com', role: 'customer', token: 't' },
      loading: false,
    })

    render(<LoginPage />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'))
  })

  it('calls login() on form submit and redirects to /', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    render(<LoginPage />)

    await userEvent.type(screen.getByLabelText(/email address/i), 'john@test.com')
    await userEvent.type(document.getElementById('password')!, 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('john@test.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    render(<LoginPage />)

    await userEvent.type(screen.getByLabelText(/email address/i), 'bad@test.com')
    await userEvent.type(document.getElementById('password')!, 'wrongpw')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('disables submit button when fields are empty', () => {
    render(<LoginPage />)
    const submitBtn = screen.getByRole('button', { name: /sign in/i })
    expect(submitBtn).toBeDisabled()
  })

  it('shows spinner and hides form when loading is true', () => {
    mockUseAuth.mockReturnValue({ ...baseAuth, loading: true })
    render(<LoginPage />)
    // Form fields should not be visible during loading
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument()
    // Spinner element should be in document
    expect(document.querySelector('.animate-spin')).not.toBeNull()
  })
})
