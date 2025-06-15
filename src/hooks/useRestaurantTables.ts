
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantTable, RestaurantRoom } from '@/types/reservation';
import { useToast } from '@/hooks/use-toast';

export const useRestaurantTables = (restaurantId?: string) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [rooms, setRooms] = useState<RestaurantRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRooms = useCallback(async () => {
    if (!restaurantId) return [];

    try {
      const { data, error } = await supabase
        .from('restaurant_rooms')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching rooms:', err);
      throw err;
    }
  }, [restaurantId]);

  const fetchTables = useCallback(async () => {
    if (!restaurantId) return [];

    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select(`
          *,
          restaurant_rooms!left(name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;

      // Aggiungere il nome della sala ai tavoli
      const tablesWithRoomName = (data || []).map(table => ({
        ...table,
        room_name: table.restaurant_rooms?.name || null
      }));

      return tablesWithRoomName;
    } catch (err) {
      console.error('Error fetching tables:', err);
      throw err;
    }
  }, [restaurantId]);

  const fetchData = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [roomsData, tablesData] = await Promise.all([
        fetchRooms(),
        fetchTables()
      ]);

      setRooms(roomsData);
      setTables(tablesData);
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
      toast({
        title: "Errore",
        description: "Impossibile caricare tavoli e sale",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, fetchRooms, fetchTables, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    tables,
    rooms,
    loading,
    error,
    refetch: fetchData
  };
};
