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
import { clientFetch } from '@/lib/client-fetch';
import { uploadStaticImage } from '@/lib/static-image-upload';

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
  return uploadStaticImage(file, 'pet');
}
