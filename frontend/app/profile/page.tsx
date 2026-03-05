'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { fetchMyOrders, updateProfile, cancelOrder } from '@/app/lib/api';
import type { IOrder } from '@/app/types';

const STATUS_STYLES: Record<IOrder['orderStatus'], string> = {
  processing: 'bg-yellow-100 text-yellow-800',
  shipped:    'bg-blue-100 text-blue-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Inline feedback banner ───────────────────────────────────────────────────

function Feedback({ type, message }: { type: 'success' | 'error'; message: string }) {
  const styles = type === 'success'
    ? 'bg-green-50 border-green-200 text-green-700'
    : 'bg-red-50 border-red-200 text-red-700';
  return (
    <div className={`flex items-start gap-2.5 border text-sm rounded-lg px-4 py-3 ${styles}`}>
      {type === 'success' ? (
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();

  // ── Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // ── Edit form state
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving]                   = useState(false);
  const [feedback, setFeedback]               = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── Orders state
  const [orders, setOrders]               = useState<IOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError]     = useState<string | null>(null);
  const [cancellingId, setCancellingId]   = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Seed form with current user data when entering edit mode
  function enterEditMode() {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback(null);
    }
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setFeedback(null);
  }

  // Fetch orders
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetchMyOrders(user.token)
      .then(setOrders)
      .catch((err: unknown) =>
        setOrdersError(err instanceof Error ? err.message : 'Failed to load orders')
      )
      .finally(() => setOrdersLoading(false));
  }, [user]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    // If the user started filling in the password section, validate it
    if (currentPassword && newPassword !== confirmPassword) {
      setFeedback({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }

    setFeedback(null);
    setSaving(true);
    try {
      const payload: { name: string; email: string; currentPassword?: string; newPassword?: string } = { name, email };
      if (currentPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const updated = await updateProfile(user.token, payload);
      updateUser(updated);
      setFeedback({ type: 'success', msg: 'Profile updated successfully.' });
      setIsEditing(false);
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelOrder(e: React.MouseEvent, orderId: string) {
    e.stopPropagation();
    if (!user) return;
    setCancellingId(orderId);
    try {
      const updated = await cancelOrder(user.token, orderId);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Account Info + Edit ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-6">

          {/* Avatar + name/email row — always visible */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={enterEditMode}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 transition-colors shadow-sm"
              >
                {/* Pencil icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3.414A2 2 0 017.586 11.5L9 13z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* Feedback banner (shown in view mode after a successful save, or in edit mode for errors) */}
          {feedback && <div className="mb-4"><Feedback type={feedback.type} message={feedback.msg} /></div>}

          {/* Edit form — shown only in edit mode */}
          {isEditing && (
            <form onSubmit={handleSave} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Edit Profile</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Change password subsection */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">Change password <span className="font-normal text-gray-400">(optional)</span></p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="currentPassword">
                      Current password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="newPassword">
                      New password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      disabled={!currentPassword}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="confirmPassword">
                      Confirm new password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={!currentPassword}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !email.trim()}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Order History ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Order History</h2>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ordersError ? (
            <div className="text-center py-16 text-red-500 text-sm">{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No orders yet</p>
              <p className="text-gray-400 text-sm mt-1">Your orders will appear here once you make a purchase.</p>
              <Link
                href="/products"
                className="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Browse products →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Order</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Items</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 px-2">Total</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-2 px-2 pl-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => router.push(`/profile/orders/${order._id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-2 font-medium text-indigo-600 group-hover:text-indigo-700">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-2 text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="py-3.5 px-2 text-gray-600">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} item
                        {order.items.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="py-3.5 px-2 text-right font-semibold text-gray-900">
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 pl-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[order.orderStatus]}`}>
                            {order.orderStatus}
                          </span>
                          {order.orderStatus === 'processing' && (
                            <button
                              onClick={(e) => handleCancelOrder(e, order._id)}
                              disabled={cancellingId === order._id}
                              className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-60 transition-colors"
                            >
                              {cancellingId === order._id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
