
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const roundToTwo = (num: number): number => {
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

const roundQuantity = (num: number): number => {
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

interface CalculateRequest {
  restaurantId: string;
  forceRecalculate?: boolean;
  // periodStart, periodEnd, periodType are no longer used but kept for client compatibility
  periodStart?: string;
  periodEnd?: string;
  periodType?: 'daily' | 'weekly' | 'monthly' | 'custom' | 'all_time';
}

interface DishSalesData {
  dishExternalId: string;
  dishName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
}

const getRowRevenue = (row: any): number => {
  const quantity = Number(row.quantity) || 0;
  // Cascata di priorità per il calcolo del ricavo, dal più affidabile al meno.
  if (row.total_price_gross !== null && !isNaN(Number(row.total_price_gross))) {
    return Number(row.total_price_gross);
  }
  if (row.total !== null && !isNaN(Number(row.total))) {
    return Number(row.total);
  }
  if (row.amount !== null && !isNaN(Number(row.amount))) {
    return Number(row.amount);
  }
  
  // Ultima risorsa: calcolo manuale.
  const price = Number(row.price) || 0;
  const variation = Number(row.variation) || 0;
  return (price * quantity) + variation;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { restaurantId, forceRecalculate = false }: CalculateRequest = await req.json();

    console.log('Calculating full sales history for restaurant:', { restaurantId, forceRecalculate });

    // Se forceRecalculate è true, puliamo prima i dati di vendita dettagliati esistenti.
    if (forceRecalculate) {
      console.log('Force recalculate enabled - deleting existing detailed sales data');
      
      const { error: deleteSalesHistoryError } = await supabase
        .from('external_sales_data')
        .delete()
        .eq('restaurant_id', restaurantId);
      
      if (deleteSalesHistoryError) {
        console.error('Error deleting existing sales history data:', deleteSalesHistoryError);
        // Non blocchiamo, ma è un problema serio
      } else {
        console.log('Successfully deleted existing sales history data for the restaurant.');
      }
    } else {
      // Potremmo aggiungere una logica per non ricalcolare se non è forzato,
      // ma per ora il calcolo è l'unica via per aggiornare.
      console.log('Proceeding with calculation (non-forced). Data will be added/updated.');
    }

    // 1. Recupera TUTTI gli ID delle ricevute per il ristorante
    const { data: receipts, error: receiptsError } = await supabase
      .from('cassa_in_cloud_receipts')
      .select('id')
      .eq('restaurant_id', restaurantId);

    if (receiptsError) {
      console.error('Error fetching receipts:', receiptsError);
      throw receiptsError;
    }

    console.log(`Found ${receipts?.length || 0} total receipts for the restaurant.`);

    if (!receipts || receipts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [],
          message: 'No receipts found for this restaurant'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const receiptIds = receipts.map(r => r.id);
    console.log(`Processing ${receiptIds.length} receipt IDs`);

    // 2. Recupera le righe delle ricevute con i prodotti E LE VARIAZIONI
    let allReceiptRows: any[] = [];
    const batchSize = 100;
    
    for (let i = 0; i < receiptIds.length; i += batchSize) {
      const batchIds = receiptIds.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(receiptIds.length/batchSize)} with ${batchIds.length} receipts`);
      
      const { data: batchRows, error: batchError } = await supabase
        .from('cassa_in_cloud_receipt_rows')
        .select(`
          cic_row_id,
          id_product,
          quantity,
          total,
          price,
          variation,
          product_description,
          description,
          total_price_gross,
          unit_price_gross,
          amount,
          receipt_id,
          cassa_in_cloud_receipts!inner (
            id,
            external_id,
            receipt_date
          )
        `)
        .in('receipt_id', batchIds);
        // REMOVED: .not('id_product', 'is', null) to include discounts and other variations.

      if (batchError) {
        console.error('Error fetching receipt rows batch:', batchError);
        throw batchError;
      }

      if (batchRows) {
        allReceiptRows = allReceiptRows.concat(batchRows);
      }
    }

    console.log(`Found ${allReceiptRows.length} total receipt rows (including variations) across all batches`);

    if (allReceiptRows.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [],
          message: 'No product sales found for the specified period'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Rimuoviamo la vecchia aggregazione per la tabella 'foodcost'.
    // Ci concentriamo solo su 'external_sales_data'.

    // 4. Recupera i nomi dei piatti dalla tabella dishes (invariato)
    const productIds = Array.from(new Set(allReceiptRows.map(r => r.id_product).filter(Boolean)));
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('external_id, name, id')
      .in('external_id', productIds);

    if (dishesError) {
      console.warn('Error fetching dish names:', dishesError);
    }

    const dishNamesMap = new Map<string, { name: string; dishId: string }>();
    if (dishes) {
      dishes.forEach(dish => {
        if (dish.external_id) {
          dishNamesMap.set(dish.external_id, { name: dish.name, dishId: dish.id });
        }
      });
    }

    // 5. Rimuoviamo la preparazione per la tabella 'foodcost'.

    // 6. Rimuoviamo la cancellazione da 'foodcost' su forceRecalculate (già fatto sopra).

    // 7. Rimuoviamo l'inserimento nella tabella 'foodcost'.

    // 8. Prepara e inserisce lo storico dettagliato in 'external_sales_data' con arrotondamenti corretti
    const salesHistoryData: any[] = [];
    for (const row of allReceiptRows) {
        const receiptInfo = row.cassa_in_cloud_receipts;

        if (!receiptInfo || !receiptInfo.external_id) {
          console.warn(`Skipping sales history row due to missing receipt external ID. Row ID: ${row.cic_row_id}, Internal Receipt ID: ${row.receipt_id}`);
          continue;
        }

        if (!receiptInfo.receipt_date) {
            console.warn(`Skipping sales history row due to missing receipt_date. Row ID: ${row.cic_row_id}, Receipt External ID: ${receiptInfo.external_id}`);
            continue;
        }
        
        // Calcola il ricavo per la riga
        const rawRevenue = getRowRevenue(row);

        // Salta le righe non-prodotto che non hanno valore monetario
        if (!row.id_product && rawRevenue === 0) {
          console.log(`Skipping zero-value non-product row: ${row.cic_row_id}`);
          continue;
        }
        
        // Arrotonda i valori solo prima dell'inserimento
        const finalRevenue = roundToTwo(rawRevenue);
        const rawQuantity = Number(row.quantity) || 0;
        const finalQuantity = roundQuantity(rawQuantity);
        const unitPrice = finalQuantity > 0 ? roundToTwo(finalRevenue / finalQuantity) : roundToTwo(Number(row.unit_price_gross) || Number(row.price) || 0);
        const dishInfo = row.id_product ? dishNamesMap.get(row.id_product) : undefined;

        salesHistoryData.push({
            receipt_id: receiptInfo.id, // Aggiunta FK alla ricevuta
            bill_id_external: receiptInfo.external_id,
            document_row_id_external: row.cic_row_id,
            restaurant_id: restaurantId,
            dish_id: dishInfo?.dishId || null,
            external_product_id: row.id_product || null,
            unmapped_product_description: dishInfo?.name || row.product_description || row.description || `Riga ${row.cic_row_id}`,
            quantity_sold: finalQuantity,
            price_per_unit_sold: unitPrice,
            total_amount_sold_for_row: finalRevenue,
            sale_timestamp: receiptInfo.receipt_date,
            raw_bill_data: row,
            operator_id_external: null, // Campo da popolare se disponibile
            operator_name: null, // Campo da popolare se disponibile
        });
    }

    let insertedData: any[] = [];

    if (salesHistoryData.length > 0) {
      console.log(`Preparing to upsert ${salesHistoryData.length} sales history records.`);
      // Usiamo upsert per gestire sia i nuovi calcoli che gli aggiornamenti
      const { data, error: salesHistoryError } = await supabase
        .from('external_sales_data')
        .upsert(salesHistoryData, { 
          onConflict: 'restaurant_id,document_row_id_external',
          ignoreDuplicates: false
        })
        .select();

      if (salesHistoryError) {
        console.error('Error upserting sales history data:', salesHistoryError);
        throw salesHistoryError;
      } else {
        console.log(`Successfully upserted ${data?.length || 0} sales history records.`);
        insertedData = data || [];
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: insertedData,
        message: `Successfully calculated sales history. ${insertedData.length} records processed.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-foodcost-sales function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
