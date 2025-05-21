
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, Profile, SignUpParams, SignInParams } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          service_category:service_categories (id, name)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({ title: "Error", description: "Failed to fetch profile.", variant: "destructive" });
        setProfile(null);
        return null;
      }
      setProfile(data as Profile);
      return data as Profile;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      setProfile(null);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoadingInitial(false);
      }
    );

    // Check for existing session on initial load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoadingInitial(false);
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password_1, options }: SignUpParams) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password_1,
      options,
    });
    if (error) {
      console.error('Sign up error:', error.message);
      toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
      throw error;
    }
    if (data.user) {
      toast({ title: "Sign Up Successful", description: "Please check your email to verify your account." });
      // The trigger will create the profile. We can fetch it or rely on onAuthStateChange.
      // For now, we'll navigate, and onAuthStateChange should pick up the new user and profile.
      navigate('/'); 
    }
  };

  const signInWithPassword = async ({ email, password_1 }: SignInParams) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password_1,
    });
    if (error) {
      console.error('Sign in error:', error.message);
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
      throw error;
    }
    if (data.user) {
      toast({ title: "Sign In Successful", description: `Welcome back, ${data.user.email}!` });
      navigate('/');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      throw error;
    }
    setProfile(null); // Clear profile on sign out
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
    navigate('/auth');
  };

  const value = {
    user,
    session,
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
