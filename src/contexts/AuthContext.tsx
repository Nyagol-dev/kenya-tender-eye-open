import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { AuthContextType, Profile, SignUpParams, SignInParams, User } from '@/types/auth';
import { api, setAccessToken, getTokenExpiry } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthResponse {
  accessToken: string;
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

  // Ref for the silent-refresh timer so we can clear it on unmount / token change
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /**
   * Call POST /auth/refresh. The HttpOnly cookie is sent automatically.
   * Returns the new access token and user, or null if the refresh failed.
   */
  const performRefresh = useCallback(async (): Promise<AuthResponse | null> => {
    try {
      const data = await api.post<AuthResponse>('/auth/refresh');
      return data;
    } catch {
      return null;
    }
  }, []);

  /**
   * Store the access token in memory and schedule the next silent refresh.
   */
  const applyToken = useCallback((accessToken: string) => {
    setAccessToken(accessToken);
    setToken(accessToken);

    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Schedule silent refresh ~1 minute before the token expires
    const exp = getTokenExpiry(accessToken);
    if (exp) {
      const nowSec = Math.floor(Date.now() / 1000);
      const delayMs = Math.max((exp - nowSec - 60) * 1000, 0);

      refreshTimerRef.current = setTimeout(async () => {
        const result = await performRefresh();
        if (result?.accessToken) {
          applyToken(result.accessToken);
          if (result.user) setUser(result.user);
        } else {
          // Refresh failed — session expired
          setAccessToken(null);
          setToken(null);
          setUser(null);
          setProfile(null);
        }
      }, delayMs);
    }
  }, [performRefresh]);

  // On mount, try to restore the session via the refresh-token cookie.
  // POST /auth/refresh sends the HttpOnly cookie automatically; if valid
  // the server returns a new accessToken + user.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await performRefresh();
        if (data?.accessToken) {
          applyToken(data.accessToken);
          if (data.user) {
            setUser(data.user);
            fetchProfile(data.user.id);
          }
        } else {
          // No valid session — user needs to log in.
          setUser(null);
          setToken(null);
          setProfile(null);
        }
      } catch {
        setUser(null);
        setToken(null);
        setProfile(null);
      } finally {
        setLoadingInitial(false);
      }
    };

    restoreSession();

    // Cleanup: clear the silent-refresh timer when the provider unmounts
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async ({ email, password_1, options }: SignUpParams) => {
    try {
      const data = await api.post<AuthResponse>('/auth/signup', {
        email,
        password: password_1,
        ...options?.data,
      });

      if (data.accessToken) {
        applyToken(data.accessToken);
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

      if (data.accessToken) {
        applyToken(data.accessToken);
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
    // Clear the silent-refresh timer immediately
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

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
