import { clientFetch } from '@/lib/client-fetch';

type StaticUploadDir = 'pet' | 'expense' | 'hospital';

type StaticUploadUrlResponse = {
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
};

type LocalUploadResponse = {
  path?: string;
};

function parseStaticUploadResponse(rawText: string) {
  const trimmedText = rawText.trim();

  if (!trimmedText) {
    return { uploadUrl: '', publicUrl: '' };
  }

  try {
    const parsed = JSON.parse(trimmedText) as StaticUploadUrlResponse | string;

    if (typeof parsed === 'string') {
      const uploadUrl = parsed.trim().replace(/^"|"$/g, '');
      return {
        uploadUrl,
        publicUrl: uploadUrl.split('?')[0] ?? '',
      };
    }

    return {
      uploadUrl: parsed.uploadUrl?.trim().replace(/^"|"$/g, '') ?? '',
      publicUrl:
        parsed.publicUrl?.trim().replace(/^"|"$/g, '') ??
        parsed.uploadUrl?.split('?')[0] ??
        '',
    };
  } catch {
    const uploadUrl = trimmedText.replace(/^"|"$/g, '');
    return {
      uploadUrl,
      publicUrl: uploadUrl.split('?')[0] ?? '',
    };
  }
}

async function uploadLocalStaticImage(file: File, dir: StaticUploadDir) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dir', dir);

    const response = await fetch('/api/static-image-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return '';
    }

    const result = (await response.json()) as LocalUploadResponse;
    return result.path?.trim() ?? '';
  } catch {
    return '';
  }
}

export async function uploadStaticImage(
  file: File,
  dir: StaticUploadDir,
): Promise<{ ok: true; path: string } | { ok: false; errorMessage: string }> {
  try {
    const localPathPromise = uploadLocalStaticImage(file, dir);

    const params = new URLSearchParams({
      fileName: file.name,
      contentType: file.type || 'image/png',
      dir,
    });

    const presignRes = await clientFetch(
      `/apis/files/upload-url/static?${params.toString()}`,
      { method: 'GET' },
    );

    if (!presignRes.ok) {
      return { ok: false, errorMessage: '이미지 업로드에 실패했어요.' };
    }

    const rawResponseText = await presignRes.text();
    const { uploadUrl, publicUrl } = parseStaticUploadResponse(rawResponseText);

    if (!uploadUrl || !publicUrl) {
      return {
        ok: false,
        errorMessage: '업로드 URL을 받지 못했어요.',
      };
    }

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/png',
      },
      body: file,
    });

    if (!uploadRes.ok) {
      return { ok: false, errorMessage: '이미지 업로드에 실패했어요.' };
    }

    const localPath = await localPathPromise;
    return { ok: true, path: localPath || publicUrl };
  } catch {
    return {
      ok: false,
      errorMessage: '이미지 업로드 중 오류가 발생했어요.',
    };
  }
}
