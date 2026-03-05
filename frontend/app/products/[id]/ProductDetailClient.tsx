'use client';

import { useState, useEffect } from 'react';
import type { IProduct, IReview } from '@/app/types';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { createReview, fetchMyOrders } from '@/app/lib/api';

const BACKEND_URL = 'http://localhost:5000';
const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const filled = Math.round(rating);
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${cls} ${star <= filled ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

interface Props {
  product: IProduct;
  reviews: IReview[];
}

function StarPicker({
  value,
  hover,
  onHover,
  onLeave,
  onClick,
}: {
  value: number;
  hover: number;
  onHover: (n: number) => void;
  onLeave: () => void;
  onClick: (n: number) => void;
}) {
  const active = hover || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => onHover(star)}
          onMouseLeave={onLeave}
          onClick={() => onClick(star)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <svg
            className={`w-7 h-7 transition-colors ${star <= active ? 'text-amber-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailClient({ product, reviews }: Props) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const images = product.images.length > 0 ? product.images : [];
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewsList, setReviewsList] = useState<IReview[]>(reviews);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (!user) { setEligible(false); return; }
    fetchMyOrders(user.token).then((orders) => {
      setEligible(
        orders.some(
          (o) => o.orderStatus === 'delivered' &&
                 o.items.some((item) => item.product === product._id)
        )
      );
    }).catch(() => setEligible(false));
  }, [user]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (rating === 0) {
      setFormError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setFormError('Please enter a comment.');
      return;
    }
    setSubmitting(true);
    try {
      const newReview = await createReview(product._id, rating, comment, user!.token);
      setReviewsList((prev) => [newReview, ...prev]);
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  const categoryName =
    typeof product.category === 'string' ? null : product.category.name;

  const mainImageSrc = images[activeImage]
    ? `${BACKEND_URL}${images[activeImage]}`
    : null;

  function handleAddToCart() {
    addToCart(product, qty);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <a href="/" className="hover:text-indigo-600 transition-colors">Home</a>
        <span>/</span>
        <a href="/products" className="hover:text-indigo-600 transition-colors">Products</a>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* ── Image gallery ── */}
          <div className="flex flex-col gap-3">
            {/* Main image */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
              {mainImageSrc ? (
                <img
                  src={mainImageSrc}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === activeImage
                        ? 'border-indigo-600'
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={idx === activeImage}
                  >
                    <img
                      src={`${BACKEND_URL}${img}`}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div className="flex flex-col">
            {/* Category badge */}
            {categoryName && (
              <span className="inline-flex self-start bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                {categoryName}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.rating} size="md" />
              <span className="text-sm font-medium text-gray-700">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Price */}
            <p className="text-3xl font-bold text-gray-900 mb-4">
              ${product.price.toFixed(2)}
            </p>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Stock status */}
            <p className="text-sm mb-4">
              {product.stock > 0 ? (
                <span className="text-emerald-600 font-medium">
                  In stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-red-500 font-medium">Out of stock</span>
              )}
            </p>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                  className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={qty}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(product.stock, Number(e.target.value)));
                    setQty(val);
                  }}
                  className="w-12 text-center text-sm font-medium text-gray-900 py-2.5 border-x border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  aria-label="Increase quantity"
                  className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
              >
                Add to Cart
              </button>
            </div>

            {/* Specifications table */}
            {product.specifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h2>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.specifications.map((spec, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                        >
                          <td className="py-2.5 px-4 font-medium text-gray-700 w-2/5 border-b border-gray-100">
                            {spec.key}
                          </td>
                          <td className="py-2.5 px-4 text-gray-600 border-b border-gray-100">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          Customer Reviews
          {reviewsList.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({reviewsList.length})
            </span>
          )}
        </h2>

        {/* Review form */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          {!user ? (
            <p className="text-sm text-gray-500">
              <a href="/login" className="text-indigo-600 font-medium hover:underline">Log in</a> to leave a review
            </p>
          ) : !eligible ? (
            <p className="text-sm text-gray-400">
              Only verified purchasers with a delivered order can leave a review.
            </p>
          ) : submitted ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-3 rounded-lg">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Thanks for your review!
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
                <StarPicker
                  value={rating}
                  hover={hoverRating}
                  onHover={setHoverRating}
                  onLeave={() => setHoverRating(0)}
                  onClick={setRating}
                />
              </div>
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Your comment
                </label>
                <textarea
                  id="review-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product…"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {reviewsList.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No reviews yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to review this product</p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviewsList.map((review) => (
              <div key={review._id} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{review.user.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
