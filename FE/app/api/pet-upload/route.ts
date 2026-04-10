import { mkdir, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.server';

export const runtime = 'nodejs';

const BASE_URL =
  process.env.SPRING_API_URL ?? process.env.NEXT_PUBLIC_SPRING_API_URL ?? '';
const DEFAULT_PET_NAME = '\uC0C8 \uD3AB';
const IS_DEV = process.env.NODE_ENV !== 'production';

type PetSummary = {
  id: number;
  name?: string | null;
  imageUrl?: string | null;
  image?: string | null;
};

type ParsedResponseBody = {
  kind: 'json' | 'html' | 'text' | 'empty' | 'invalid';
  data?: unknown;
  summary: string;
};

type DebugCall = {
  phase: 'get-pets' | 'patch-pet-image';
  endpoint: string;
  status: number;
  bodySummary: string;
};

type DebugInfo = {
  sessionExists: boolean;
  hasAccessToken: boolean;
  baseUrlExists: boolean;
  calls: DebugCall[];
};

type UploadResponse = {
  success: boolean;
  path: string | null;
  dbUpdated: boolean;
  message: string;
  error?: string;
  petId?: number;
  debug?: DebugInfo;
};

function normalizePetName(petName: string) {
  const value = petName.trim();
  return value.length > 0 ? value : null;
}

function summarizeUnknownBody(payload: unknown) {
  if (payload === null || payload === undefined) {
    return '(empty)';
  }

  if (typeof payload === 'string') {
    return payload.slice(0, 240);
  }

  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    const knownMessage = [data.message, data.error, data.detail]
      .find((value) => typeof value === 'string')
      ?.toString();

    if (knownMessage) {
      return knownMessage.slice(0, 240);
    }

    try {
      return JSON.stringify(payload).slice(0, 240);
    } catch {
      return '[unserializable object]';
    }
  }

  return String(payload).slice(0, 240);
}

async function readResponseBody(response: Response): Promise<ParsedResponseBody> {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return {
        kind: 'json',
        data,
        summary: summarizeUnknownBody(data),
      };
    }

    const text = await response.text();
    const trimmedText = text.trim();

    if (!trimmedText) {
      return {
        kind: 'empty',
        summary: '(empty)',
      };
    }

    const isHtml =
      contentType.includes('text/html') ||
      trimmedText.startsWith('<!DOCTYPE') ||
      trimmedText.startsWith('<html');

    if (isHtml) {
      const plainText = trimmedText
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 240);

      return {
        kind: 'html',
        summary: plainText || '[html response]',
      };
    }

    return {
      kind: 'text',
      summary: trimmedText.slice(0, 240),
    };
  } catch {
    return {
      kind: 'invalid',
      summary: '[unreadable response body]',
    };
  }
}

function withDebug(payload: Omit<UploadResponse, 'debug'>, debug: DebugInfo) {
  return IS_DEV ? { ...payload, debug } : payload;
}

