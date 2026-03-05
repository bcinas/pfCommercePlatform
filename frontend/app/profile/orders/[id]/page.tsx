'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { fetchOrderById } from '@/app/lib/api';
import type { IOrder } from '@/app/types';

const STATUS_STYLES: Record<IOrder['orderStatus'], string> = {
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const IMAGE_BASE = 'http://localhost:5000';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrderDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !id) return;
    setOrderLoading(true);
    fetchOrderById(user.token, id)
      .then(setOrder)
      .catch((err: unknown) =>
        setOrderError(err instanceof Error ? err.message : 'Failed to load order')
      )
      .finally(() => setOrderLoading(false));
  }, [user, id]);

  if (loading || (!order && orderLoading)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orderError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{orderError}</p>
        <Link href="/profile" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to profile
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back + header */}
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to profile
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize ${STATUS_STYLES[order.orderStatus]}`}>
              {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item, idx) => {
              const imgSrc = item.image.startsWith('http')
                ? item.image
                : `${IMAGE_BASE}${item.image}`;
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Shipping Address</h2>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Price Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${order.itemsPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{order.shippingPrice === 0 ? 'Free' : `$${order.shippingPrice.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${order.taxPrice.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>${order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
