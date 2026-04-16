import { redirect } from 'next/navigation';
import { getProducts } from '@/features/product/api/productApi';

type ProductPageProps = {
  searchParams: Promise<{ petId?: string }>;
};

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const products = await getProducts();
  const { petId } = await searchParams;

  if (!products.length) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p>상품이 없습니다.</p>
      </main>
    );
  }

  redirect(
    petId
      ? `/product/${products[0].id}?petId=${petId}`
      : `/product/${products[0].id}`,
  );
}
