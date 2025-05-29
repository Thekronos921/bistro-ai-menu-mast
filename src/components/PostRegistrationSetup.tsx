
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const handleCreateRestaurant = async () => {
    if (!pendingData || !user) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-restaurant-profile', {
        body: { restaurantData: pendingData }
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

  // Only show this component if user is authenticated but has no profile and has pending data
  if (!user || userProfile || !pendingData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Completa la registrazione</CardTitle>
          <CardDescription>
            Ora che hai verificato la tua email, creiamo il profilo del tuo ristorante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Ristorante:</strong> {(pendingData as any)?.restaurantName}</p>
            <p><strong>Tipo:</strong> {(pendingData as any)?.restaurantType}</p>
            <p><strong>Città:</strong> {(pendingData as any)?.city}</p>
          </div>
          
          <Button 
            onClick={handleCreateRestaurant} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Creazione in corso...' : 'Completa Setup Ristorante'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostRegistrationSetup;
