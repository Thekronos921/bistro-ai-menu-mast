
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalculateRequest {
  restaurantId: string;
  periodStart: string;
  periodEnd: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom';
  forceRecalculate?: boolean;
}

interface DishSalesData {
  dishExternalId: string;
  dishName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
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

    console.log('Calculating foodcost sales for:', { restaurantId, periodStart, periodEnd, periodType });

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

    // 1. Recupera le ricevute per il periodo specificato usando receipt_date invece di datetime
    const { data: receipts, error: receiptsError } = await supabase
      .from('cassa_in_cloud_receipts')
      .select('id, receipt_date, restaurant_id')
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

    // 2. Recupera le righe delle ricevute con i prodotti
    const { data: receiptRows, error: rowsError } = await supabase
      .from('cassa_in_cloud_receipt_rows')
      .select('id_product, quantity, total, price, product_description')
      .in('receipt_id', receiptIds)
      .not('id_product', 'is', null);

    if (rowsError) {
      console.error('Error fetching receipt rows:', rowsError);
      throw rowsError;
    }

    console.log(`Found ${receiptRows?.length || 0} receipt rows with products`);

    if (!receiptRows || receiptRows.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [],
          message: 'No product sales found for the specified period'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Aggrega i dati per prodotto
    const salesMap = new Map<string, { quantity: number; revenue: number; productName: string }>();

    for (const row of receiptRows) {
      if (!row.id_product) continue;

      const quantity = Number(row.quantity) || 0;
      const total = Number(row.total) || 0;
      const price = Number(row.price) || 0;
      const revenue = total || (price * quantity);

      const existing = salesMap.get(row.id_product) || { 
        quantity: 0, 
        revenue: 0, 
        productName: row.product_description || `Prodotto ${row.id_product}`
      };
      
      existing.quantity += quantity;
      existing.revenue += revenue;
      
      salesMap.set(row.id_product, existing);
    }

    // 4. Recupera i nomi dei piatti dalla tabella dishes
    const productIds = Array.from(salesMap.keys());
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('external_id, name, id')
      .in('external_id', productIds);

    if (dishesError) {
      console.warn('Error fetching dish names:', dishesError);
    }

    // Crea una mappa per i nomi dei piatti
    const dishNamesMap = new Map<string, { name: string; dishId: string }>();
    if (dishes) {
      dishes.forEach(dish => {
        if (dish.external_id) {
          dishNamesMap.set(dish.external_id, { name: dish.name, dishId: dish.id });
        }
      });
    }

    // 5. Prepara i dati per l'inserimento nella tabella foodcost
    const foodcostData: any[] = [];
    
    salesMap.forEach((sale, productId) => {
      const dishInfo = dishNamesMap.get(productId);
      const averageUnitPrice = sale.quantity > 0 ? sale.revenue / sale.quantity : 0;
      
      foodcostData.push({
        restaurant_id: restaurantId,
        dish_id: dishInfo?.dishId || null,
        dish_external_id: productId,
        dish_name: dishInfo?.name || sale.productName,
        period_start: periodStart,
        period_end: periodEnd,
        period_type: periodType,
        total_quantity_sold: sale.quantity,
        total_revenue: sale.revenue,
        average_unit_price: averageUnitPrice,
      });
    });

    console.log(`Prepared ${foodcostData.length} foodcost records`);

    // 6. Se forceRecalculate è true, elimina i dati esistenti prima di inserire i nuovi
    if (forceRecalculate) {
      const { error: deleteError } = await supabase
        .from('foodcost')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .eq('period_type', periodType);

      if (deleteError) {
        console.error('Error deleting existing data:', deleteError);
        // Non interrompiamo il processo, continuiamo con l'inserimento
      }
    }

    // 7. Inserisci i dati nella tabella foodcost
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: insertedData,
        message: `Successfully calculated sales data for ${foodcostData.length} products`
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
