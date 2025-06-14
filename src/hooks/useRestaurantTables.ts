
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantTable, RestaurantRoom } from '@/types/reservation';
import { useToast } from '@/hooks/use-toast';

export const useRestaurantTables = (restaurantId: string) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [rooms, setRooms] = useState<RestaurantRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTablesAndRooms = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('restaurant_rooms')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (roomsError) throw roomsError;

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (tablesError) throw tablesError;

      setRooms(roomsData || []);
      setTables(tablesData || []);
    } catch (err) {
      console.error('Error fetching tables and rooms:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento tavoli e sale');
      toast({
        title: "Errore",
        description: "Impossibile caricare tavoli e sale",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndRooms();
  }, [restaurantId]);

  return {
    tables,
    rooms,
    loading,
    error,
    refetch: fetchTablesAndRooms
  };
};
