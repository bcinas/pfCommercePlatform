import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/app/context/AuthContext'

const STORAGE_KEY = 'pf_auth_user'

const mockApiUser = {
  _id: 'user-123',
  name: 'John Doe',
  email: 'john@test.com',
  role: 'customer',
  token: 'test-token-abc',
}

const mockStoredUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@test.com',
  role: 'customer',
  token: 'test-token-abc',
}

// ── Helper component ──────────────────────────────────────────────────────────

function AuthDisplay() {
  const { user, loading, logout } = useAuth()

  if (loading) return <div data-testid="loading">loading</div>
  if (!user) return <div data-testid="no-user">not logged in</div>

  return (
    <div>
      <span data-testid="user-name">{user.name}</span>
      <span data-testid="user-email">{user.email}</span>
      <span data-testid="user-role">{user.role}</span>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

function LoginButton() {
  const { login } = useAuth()
  return (
    <button onClick={() => login('john@test.com', 'password123')}>Login</button>
  )
}

function renderAuth(children: React.ReactNode = <AuthDisplay />) {
  return render(<AuthProvider>{children}</AuthProvider>)
}

// ── Session hydration ─────────────────────────────────────────────────────────

describe('AuthContext — session hydration', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('starts with loading=true then resolves to loading=false', async () => {
    renderAuth()
    // After mount, loading should resolve
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  })

  it('hydrates user from sessionStorage on mount', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockStoredUser))
    renderAuth()

    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe('John Doe')
    })
  })

  it('handles corrupt sessionStorage gracefully', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'not-valid-json')
    renderAuth()

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

// ── login() ───────────────────────────────────────────────────────────────────

describe('AuthContext — login()', () => {
  beforeEach(() => {
    sessionStorage.clear()
    jest.resetAllMocks()
  })

  it('calls POST /api/auth/login and persists user to sessionStorage', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiUser,
    } as Response)

    renderAuth(
      <>
        <AuthDisplay />
        <LoginButton />
      </>
    )

    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument())

    await userEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe('John Doe')
    })

    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
    expect(stored.id).toBe('user-123')
    expect(stored.token).toBe('test-token-abc')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws an error on 4xx response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response)

    let thrownError: Error | null = null

    function LoginThrower() {
      const { login } = useAuth()
      return (
        <button
          onClick={async () => {
            try {
              await login('bad@test.com', 'wrong')
            } catch (e) {
              thrownError = e as Error
            }
          }}
        >
          Bad Login
        </button>
      )
    }

    renderAuth(<LoginThrower />)
    await userEvent.click(screen.getByText('Bad Login'))

    await waitFor(() => expect(thrownError).not.toBeNull())
    expect(thrownError!.message).toBe('Invalid credentials')
  })
})

// ── logout() ─────────────────────────────────────────────────────────────────

describe('AuthContext — logout()', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('clears sessionStorage and sets user to null', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockStoredUser))
    renderAuth()

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(screen.getByTestId('no-user')).toBeInTheDocument()
    })
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

// ── updateUser() ──────────────────────────────────────────────────────────────

describe('AuthContext — updateUser()', () => {
  it('syncs updated user to state and sessionStorage', async () => {
    // Set session storage BEFORE rendering so hydration picks it up
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockStoredUser))

    function UpdaterComponent() {
      const { user, updateUser } = useAuth()
      return (
        <div>
          <span data-testid="user-name">{user?.name}</span>
          <button
            onClick={() =>
              updateUser({ ...mockApiUser, name: 'Updated Name' })
            }
          >
            Update
          </button>
        </div>
      )
    }

    render(
      <AuthProvider>
        <UpdaterComponent />
      </AuthProvider>
    )

    // Wait for hydration
    await waitFor(() => expect(screen.getByTestId('user-name').textContent).toBe('John Doe'))

    await userEvent.click(screen.getByText('Update'))

    await waitFor(() => {
      expect(screen.getByTestId('user-name').textContent).toBe('Updated Name')
    })

    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
    expect(stored.name).toBe('Updated Name')
  })
})
