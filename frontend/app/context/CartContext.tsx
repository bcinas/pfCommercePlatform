'use client';

import { createContext, useContext, useReducer, useMemo, type ReactNode } from 'react';
import type { IProduct } from '@/app/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: IProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; product: IProduct; quantity: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR' };

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: IProduct, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.findIndex(
        (i) => i.product._id === action.product._id
      );
      if (existing !== -1) {
        const updated = [...state.items];
        const newQty = Math.min(
          updated[existing].quantity + action.quantity,
          action.product.stock
        );
        updated[existing] = { ...updated[existing], quantity: newQty };
        return { items: updated };
      }
      return {
        items: [
          ...state.items,
          { product: action.product, quantity: Math.min(action.quantity, action.product.stock) },
        ],
      };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.product._id !== action.productId) };
    case 'UPDATE_QTY': {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.product._id !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product._id === action.productId
            ? { ...i, quantity: Math.min(action.quantity, i.product.stock) }
            : i
        ),
      };
    }
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [state.items]
  );
  const tax = useMemo(() => subtotal * 0.1, [subtotal]);
  const shipping = useMemo(() => (subtotal >= 100 ? 0 : 10), [subtotal]);
  const total = useMemo(() => subtotal + tax + shipping, [subtotal, tax, shipping]);

  function addToCart(product: IProduct, quantity: number) {
    dispatch({ type: 'ADD', product, quantity });
  }

  function removeFromCart(productId: string) {
    dispatch({ type: 'REMOVE', productId });
  }

  function updateQuantity(productId: string, quantity: number) {
    dispatch({ type: 'UPDATE_QTY', productId, quantity });
  }

  function clearCart() {
    dispatch({ type: 'CLEAR' });
  }

  return (
    <CartContext.Provider
      value={{ items: state.items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, tax, shipping, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
