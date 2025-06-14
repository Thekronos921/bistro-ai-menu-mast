
import { supabase } from '@/integrations/supabase/client';
import { CassaInCloudReceiptRow } from './cassaInCloudTypes';

// Tipo per i dati di vendita aggregati per piatto
export interface DishSaleData {
  dishId: string;
  dishName?: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

// Tipo per i parametri della funzione
interface GetDishSalesParams {
  restaurantId: string;
  startDate?: string; // Reso opzionale per gestire "allTime"
  endDate?: string;   // Reso opzionale per gestire "allTime"
}

/**
 * Calcola la quantità totale di piatti venduti e il fatturato per un dato periodo.
 */
export async function getDishSalesByPeriod(
  { restaurantId, startDate, endDate }: GetDishSalesParams
): Promise<DishSaleData[]> {
  try {
    console.log('Avvio getDishSalesByPeriod con parametri:', { restaurantId, startDate, endDate });

    // 1. Costruire la query per le ricevute con gestione corretta delle date
    let receiptsQuery = supabase
      .from('cassa_in_cloud_receipts')
      .select('id, datetime, external_id, restaurant_id') // Cambiato da receipt_date a datetime
      .eq('restaurant_id', restaurantId);

    // Applicare filtri data solo se forniti
    if (startDate) {
      receiptsQuery = receiptsQuery.gte('datetime', startDate);
    }
    if (endDate) {
      receiptsQuery = receiptsQuery.lte('datetime', endDate);
    }

    const { data: receipts, error: receiptsError } = await receiptsQuery;

    if (receiptsError) {
      console.error('Errore nel recupero delle ricevute:', receiptsError);
      throw new Error(`Errore ricevute: ${receiptsError.message}`);
    }

    console.log('Ricevute trovate:', receipts?.length || 0);

    if (!receipts || receipts.length === 0) {
      console.log('Nessuna ricevuta trovata per il periodo specificato.');
      return [];
    }

    const receiptIds = receipts.map(r => r.id);
    console.log('IDs ricevute da processare:', receiptIds.length);

    // 2. Recuperare le righe delle ricevute con controllo array non vuoto
    if (receiptIds.length === 0) {
      console.log('Nessun ID ricevuta da processare');
      return [];
    }

    const { data: receiptRows, error: rowsError } = await supabase
      .from('cassa_in_cloud_receipt_rows')
      .select('id_product, quantity, total, price')
      .in('receipt_id', receiptIds)
      .not('id_product', 'is', null);

    if (rowsError) {
      console.error('Errore nel recupero delle righe delle ricevute:', rowsError);
      throw new Error(`Errore righe ricevute: ${rowsError.message}`);
    }

    console.log('Righe ricevute trovate:', receiptRows?.length || 0);

    if (!receiptRows || receiptRows.length === 0) {
      console.log('Nessuna riga di prodotto trovata per le ricevute del periodo.');
      return [];
    }

    // 3. Aggregare i dati per id_product con controlli null safety
    const salesMap = new Map<string, { quantity: number; revenue: number }>();

    for (const row of receiptRows) {
      if (!row.id_product) continue; // Skip se id_product è null/undefined

      const existingSale = salesMap.get(row.id_product) || { quantity: 0, revenue: 0 };
      
      // Gestione null safety per quantity e total/price
      const quantity = Number(row.quantity) || 0;
      const total = Number(row.total) || 0;
      const price = Number(row.price) || 0;
      
      existingSale.quantity += quantity;
      // Usa total se disponibile, altrimenti price * quantity
      existingSale.revenue += total || (price * quantity);
      
      salesMap.set(row.id_product, existingSale);
    }

    console.log('Prodotti aggregati:', salesMap.size);

    // 4. Recuperare i nomi dei piatti dalla tabella 'dishes' (non 'dish')
    const productIds = Array.from(salesMap.keys());
    let dishDetailsMap = new Map<string, { name: string }>();

    if (productIds.length > 0) {
      // Prova prima con la tabella 'dishes'
      const { data: dishes, error: dishesError } = await supabase
        .from('dishes')
        .select('external_id, name')
        .in('external_id', productIds);

      if (dishesError) {
        console.warn('Errore nel recupero dei dettagli dei piatti dalla tabella dishes:', dishesError.message);
        
        // Fallback: prova con la tabella 'dish' se esiste
        const { data: dishFallback, error: dishFallbackError } = await supabase
          .from('dish')
          .select('external_id, name')
          .in('external_id', productIds);

        if (!dishFallbackError && dishFallback) {
          dishFallback.forEach(dish => {
            if (dish.external_id) {
              dishDetailsMap.set(dish.external_id, { name: dish.name || 'Nome non disponibile' });
            }
          });
        }
      } else if (dishes) {
        dishes.forEach(dish => {
          if (dish.external_id) {
            dishDetailsMap.set(dish.external_id, { name: dish.name || 'Nome non disponibile' });
          }
        });
      }
    }

    console.log('Dettagli piatti recuperati:', dishDetailsMap.size);

    // 5. Formattare l'output
    const result: DishSaleData[] = [];
    salesMap.forEach((sale, productId) => {
      result.push({
        dishId: productId,
        dishName: dishDetailsMap.get(productId)?.name || `Prodotto ${productId}`,
        totalQuantitySold: sale.quantity,
        totalRevenue: sale.revenue,
      });
    });

    console.log(`Calcolo vendite completato per ristorante ${restaurantId}. Prodotti venduti: ${result.length}`);
    return result;

  } catch (error) {
    console.error('Errore imprevisto in getDishSalesByPeriod:', error);
    // Restituisci array vuoto invece di propagare l'errore per non bloccare l'UI
    return [];
  }
}
