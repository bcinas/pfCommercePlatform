import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider, useCart } from '@/app/context/CartContext'
import { mockProduct, mockProductB } from '../fixtures'

// ── Helper: renders a component that exposes cart actions as buttons ──────────

interface CartControllerProps {
  onSubtotal?: (v: number) => void
  onTax?: (v: number) => void
  onShipping?: (v: number) => void
  onTotal?: (v: number) => void
}

function CartController({ onSubtotal, onTax, onShipping, onTotal }: CartControllerProps) {
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, tax, shipping, total } = useCart()

  return (
    <div>
      <span data-testid="item-count">{items.length}</span>
      <span data-testid="subtotal">{subtotal.toFixed(2)}</span>
      <span data-testid="tax">{tax.toFixed(2)}</span>
      <span data-testid="shipping">{shipping.toFixed(2)}</span>
      <span data-testid="total">{total.toFixed(2)}</span>
      {items.map((i) => (
        <div key={i.product._id}>
          <span data-testid={`qty-${i.product._id}`}>{i.quantity}</span>
          <span data-testid={`name-${i.product._id}`}>{i.product.name}</span>
        </div>
      ))}
      <button onClick={() => addToCart(mockProduct, 1)}>Add P1</button>
      <button onClick={() => addToCart(mockProductB, 1)}>Add P2</button>
      <button onClick={() => addToCart(mockProduct, 999)}>Add P1 999</button>
      <button onClick={() => removeFromCart(mockProduct._id)}>Remove P1</button>
      <button onClick={() => updateQuantity(mockProduct._id, 3)}>Update P1 to 3</button>
      <button onClick={() => updateQuantity(mockProduct._id, 0)}>Update P1 to 0</button>
      <button onClick={() => updateQuantity(mockProduct._id, 999)}>Update P1 999</button>
      <button onClick={clearCart}>Clear</button>
      <button onClick={() => { onSubtotal?.(subtotal); onTax?.(tax); onShipping?.(shipping); onTotal?.(total) }}>
        Capture values
      </button>
    </div>
  )
}

function renderCart(props: CartControllerProps = {}) {
  return render(
    <CartProvider>
      <CartController {...props} />
    </CartProvider>
  )
}

// ── ADD ───────────────────────────────────────────────────────────────────────

describe('CartContext — ADD action', () => {
  it('adds a new item to an empty cart', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    expect(screen.getByTestId('item-count').textContent).toBe('1')
    expect(screen.getByTestId(`qty-${mockProduct._id}`).textContent).toBe('1')
  })

  it('increments quantity for an existing item', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    await userEvent.click(screen.getByText('Add P1'))
    expect(screen.getByTestId('item-count').textContent).toBe('1')
    expect(screen.getByTestId(`qty-${mockProduct._id}`).textContent).toBe('2')
  })

  it('caps quantity at product stock', async () => {
    // mockProduct has stock: 50, adding 999 should cap at 50
    renderCart()
    await userEvent.click(screen.getByText('Add P1 999'))
    expect(screen.getByTestId(`qty-${mockProduct._id}`).textContent).toBe('50')
  })

  it('caps combined quantity at product stock', async () => {
    renderCart()
    // Add 50 (caps at stock=50)
    await userEvent.click(screen.getByText('Add P1 999'))
    // Try to add more — should stay at 50
    await userEvent.click(screen.getByText('Add P1'))
    expect(screen.getByTestId(`qty-${mockProduct._id}`).textContent).toBe('50')
  })
})

// ── REMOVE ────────────────────────────────────────────────────────────────────

describe('CartContext — REMOVE action', () => {
  it('removes the specified item', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    await userEvent.click(screen.getByText('Remove P1'))
    expect(screen.getByTestId('item-count').textContent).toBe('0')
  })

  it('does not affect other items when removing', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    await userEvent.click(screen.getByText('Add P2'))
    await userEvent.click(screen.getByText('Remove P1'))
    expect(screen.getByTestId('item-count').textContent).toBe('1')
    expect(screen.getByTestId(`name-${mockProductB._id}`).textContent).toBe(mockProductB.name)
  })
})

// ── UPDATE_QTY ────────────────────────────────────────────────────────────────

describe('CartContext — UPDATE_QTY action', () => {
  it('updates quantity for existing item', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    await userEvent.click(screen.getByText('Update P1 to 3'))
    expect(screen.getByTestId(`qty-${mockProduct._id}`).textContent).toBe('3')
  })

  it('removes item when quantity is set to 0', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    await userEvent.click(screen.getByText('Update P1 to 0'))
    expect(screen.getByTestId('item-count').textContent).toBe('0')
  })

  it('caps at stock when updating to quantity > stock', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    await userEvent.click(screen.getByText('Update P1 999'))
    expect(screen.getByTestId(`qty-${mockProduct._id}`).textContent).toBe('50')
  })
})

// ── CLEAR ─────────────────────────────────────────────────────────────────────

describe('CartContext — CLEAR action', () => {
  it('empties the cart', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    await userEvent.click(screen.getByText('Add P2'))
    await userEvent.click(screen.getByText('Clear'))
    expect(screen.getByTestId('item-count').textContent).toBe('0')
  })
})

// ── Computed values ───────────────────────────────────────────────────────────

describe('CartContext — computed values', () => {
  it('shipping is $10 when subtotal < $100', async () => {
    // mockProduct price is 149.99; we need a lower price product
    // Use mockProduct at qty 0 to get subtotal=0, then add 1 item at < $100
    // mockProductB price is 699.99, mockProduct is 149.99
    // We need a product whose price * qty < 100
    // Let's use 1 item of mockProduct (149.99 >= 100) — so let's check with specific products

    // Use the Controller to capture values with a product that won't meet free shipping threshold
    // mockProduct.price = 149.99 (1 qty) → subtotal >= 100 → shipping = 0
    // We need a product with price < 100.
    // Since we can't easily modify fixtures here, let's render with a custom product
    const cheapProduct = { ...mockProduct, _id: 'cheap-001', price: 9.99, stock: 10 }

    function CheapController() {
      const { addToCart, shipping, subtotal } = useCart()
      return (
        <div>
          <span data-testid="shipping">{shipping}</span>
          <span data-testid="subtotal">{subtotal.toFixed(2)}</span>
          <button onClick={() => addToCart(cheapProduct, 1)}>Add cheap</button>
        </div>
      )
    }

    render(<CartProvider><CheapController /></CartProvider>)
    await userEvent.click(screen.getByText('Add cheap'))
    expect(screen.getByTestId('shipping').textContent).toBe('10')
  })

  it('shipping is $0 when subtotal >= $100', async () => {
    // mockProduct.price = 149.99 >= 100
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    expect(screen.getByTestId('shipping').textContent).toBe('0.00')
  })

  it('tax is subtotal * 0.1', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    // subtotal = 149.99, tax = 14.999
    const expectedTax = (149.99 * 0.1).toFixed(2)
    expect(screen.getByTestId('tax').textContent).toBe(expectedTax)
  })

  it('total equals subtotal + tax + shipping', async () => {
    renderCart()
    await userEvent.click(screen.getByText('Add P1'))
    const subtotal = 149.99
    const shipping = subtotal >= 100 ? 0 : 10
    const tax = subtotal * 0.1
    const expectedTotal = (subtotal + tax + shipping).toFixed(2)
    expect(screen.getByTestId('total').textContent).toBe(expectedTotal)
  })
})
