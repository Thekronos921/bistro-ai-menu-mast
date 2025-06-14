import { supabase } from '@/integrations/supabase/client';
import { CassaInCloudReceiptRow } from './cassaInCloudTypes'; // Modificato per importare CassaInCloudReceiptRow

// Tipo per i dati di vendita aggregati per piatto
export interface DishSaleData {
  dishId: string; // Corrisponde a id_product in CassaInCloudReceiptRow e external_id in Dish
  dishName?: string; // Nome del piatto (da recuperare dalla tabella dish)
  totalQuantitySold: number;
  totalRevenue: number; // Aggiunto per potenziale utilità
  // Potremmo aggiungere altri campi aggregati se necessario (es. averagePrice)
}

// Tipo per i parametri della funzione
interface GetDishSalesParams {
  restaurantId: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate: string;   // Formato YYYY-MM-DD
}

/**
 * Calcola la quantità totale di piatti venduti e il fatturato per un dato periodo.
 * @param params - Oggetto contenente restaurantId, startDate, endDate.
 * @returns Una Promise che risolve in un array di DishSaleData.
 */
export async function getDishSalesByPeriod(
  { restaurantId, startDate, endDate }: GetDishSalesParams
): Promise<DishSaleData[]> {
  try {
    // 1. Recuperare le ricevute per il ristorante e il periodo specificato
    const { data: receipts, error: receiptsError } = await supabase
      .from('cassa_in_cloud_receipts')
      .select('id, receipt_date, external_id, restaurant_id') // Seleziona solo i campi necessari, aggiornato a receipt_date
      .eq('restaurant_id', restaurantId)
      .gte('receipt_date', startDate) // Aggiornato a receipt_date
      .lte('receipt_date', endDate); // Aggiornato a receipt_date

    if (receiptsError) {
      console.error('Errore nel recupero delle ricevute:', receiptsError);
      throw receiptsError;
    }

    if (!receipts || receipts.length === 0) {
      console.log('Nessuna ricevuta trovata per il periodo specificato.');
      return [];
    }

    const receiptIds = receipts.map(r => r.id);

    console.log('receiptIds:', receiptIds, Array.isArray(receiptIds), receiptIds.length);

    // 2. Recuperare tutte le righe delle ricevute corrispondenti
    // È importante selezionare solo le colonne necessarie per ottimizzare la query
    const { data: receiptRows, error: rowsError } = await supabase
      .from('cassa_in_cloud_receipt_rows')
      .select('id_product, quantity, total, price') // Aggiunto price per calcolare il revenue se total non è il prezzo unitario * quantità
      .in('receipt_id', receiptIds)
      .not('id_product', 'is', null); // Escludere righe senza un id_product

    if (rowsError) {
      console.error('Errore nel recupero delle righe delle ricevute:', rowsError);
      throw rowsError;
    }

    if (!receiptRows || receiptRows.length === 0) {
      console.log('Nessuna riga di prodotto trovata per le ricevute del periodo.');
      return [];
    }

    // 3. Aggregare i dati per id_product
    const salesMap = new Map<string, { quantity: number; revenue: number }>();

    for (const row of receiptRows) {
      if (row.id_product) {
        const existingSale = salesMap.get(row.id_product) || { quantity: 0, revenue: 0 };
        existingSale.quantity += row.quantity || 0;
        // Assumiamo che 'total' in cassa_in_cloud_receipt_rows sia il totale della riga (prezzo * quantità)
        // Se 'total' non è disponibile o non è affidabile, si potrebbe usare row.price * row.quantity
        existingSale.revenue += row.total || (row.price || 0) * (row.quantity || 0);
        salesMap.set(row.id_product, existingSale);
      }
    }

    // 4. (Opzionale ma raccomandato) Recuperare i nomi dei piatti dalla tabella 'dish'
    // Questo passaggio assume che esista una tabella 'dish' con 'external_id' e 'name'
    const productIds = Array.from(salesMap.keys());
    let dishDetailsMap = new Map<string, { name: string }>();

    if (productIds.length > 0) {
      const { data: dishes, error: dishesError } = await supabase
        .from('dish') // Nome della tabella dei piatti
        .select('external_id, name')
        .in('external_id', productIds);

      if (dishesError) {
        console.warn('Attenzione: Errore nel recupero dei dettagli dei piatti:', dishesError.message);
        // Non bloccare l'esecuzione, ma segnalare il problema
      } else if (dishes) {
        dishes.forEach(dish => {
          if (dish.external_id) {
            dishDetailsMap.set(dish.external_id, { name: dish.name || 'Nome non disponibile' });
          }
        });
      }
    }

    // 5. Formattare l'output
    const result: DishSaleData[] = [];
    salesMap.forEach((sale, productId) => {
      result.push({
        dishId: productId,
        dishName: dishDetailsMap.get(productId)?.name || 'Piatto non trovato',
        totalQuantitySold: sale.quantity,
        totalRevenue: sale.revenue,
      });
    });

    console.log(`Calcolo vendite completato per ristorante ${restaurantId} dal ${startDate} al ${endDate}. Prodotti venduti: ${result.length}`);
    return result;

  } catch (error) {
    console.error('Errore imprevisto in getDishSalesByPeriod:', error);
    // Potrebbe essere utile restituire un errore specifico o un array vuoto con un log
    // a seconda di come si vuole gestire l'errore a livello superiore
    throw error; // O return [];
  }
}

// Esempio di utilizzo (da rimuovere o commentare in produzione)
/*
async function testSalesData() {
  try {
    const sales = await getDishSalesByPeriod({
      restaurantId: 'ID_RISTORANTE_ESEMPIO', // Sostituire con un ID valido
      startDate: '2023-01-01',
      endDate: '2023-01-31',
    });
    console.log('Dati di vendita:', sales);
  } catch (e) {
    console.error('Errore nel test:', e);
  }
}

testSalesData();
*/