import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../client';
import type { AuthResponse, Credentials } from '../types';

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      apiRequest<AuthResponse>('POST', '/auth/login', { body: credentials }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      apiRequest<AuthResponse>('POST', '/auth/register', { body: credentials }),
  });
}
