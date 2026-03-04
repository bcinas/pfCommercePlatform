import { notFound } from 'next/navigation';
import { fetchProductById, fetchProductReviews } from '@/app/lib/api';
import type { IReview } from '@/app/types';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  let product;
  try {
    product = await fetchProductById(id);
  } catch {
    notFound();
  }

  let reviews: IReview[];
  try {
    reviews = await fetchProductReviews(id);
  } catch {
    reviews = [];
  }

  return <ProductDetailClient product={product} reviews={reviews} />;
}
