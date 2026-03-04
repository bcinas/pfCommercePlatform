'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { fetchOrderById } from '@/app/lib/api';
import type { IOrder } from '@/app/types';

const BACKEND_URL = 'http://localhost:5000';

const STATUS_STYLES: Record<IOrder['orderStatus'], string> = {
  processing: 'bg-amber-50 text-amber-700',
  shipped:    'bg-blue-50 text-blue-700',
  delivered:  'bg-emerald-50 text-emerald-700',
  cancelled:  'bg-red-50 text-red-600',
};

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchOrderById(user.token, id)
      .then(setOrder)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load order')
      )
      .finally(() => setLoading(false));
  }, [id, user]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Please log in to view your order.</p>
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-500 font-medium mb-4">{error || 'Order not found.'}</p>
        <Link href="/" className="text-indigo-600 font-medium hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const { shippingAddress: addr } = order;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-lg font-bold text-gray-900">Order Confirmed</h1>
          </div>
          <p className="text-xs text-gray-400 font-mono">#{order._id}</p>
          <p className="text-xs text-gray-500 mt-1">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[order.orderStatus]}`}>
            {order.orderStatus}
          </span>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 mb-4">
        <h2 className="text-sm font-bold text-gray-900 px-5 py-4">Items</h2>
        {order.items.map((item, idx) => {
          const imageSrc = item.image ? `${BACKEND_URL}${item.image}` : null;
          return (
            <div key={idx} className="flex items-center gap-4 px-5 py-4">
              <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.quantity} × ${item.price.toFixed(2)}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Shipping address */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">{addr.fullName}</p>
            <p>{addr.address}</p>
            <p>{addr.city}, {addr.postalCode}</p>
            <p>{addr.country}</p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Price Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">${order.itemsPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className={`font-medium ${order.shippingPrice === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                {order.shippingPrice === 0 ? 'Free' : `$${order.shippingPrice.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span className="font-medium text-gray-900">${order.taxPrice.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">${order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
