import { auth } from '@/lib/auth';

const SPRING_API = process.env.SPRING_API_URL!;

type Context = {
  params: Promise<{
    path?: string[];
  }>;
};

async function handler(req: Request, { params }: Context) {
  const [session, resolvedParams] = await Promise.all([auth(), params]);

  if (!session?.accessToken) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const pathArray = resolvedParams?.path ?? [];
  const path = pathArray.join('/').replace(/^\/+/, '');

  const cleanPath = path.replace(/^api\//, '');

  const base = SPRING_API.replace(/\/$/, '');

  const targetUrl = cleanPath.startsWith('apis/')
    ? new URL(`/${cleanPath}`, base)
    : new URL(`/api/${cleanPath}`, base);

  const incomingUrl = new URL(req.url);
  targetUrl.search = incomingUrl.search;

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ...(hasBody
          ? {
              'Content-Type':
                req.headers.get('content-type') || 'application/json',
            }
          : {}),
      },
      body,
    });

    if ([101, 204, 205, 304].includes(res.status)) {
      return new Response(null, { status: res.status });
    }

    return new Response(await res.text(), {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (e) {
    console.error('[proxy] fetch failed:', targetUrl.toString(), e);
    return Response.json({ message: 'Bad Gateway' }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
