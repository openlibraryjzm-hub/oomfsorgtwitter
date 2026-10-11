'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface DbProfile {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  banner_url?: string;
  bio?: string;
  website?: string;
  created_at?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: DbProfile | null;
  isLoading: boolean;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signInWithTwitter: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Check active session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithTwitter = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Modern Supabase uses 'x' for X / Twitter (OAuth 2.0)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'x' as any,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.warn('Provider x failed, attempting fallback to twitter:', error);
      await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signInWithTwitter,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
