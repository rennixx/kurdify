import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../api/supabase';

type User = any;

type AuthContextValue = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // placeholder: check session
    // supabase.auth.getSession() ...
  }, []);

  async function signIn(email: string, password: string) {
    // placeholder implementation
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setUser({ email });
  }

  async function signOut() {
    // await supabase.auth.signOut();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
