import { mkdir, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = extname(file.name) || '.png';
    const fileName = `pet-${Date.now()}${extension}`;
    const uploadDir = `${process.cwd()}/public/images/pet`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(`${uploadDir}/${fileName}`, buffer);

    return NextResponse.json({
      success: true,
      path: `/images/pet/${fileName}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
