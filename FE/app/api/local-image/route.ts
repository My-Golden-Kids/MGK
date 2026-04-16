import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const LOCAL_IMAGE_DIRS = {
  '/expense/': 'public/expense',
  '/hospital/': 'public/hospital',
} as const;

function resolveLocalImagePath(requestPath: string) {
  for (const [prefix, directory] of Object.entries(LOCAL_IMAGE_DIRS)) {
    if (!requestPath.startsWith(prefix)) {
      continue;
    }

    const fileName = requestPath.slice(prefix.length);
    if (
      !fileName ||
      fileName.includes('/') ||
      fileName.includes('\\') ||
      fileName.includes('..')
    ) {
      return '';
    }

    return join(process.cwd(), directory, fileName);
  }

  return '';
}

function getContentType(filePath: string) {
  const extension = extname(filePath).toLowerCase();

  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  }
  if (extension === '.png') {
    return 'image/png';
  }
  if (extension === '.webp') {
    return 'image/webp';
  }
  if (extension === '.gif') {
    return 'image/gif';
  }
  if (extension === '.heic') {
    return 'image/heic';
  }
  if (extension === '.heif') {
    return 'image/heif';
  }

  return 'application/octet-stream';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path')?.trim() ?? '';
  const filePath = resolveLocalImagePath(path);

  if (!filePath) {
    return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
  }

  try {
    const buffer = await readFile(filePath);
    return new Response(buffer, {
      headers: {
        'Content-Type': getContentType(filePath),
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
