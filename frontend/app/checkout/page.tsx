'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { createOrder } from '@/app/lib/api';
import type { IShippingAddress } from '@/app/types';

const BACKEND_URL = 'http://localhost:5000';

const EMPTY_ADDRESS: IShippingAddress = {
  fullName: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
};

const FIELD_LABELS: Record<keyof IShippingAddress, string> = {
  fullName: 'Full Name',
  address: 'Street Address',
  city: 'City',
  postalCode: 'Postal Code',
  country: 'Country',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, tax, shipping, total, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirm'>('shipping');
  const [form, setForm] = useState<IShippingAddress>(EMPTY_ADDRESS);
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', cardholderName: '', expiry: '', cvv: '' });
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');

  // Redirect to cart if empty — but not when we just placed an order
  useEffect(() => {
    if (!orderPlaced && items.length === 0) router.replace('/cart');
  }, [orderPlaced, items.length, router]);

  if (!orderPlaced && items.length === 0) return null;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sign in to continue</h1>
          <p className="text-gray-500 text-sm mb-6">You need an account to place an order.</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function handleChange(field: keyof IShippingAddress, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleShippingContinue() {
    setError('');
    for (const key of Object.keys(EMPTY_ADDRESS) as (keyof IShippingAddress)[]) {
      if (!form[key].trim()) {
        setError(`${FIELD_LABELS[key]} is required.`);
        return;
      }
    }
    setStep('payment');
  }

  async function handlePaymentSubmit() {
    setError('');
    if (!paymentForm.cardNumber.trim() || !paymentForm.cardholderName.trim() || !paymentForm.expiry.trim() || !paymentForm.cvv.trim()) {
      setError('All payment fields are required.');
      return;
    }
    setProcessingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessingPayment(false);
    setStep('confirm');
  }

  async function handlePlaceOrder() {
    setError('');
    if (!user) return;
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        productId: i.product._id,
        quantity: i.quantity,
      }));

      const order = await createOrder(user.token, orderItems, form);
      setOrderPlaced(true);
      clearCart();
      router.push(`/orders/${order._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = ['shipping', 'payment', 'confirm'].indexOf(step);
  const STEP_LABELS = ['Shipping', 'Payment', 'Confirm'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* ── Step indicator ── */}
      <div className="flex items-center mb-8">
        {STEP_LABELS.map((label, i) => {
          const isActive = stepIndex === i;
          const isDone = stepIndex > i;
          return (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 text-sm font-medium ${isActive ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-indigo-600 text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {isDone ? '✓' : i + 1}
                </span>
                {label}
              </div>
              {i < STEP_LABELS.length - 1 && <span className="mx-3 text-gray-300">→</span>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Main content area ── */}
        <div className="flex-1 min-w-0">

          {/* Step 1: Shipping */}
          {step === 'shipping' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Shipping Address</h2>
              <div className="space-y-4">
                {(Object.keys(EMPTY_ADDRESS) as (keyof IShippingAddress)[]).map((field) => (
                  <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1.5">
                      {FIELD_LABELS[field]}
                    </label>
                    <input
                      id={field}
                      type="text"
                      value={form[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      placeholder={FIELD_LABELS[field]}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="button"
                onClick={handleShippingContinue}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Continue to Payment
              </button>
              <Link
                href="/cart"
                className="mt-2 block w-full text-center text-sm text-gray-500 hover:text-indigo-600 py-2 transition-colors"
              >
                ← Back to Cart
              </Link>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                  <input
                    id="cardNumber"
                    type="text"
                    value={paymentForm.cardNumber}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, cardNumber: e.target.value }))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1.5">Cardholder Name</label>
                  <input
                    id="cardholderName"
                    type="text"
                    value={paymentForm.cardholderName}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, cardholderName: e.target.value }))}
                    placeholder="Cardholder Name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                    <input
                      id="expiry"
                      type="text"
                      value={paymentForm.expiry}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, expiry: e.target.value }))}
                      placeholder="MM/YY"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                    <input
                      id="cvv"
                      type="text"
                      value={paymentForm.cvv}
                      onChange={(e) => setPaymentForm((p) => ({ ...p, cvv: e.target.value }))}
                      placeholder="CVV"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={processingPayment}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {processingPayment && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                )}
                {processingPayment ? 'Processing payment…' : `Pay $${total.toFixed(2)}`}
              </button>
              <button
                type="button"
                onClick={() => { setError(''); setStep('shipping'); }}
                className="mt-2 block w-full text-center text-sm text-gray-500 hover:text-indigo-600 py-2 transition-colors"
              >
                ← Back to Shipping
              </button>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Review & Confirm</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Shipping Address</p>
                  <p className="text-sm text-gray-900">{form.fullName}</p>
                  <p className="text-sm text-gray-700">{form.address}</p>
                  <p className="text-sm text-gray-700">{form.city}, {form.postalCode}</p>
                  <p className="text-sm text-gray-700">{form.country}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Method</p>
                  <p className="text-sm text-gray-900">•••• •••• •••• {paymentForm.cardNumber.replace(/\s/g, '').slice(-4)}</p>
                  <p className="text-sm text-gray-700">{paymentForm.cardholderName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Total</p>
                  <p className="text-lg font-bold text-gray-900">${total.toFixed(2)}</p>
                </div>
              </div>
              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                )}
                {submitting ? 'Placing Order…' : 'Confirm & Place Order'}
              </button>
              <button
                type="button"
                onClick={() => { setError(''); setStep('payment'); }}
                className="mt-2 block w-full text-center text-sm text-gray-500 hover:text-indigo-600 py-2 transition-colors"
              >
                ← Back to Payment
              </button>
            </div>
          )}
        </div>

        {/* ── Order summary ── */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4 sticky top-20">
          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {items.map(({ product, quantity }) => {
              const imageSrc = product.images[0]
                ? `${BACKEND_URL}${product.images[0]}`
                : null;
              return (
                <div key={product._id} className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    ${(product.price * quantity).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
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
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
