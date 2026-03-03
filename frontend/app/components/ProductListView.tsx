'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/app/components/ProductCard';
import { fetchProducts } from '@/app/lib/api';
import type { IProduct } from '@/app/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StarRatingFilterProps {
  value: number;
  onChange: (v: number) => void;
}

function StarRatingFilter({ value, onChange }: StarRatingFilterProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered > 0 ? hovered : value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Minimum ${star} star${star !== 1 ? 's' : ''}`}
          className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          <svg
            className={`w-5 h-5 transition-colors ${active >= star ? 'text-amber-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-xs text-indigo-600 font-medium">{value}+ stars</span>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface ProductListViewProps {
  title: string;
  subtitle?: string;
  categoryId?: string;
}

export default function ProductListView({
  title,
  subtitle,
  categoryId,
}: ProductListViewProps) {
  // Products state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filter / sort state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortValue>('newest');
  const [priceMinInput, setPriceMinInput] = useState('');
  const [priceMaxInput, setPriceMaxInput] = useState('');
  const [appliedMin, setAppliedMin] = useState<number | undefined>();
  const [appliedMax, setAppliedMax] = useState<number | undefined>();
  const [minRating, setMinRating] = useState(0);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when any filter/sort changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort, appliedMin, appliedMax, minRating, categoryId]);

  // Fetch products
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts({
          category: categoryId,
          search: debouncedSearch || undefined,
          sort,
          minPrice: appliedMin,
          maxPrice: appliedMax,
          minRating: minRating || undefined,
          page,
          limit: 12,
        });
        if (!cancelled) {
          setProducts(data.products);
          setTotalPages(data.totalPages);
          setTotalProducts(data.totalProducts);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedSearch, sort, appliedMin, appliedMax, minRating, page]);

  const hasActiveFilters =
    !!debouncedSearch ||
    appliedMin !== undefined ||
    appliedMax !== undefined ||
    minRating > 0;

  function handleApplyPrice() {
    setAppliedMin(priceMinInput !== '' ? Number(priceMinInput) : undefined);
    setAppliedMax(priceMaxInput !== '' ? Number(priceMaxInput) : undefined);
  }

  function handleClearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setPriceMinInput('');
    setPriceMaxInput('');
    setAppliedMin(undefined);
    setAppliedMax(undefined);
    setMinRating(0);
    setPage(1);
  }

  // Render sidebar content (called for both mobile panel and desktop aside)
  function renderSidebar() {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Price Range</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={priceMinInput}
              onChange={(e) => setPriceMinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
              min={0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-gray-400 flex-shrink-0 text-sm">—</span>
            <input
              type="number"
              placeholder="Max $"
              value={priceMaxInput}
              onChange={(e) => setPriceMaxInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
              min={0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {(appliedMin !== undefined || appliedMax !== undefined) && (
            <p className="mt-1.5 text-xs text-indigo-600">
              {appliedMin !== undefined ? `$${appliedMin}` : '$0'} —{' '}
              {appliedMax !== undefined ? `$${appliedMax}` : '∞'}
            </p>
          )}
          <button
            onClick={handleApplyPrice}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            Apply Price
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {/* Minimum Rating */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Minimum Rating</h3>
          <StarRatingFilter value={minRating} onChange={setMinRating} />
          {minRating > 0 && (
            <button
              onClick={() => setMinRating(0)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear rating
            </button>
          )}
        </div>
      </div>
    );
  }

  // Build paginator items (page numbers + ellipsis placeholders)
  const rawPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );
  const paginatorItems = rawPages.reduce<(number | 'ellipsis')[]>((acc, p, idx) => {
    if (idx > 0 && p - rawPages[idx - 1] > 1) acc.push('ellipsis');
    acc.push(p);
    return acc;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
      </div>

      {/* Toolbar: search + sort + mobile filter toggle */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortValue)}
          aria-label="Sort products"
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer flex-shrink-0"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          aria-label="Toggle filters"
          aria-expanded={sidebarOpen}
          className={`lg:hidden flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm font-medium transition-colors flex-shrink-0 ${
            sidebarOpen || hasActiveFilters
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-indigo-600 rounded-full" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile sidebar (collapsed by default) */}
      {sidebarOpen && <div className="lg:hidden mb-6">{renderSidebar()}</div>}

      {/* Main layout: sidebar + product grid */}
      <div className="flex gap-6 items-start">
        {/* Desktop sidebar — sticky below the fixed header */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-20">
          {renderSidebar()}
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Result count */}
          <p className="text-sm text-gray-500 mb-4">
            {loading ? (
              <span className="inline-block h-4 w-36 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                <span className="font-semibold text-gray-900">{totalProducts}</span>{' '}
                product{totalProducts !== 1 ? 's' : ''} found
              </>
            )}
          </p>

          {/* Empty state */}
          {!loading && products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="font-semibold text-gray-900">No products found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)
                : products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <nav
              aria-label="Product pagination"
              className="mt-8 flex items-center justify-center gap-1"
            >
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>

              {paginatorItems.map((p, idx) =>
                p === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-gray-400 text-sm select-none"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
