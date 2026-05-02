'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import apiClient, { TOKEN_KEY } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { Usuario, AuthResponse } from '@/lib/types';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = Cookies.get(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get<{ success: boolean; data: Usuario }>(
        ENDPOINTS.AUTH.ME
      );
      setUser(data.data);
    } catch {
      Cookies.remove(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      ENDPOINTS.AUTH.LOGIN,
      { email, password }
    );
    const { access_token, user: loggedUser } = data.data;
    Cookies.set(TOKEN_KEY, access_token, { expires: 7, sameSite: 'strict' });
    setUser(loggedUser);
  };

  const logout = () => {
    Cookies.remove(TOKEN_KEY);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
