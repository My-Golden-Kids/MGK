import type {
  PetApiResult,
  PetDeleteResult,
  PetFormParams,
  PetSize,
  PetSummary,
  PetsApiResult,
  PetType,
  UpdatePetParams,
  UploadResult,
} from '@/features/settings/types/petSettings';
import { clientFetch } from '@/lib/auth';

type PetApiResponse = {
  id: number;
  name: string;
  age?: number | null;
  species?: string | null;
  imageUrl?: string | null;
  size?: string | null;
  isDeath?: boolean | null;
  death?: boolean | null;
};

type StaticUploadUrlResponse = {
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
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

function parsePetSummary(data: PetApiResponse): PetSummary {
  return {
    id: data.id,
    name: data.name,
    age: data.age ?? null,
    species: (data.species as PetType) ?? null,
    imageUrl: data.imageUrl ?? null,
    size: (data.size as PetSize) ?? null,
    isDeath: data.isDeath ?? data.death ?? false,
  };
}

export async function fetchPets(): Promise<PetsApiResult> {
  try {
    const res = await clientFetch('/api/pets');
    if (!res.ok)
      return { ok: false, errorMessage: '반려동물 목록을 불러오지 못했어요.' };
    const data = (await res.json()) as PetApiResponse[];
    return { ok: true, pets: data.map(parsePetSummary) };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}

export async function fetchPet(petId: number): Promise<PetApiResult> {
  try {
    const res = await clientFetch(`/api/pets/${petId}`);
    if (!res.ok)
      return { ok: false, errorMessage: '반려동물 정보를 불러오지 못했어요.' };
    const data = (await res.json()) as PetApiResponse;
    return { ok: true, pet: parsePetSummary(data) };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}

export async function createPet(params: PetFormParams): Promise<PetApiResult> {
  try {
    const res = await clientFetch('/api/pets', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (!res.ok)
      return { ok: false, errorMessage: '반려동물 추가에 실패했어요.' };
    const data = (await res.json()) as PetApiResponse;
    return { ok: true, pet: parsePetSummary(data) };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}

export async function updatePet(
  params: UpdatePetParams,
): Promise<PetApiResult> {
  try {
    const { petId, ...rest } = params;
    const res = await clientFetch(`/api/pets/${petId}`, {
      method: 'PATCH',
      body: JSON.stringify(rest),
    });
    if (!res.ok)
      return { ok: false, errorMessage: '반려동물 정보 저장에 실패했어요.' };
    const data = (await res.json()) as PetApiResponse;
    return { ok: true, pet: parsePetSummary(data) };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}

export async function deletePet(petId: number): Promise<PetDeleteResult> {
  try {
    const res = await clientFetch(`/api/pets/${petId}`, {
      method: 'DELETE',
    });
    if (!res.ok)
      return { ok: false, errorMessage: '반려동물 삭제에 실패했어요.' };
    return { ok: true };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}

export async function uploadPetImage(file: File): Promise<UploadResult> {
  try {
    const params = new URLSearchParams({
      fileName: file.name,
      contentType: file.type || 'image/png',
    });

    const presignRes = await clientFetch(
      `/apis/files/upload-url/static?${params.toString()}`,
      {
        method: 'GET',
      },
    );

    if (!presignRes.ok)
      return { ok: false, errorMessage: '이미지 업로드에 실패했어요.' };

    const rawResponseText = await presignRes.text();
    const { uploadUrl, publicUrl } = parseStaticUploadResponse(rawResponseText);

    if (!uploadUrl) {
      return { ok: false, errorMessage: '업로드 URL을 받지 못했어요.' };
    }

    if (!publicUrl) {
      return { ok: false, errorMessage: '공개 이미지 URL을 받지 못했어요.' };
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

    return { ok: true, path: publicUrl };
  } catch {
    return { ok: false, errorMessage: '이미지 업로드 중 오류가 발생했어요.' };
  }
}
