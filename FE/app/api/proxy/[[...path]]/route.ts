import { auth } from '@/lib/auth';

// biome-ignore lint/style/noNonNullAssertion: neededENV
const SPRING_API = process.env.SPRING_API_URL!;

async function handler(req: Request, { params }: any) {
  const [session, resolvedParams] = await Promise.all([auth(), params]);

  if (!session?.accessToken) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let path = resolvedParams?.path?.join('/') ?? '';
  path = path.replace(/^\/+/, '');
  path = path.replace(/^api\//, '');

  const url = new URL(req.url);
  const targetUrl = `${SPRING_API}/api/${path}${url.search}`;

  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await req.text();

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body,
    });

    const nullBody = new Set([101, 204, 205, 304]);
    if (nullBody.has(res.status)) {
      return new Response(null, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? 'application/json';
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (e) {
    console.error('[proxy] fetch failed:', targetUrl, e);
    return new Response(JSON.stringify({ message: 'Bad Gateway' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
