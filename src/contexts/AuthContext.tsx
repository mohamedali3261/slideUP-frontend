import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, logoutUser, getCurrentUser } from '@/lib/storage';

interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('slideup_current_user'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-login with default user if no user exists
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser({
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
      });
      setToken(btoa(JSON.stringify(currentUser)));
    } else {
      // Create default user automatically
      const defaultUsername = 'guest';
      const result = loginUser(defaultUsername, '');
      if (!('error' in result)) {
        setUser({
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
        });
        setToken(result.token);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const result = loginUser(username, password);
    if ('error' in result) {
      throw new Error(result.error);
    }
    setUser({
      id: result.user.id,
      username: result.user.username,
      role: result.user.role,
    });
    setToken(result.token);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
