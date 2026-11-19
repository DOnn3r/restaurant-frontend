import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { http } from './api';
import { Role, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return v;
}

export const homeFor = (role: Role): string =>
  role === 'ADMIN' ? '/dashboard' : role === 'CUISINIER' ? '/kitchen' : '/tables';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => localStorage.getItem('token') !== null);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    http.get<User>('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await http.post<{ token: string; user: User }>('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
