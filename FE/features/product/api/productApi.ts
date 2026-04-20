import { serverFetch } from '@/lib/server-fetch';
import type { PersonalizedProductReport, Product } from '../types/product';

export async function getProducts(): Promise<Product[]> {
  const res = await serverFetch('/api/products', { cache: 'no-store' });
  if (!res.ok) throw new Error('상품 목록 조회 실패');
  return res.json();
}

export async function getProductDetail(productId: string): Promise<Product> {
  const res = await serverFetch(`/api/products/${productId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('상품 상세 조회 실패');
  return res.json();
}

export async function getPersonalizedProducts(
  petId?: number | null,
): Promise<PersonalizedProductReport[]> {
  const query = petId != null && petId > 0 ? `?petId=${petId}` : '';
  const res = await serverFetch(`/api/products/personalized${query}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('개인화 상품 조회 실패');
  return res.json();
}
