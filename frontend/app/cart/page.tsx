'use client';

import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';

const BACKEND_URL = 'http://localhost:5000';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, subtotal, tax, shipping, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Cart items ── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {items.map(({ product, quantity }) => {
            const imageSrc = product.images[0]
              ? `${BACKEND_URL}${product.images[0]}`
              : null;

            return (
              <div key={product._id} className="flex items-start gap-4 p-4 sm:p-5">
                {/* Thumbnail */}
                <Link
                  href={`/products/${product._id}`}
                  className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${product._id}`}
                    className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">
                    ${product.price.toFixed(2)} each
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        aria-label="Decrease quantity"
                        className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-sm font-medium"
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-gray-900 py-1.5 border-x border-gray-200">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        aria-label="Increase quantity"
                        className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-sm font-medium"
                        disabled={quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(product._id)}
                      aria-label={`Remove ${product.name}`}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <p className="flex-shrink-0 text-sm font-bold text-gray-900 pt-0.5">
                  ${(product.price * quantity).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Order summary ── */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
          <h2 className="text-base font-bold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={`font-medium ${shipping === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (10%)</span>
              <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
            </div>
          </div>

          {subtotal < 100 && (
            <p className="mt-3 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
              Add ${(100 - subtotal).toFixed(2)} more for free shipping
            </p>
          )}

          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-4 block w-full text-center bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Proceed to Checkout
          </Link>

          <Link
            href="/products"
            className="mt-2 block w-full text-center text-sm text-gray-500 hover:text-indigo-600 py-2 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
