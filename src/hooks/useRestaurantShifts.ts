// src/hooks/useRestaurantShifts.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Assicurati che il percorso sia corretto
import { useToast } from './use-toast'; // O il tuo sistema di notifiche preferito

export interface RestaurantShift {
  id?: string;
  restaurant_id: string;
  shift_name: string;
  start_time: string; // Formato HH:MM:SS
  end_time: string;   // Formato HH:MM:SS
  days_active: number[]; // Array di interi (0=Domenica, 1=Lunedì, ..., 6=Sabato)
  created_at?: string;
  updated_at?: string;
}

export const useRestaurantShifts = (restaurantId: string | undefined) => {
  const [shifts, setShifts] = useState<RestaurantShift[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchShifts = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_shifts')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setShifts(data || []);
    } catch (error: any) {
      toast({
        title: 'Errore nel caricamento dei turni',
        description: error.message,
        variant: 'destructive',
      });
      setShifts([]);
    }
    setLoading(false);
  }, [restaurantId, toast]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const addShift = async (newShift: Omit<RestaurantShift, 'id' | 'created_at' | 'updated_at' | 'restaurant_id'>) => {
    if (!restaurantId) {
        toast({
            title: 'Errore',
            description: 'ID Ristorante non specificato.',
            variant: 'destructive',
        });
        return null;
    }
    setLoading(true);
    try {
      const shiftToInsert = { ...newShift, restaurant_id: restaurantId };
      const { data, error } = await supabase
        .from('restaurant_shifts')
        .insert(shiftToInsert)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setShifts(prevShifts => [...prevShifts, data]);
        toast({
          title: 'Successo',
          description: 'Turno aggiunto con successo.',
        });
        return data;
      }
      return null;
    } catch (error: any) {
      toast({
        title: 'Errore nell\'aggiunta del turno',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateShift = async (shiftId: string, updatedFields: Partial<RestaurantShift>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_shifts')
        .update(updatedFields)
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setShifts(prevShifts => 
          prevShifts.map(s => s.id === shiftId ? data : s)
        );
        toast({
          title: 'Successo',
          description: 'Turno aggiornato con successo.',
        });
        return data;
      }
      return null;
    } catch (error: any) {
      toast({
        title: 'Errore nell\'aggiornamento del turno',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteShift = async (shiftId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurant_shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      setShifts(prevShifts => prevShifts.filter(s => s.id !== shiftId));
      toast({
        title: 'Successo',
        description: 'Turno eliminato con successo.',
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Errore nell\'eliminazione del turno',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { shifts, loading, fetchShifts, addShift, updateShift, deleteShift };
};