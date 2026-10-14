import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, {
  clearAuthSession,
  getStoredUser,
  setAuthSession,
} from 'lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('hope_gym_token')));

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('hope_gym_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const result = await api.get('/auth/me');
      setUser(result.data);
      localStorage.setItem('hope_gym_user', JSON.stringify(result.data));
      return result.data;
    } catch {
      clearAuthSession();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const result = await api.post('/auth/google/admin', { idToken });
    setAuthSession(result.data);
    setUser(result.data.user);
    return result.data.user;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      loginWithGoogle,
      logout,
      refreshMe,
    }),
    [user, loading, loginWithGoogle, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
