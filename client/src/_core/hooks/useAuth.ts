import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type AppUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'user';
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUser = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      setError(new Error('Supabase Auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.'));
      return;
    }

    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      setUser(null);
      setLoading(false);
      setError(null);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, is_admin')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      setUser(null);
      setLoading(false);
      setError(profileError);
      return;
    }

    setUser({
      id: authData.user.id,
      email: authData.user.email ?? null,
      name: profile?.full_name ?? authData.user.user_metadata?.full_name ?? null,
      role: profile?.is_admin ? 'admin' : 'user',
    });
    setError(null);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase Auth is not configured.');
    }

    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (result.error) throw result.error;
    await loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    const result = await supabase.auth.signOut();
    if (result.error) throw result.error;
    setUser(null);
  }, []);

  useEffect(() => {
    if (!supabase) {
      void loadUser();
      return;
    }

    void loadUser();
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void loadUser(), 0);
    });

    return () => data.subscription.unsubscribe();
  }, [loadUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading || user) return;
    if (typeof window === 'undefined') return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) window.location.href = redirectPath;
  }, [loading, redirectOnUnauthenticated, redirectPath, user]);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    refresh: loadUser,
    login,
    logout,
  };
}
