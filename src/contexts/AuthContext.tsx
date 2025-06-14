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
  error: string | null;
  retryLoading: () => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Timeout per le operazioni di caricamento (10 secondi)
  const LOADING_TIMEOUT = 10000;
  
  useEffect(() => {
    console.log('AuthProvider: Setting up auth listeners');
    
    // Timeout di sicurezza per evitare caricamenti infiniti
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('AuthProvider: Loading timeout reached, setting loading to false');
        setLoading(false);
        setError('Timeout durante il caricamento. Riprova.');
      }
    }, LOADING_TIMEOUT);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setError(null); // Reset error on auth change
        
        if (session?.user) {
          // Fetch user profile with retry logic
          await fetchUserProfileWithRetry(session.user.id);
        } else {
          setUserProfile(null);
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    );

    // Check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setError('Errore nel recupero della sessione');
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
        
        console.log('Initial session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfileWithRetry(session.user.id);
        } else {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setError('Errore durante l\'inizializzazione');
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const fetchUserProfileWithRetry = async (userId: string, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 secondo
    
    try {
      console.log(`Fetching user profile for: ${userId} (attempt ${retryCount + 1})`);
      
      // Timeout per la singola richiesta (5 secondi)
      const controller = new AbortController();
      const requestTimeout = setTimeout(() => controller.abort(), 5000);
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          restaurant:restaurants!users_restaurant_id_fkey(*)
        `)
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(requestTimeout);

      if (error) {
        throw error;
      }

      console.log('User profile fetched successfully');
      setUserProfile(data);
      setLoading(false);
      setError(null);
    } catch (error: any) {
      console.error(`Error fetching user profile (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < MAX_RETRIES && error.name !== 'AbortError') {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        setTimeout(() => {
          fetchUserProfileWithRetry(userId, retryCount + 1);
        }, RETRY_DELAY);
      } else {
        setError(error.name === 'AbortError' ? 'Timeout nel caricamento del profilo' : 'Errore nel caricamento del profilo');
        setLoading(false);
        
        // Toast di errore solo se non è un timeout
        if (error.name !== 'AbortError') {
          toast({
            title: "Errore di caricamento",
            description: "Problema nel caricamento del profilo utente. Riprova.",
            variant: "destructive"
          });
        }
      }
    }
  };

  // Funzione per ritentare il caricamento manualmente
  const retryLoading = async () => {
    if (user) {
      setLoading(true);
      setError(null);
      await fetchUserProfileWithRetry(user.id);
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

      // Store the registration data temporarily for the user to use later
      // The restaurant and user profile will be created when the user confirms their email
      localStorage.setItem('pendingRegistration', JSON.stringify(data));

      toast({
        title: "Registrazione completata",
        description: "Account creato con successo! Controlla la tua email per verificare l'account e completare la registrazione.",
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
    error,
    retryLoading,
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
