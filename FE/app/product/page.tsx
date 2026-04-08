import { redirect } from 'next/navigation';
import { getProducts } from '@/features/product/api/productApi';

export default async function ProductPage() {
  const products = await getProducts();

  if (!products.length) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p>상품이 없습니다.</p>
      </main>
    );
  }

  redirect(`/product/${products[0].id}`);
}
