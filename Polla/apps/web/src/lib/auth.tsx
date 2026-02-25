'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from './api';
import { User } from '../types/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  mutate: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // La cookie auth_token se envía automáticamente (withCredentials: true)
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch {
      // Sin sesión activa o token expirado—no hacer nada, user queda null
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Borra la cookie httpOnly en el servidor
    } catch {
      // Continuar con logout aunque falle el request
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, mutate: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
