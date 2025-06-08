/**
 * Servizio per gestire i webhook di CassaInCloud
 * Questo servizio fornisce utilità per testare e monitorare i webhook
 */

import { supabase } from '@/integrations/supabase/client';

// Interfacce per i webhook
export interface CassaInCloudBillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId?: string;
  categoryId?: string;
}

export interface CassaInCloudBill {
  id: string;
  salesPointId: string;
  closedAt: string;
  totalAmount: number;
  items: CassaInCloudBillItem[];
  billNumber?: string;
  tableNumber?: string;
}

export interface WebhookPayload {
  bill: CassaInCloudBill;
  operation: string;
  timestamp: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  billId?: string;
  errors?: string[];
  warnings?: string[];
  processedAt: string;
}

/**
 * Verifica lo stato di processamento di un conto
 */
export async function checkBillProcessingStatus(
  billId: string,
  restaurantId: string
): Promise<{ processed: boolean; lastUpdated?: string; errors?: string }> {
  try {
    const { data, error } = await supabase
      .from('cassa_in_cloud_bills_state')
      .select('bill_id, last_updated_at, processed_row_ids')
      .eq('bill_id', billId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { processed: false, errors: error.message };
    }

    return {
      processed: !!data,
      lastUpdated: data?.last_updated_at || undefined
    };
  } catch (error) {
    return {
      processed: false,
      errors: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Recupera i dati di vendita per un periodo specifico
 */
export async function getSalesDataByPeriod(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<{
  salesData: any[];
  dishSalesData: any[];
  totalRevenue: number;
  totalCovers: number;
  error?: string;
}> {
  try {
    // Recupera i dati di vendita principali
    const { data: salesData, error: salesError } = await supabase
      .from('sales_data')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (salesError) {
      return {
        salesData: [],
        dishSalesData: [],
        totalRevenue: 0,
        totalCovers: 0,
        error: salesError.message
      };
    }

    // Recupera i dati di vendita dei piatti
    const { data: dishSalesData, error: dishError } = await supabase
      .from('dish_sales_data')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: true });

    if (dishError) {
      console.warn('Errore nel recupero dish_sales_data:', dishError);
    }

    // Calcola totali
    const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.revenue_total || 0), 0) || 0;
    const totalCovers = salesData?.reduce((sum, sale) => sum + (sale.covers_total || 0), 0) || 0;

    return {
      salesData: salesData || [],
      dishSalesData: dishSalesData || [],
      totalRevenue,
      totalCovers
    };
  } catch (error) {
    return {
      salesData: [],
      dishSalesData: [],
      totalRevenue: 0,
      totalCovers: 0,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Recupera le statistiche sui webhook processati
 */
export async function getWebhookStats(
  restaurantId: string,
  days: number = 30
): Promise<{
  totalBills: number;
  successfulBills: number;
  lastProcessedAt?: string;
  averageItemsPerBill: number;
  error?: string;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Conta i conti processati
    const { data: billsData, error: billsError } = await supabase
      .from('cassa_in_cloud_bills_state')
      .select('bill_id, last_updated_at, processed_row_ids')
      .eq('restaurant_id', restaurantId)
      .gte('last_updated_at', startDateStr)
      .order('last_updated_at', { ascending: false });

    if (billsError) {
      return {
        totalBills: 0,
        successfulBills: 0,
        averageItemsPerBill: 0,
        error: billsError.message
      };
    }

    const totalBills = billsData?.length || 0;
    const successfulBills = billsData?.filter(bill => bill.processed_row_ids && 
      Array.isArray(bill.processed_row_ids) && 
      bill.processed_row_ids.length > 0).length || 0;
    
    const lastProcessedAt = billsData?.[0]?.last_updated_at;
    
    // Calcola media items per conto
    const totalItems = billsData?.reduce((sum, bill) => {
      const items = bill.processed_row_ids;
      return sum + (Array.isArray(items) ? items.length : 0);
    }, 0) || 0;
    
    const averageItemsPerBill = totalBills > 0 ? totalItems / totalBills : 0;

    return {
      totalBills,
      successfulBills,
      lastProcessedAt,
      averageItemsPerBill: Math.round(averageItemsPerBill * 100) / 100
    };
  } catch (error) {
    return {
      totalBills: 0,
      successfulBills: 0,
      averageItemsPerBill: 0,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Simula un webhook per test (solo in ambiente di sviluppo)
 */
export async function simulateWebhook(
  restaurantId: string,
  mockBill: CassaInCloudBill
): Promise<WebhookProcessingResult> {
  try {
    // Verifica che siamo in ambiente di sviluppo
    if (import.meta.env.PROD) {
      throw new Error('Simulazione webhook disponibile solo in sviluppo');
    }

    const webhookPayload: WebhookPayload = {
      bill: mockBill,
      operation: 'BILL/UPDATE',
      timestamp: new Date().toISOString()
    };

    // Chiama l'endpoint webhook locale
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cassa-in-cloud-webhook`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cn-operation': 'BILL/UPDATE',
        'x-cn-signature': 'sha1=test_signature', // In produzione, calcolare la firma reale
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.json();

    return {
      success: response.ok,
      billId: result.billId,
      errors: result.error ? [result.error] : undefined,
      warnings: result.warnings,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Errore sconosciuto'],
      processedAt: new Date().toISOString()
    };
  }
}

/**
 * Recupera i prodotti non mappati per un ristorante
 */
export async function getUnmappedProducts(
  restaurantId: string,
  days: number = 7
): Promise<{
  unmappedProducts: Array<{
    productName: string;
    productId?: string;
    occurrences: number;
    lastSeen: string;
  }>;
  error?: string;
}> {
  try {
    // Questa funzione richiederebbe una tabella di log per i prodotti non mappati
    // Per ora, restituiamo un placeholder
    console.warn('getUnmappedProducts: Funzionalità non ancora implementata');
    
    return {
      unmappedProducts: []
    };
  } catch (error) {
    return {
      unmappedProducts: [],
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Configura il mapping tra punto vendita CassaInCloud e ristorante BistroAI
 */
export async function configureSalesPointMapping(
  restaurantId: string,
  salesPointId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('restaurants')
      .update({ cic_sales_point_id: salesPointId })
      .eq('id', restaurantId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Recupera la configurazione del webhook per un ristorante
 */
export async function getWebhookConfiguration(
  restaurantId: string
): Promise<{
  salesPointId?: string;
  webhookUrl: string;
  isConfigured: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('cic_sales_point_id')
      .eq('id', restaurantId)
      .single();

    if (error) {
      return {
        webhookUrl: '',
        isConfigured: false,
        error: error.message
      };
    }

    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cassa-in-cloud-webhook`;
    
    return {
      salesPointId: data?.cic_sales_point_id,
      webhookUrl,
      isConfigured: !!data?.cic_sales_point_id
    };
  } catch (error) {
    return {
      webhookUrl: '',
      isConfigured: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}