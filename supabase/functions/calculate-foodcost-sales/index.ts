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
  periodStart: string;
  periodEnd: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom' | 'all_time';
  forceRecalculate?: boolean;
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
  return price * quantity;
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

    const { restaurantId, periodStart, periodEnd, periodType, forceRecalculate = false }: CalculateRequest = await req.json();

    console.log('Calculating foodcost sales with new rounding logic for:', { restaurantId, periodStart, periodEnd, periodType, forceRecalculate });

    // Verifica se esistono già dati per questo periodo
    if (!forceRecalculate) {
      const { data: existingData, error: existingError } = await supabase
        .from('foodcost')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .eq('period_type', periodType)
        .limit(1);

      if (existingError) {
        console.error('Error checking existing data:', existingError);
      } else if (existingData && existingData.length > 0) {
        console.log('Data already exists for this period, skipping calculation');
        
        // Restituisci i dati esistenti
        const { data: existingFoodcostData, error: fetchError } = await supabase
          .from('foodcost')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .eq('period_type', periodType);

        if (fetchError) {
          throw fetchError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: existingFoodcostData,
            message: 'Data already calculated for this period'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 1. Recupera gli ID delle ricevute per il periodo specificato
    const { data: receipts, error: receiptsError } = await supabase
      .from('cassa_in_cloud_receipts')
      .select('id') // Seleziono solo l'ID, il resto dei dati lo recupero con la join dopo
      .eq('restaurant_id', restaurantId)
      .gte('receipt_date', periodStart)
      .lte('receipt_date', periodEnd);

    if (receiptsError) {
      console.error('Error fetching receipts:', receiptsError);
      throw receiptsError;
    }

    console.log(`Found ${receipts?.length || 0} receipts for the period using receipt_date`);

    if (!receipts || receipts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [],
          message: 'No receipts found for the specified period'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const receiptIds = receipts.map(r => r.id);
    console.log(`Processing ${receiptIds.length} receipt IDs`);

    // 2. Recupera le righe delle ricevute con i prodotti
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
          product_description,
          total_price_gross,
          unit_price_gross,
          amount,
          receipt_id,
          cassa_in_cloud_receipts!inner (
            cic_id,
            datetime,
            receipt_date
          )
        `)
        .in('receipt_id', batchIds)
        .not('id_product', 'is', null);

      if (batchError) {
        console.error('Error fetching receipt rows batch:', batchError);
        throw batchError;
      }

      if (batchRows) {
        allReceiptRows = allReceiptRows.concat(batchRows);
      }
    }

    console.log(`Found ${allReceiptRows.length} receipt rows with products across all batches`);

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

    // 3. Aggrega i dati per prodotto. I calcoli vengono fatti sui valori grezzi per massima precisione.
    console.log('Aggregating sales data. Rounding will be applied only at the final step.');
    const salesMap = new Map<string, { quantity: number; revenue: number; productName: string }>();

    for (const row of allReceiptRows) {
      if (!row.id_product) continue;

      // Usa i valori grezzi, non arrotondati, per i calcoli
      const revenue = getRowRevenue(row); 
      const quantity = Number(row.quantity) || 0;

      const existing = salesMap.get(row.id_product) || { 
        quantity: 0, 
        revenue: 0, 
        productName: row.product_description || `Prodotto ${row.id_product}`
      };
      
      // Somma i valori grezzi senza arrotondare
      existing.quantity += quantity;
      existing.revenue += revenue;
      
      salesMap.set(row.id_product, existing);
    }

    console.log(`Aggregated data for ${salesMap.size} unique products.`);
    // Log di esempio per un prodotto prima dell'arrotondamento
    if (salesMap.size > 0) {
      const firstKey = salesMap.keys().next().value;
      console.log('Sample raw aggregated data before rounding:', salesMap.get(firstKey));
    }

    // 4. Recupera i nomi dei piatti dalla tabella dishes (invariato)
    const productIds = Array.from(salesMap.keys());
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

    // 5. Prepara i dati aggregati per la tabella 'foodcost' APPLICANDO GLI ARROTONDAMENTI FINALI
    const foodcostData: any[] = [];
    salesMap.forEach((sale, productId) => {
      const dishInfo = dishNamesMap.get(productId);

      // Applica gli arrotondamenti qui, una sola volta, prima di salvare.
      const totalRevenue = roundToTwo(sale.revenue);
      const totalQuantity = roundQuantity(sale.quantity);
      const averageUnitPrice = totalQuantity > 0 ? roundToTwo(totalRevenue / totalQuantity) : 0;
      
      foodcostData.push({
        restaurant_id: restaurantId,
        dish_id: dishInfo?.dishId || null,
        dish_external_id: productId,
        dish_name: dishInfo?.name || sale.productName,
        period_start: periodStart,
        period_end: periodEnd,
        period_type: periodType,
        total_quantity_sold: totalQuantity,
        total_revenue: totalRevenue,
        average_unit_price: averageUnitPrice,
      });
    });

    console.log(`Prepared ${foodcostData.length} foodcost records to be inserted/updated.`);

    // 6. Se forceRecalculate è true, elimina i dati esistenti prima di inserire i nuovi
    if (forceRecalculate) {
      console.log('Force recalculate enabled - deleting existing data');
      
      // Elimina da foodcost (aggregati)
      const { error: deleteError } = await supabase
        .from('foodcost')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .eq('period_type', periodType);

      if (deleteError) {
        console.error('Error deleting existing data:', deleteError);
      } else {
        console.log('Successfully deleted existing foodcost data for the period.');
      }

      // Elimina da external_sales_data (storico dettagliato)
      const { error: deleteSalesHistoryError } = await supabase
        .from('external_sales_data')
        .delete()
        .eq('restaurant_id', restaurantId)
        .gte('sale_timestamp', periodStart)
        .lte('sale_timestamp', periodEnd);
      
      if (deleteSalesHistoryError) {
        console.error('Error deleting existing sales history data:', deleteSalesHistoryError);
      } else {
        console.log('Successfully deleted existing sales history data for the period.');
      }
    }

    // 7. Inserisci i dati aggregati nella tabella 'foodcost'
    const { data: insertedData, error: insertError } = await supabase
      .from('foodcost')
      .upsert(foodcostData, { 
        onConflict: 'restaurant_id,dish_external_id,period_start,period_end,period_type',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      console.error('Error inserting foodcost data:', insertError);
      throw insertError;
    }

    console.log(`Successfully inserted/updated ${insertedData?.length || 0} foodcost records`);

    // 8. Prepara e inserisce lo storico dettagliato in 'external_sales_data' con arrotondamenti corretti
    const salesHistoryData: any[] = [];
    for (const row of allReceiptRows) {
        if (!row.id_product) continue;
        
        const receiptInfo = row.cassa_in_cloud_receipts;

        if (!receiptInfo || !receiptInfo.cic_id) {
          console.warn(`Skipping sales history row due to missing receipt external ID (cic_id). Product ID: ${row.id_product}`);
          continue;
        }
        
        // Ottieni i valori grezzi
        const rawRevenue = getRowRevenue(row);
        const rawQuantity = Number(row.quantity) || 0;

        // Arrotonda i valori solo prima dell'inserimento
        const finalRevenue = roundToTwo(rawRevenue);
        const finalQuantity = roundQuantity(rawQuantity);
        const unitPrice = finalQuantity > 0 ? roundToTwo(finalRevenue / finalQuantity) : roundToTwo(Number(row.unit_price_gross) || Number(row.price) || 0);
        const dishInfo = dishNamesMap.get(row.id_product);

        salesHistoryData.push({
            bill_id_external: receiptInfo.cic_id,
            document_row_id_external: row.cic_row_id,
            restaurant_id: restaurantId,
            dish_id: dishInfo?.dishId || null,
            external_product_id: row.id_product,
            unmapped_product_description: row.product_description || `Prodotto ${row.id_product}`,
            quantity_sold: finalQuantity,
            price_per_unit_sold: unitPrice,
            total_amount_sold_for_row: finalRevenue,
            sale_timestamp: receiptInfo.datetime || receiptInfo.receipt_date,
            raw_bill_data: row,
            operator_id_external: null, // Campo da popolare se disponibile
            operator_name: null, // Campo da popolare se disponibile
        });
    }

    if (salesHistoryData.length > 0) {
      console.log(`Preparing to insert ${salesHistoryData.length} sales history records.`);
      const { error: salesHistoryError } = await supabase
        .from('external_sales_data')
        .insert(salesHistoryData); // Uso 'insert' dopo aver pulito con forceRecalculate

      if (salesHistoryError) {
        console.error('Error inserting sales history data:', salesHistoryError);
        // Non bloccante, ma loggo l'errore
      } else {
        console.log(`Successfully inserted ${salesHistoryData.length} sales history records.`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: insertedData,
        message: `Successfully calculated sales data for ${foodcostData.length} products with improved precision`
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
