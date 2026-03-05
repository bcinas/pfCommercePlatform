import type { ICategory, IProduct, IProductResponse, IReview, IOrder, IShippingAddress } from '@/app/types';

const BASE_URL = 'http://localhost:5000/api';

export interface ProductParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function fetchCategories(): Promise<ICategory[]> {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data: ICategory[] = await res.json();
  return data;
}

export async function fetchCategoryBySlug(slug: string): Promise<ICategory | null> {
  const categories = await fetchCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function fetchProductById(id: string): Promise<IProduct> {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  const data: IProduct = await res.json();
  return data;
}

export async function fetchProductReviews(productId: string): Promise<IReview[]> {
  const res = await fetch(`${BASE_URL}/products/${productId}/reviews`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const data: IReview[] = await res.json();
  return data;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

function authHeaders(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function createOrder(
  token: string,
  items: OrderItemInput[],
  shippingAddress: IShippingAddress
): Promise<IOrder> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ items, shippingAddress }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Failed to create order');
  }
  return res.json() as Promise<IOrder>;
}

export async function fetchOrderById(token: string, id: string): Promise<IOrder> {
  const res = await fetch(`${BASE_URL}/orders/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json() as Promise<IOrder>;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthUserResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

export async function updateProfile(token: string, data: UpdateProfileInput): Promise<AuthUserResponse> {
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Failed to update profile');
  }
  return res.json() as Promise<AuthUserResponse>;
}

export async function cancelOrder(token: string, id: string): Promise<IOrder> {
  const res = await fetch(`${BASE_URL}/orders/${id}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<IOrder>;
}

export async function createReview(
  productId: string,
  rating: number,
  comment: string,
  token: string
): Promise<IReview> {
  const res = await fetch(`${BASE_URL}/products/${productId}/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Failed to submit review');
  }
  return res.json() as Promise<IReview>;
}

export async function fetchMyOrders(token: string): Promise<IOrder[]> {
  const res = await fetch(`${BASE_URL}/orders/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json() as Promise<IOrder[]>;
}

export async function fetchProducts(params?: ProductParams): Promise<IProductResponse> {
  const searchParams = new URLSearchParams();

  if (params) {
    const { category, minPrice, maxPrice, minRating, search, sort, page, limit } = params;
    if (category !== undefined) searchParams.set('category', category);
    if (minPrice !== undefined) searchParams.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) searchParams.set('maxPrice', String(maxPrice));
    if (minRating !== undefined) searchParams.set('minRating', String(minRating));
    if (search !== undefined) searchParams.set('search', search);
    if (sort !== undefined) searchParams.set('sort', sort);
    if (page !== undefined) searchParams.set('page', String(page));
    if (limit !== undefined) searchParams.set('limit', String(limit));
  }

  const query = searchParams.toString();
  const res = await fetch(`${BASE_URL}/products${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data: IProductResponse = await res.json();
  return data;
}
