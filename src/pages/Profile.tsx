
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Building2 } from 'lucide-react';
import RestaurantConfigForm from '@/components/RestaurantConfigForm';

const Profile = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRestaurant = async (formData: any) => {
    if (!userProfile?.restaurant_id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: formData.restaurantName,
          type: formData.restaurantType,
          country: formData.country,
          city: formData.city,
          vat_number: formData.vatNumber || null,
          seats_count: formData.seatsCount ? parseInt(formData.seatsCount) : null,
        })
        .eq('id', userProfile.restaurant_id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profilo aggiornato",
        description: "Le informazioni del ristorante sono state aggiornate con successo!",
      });

      // Reload to refresh data
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating restaurant:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento del profilo. Riprova.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">Caricamento profilo...</div>
      </div>
    );
  }

  const initialRestaurantData = userProfile.restaurant ? {
    restaurantName: userProfile.restaurant.name,
    restaurantType: userProfile.restaurant.type,
    country: userProfile.restaurant.country,
    city: userProfile.restaurant.city,
    vatNumber: userProfile.restaurant.vat_number || '',
    seatsCount: userProfile.restaurant.seats_count?.toString() || ''
  } : {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profilo</h1>
        <p className="text-gray-600">Gestisci le informazioni del tuo account e ristorante</p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informazioni Utente
          </CardTitle>
          <CardDescription>
            Informazioni del tuo account personale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome Completo</label>
            <p className="text-gray-900">{userProfile.full_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{userProfile.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Ruolo</label>
            <p className="text-gray-900 capitalize">{userProfile.role}</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Restaurant Information */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Ristorante</h2>
        </div>

        {userProfile.restaurant_id ? (
          <RestaurantConfigForm
            onSubmit={handleUpdateRestaurant}
            initialData={initialRestaurantData}
            isLoading={isUpdating}
            title="Configurazione Ristorante"
            description="Modifica le informazioni del tuo ristorante"
            submitText="Aggiorna Ristorante"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Nessun Ristorante Configurato</CardTitle>
              <CardDescription>
                Non hai ancora configurato un ristorante. Completa la configurazione per iniziare.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
