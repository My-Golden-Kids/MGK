import { clientFetch } from '@/lib/auth';

export async function handleDeleteAccount() {
  const res = await clientFetch('/api/auth/delete-account');

  if (!res.ok) {
    return { ok: false, errorMessage: '' };
  }
}
