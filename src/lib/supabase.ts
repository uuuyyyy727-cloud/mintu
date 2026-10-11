import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kvksunfttokewwdyonxl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validates whether the anon key is populated and not an empty placeholder
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey.trim() !== '' && 
  !supabaseAnonKey.includes('your_supabase_anon')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  tier?: 'VIP' | 'Elite' | 'Legend';
  membership_active?: boolean;
  membership_expires_at?: string;
  created_at: string;
}

// Auth Helper Methods
export async function supabaseSignUp(email: string, password: string, name: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured with VITE_SUPABASE_ANON_KEY');
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured with VITE_SUPABASE_ANON_KEY');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function supabaseResetPassword(email: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured with VITE_SUPABASE_ANON_KEY');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function supabaseUpdateProfile(name: string, avatarUrl?: string) {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const updates: Record<string, string> = { name };
  if (avatarUrl) updates.avatar_url = avatarUrl;

  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  if (error) throw error;
  return data.user;
}

export async function getSupabaseProfile(userId: string): Promise<SupabaseProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('Could not fetch Supabase profile:', error.message);
    return null;
  }
  return data;
}
