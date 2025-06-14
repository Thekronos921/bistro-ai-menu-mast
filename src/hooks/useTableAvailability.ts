
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantTable, TableAvailability } from '@/types/reservation';
import { useToast } from '@/hooks/use-toast';

export const useTableAvailability = (restaurantId: string, selectedDate: string, selectedTime?: string) => {
  const [availability, setAvailability] = useState<TableAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTableAvailability = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all tables for the restaurant
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select(`
          *,
          restaurant_rooms!restaurant_tables_room_id_fkey(name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (tablesError) throw tablesError;

      if (!tablesData) {
        setAvailability([]);
        return;
      }

      // Check for existing reservations on the selected date/time
      let reservationsQuery = supabase
        .from('reservations')
        .select('assigned_table_id, id, reservation_time')
        .eq('restaurant_id', restaurantId)
        .in('status', ['approvata', 'approvata_manualmente', 'approvata_automaticamente'])
        .not('assigned_table_id', 'is', null);

      if (selectedTime) {
        // Check for a specific time slot (2 hours window)
        const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
        const startTime = new Date(selectedDateTime.getTime() - 60 * 60 * 1000); // 1 hour before
        const endTime = new Date(selectedDateTime.getTime() + 60 * 60 * 1000); // 1 hour after
        
        reservationsQuery = reservationsQuery
          .gte('reservation_time', startTime.toISOString())
          .lte('reservation_time', endTime.toISOString());
      } else {
        // Check for the entire day
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        reservationsQuery = reservationsQuery
          .gte('reservation_time', startOfDay.toISOString())
          .lte('reservation_time', endOfDay.toISOString());
      }

      const { data: reservationsData, error: reservationsError } = await reservationsQuery;

      if (reservationsError) throw reservationsError;

      // Create availability map
      const occupiedTables = new Set(
        (reservationsData || []).map(r => r.assigned_table_id).filter(Boolean)
      );

      const tableAvailability: TableAvailability[] = tablesData.map(table => ({
        table_id: table.id,
        table_name: table.name,
        seats: table.seats || 0,
        room_name: table.restaurant_rooms?.name,
        is_available: !occupiedTables.has(table.id),
        current_reservation_id: reservationsData?.find(r => r.assigned_table_id === table.id)?.id
      }));

      setAvailability(tableAvailability);
    } catch (err) {
      console.error('Error fetching table availability:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento disponibilità tavoli');
      toast({
        title: "Errore",
        description: "Impossibile caricare la disponibilità dei tavoli",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableAvailability();
  }, [restaurantId, selectedDate, selectedTime]);

  return {
    availability,
    loading,
    error,
    refetch: fetchTableAvailability
  };
};
