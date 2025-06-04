
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RestaurantConfigForm from './RestaurantConfigForm';

const PostRegistrationSetup = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  useEffect(() => {
    // Check if there's pending registration data
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    if (pendingRegistration) {
      setPendingData(JSON.parse(pendingRegistration));
    }
  }, []);

  const handleCreateRestaurant = async (formData: any) => {
    if (!user) return;

    setIsCreating(true);
    try {
      const restaurantData = {
        restaurantName: formData.restaurantName,
        restaurantType: formData.restaurantType,
        country: formData.country,
        city: formData.city,
        vatNumber: formData.vatNumber || undefined,
        seatsCount: formData.seatsCount ? parseInt(formData.seatsCount) : undefined,
      };

      const { data, error } = await supabase.functions.invoke('create-restaurant-profile', {
        body: { restaurantData }
      });

      if (error) {
        throw error;
      }

      // Clear pending data
      localStorage.removeItem('pendingRegistration');
      
      toast({
        title: "Setup completato",
        description: "Il tuo ristorante è stato creato con successo!",
      });

      // Reload the page to refresh user profile
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast({
        title: "Errore",
        description: "Errore durante la creazione del ristorante. Riprova.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Only show this component if user is authenticated but has no restaurant
  if (!user || (userProfile && userProfile.restaurant_id)) {
    return null;
  }

  // Show loading if we're still checking for user profile
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const initialData = pendingData ? {
    restaurantName: (pendingData as any)?.restaurantName || '',
    restaurantType: (pendingData as any)?.restaurantType || '',
    country: (pendingData as any)?.country || '',
    city: (pendingData as any)?.city || '',
    vatNumber: (pendingData as any)?.vatNumber || '',
    seatsCount: (pendingData as any)?.seatsCount?.toString() || ''
  } : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <RestaurantConfigForm
        onSubmit={handleCreateRestaurant}
        initialData={initialData}
        isLoading={isCreating}
        title="Completa la registrazione"
        description="Ora che hai verificato la tua email, creiamo il profilo del tuo ristorante."
        submitText="Completa Setup Ristorante"
      />
    </div>
  );
};

export default PostRegistrationSetup;
