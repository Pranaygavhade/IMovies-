import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { IUser } from '../types/index.js';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (movieId: string) => Promise<boolean>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('imovies_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('imovies_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch {
          localStorage.removeItem('imovies_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const authToken = res.data.token;
      localStorage.setItem('imovies_token', authToken);
      setToken(authToken);
      setUser(res.data.user);
      setIsAuthModalOpen(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    if (res.data.success) {
      const authToken = res.data.token;
      localStorage.setItem('imovies_token', authToken);
      setToken(authToken);
      setUser(res.data.user);
      setIsAuthModalOpen(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue cleanup
    }
    localStorage.removeItem('imovies_token');
    setToken(null);
    setUser(null);
  };

  const toggleFavorite = async (movieId: string): Promise<boolean> => {
    if (!user) {
      openAuthModal('login');
      return false;
    }
    try {
      const res = await api.post(`/auth/favorites/${movieId}`);
      if (res.data.success) {
        setUser((prev) => {
          if (!prev) return null;
          const currentFavs = prev.favorites || [];
          const updatedFavs = res.data.isFavorite
            ? [...currentFavs, movieId]
            : currentFavs.filter((id) => id !== movieId);
          return { ...prev, favorites: updatedFavs };
        });
        return res.data.isFavorite;
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
    return false;
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        toggleFavorite,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
