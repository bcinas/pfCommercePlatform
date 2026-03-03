'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCategories, fetchProducts } from '@/app/lib/api';
import type { ICategory, IProduct } from '@/app/types';
import ProductCard from '@/app/components/ProductCard';

const BACKEND_URL = 'http://localhost:5000';

const CATEGORY_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-400 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
];

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ category, index }: { category: ICategory; index: number }) {
  const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
  const imageUrl = category.image ? `${BACKEND_URL}${category.image}` : null;

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative block rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <div className={`relative h-40 bg-gradient-to-br ${gradient}`}>
        {/* Optional backend image overlaid with blend */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        {/* Hover darkening overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        {/* Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <span className="text-white font-bold text-base leading-snug drop-shadow-sm">
            {category.name}
          </span>
          <span className="mt-1.5 inline-flex items-center gap-1 text-white/80 text-xs font-medium group-hover:text-white transition-colors">
            Shop now
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

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

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface ProductSectionProps {
  title: string;
  subtitle: string;
  seeAllHref: string;
  products: IProduct[];
  loading: boolean;
}

function ProductSection({ title, subtitle, seeAllHref, products, loading }: ProductSectionProps) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>
          </div>
          <Link
            href={seeAllHref}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            See all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [topRated, setTopRated] = useState<IProduct[]>([]);
  const [mostPopular, setMostPopular] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catsData, topRatedData, popularData] = await Promise.all([
          fetchCategories(),
          fetchProducts({ sort: 'rating', limit: 4 }),
          fetchProducts({ sort: 'most_ordered', limit: 4 }),
        ]);
        setCategories(catsData);
        setTopRated(topRatedData.products);
        setMostPopular(popularData.products);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[20rem] bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <span className="inline-block bg-white/15 border border-white/25 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            New arrivals every week
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Discover Premium
            <br />
            <span className="text-amber-300">Products</span> You&apos;ll Love
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Shop electronics, fashion, home goods, sports gear, and more — curated for quality
            and delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-full hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/30 text-sm"
            >
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 hover:border-white/60 transition-colors text-sm"
            >
              Browse Categories
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
            {[
              { value: '20+', label: 'Products' },
              { value: '5', label: 'Categories' },
              { value: '100%', label: 'Secure checkout' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop by Category ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 mt-1 text-sm">Browse our curated collections</p>
          </div>
          <Link
            href="/categories"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, i) => (
              <CategoryCard key={category._id} category={category} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Top Rated ────────────────────────────────────────────────────── */}
      <div className="bg-white">
        <ProductSection
          title="Top Rated Products"
          subtitle="Highly rated by our community"
          seeAllHref="/products?sort=rating"
          products={topRated}
          loading={loading}
        />
      </div>

      {/* ── Most Popular ─────────────────────────────────────────────────── */}
      <ProductSection
        title="Most Popular"
        subtitle="What everyone is ordering right now"
        seeAllHref="/products?sort=most_ordered"
        products={mostPopular}
        loading={loading}
      />
    </>
  );
}
