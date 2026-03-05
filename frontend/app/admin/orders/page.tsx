'use client';

import { useEffect, useState, Fragment } from 'react';
import { fetchAdminOrders, updateOrderStatus, type AdminOrder } from '@/app/lib/adminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

const ORDER_STATUSES: AdminOrder['orderStatus'][] = [
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

function orderStatusClass(status: AdminOrder['orderStatus']) {
  const map: Record<AdminOrder['orderStatus'], string> = {
    processing: 'bg-amber-100 text-amber-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return map[status];
}

function paymentStatusClass(status: AdminOrder['paymentStatus']) {
  return status === 'paid'
    ? 'bg-green-100 text-green-700'
    : 'bg-amber-100 text-amber-700';
}

// ─── Expanded detail panel ────────────────────────────────────────────────────

function OrderDetail({ order }: { order: AdminOrder }) {
  return (
    <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping address */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h3>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium text-gray-800">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Price breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Price Breakdown</h3>
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Items</span>
              <span>{formatCurrency(order.itemsPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{formatCurrency(order.shippingPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatCurrency(order.taxPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-200 pt-1.5 mt-1">
              <span>Total</span>
              <span>{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Items</h3>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 w-6 shrink-0">{item.quantity}×</span>
              <span className="text-gray-900 flex-1">{item.name}</span>
              <span className="text-gray-500">
                {formatCurrency(item.price)} each
              </span>
              <span className="text-gray-900 font-medium">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOrders()
      .then(setOrders)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(
    orderId: string,
    newStatus: AdminOrder['orderStatus'],
  ) {
    setUpdatingId(orderId);
    setStatusError(null);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, orderStatus: updated.orderStatus } : o,
        ),
      );
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : 'Failed to update order status',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleExpand(orderId: string) {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        {!loading && (
          <span className="bg-indigo-100 text-indigo-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {orders.length}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}
      {statusError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
          {statusError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Order ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Items</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Order Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Update</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <Fragment key={order._id}>
                      <tr
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleExpand(order._id)}
                      >
                        <td className="px-4 py-3 font-mono text-gray-600 text-xs">
                          {order._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {order.user?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {order.user?.email ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {order.items.length}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusClass(order.orderStatus)}`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusClass(order.paymentStatus)}`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleStatusChange(
                                order._id,
                                e.target.value as AdminOrder['orderStatus'],
                              )
                            }
                            disabled={updatingId === order._id}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 bg-white"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {expandedId === order._id && (
                        <tr>
                          <td colSpan={9} className="p-0">
                            <OrderDetail order={order} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
