import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiLogin, apiGetUsers, apiAddUser, apiDeleteUser, apiUpdatePassword } from '../utils/api';

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// Auth Context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Session storage key
const SESSION_KEY = 'presence_session';

// Get all users (for admin page)
export async function getUsers(): Promise<{ email: string; user: User }[]> {
  try {
    return await apiGetUsers();
  } catch {
    return [];
  }
}

// Add new user (admin function)
export async function addUser(email: string, password: string, name: string, role: 'admin' | 'user'): Promise<{ success: boolean; error?: string }> {
  try {
    return await apiAddUser(email, password, name, role);
  } catch {
    return { success: false, error: 'حدث خطأ في الاتصال' };
  }
}

// Delete user (admin function)
export async function deleteUser(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    return await apiDeleteUser(email);
  } catch {
    return { success: false, error: 'حدث خطأ في الاتصال' };
  }
}

// Update user password (admin function)
export async function updateUserPassword(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    return await apiUpdatePassword(email, newPassword);
  } catch {
    return { success: false, error: 'حدث خطأ في الاتصال' };
  }
}

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession));
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiLogin(email, password);

      if (!result.success) {
        return { success: false, error: result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }

      setUser(result.user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      return { success: true };
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  const logout = async () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
