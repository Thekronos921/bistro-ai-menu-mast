import { supabase } from '@/integrations/supabase/client';

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
 * Utility per convertire TimePeriod in date range. Rimane utile per il filtering sul client.
 */
export function convertTimePeriodToParams(
  period: string,
  customDateRange?: { from: Date; to: Date }
): { periodStart: string; periodEnd: string; periodType: 'daily' | 'weekly' | 'monthly' | 'custom' | 'all_time' } {
  const today = new Date();
  let startDate = new Date();
  let endDate = new Date();
  let periodType: 'daily' | 'weekly' | 'monthly' | 'custom' | 'all_time' = 'custom';

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
    case 'allTime':
      startDate = new Date('1970-01-01');
      endDate = new Date();
      periodType = 'all_time';
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
