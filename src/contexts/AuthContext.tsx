import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AuthContextType, Profile, SignUpParams, SignInParams, User } from '@/types/auth';
import { api, setAccessToken, getAccessToken } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthResponse {
  token: string;
  user: User;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    setLoadingProfile(true);
    try {
      const data = await api.get<Profile>(`/profiles/${userId}`);
      setProfile(data);
      return data;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch profile.';
      console.error('Error fetching profile:', message);
      toast({ title: "Error", description: message, variant: "destructive" });
      setProfile(null);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  }, [toast]);

  // On mount, try to restore the session from a refresh-token cookie or
  // a previously stored JWT (e.g. kept in memory across hot-reloads).
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // If the backend issues HttpOnly refresh-token cookies, calling
        // /auth/me with credentials: "include" will return the current
        // user without the client ever touching the token.
        const data = await api.get<AuthResponse>('/auth/me');
        if (data?.token) {
          setAccessToken(data.token);
          setToken(data.token);
        }
        if (data?.user) {
          setUser(data.user);
          fetchProfile(data.user.id);
        }
      } catch {
        // No valid session — user needs to log in.
        setUser(null);
        setToken(null);
        setProfile(null);
      } finally {
        setLoadingInitial(false);
      }
    };

    restoreSession();
  }, [fetchProfile]);

  const signUp = async ({ email, password_1, options }: SignUpParams) => {
    try {
      const data = await api.post<AuthResponse>('/auth/signup', {
        email,
        password: password_1,
        ...options?.data,
      });

      if (data.token) {
        setAccessToken(data.token);
        setToken(data.token);
      }
      if (data.user) {
        setUser(data.user);
        fetchProfile(data.user.id);
      }

      toast({ title: "Sign Up Successful", description: "Your account has been created." });
      navigate('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign up failed.';
      console.error('Sign up error:', message);
      toast({ title: "Sign Up Failed", description: message, variant: "destructive" });
      throw e;
    }
  };

  const signInWithPassword = async ({ email, password_1 }: SignInParams) => {
    try {
      const data = await api.post<AuthResponse>('/auth/login', {
        email,
        password: password_1,
      });

      if (data.token) {
        setAccessToken(data.token);
        setToken(data.token);
      }
      if (data.user) {
        setUser(data.user);
        toast({ title: "Sign In Successful", description: `Welcome back, ${data.user.email}!` });
        fetchProfile(data.user.id);
      }

      navigate('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign in failed.';
      console.error('Sign in error:', message);
      toast({ title: "Sign In Failed", description: message, variant: "destructive" });
      throw e;
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails, clear local state.
    }
    setAccessToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
    navigate('/auth');
  };

  const value: AuthContextType = {
    user,
    token,
    profile,
    loadingInitial,
    loadingProfile,
    signUp,
    signInWithPassword,
    signOut,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