function jsonResponse(status: number, payload: UploadResponse) {
  return NextResponse.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function mapSpringErrorStatus(status: number, phase: 'get-pets' | 'patch-pet-image') {
  const codeByStatus: Record<number, string> = {
    401: 'SPRING_UNAUTHORIZED',
    403: 'SPRING_FORBIDDEN',
    404: 'SPRING_NOT_FOUND',
    415: 'SPRING_UNSUPPORTED_MEDIA_TYPE',
    500: 'SPRING_INTERNAL_ERROR',
  };

  const reasonCode = codeByStatus[status] ?? 'SPRING_BAD_RESPONSE';
  const phaseCode = phase.toUpperCase().replace(/-/g, '_');
  return `${phaseCode}_${reasonCode}`;
}

export async function POST(request: Request) {
  const debug: DebugInfo = {
    sessionExists: false,
    hasAccessToken: false,
    baseUrlExists: Boolean(BASE_URL),
    calls: [],
  };

  let imagePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const petNameValue = formData.get('petName');
    const petName = typeof petNameValue === 'string' ? petNameValue.trim() : '';
    const resolvedPetName = normalizePetName(petName) ?? DEFAULT_PET_NAME;

    if (!(file instanceof File)) {
      return jsonResponse(
        400,
        withDebug(
          {
            success: false,
            path: null,
            dbUpdated: false,
            message: 'FILE_REQUIRED',
            error: 'No file provided',
          },
          debug,
        ),
      );
    }

    const extension = extname(file.name) || '.png';
    const fileName = `pet-${Date.now()}${extension}`;
    const uploadDir = `${process.cwd()}/public/images/pet`;
    imagePath = `/images/pet/${fileName}`;

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await mkdir(uploadDir, { recursive: true });
      await writeFile(`${uploadDir}/${fileName}`, buffer);
    } catch (error) {
      console.error('[pet-upload] file save failed', { imagePath, error });
      return jsonResponse(
        500,
        withDebug(
          {
            success: false,
            path: imagePath,
            dbUpdated: false,
            message: 'FILE_SAVE_FAILED',
            error: 'Failed to save uploaded file',
          },
          debug,
        ),
      );
    }

    const session = await auth();
    debug.sessionExists = Boolean(session);
    debug.hasAccessToken = Boolean(session?.accessToken);

    console.info('[pet-upload] auth context', {
      sessionExists: debug.sessionExists,
      hasAccessToken: debug.hasAccessToken,
      baseUrlExists: debug.baseUrlExists,
    });

    if (!session?.accessToken) {
      return jsonResponse(
        401,
        withDebug(
          {
            success: false,
            path: imagePath,
            dbUpdated: false,
            message: 'SESSION_NOT_FOUND',
            error: 'No active session or access token',
          },
          debug,
        ),
      );
    }

    if (!BASE_URL) {
      console.error('[pet-upload] Missing Spring API base URL');
      return jsonResponse(
        500,
        withDebug(
          {
            success: false,
            path: imagePath,
            dbUpdated: false,
            message: 'BASE_URL_MISSING',
            error: 'SPRING_API_URL is not configured',
          },
          debug,
        ),
      );
    }

    const petsEndpoint = `${BASE_URL}/api/pets`;
    let petsResponse: Response;

    try {
      petsResponse = await fetch(petsEndpoint, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: 'no-store',
      });
    } catch (error) {
      console.error('[pet-upload] spring get-pets request failed', {
        endpoint: petsEndpoint,
        error,
      });

      return jsonResponse(
        502,
        withDebug(
          {
            success: false,
            path: imagePath,
            dbUpdated: false,
            message: 'GET_PETS_SPRING_NETWORK_ERROR',
            error: 'Failed to reach Spring /api/pets',
          },
          debug,
        ),
      );
    }

    const petsBody = await readResponseBody(petsResponse);
    debug.calls.push({
      phase: 'get-pets',
      endpoint: petsEndpoint,
      status: petsResponse.status,
      bodySummary: petsBody.summary,
    });

    console.info('[pet-upload] spring response', {
      phase: 'get-pets',
      endpoint: petsEndpoint,
      status: petsResponse.status,
      bodySummary: petsBody.summary,
    });

    if (!petsResponse.ok) {
      const mappedMessage = mapSpringErrorStatus(petsResponse.status, 'get-pets');
      return jsonResponse(
        petsResponse.status,
        withDebug(
          {
            success: false,
            path: imagePath,
            dbUpdated: false,
            message: mappedMessage,
            error: petsBody.summary,
          },
          debug,
        ),
      );
    }

    const petList =
      petsBody.kind === 'json' && Array.isArray(petsBody.data)
        ? (petsBody.data as PetSummary[])
        : [];

    const matchedPet = petList.find((pet) => pet.name?.trim() === resolvedPetName);
    const targetPetId = matchedPet?.id ?? petList[0]?.id;

    const patchEndpoint = targetPetId
      ? `${BASE_URL}/api/pets/${targetPetId}/image`
      : `${BASE_URL}/api/pets/onboarding-image`;

    const patchBody = targetPetId
      ? { image: imagePath }
      : { image: imagePath, name: resolvedPetName };

    let patchResponse: Response;

    try {
      patchResponse = await fetch(patchEndpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: 'no-store',
        body: JSON.stringify(patchBody),
      });
    } catch (error) {
      console.error('[pet-upload] spring patch request failed', {
        endpoint: patchEndpoint,
        error,
      });

      return jsonResponse(
        502,
        withDebug(
          {
            success: false,
            path: imagePath,
            dbUpdated: false,
            message: 'PATCH_PET_IMAGE_SPRING_NETWORK_ERROR',
            error: 'Failed to reach Spring patch endpoint',
          },
          debug,
        ),
      );
    }

    const patchResponseBody = await readResponseBody(patchResponse);
    debug.calls.push({
      phase: 'patch-pet-image',
      endpoint: patchEndpoint,
      status: patchResponse.status,
      bodySummary: patchResponseBody.summary,
    });

    console.info('[pet-upload] spring response', {
      phase: 'patch-pet-image',
      endpoint: patchEndpoint,
      status: patchResponse.status,
      bodySummary: patchResponseBody.summary,
    });

    if (!patchResponse.ok) {
      const mappedMessage = mapSpringErrorStatus(
        patchResponse.status,
        'patch-pet-image',
      );

      return jsonResponse(
        patchResponse.status,
        withDebug(
          {
            success: false,
            path: imagePath,
            dbUpdated: false,
            message: mappedMessage,
            error: patchResponseBody.summary,
          },
          debug,
        ),
      );
    }

    const petId =
      patchResponseBody.kind === 'json' &&
      patchResponseBody.data &&
      typeof patchResponseBody.data === 'object' &&
      'id' in patchResponseBody.data &&
      typeof patchResponseBody.data.id === 'number'
        ? patchResponseBody.data.id
        : undefined;

    return jsonResponse(
      200,
      withDebug(
        {
          success: true,
          path: imagePath,
          dbUpdated: true,
          message: targetPetId
            ? 'PET_IMAGE_UPDATED'
            : 'PET_CREATED_AND_IMAGE_UPDATED',
          petId,
        },
        debug,
      ),
    );
  } catch (error) {
    console.error('[pet-upload] unhandled error', { imagePath, error });
    return jsonResponse(
      500,
      withDebug(
        {
          success: false,
          path: imagePath,
          dbUpdated: false,
          message: 'UPLOAD_UNHANDLED_ERROR',
          error: 'Unexpected upload error',
        },
        debug,
      ),
    );
  }
}
