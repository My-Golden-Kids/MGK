import { mkdir, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const LOCAL_UPLOAD_DIRS = {
  pet: {
    fileNamePrefix: 'pet',
    filePath: 'public/images/pet',
    publicPath: '/images/pet',
  },
  expense: {
    fileNamePrefix: 'expense',
    filePath: 'public/expense',
    publicPath: '/expense',
  },
  hospital: {
    fileNamePrefix: 'hospital',
    filePath: 'public/hospital',
    publicPath: '/hospital',
  },
} as const;

type LocalUploadDir = keyof typeof LOCAL_UPLOAD_DIRS;

function isLocalUploadDir(value: string): value is LocalUploadDir {
  return value in LOCAL_UPLOAD_DIRS;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const dir = formData.get('dir');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (typeof dir !== 'string' || !isLocalUploadDir(dir)) {
      return NextResponse.json(
        { error: 'Invalid upload directory' },
        { status: 400 },
      );
    }

    const config = LOCAL_UPLOAD_DIRS[dir];
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = extname(file.name) || '.png';
    const fileName = `${config.fileNamePrefix}-${Date.now()}${extension}`;
    const uploadDir = `${process.cwd()}/${config.filePath}`;

    await mkdir(uploadDir, { recursive: true });
    await writeFile(`${uploadDir}/${fileName}`, buffer);

    return NextResponse.json({
      success: true,
      path: `${config.publicPath}/${fileName}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
