import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.server';

export const runtime = 'nodejs';

const BASE_URL =
  process.env.SPRING_API_URL ?? process.env.NEXT_PUBLIC_SPRING_API_URL ?? '';

type PetResponse = {
  id: number;
  name: string;
  imageUrl?: string | null;
  image?: string | null;
  age?: number | null;
  species?: string | null;
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${BASE_URL}/api/pets`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch pets' },
        { status: response.status },
      );
    }

    const pets = ((await response.json()) as PetResponse[]).map((pet) => ({
      ...pet,
      imageUrl: pet.imageUrl ?? pet.image ?? null,
    }));

    return NextResponse.json(
      { pets },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch pets' }, { status: 500 });
  }
}
