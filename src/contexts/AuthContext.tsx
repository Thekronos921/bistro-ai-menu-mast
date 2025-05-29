
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  vat_number?: string;
  seats_count?: number;
  subscription_status: string;
}

interface UserProfile {
  id: string;
  restaurant_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  email_verified_at?: string;
  last_login_at?: string;
  restaurant?: Restaurant;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  register: (restaurantData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  restaurantName: string;
  restaurantType: string;
  country: string;
  city: string;
  vatNumber?: string;
  seatsCount?: number;
  fullName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile data
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          await fetchUserProfile(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Update last login
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      toast({
        title: "Login effettuato",
        description: "Benvenuto nella tua dashboard!",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setSession(null);
      toast({
        title: "Logout effettuato",
        description: "Sei stato disconnesso con successo.",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Errore durante la creazione dell\'account' };
      }

      // Create restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: data.restaurantName,
          type: data.restaurantType,
          country: data.country,
          city: data.city,
          vat_number: data.vatNumber,
          seats_count: data.seatsCount,
          owner_user_id: authData.user.id
        })
        .select()
        .single();

      if (restaurantError) {
        // Cleanup: delete the auth user if restaurant creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: 'Errore durante la creazione del ristorante' };
      }

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          restaurant_id: restaurantData.id,
          full_name: data.fullName,
          email: data.email,
          password_hash: '', // This will be handled by Supabase Auth
          role: 'owner'
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
        // Note: We don't return error here as the main auth user was created successfully
      }

      toast({
        title: "Registrazione completata",
        description: "Account creato con successo! Controlla la tua email per verificare l'account.",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast({
        title: "Email inviata",
        description: "Controlla la tua email per le istruzioni per reimpostare la password.",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast({
        title: "Password aggiornata",
        description: "La tua password è stata cambiata con successo.",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signOut,
    register,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
