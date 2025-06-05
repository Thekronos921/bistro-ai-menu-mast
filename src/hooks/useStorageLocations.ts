
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';

export interface StorageLocation {
  id: string;
  restaurant_id: string;
  name: string;
  type: string;
  temperature_min?: number;
  temperature_max?: number;
  capacity_description?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useStorageLocations = () => {
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const fetchStorageLocations = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStorageLocations(data || []);
    } catch (error: any) {
      console.error('Error fetching storage locations:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle posizioni di storage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStorageLocation = async (locationData: Omit<StorageLocation, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!restaurantId) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('storage_locations')
        .insert({
          ...locationData,
          restaurant_id: restaurantId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Posizione creata",
        description: `La posizione "${locationData.name}" è stata creata con successo`
      });

      await fetchStorageLocations();
      return data;
    } catch (error: any) {
      console.error('Error creating storage location:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione della posizione di storage",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStorageLocation = async (id: string, updates: Partial<StorageLocation>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('storage_locations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Posizione aggiornata",
        description: "La posizione è stata aggiornata con successo"
      });

      await fetchStorageLocations();
    } catch (error: any) {
      console.error('Error updating storage location:', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento della posizione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageLocations();
  }, [restaurantId]);

  return {
    storageLocations,
    loading,
    fetchStorageLocations,
    createStorageLocation,
    updateStorageLocation
  };
};
