import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from './useRestaurant';
import { toast } from '@/hooks/use-toast';

export interface SalesData {
  id: string;
  date: string;
  day_of_week: number;
  covers_total: number;
  covers_lunch?: number;
  covers_dinner?: number;
  revenue_total?: number;
  revenue_lunch?: number;
  revenue_dinner?: number;
  avg_spending_per_cover?: number;
  weather_condition?: string;
  temperature?: number;
  is_holiday?: boolean;
  special_events?: string[];
  notes?: string;
}

export interface LocalEvent {
  id: string;
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
}

export interface WeatherData {
  id: string;
  date: string;
  is_forecast: boolean;
  condition: string;
  temperature_min?: number;
  temperature_max?: number;
  precipitation_mm?: number;
  humidity_percentage?: number;
  wind_speed_kmh?: number;
}

export interface DemandForecast {
  id: string;
  forecast_date: string;
  generated_at: string;
  predicted_covers: number;
  predicted_covers_lunch?: number;
  predicted_covers_dinner?: number;
  predicted_revenue?: number;
  confidence_percentage: number;
  key_factors?: string[];
  recommended_dishes?: any;
  staff_recommendations?: string;
  inventory_suggestions?: string;
  weather_impact?: string;
  events_impact?: string;
  model_version?: string;
  is_active?: boolean;
}

export const useDemandForecast = () => {
  const { getRestaurantId } = useRestaurant();
  const queryClient = useQueryClient();

  // Fetch demand forecasts
  const {
    data: forecasts,
    isLoading: forecastsLoading,
    error: forecastsError
  } = useQuery({
    queryKey: ['demand-forecasts', getRestaurantId()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demand_forecasts')
        .select('*')
        .eq('restaurant_id', getRestaurantId())
        .eq('is_active', true)
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(14);

      if (error) {
        console.error('Error fetching demand forecasts:', error);
        throw error;
      }
      return data as DemandForecast[];
    },
    enabled: !!getRestaurantId()
  });

  // Fetch sales data for analysis
  const {
    data: salesData,
    isLoading: salesLoading
  } = useQuery({
    queryKey: ['sales-data', getRestaurantId()],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .eq('restaurant_id', getRestaurantId())
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching sales data:', error);
        throw error;
      }
      return data as SalesData[];
    },
    enabled: !!getRestaurantId()
  });

  // Fetch local events - aggiornato per i nuovi campi
  const {
    data: localEvents,
    isLoading: eventsLoading
  } = useQuery({
    queryKey: ['local-events', getRestaurantId()],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('local_events')
        .select('*')
        .eq('restaurant_id', getRestaurantId())
        .eq('is_active', true)
        .gte('date', today)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching local events:', error);
        throw error;
      }
      return data as LocalEvent[];
    },
    enabled: !!getRestaurantId()
  });

  // Fetch weather data
  const {
    data: weatherData,
    isLoading: weatherLoading
  } = useQuery({
    queryKey: ['weather-data', getRestaurantId()],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('weather_data')
        .select('*')
        .eq('restaurant_id', getRestaurantId())
        .gte('date', today)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching weather data:', error);
        throw error;
      }
      return data as WeatherData[];
    },
    enabled: !!getRestaurantId()
  });

  // Create sales data entry
  const createSalesData = useMutation({
    mutationFn: async (salesDataInput: Omit<SalesData, 'id'>) => {
      const { data, error } = await supabase
        .from('sales_data')
        .insert({
          ...salesDataInput,
          restaurant_id: getRestaurantId()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-data'] });
      toast({
        title: "Successo",
        description: "Dati di vendita salvati con successo"
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nel salvare i dati di vendita",
        variant: "destructive"
      });
      console.error('Error creating sales data:', error);
    }
  });

  // Create local event - aggiornato per i nuovi campi
  const createLocalEvent = useMutation({
    mutationFn: async (eventInput: Omit<LocalEvent, 'id'>) => {
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
      queryClient.invalidateQueries({ queryKey: ['local-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: "Successo",
        description: "Evento locale aggiunto con successo"
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nell'aggiungere l'evento locale",
        variant: "destructive"
      });
      console.error('Error creating local event:', error);
    }
  });

  return {
    forecasts: forecasts || [],
    salesData: salesData || [],
    localEvents: localEvents || [],
    weatherData: weatherData || [],
    isLoading: forecastsLoading || salesLoading || eventsLoading || weatherLoading,
    error: forecastsError,
    createSalesData,
    createLocalEvent
  };
};
