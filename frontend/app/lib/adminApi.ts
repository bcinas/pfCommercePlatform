const BASE_URL = 'http://localhost:5000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: { _id: string; name: string };
  images: string[];
  isActive: boolean;
  rating: number;
  numReviews: number;
  createdAt: string;
  specifications: { key: string; value: string }[];
}

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
  createdAt: string;
}

export interface AdminOrderItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface AdminShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface AdminOrder {
  _id: string;
  user: { _id: string; name: string; email: string };
  items: AdminOrderItem[];
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  shippingAddress: AdminShippingAddress;
  createdAt: string;
}

// Shapes specific to what GET /api/admin/stats returns
export interface StatsRecentOrder {
  _id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface StatsPopularProduct {
  productId: string;
  name: string;
  timesOrdered: number;
  revenue: number;
}

export interface OrderStatusDistribution {
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  recentOrders: StatsRecentOrder[];
  popularProducts: StatsPopularProduct[];
  orderStatusDistribution: OrderStatusDistribution;
  salesTrends: SalesTrend[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isActive: boolean;
  specifications: { key: string; value: string }[];
}

export interface CategoryFormData {
  name: string;
  slug: string;
  image: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

export function getAuthHeaders(): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window === 'undefined') return base;
  const stored = sessionStorage.getItem('pf_auth_user');
  if (!stored) return base;
  try {
    const { token } = JSON.parse(stored) as { token: string };
    return { ...base, Authorization: `Bearer ${token}` };
  } catch {
    return base;
  }
}

// ─── Request helper ───────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function fetchAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/admin/stats');
}

// ─── Orders ───────────────────────────────────────────────────────────────────

interface OrdersResponse {
  orders: AdminOrder[];
  pagination: { currentPage: number; totalPages: number; totalOrders: number; limit: number };
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const data = await request<OrdersResponse>('/admin/orders');
  return data.orders;
}

export async function fetchAdminOrder(id: string): Promise<AdminOrder> {
  const data = await request<{ order: AdminOrder }>(`/admin/orders/${id}`);
  return data.order;
}

interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;
  order: { _id: string; orderStatus: AdminOrder['orderStatus']; updatedAt: string };
}

export async function updateOrderStatus(
  id: string,
  orderStatus: AdminOrder['orderStatus'],
): Promise<{ _id: string; orderStatus: AdminOrder['orderStatus'] }> {
  const data = await request<UpdateOrderStatusResponse>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ orderStatus }),
  });
  return data.order;
}

// ─── Products ─────────────────────────────────────────────────────────────────

interface ProductsResponse {
  products: AdminProduct[];
  pagination: { currentPage: number; totalPages: number; totalProducts: number; limit: number };
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const data = await request<ProductsResponse>('/admin/products');
  return data.products;
}

interface UpdateStockResponse {
  success: boolean;
  message: string;
  product: { _id: string; name: string; stock: number; isActive: boolean };
}

export async function updateProductStock(
  id: string,
  stockQuantity: number,
): Promise<{ _id: string; stock: number; isActive: boolean }> {
  const data = await request<UpdateStockResponse>(`/admin/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stockQuantity }),
  });
  return data.product;
}

interface BulkUpdateResponse {
  success: boolean;
  message: string;
  modifiedCount: number;
}

export async function bulkUpdateProducts(
  productIds: string[],
  isActive: boolean,
): Promise<{ modifiedCount: number }> {
  const data = await request<BulkUpdateResponse>('/admin/products/bulk-update', {
    method: 'PATCH',
    body: JSON.stringify({ productIds, isActive }),
  });
  return { modifiedCount: data.modifiedCount };
}

export function createProduct(data: ProductFormData): Promise<AdminProduct> {
  return request<AdminProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: string, data: ProductFormData): Promise<AdminProduct> {
  return request<AdminProduct>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/products/${id}`, {
    method: 'DELETE',
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function fetchAdminCategories(): Promise<AdminCategory[]> {
  return request<AdminCategory[]>('/categories');
}

export function createCategory(data: CategoryFormData): Promise<AdminCategory> {
  return request<AdminCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: string, data: CategoryFormData): Promise<AdminCategory> {
  return request<AdminCategory>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/categories/${id}`, {
    method: 'DELETE',
  });
}
