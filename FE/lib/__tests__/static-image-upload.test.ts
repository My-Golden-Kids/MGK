import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clientFetchMock = vi.fn();
const fetchMock = vi.fn<typeof fetch>();

vi.mock('@/lib/client-fetch', () => ({
  clientFetch: clientFetchMock,
}));

async function loadUploadModule() {
  return await import('../static-image-upload');
}

describe('uploadStaticImage', () => {
  const originalFetch = global.fetch;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    clientFetchMock.mockReset();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    global.fetch = originalFetch;
    vi.resetModules();
  });

  it('S3 업로드 성공 시 publicUrl을 반환하고 로컬 업로드는 시도하지 않는다', async () => {
    process.env.NODE_ENV = 'production';

    clientFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          objectKey: 'static/pet.png',
          uploadUrl: 'https://upload.example.com/static/pet.png?signature=1',
          publicUrl: 'https://cdn.example.com/static/pet.png',
        }),
        { status: 200 },
      ),
    );
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const { uploadStaticImage } = await loadUploadModule();
    const file = new File(['pet'], 'pet.png', { type: 'image/png' });
    const result = await uploadStaticImage(file, 'pet');

    expect(result).toEqual({
      ok: true,
      path: 'https://cdn.example.com/static/pet.png',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://upload.example.com/static/pet.png?signature=1',
      expect.objectContaining({
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'image/png',
        },
      }),
    );
  });

  it('프로덕션에서는 presign 실패 시 로컬 fallback 없이 에러를 반환한다', async () => {
    process.env.NODE_ENV = 'production';

    clientFetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const { uploadStaticImage } = await loadUploadModule();
    const file = new File(['pet'], 'pet.png', { type: 'image/png' });
    const result = await uploadStaticImage(file, 'pet');

    expect(result).toEqual({
      ok: false,
      errorMessage: '이미지 업로드에 실패했어요.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('개발 환경에서는 presign 실패 시 로컬 업로드로 fallback 한다', async () => {
    process.env.NODE_ENV = 'development';

    clientFetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ path: '/images/pet/pet-123.png' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const { uploadStaticImage } = await loadUploadModule();
    const file = new File(['pet'], 'pet.png', { type: 'image/png' });
    const result = await uploadStaticImage(file, 'pet');

    expect(result).toEqual({
      ok: true,
      path: '/images/pet/pet-123.png',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/static-image-upload',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
  });
});
