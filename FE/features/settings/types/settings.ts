export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
  passwordConfirm: string;
}

export interface ChangePasswordResult {
  ok: boolean;
  fieldErrors?: Partial<
    Record<'currentPassword' | 'newPassword' | 'passwordConfirm', string>
  >;
  errorMessage?: string;
}

export interface DeleteAccountResult {
  ok: boolean;
  errorMessage?: string;
}
