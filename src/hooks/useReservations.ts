import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { useToast } from '@/hooks/use-toast';

export const useReservations = (selectedDate: string, statusFilter?: ReservationStatus) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const fetchReservations = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      setError(null);

      const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`);
      const endOfDay = new Date(`${selectedDate}T23:59:59.999Z`);

      let query = supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', startOfDay.toISOString())
        .lte('reservation_time', endOfDay.toISOString())
        .order('reservation_time', { ascending: true });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReservations(data || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle prenotazioni');
      toast({
        title: "Errore",
        description: "Impossibile caricare le prenotazioni",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === id 
            ? { ...reservation, ...updates }
            : reservation
        )
      );

      toast({
        title: "Successo",
        description: "Prenotazione aggiornata con successo"
      });

      return true;
    } catch (err) {
      console.error('Error updating reservation:', err);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la prenotazione",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedDate, statusFilter, restaurantId]);

  return {
    reservations,
    loading,
    error,
    updateReservation,
    refetch: fetchReservations
  };
};
