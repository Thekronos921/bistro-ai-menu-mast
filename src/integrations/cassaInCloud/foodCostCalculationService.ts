import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export interface FoodCostCalculationParams {
  restaurantId: string;
  forceRecalculate?: boolean;
}

export interface ExternalSaleData {
  id: string;
  restaurant_id: string;
  dish_id: string | null;
  external_product_id: string;
  unmapped_product_description: string | null;
  quantity_sold: number;
  total_amount_sold_for_row: number;
  sale_timestamp: string;
  created_at: string;
}

export interface FoodCostCalculationResponse {
  success: boolean;
  data: ExternalSaleData[];
  message: string;
  error?: string;
}

/**
 * Avvia il calcolo dello storico di tutte le vendite
 * utilizzando una Edge Function.
 */
export async function calculateFoodCostSales(
  params: FoodCostCalculationParams
): Promise<FoodCostCalculationResponse> {
  try {
    console.log('Calling calculate-foodcost-sales (full history) with params:', params);

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
 * Recupera lo storico dettagliato delle vendite dalla tabella external_sales_data
 */
export async function getDetailedSalesData(
  restaurantId: string
): Promise<ExternalSaleData[]> {
  try {
    let query = supabase
      .from('external_sales_data')
      .select('id, restaurant_id, dish_id, external_product_id, unmapped_product_description, quantity_sold, total_amount_sold_for_row, sale_timestamp, created_at')
      .eq('restaurant_id', restaurantId)
      .order('sale_timestamp', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching detailed sales data:', error);
      throw error;
    }

    return (data as ExternalSaleData[]) || [];

  } catch (error) {
    console.error('Error in getDetailedSalesData:', error);
    return [];
  }
}

/**
 * Utility per convertire TimePeriod in date range.
 * Usa 'Europe/Rome' come timezone di riferimento per il ristorante.
 */
export function convertTimePeriodToParams(
  period: string,
  customDateRange?: { from: Date; to: Date }
): { periodStart: string; periodEnd: string; periodType: 'daily' | 'weekly' | 'monthly' | 'custom' | 'all_time' } {
  const timeZone = 'Europe/Rome';
  const now = toZonedTime(new Date(), timeZone);
  
  let startDate: Date;
  let endDate: Date;
  let periodType: 'daily' | 'weekly' | 'monthly' | 'custom' | 'all_time' = 'custom';

  switch (period) {
    case 'today':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      periodType = 'daily';
      break;
    case 'yesterday':
      const yesterday = subDays(now, 1);
      startDate = startOfDay(yesterday);
      endDate = endOfDay(yesterday);
      periodType = 'daily';
      break;
    case 'last7days':
      startDate = startOfDay(subDays(now, 6)); // 6 giorni fa + oggi = 7 giorni
      endDate = endOfDay(now);
      periodType = 'weekly';
      break;
    case 'last30days':
      startDate = startOfDay(subDays(now, 29));
      endDate = endOfDay(now);
      periodType = 'monthly';
      break;
    case 'last90days':
      startDate = startOfDay(subDays(now, 89));
      endDate = endOfDay(now);
      periodType = 'monthly';
      break;
    case 'currentMonth':
      startDate = startOfMonth(now);
      endDate = endOfDay(now);
      periodType = 'monthly';
      break;
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      periodType = 'monthly';
      break;
    case 'allTime':
      startDate = new Date('1970-01-01T00:00:00.000Z');
      endDate = new Date('2100-01-01T00:00:00.000Z'); // Data futura per includere tutto
      periodType = 'all_time';
      break;
    case 'custom':
      if (customDateRange?.from && customDateRange?.to) {
        startDate = startOfDay(toZonedTime(customDateRange.from, timeZone));
        endDate = endOfDay(toZonedTime(customDateRange.to, timeZone));
      } else {
        // Fallback per custom senza date
        startDate = startOfDay(subDays(now, 29));
        endDate = endOfDay(now);
      }
      periodType = 'custom';
      break;
    default:
      // Default to last 30 days
      startDate = startOfDay(subDays(now, 29));
      endDate = endOfDay(now);
      periodType = 'monthly';
  }

  return {
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
    periodType
  };
}
