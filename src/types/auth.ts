import { Session, User } from "@supabase/supabase-js";
import { Profile, ServiceCategory } from "./database";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loadingInitial: boolean;
  loadingProfile: boolean;
  signUp: (params: SignUpParams) => Promise<void>;
  signInWithPassword: (params: SignInParams) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
}

export interface SignUpData {
  email: string;
  password_1: string;
  password_2: string;
  user_type: 'supplier' | 'government_entity';
  full_name: string;
  service_category_id?: string; // For suppliers
  entity_name?: string; // For government entities
}

export interface SignUpParams {
  email: string;
  password_1: string;
  options?: {
    data: {
      user_type: 'supplier' | 'government_entity';
      full_name: string;
      service_category_id?: string;
      entity_name?: string;
    }
  }
}

export interface SignInParams {
  email: string;
  password_1: string;
}

export type { Profile, ServiceCategory };
