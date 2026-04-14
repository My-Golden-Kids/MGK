import { serverFetch } from '@/lib/auth.action';
import type { Product } from '../types/product';

export async function getProducts(): Promise<Product[]> {
  const res = await serverFetch('/api/products', { cache: 'no-store' });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `상품 목록 조회 실패: ${res.status} ${res.statusText} - ${errorText}`,
    );
  }

  return res.json();
}

export async function getProductDetail(productId: string): Promise<Product> {
  const res = await serverFetch(`/api/products/${productId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `상품 상세 조회 실패: ${res.status} ${res.statusText} - ${errorText}`,
    );
  }

  return res.json();
}
