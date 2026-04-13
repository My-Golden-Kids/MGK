export type PetType = '강아지' | '고양이';
export type PetSize = '소형' | '중형' | '대형';

export interface PetSummary {
  id: number;
  name: string;
  age: number | null;
  species: PetType | null;
  imageUrl: string | null;
  size: PetSize | null;
}

export type PetFormParams = {
  name: string;
  age: number;
  species: PetType;
  size: PetSize;
  imageUrl?: string | null;
};

export type UpdatePetParams = PetFormParams & { petId: number };

export interface PetApiResult {
  ok: boolean;
  errorMessage?: string;
  pet?: PetSummary;
}

export interface PetsApiResult {
  ok: boolean;
  errorMessage?: string;
  pets?: PetSummary[];
}

export interface PetDeleteResult {
  ok: boolean;
  errorMessage?: string;
}

export interface UploadResult {
  ok: boolean;
  errorMessage?: string;
  path?: string;
}
