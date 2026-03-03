import type { ICategory, IProductResponse } from '@/app/types';

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
