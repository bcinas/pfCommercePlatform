'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCategories } from '@/app/lib/api';
import type { ICategory } from '@/app/types';

const BACKEND_URL = 'http://localhost:5000';

const CATEGORY_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-400 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-violet-600',
  'from-lime-500 to-emerald-600',
  'from-red-500 to-rose-600',
  'from-yellow-400 to-orange-500',
];

function hashGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_GRADIENTS[hash % CATEGORY_GRADIENTS.length];
}

function CategoryCard({ category }: { category: ICategory }) {
  const gradient = hashGradient(category._id);
  const imageUrl = category.image ? `${BACKEND_URL}${category.image}` : null;

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative block rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <div className={`relative h-40 bg-gradient-to-br ${gradient}`}>
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
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Categories</h1>
        <p className="mt-1 text-gray-500">Browse our curated collections</p>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
            ))
          : categories.map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
      </div>
    </div>
  );
}
