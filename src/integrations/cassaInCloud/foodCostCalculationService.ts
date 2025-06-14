
import { supabase } from '@/integrations/supabase/client';

export interface FoodCostCalculationParams {
  restaurantId: string;
  periodStart: string;
  periodEnd: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom';
  forceRecalculate?: boolean;
}

export interface FoodCostSalesData {
  id: string;
  restaurant_id: string;
  dish_id: string | null;
  dish_external_id: string;
  dish_name: string;
  period_start: string;
  period_end: string;
  period_type: string;
  total_quantity_sold: number;
  total_revenue: number;
  average_unit_price: number;
  calculation_date: string;
  created_at: string;
  updated_at: string;
}

export interface FoodCostCalculationResponse {
  success: boolean;
  data: FoodCostSalesData[];
  message: string;
  error?: string;
}

/**
 * Calcola i dati di vendita dei piatti per un periodo specificato
 * utilizzando la Edge Function che aggrega i dati dalle ricevute
 */
export async function calculateFoodCostSales(
  params: FoodCostCalculationParams
): Promise<FoodCostCalculationResponse> {
  try {
    console.log('Calling calculate-foodcost-sales function with params:', params);

    const { data, error } = await supabase.functions.invoke('calculate-foodcost-sales', {
      body: params
    });

    if (error) {
      console.error('Error calling calculate-foodcost-sales function:', error);
      throw error;
    }

    console.log('Calculate-foodcost-sales function response:', data);
    return data;

  } catch (error) {
    console.error('Error in calculateFoodCostSales:', error);
    return {
      success: false,
      data: [],
      message: 'Errore nel calcolo dei dati di vendita',
      error: error.message
    };
  }
}

/**
 * Recupera i dati di food cost già calcolati dalla tabella foodcost
 */
export async function getFoodCostSalesData(
  restaurantId: string,
  periodStart?: string,
  periodEnd?: string,
  periodType?: string
): Promise<FoodCostSalesData[]> {
  try {
    let query = supabase
      .from('foodcost')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('total_revenue', { ascending: false });

    if (periodStart) {
      query = query.gte('period_start', periodStart);
    }
    if (periodEnd) {
      query = query.lte('period_end', periodEnd);
    }
    if (periodType) {
      query = query.eq('period_type', periodType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching foodcost sales data:', error);
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('Error in getFoodCostSalesData:', error);
    return [];
  }
}

/**
 * Elimina i dati di food cost per un periodo specificato
 */
export async function deleteFoodCostSalesData(
  restaurantId: string,
  periodStart: string,
  periodEnd: string,
  periodType: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('foodcost')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .eq('period_type', periodType);

    if (error) {
      console.error('Error deleting foodcost sales data:', error);
      throw error;
    }

    return true;

  } catch (error) {
    console.error('Error in deleteFoodCostSalesData:', error);
    return false;
  }
}

/**
 * Utility per convertire TimePeriod in date range e period type
 */
export function convertTimePeriodToParams(
  period: string,
  customDateRange?: { from: Date; to: Date }
): { periodStart: string; periodEnd: string; periodType: 'daily' | 'weekly' | 'monthly' | 'custom' } {
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let periodType: 'daily' | 'weekly' | 'monthly' | 'custom' = 'custom';

  switch (period) {
    case 'today':
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      periodType = 'daily';
      break;
    case 'yesterday':
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59, 999);
      periodType = 'daily';
      break;
    case 'last7days':
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = today;
      periodType = 'weekly';
      break;
    case 'last30days':
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = today;
      periodType = 'monthly';
      break;
    case 'last90days':
      startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      endDate = today;
      periodType = 'monthly';
      break;
    case 'currentMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = today;
      periodType = 'monthly';
      break;
    case 'lastMonth':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      periodType = 'monthly';
      break;
    case 'custom':
      if (customDateRange?.from && customDateRange?.to) {
        startDate = customDateRange.from;
        endDate = customDateRange.to;
      }
      periodType = 'custom';
      break;
    default:
      // Default to last 30 days
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = today;
      periodType = 'monthly';
  }

  return {
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
    periodType
  };
}
