import { useMutation } from '@tanstack/react-query';
import { api, unwrap } from '../client';
import type { Credentials } from '../types';

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      unwrap(api.POST('/auth/login', { body: credentials })),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      unwrap(api.POST('/auth/register', { body: credentials })),
  });
}
