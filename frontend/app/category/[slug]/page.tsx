import { notFound } from 'next/navigation';
import { fetchCategoryBySlug } from '@/app/lib/api';
import ProductListView from '@/app/components/ProductListView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) notFound();

  return (
    <ProductListView
      title={category.name}
      subtitle={`Browse all products in ${category.name}`}
      categoryId={category._id}
    />
  );
}
