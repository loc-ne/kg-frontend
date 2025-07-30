// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
  try {
    let response = await fetch('http://localhost:4001/api/auth/me', {
      credentials: 'include'
    });

    if (response.status === 401) {
      // Token hết hạn, thử refresh
      await fetch('http://localhost:4001/api/auth/refresh_token', {
        method: 'POST',
        credentials: 'include'
      });
      // Sau khi refresh, thử lại /me
      response = await fetch('http://localhost:4001/api/auth/me', {
        credentials: 'include'
      });
    }

    const data = await response.json();
    if (data.success) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  } catch (error) {
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};