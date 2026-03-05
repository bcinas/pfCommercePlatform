'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  fetchAdminStats,
  type AdminStats,
  type AdminOrder,
  type AdminProduct,
} from '@/app/lib/adminApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

const STATUS_COLORS: Record<string, string> = {
  processing: '#f59e0b',
  shipped: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function getOrderStatusClass(status: AdminOrder['orderStatus']) {
  const map: Record<AdminOrder['orderStatus'], string> = {
    processing: 'bg-amber-100 text-amber-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return map[status];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
      <div className="h-3.5 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-28" />
    </div>
  );
}

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-gray-100 rounded-lg animate-pulse"
      style={{ height }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAdminStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats
    ? Object.entries(stats.orderStatusDistribution)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({
          name: STATUS_LABELS[name] ?? name,
          value,
          color: STATUS_COLORS[name] ?? '#6b7280',
        }))
    : [];

  const avgOrderValue =
    stats && stats.totalOrders > 0 ? stats.totalSales / stats.totalOrders : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          <>
            <StatCard title="Total Revenue" value={formatCurrency(stats.totalSales)} />
            <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} />
            <StatCard title="Total Customers" value={stats.totalCustomers.toLocaleString()} />
            <StatCard title="Avg Order Value" value={formatCurrency(avgOrderValue)} />
          </>
        ) : null}
      </div>

      {/* Charts + Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Charts (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Sales Trend (Last 30 Days)
            </h2>
            {loading || !mounted ? (
              <ChartSkeleton height={200} />
            ) : stats && stats.salesTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.salesTrends}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v: string) => v.slice(5)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v: number) => `$${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(v: number | string | undefined) =>
                      typeof v === 'number'
                        ? ([formatCurrency(v), 'Sales'] as [string, string])
                        : ([String(v ?? ''), 'Sales'] as [string, string])
                    }
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#4f46e5"
                    fill="url(#salesGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-16">No sales data available</p>
            )}
          </div>

          {/* Order Status Donut */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Order Status Distribution
            </h2>
            {loading || !mounted ? (
              <ChartSkeleton height={180} />
            ) : pieData.length > 0 ? (
              <div className="flex items-center gap-8">
                <div className="shrink-0">
                  <PieChart width={180} height={180}>
                    <Pie
                      data={pieData}
                      cx={90}
                      cy={90}
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                  </PieChart>
                </div>
                <div className="space-y-2.5">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-gray-600 w-24">{entry.name}</span>
                      <span className="text-gray-900 font-semibold">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-16">No order data available</p>
            )}
          </div>
        </div>

        {/* Right: Popular Products (1/3) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Popular Products</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-5 h-4 bg-gray-200 rounded" />
                  <div className="flex-1 h-4 bg-gray-200 rounded" />
                  <div className="w-10 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : stats?.popularProducts.length ? (
            <div className="space-y-4">
              {stats.popularProducts.map((product: AdminProduct, index: number) => {
                const stockClass =
                  product.stock === 0
                    ? 'bg-red-100 text-red-700'
                    : product.stock < 10
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700';
                return (
                  <div key={product._id} className="flex items-start gap-3">
                    <span className="text-gray-400 text-sm font-medium w-5 shrink-0 mt-0.5">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-gray-500 text-xs">{formatCurrency(product.price)}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${stockClass}`}
                    >
                      {product.stock === 0 ? 'Out' : product.stock}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-12">No products yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-6">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-4 bg-gray-200 rounded w-12" />
                <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : stats?.recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Order ID</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Customer</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Items</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Total</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.slice(0, 5).map((order: AdminOrder) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-gray-600 text-xs">
                      {order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{order.user?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{order.items.length}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusClass(order.orderStatus)}`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-gray-400 text-sm text-center">No recent orders</p>
        )}
      </div>
    </div>
  );
}
