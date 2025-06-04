
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from './useRestaurant';
import { toast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  event_type: string;
  date: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  expected_impact?: string;
  impact_percentage?: number;
  radius_km?: number;
  source?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export const useEventCalendar = () => {
  const { getRestaurantId } = useRestaurant();
  const queryClient = useQueryClient();

  // Fetch events
  const {
    data: events,
    isLoading,
    error
  } = useQuery({
    queryKey: ['calendar-events', getRestaurantId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_events')
        .select('*')
        .eq('restaurant_id', getRestaurantId())
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }
      return data as CalendarEvent[];
    },
    enabled: !!getRestaurantId()
  });

  // Create event
  const createEvent = useMutation({
    mutationFn: async (eventInput: Omit<CalendarEvent, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('local_events')
        .insert({
          ...eventInput,
          restaurant_id: getRestaurantId()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['local-events'] });
      toast({
        title: "Successo",
        description: "Evento creato con successo"
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nella creazione dell'evento",
        variant: "destructive"
      });
      console.error('Error creating event:', error);
    }
  });

  // Update event
  const updateEvent = useMutation({
    mutationFn: async ({ id, ...eventInput }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('local_events')
        .update(eventInput)
        .eq('id', id)
        .eq('restaurant_id', getRestaurantId())
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['local-events'] });
      toast({
        title: "Successo",
        description: "Evento aggiornato con successo"
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dell'evento",
        variant: "destructive"
      });
      console.error('Error updating event:', error);
    }
  });

  // Delete event
  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('local_events')
        .update({ is_active: false })
        .eq('id', eventId)
        .eq('restaurant_id', getRestaurantId());

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['local-events'] });
      toast({
        title: "Successo",
        description: "Evento eliminato con successo"
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione dell'evento",
        variant: "destructive"
      });
      console.error('Error deleting event:', error);
    }
  });

  return {
    events: events || [],
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent
  };
};
