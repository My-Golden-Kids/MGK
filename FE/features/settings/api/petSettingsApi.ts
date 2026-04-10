import type {
  PetApiResult,
  PetFormParams,
  PetSize,
  PetSummary,
  PetsApiResult,
  PetType,
  UpdatePetParams,
  UploadResult,
} from '@/features/settings/types/petSettings';
import { clientFetch } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePetSummary(data: any): PetSummary {
  return {
    id: data.id,
    name: data.name,
    age: data.age ?? null,
    species: (data.species as PetType) ?? null,
    imageUrl: data.imageUrl ?? null,
    size: (data.size as PetSize) ?? null,
  };
}

export async function fetchPets(): Promise<PetsApiResult> {
  try {
    const res = await clientFetch('/api/pets');
    if (!res.ok)
      return { ok: false, errorMessage: '반려동물 목록을 불러오지 못했어요.' };
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
    return { ok: true, pet: parsePetSummary(data) };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}

export async function uploadPetImage(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/pet-upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok)
      return { ok: false, errorMessage: '이미지 업로드에 실패했어요.' };
    const data = await res.json();
    return { ok: true, path: data.path };
  } catch {
    return { ok: false, errorMessage: '이미지 업로드 중 오류가 발생했어요.' };
  }
}
