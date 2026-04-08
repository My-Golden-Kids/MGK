import type { Product } from '../types/product';

const BASE_URL = process.env.NEXT_PUBLIC_SPRING_API_URL;

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_SPRING_API_URL 환경변수가 설정되지 않았습니다.');
}

export async function getProducts(): Promise<Product[]> {
  const url = `${BASE_URL}/api/products`;

  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `상품 목록 조회 실패: ${res.status} ${res.statusText} - ${errorText}`,
    );
  }

  return res.json();
}

export async function getProductDetail(productId: string): Promise<Product> {
  const url = `${BASE_URL}/api/products/${productId}`;

  const res = await fetch(url, {
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
