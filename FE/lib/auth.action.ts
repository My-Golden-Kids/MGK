'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';

const BASE_URL =
  process.env.SPRING_API_URL ?? process.env.NEXT_PUBLIC_SPRING_API_URL ?? '';

export async function serverFetch(path: string, init?: RequestInit) {
  const session = await auth();

  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
      Authorization: `Bearer ${session?.accessToken ?? ''}`,
    },
  });
}
