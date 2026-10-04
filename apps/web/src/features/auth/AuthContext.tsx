import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onSessionExpired } from '../../api/query-client';
import { tokenStorage } from '../../api/token-storage';

interface AuthContextValue {
  isAuthenticated: boolean;
  signIn: (accessToken: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());

  const signIn = useCallback((accessToken: string) => {
    tokenStorage.set(accessToken);
    setToken(accessToken);
  }, []);

  const signOut = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    // Never show one user's cached data to the next one.
    queryClient.clear();
  }, [queryClient]);

  // Expired or invalid token: log out. `RequireAuth` then sends the user to /login and
  // remembers the current page, so they come back to it after logging in again.
  useEffect(() => onSessionExpired(signOut), [signOut]);

  const value = useMemo(
    () => ({ isAuthenticated: token !== null, signIn, signOut }),
    [token, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
