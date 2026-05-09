import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { AuthContextType, Profile, SignUpParams, SignInParams, User } from '@/types/auth';
import { api, setAccessToken } from '@/lib/api';
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
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** Decode JWT exp and schedule a silent refresh 60 s before expiry.
   *  Falls back to a safe 14-minute interval on decode failure. */
  const scheduleTokenRefresh = useCallback((accessToken: string) => {
    const FALLBACK_MS = 14 * 60 * 1000; // 14 minutes
    let delayMs = FALLBACK_MS;

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const msUntilExpiry = payload.exp * 1000 - Date.now() - 60_000;
      if (msUntilExpiry > 0) delayMs = msUntilExpiry;
    } catch {
      console.warn('Failed to decode JWT exp — using fallback refresh interval');
    }

    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => refreshToken(), delayMs);
  }, []);

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

  const refreshToken = useCallback(async () => {
    try {
      const data = await api.post<AuthResponse>('/auth/refresh');
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        setToken(data.accessToken);
        if (data.user) setUser(data.user);

        scheduleTokenRefresh(data.accessToken);
      }
    } catch (error) {
      console.error('Silent refresh failed:', error);
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // useEffect on mount calls api.get('/auth/refresh') NOT '/auth/me'
        const data = await api.post<AuthResponse>('/auth/refresh');
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          setToken(data.accessToken);
          if (data.user) {
            setUser(data.user);
            fetchProfile(data.user.id);
          }

          scheduleTokenRefresh(data.accessToken);
        }
      } catch (error) {
        // If refresh fails (401): setLoadingInitial(false), user stays null
        console.log('No active session found or initial session restoration failed.');
      } finally {
        setLoadingInitial(false);
      }
    };

    initAuth();

    return () => {
      // Clear the timeout on unmount
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [fetchProfile, refreshToken]);

  const signUp = async ({ email, password_1, options }: SignUpParams) => {
    try {
      // signUp calls POST /auth/signup (unchanged)
      const data = await api.post<AuthResponse>('/auth/signup', {
        email,
        password: password_1,
        ...options?.data,
      });

      if (data.accessToken) {
        setAccessToken(data.accessToken);
        setToken(data.accessToken);

        scheduleTokenRefresh(data.accessToken);
      }

      if (data.user) {
        setUser(data.user);
        fetchProfile(data.user.id);
      }

      toast({ title: "Sign Up Successful", description: "Your account has been created." });
      navigate('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign up failed.';
      toast({ title: "Sign Up Failed", description: message, variant: "destructive" });
      throw e;
    }
  };

  const signInWithPassword = async ({ email, password_1 }: SignInParams) => {
    try {
      // signInWithPassword calls POST /auth/login (unchanged)
      const data = await api.post<AuthResponse>('/auth/login', {
        email,
        password: password_1,
      });

      if (data.accessToken) {
        setAccessToken(data.accessToken);
        setToken(data.accessToken);

        scheduleTokenRefresh(data.accessToken);
      }

      if (data.user) {
        setUser(data.user);
        toast({ title: "Sign In Successful", description: `Welcome back, ${data.user.email}!` });
        fetchProfile(data.user.id);
      }

      navigate('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign in failed.';
      toast({ title: "Sign In Failed", description: message, variant: "destructive" });
      throw e;
    }
  };

  const signOut = async () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    try {
      // signOut calls POST /auth/logout
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      // clears in-memory token (setAccessToken(null))
      setAccessToken(null);
      setToken(null);
      setUser(null);
      setProfile(null);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      navigate('/auth');
    }
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
