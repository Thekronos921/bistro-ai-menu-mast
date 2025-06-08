import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Definizione globale per Deno nell'ambiente Supabase Edge Functions
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined
    }
    serve: (handler: (req: Request) => Response | Promise<Response>) => void
  }
}

// Funzione serve per Supabase Edge Functions
const serve = Deno.serve

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cn-signature, x-cn-operation',
}

// Interfacce per il payload del webhook
interface CassaInCloudBillItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  productId?: string
  categoryId?: string
}

interface CassaInCloudBill {
  id: string
  salesPointId: string
  closedAt: string
  totalAmount: number
  items: CassaInCloudBillItem[]
  billNumber?: string
  tableNumber?: string
}

interface WebhookPayload {
  bill: CassaInCloudBill
  operation: string
  timestamp: string
}

/**
 * Verifica la firma HMAC-SHA1 del webhook
 */
async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Rimuovi il prefisso "sha1=" se presente
    const cleanSignature = signature.replace(/^sha1=/, '')
    
    // Crea la chiave HMAC
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
    
    // Calcola l'HMAC del payload
    const hmacBuffer = await globalThis.crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payload)
    )
    
    // Converti in hex
    const hmacArray = Array.from(new Uint8Array(hmacBuffer))
    const hmacHex = hmacArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Confronta le firme
    return hmacHex === cleanSignature
  } catch (error) {
    console.error('Errore nella verifica HMAC:', error)
    return false
  }
}

/**
 * Mappa l'ID del punto vendita CassaInCloud al restaurant_id di BistroAI
 */
async function mapSalesPointToRestaurant(
  supabase: any,
  salesPointId: string
): Promise<string | null> {
  try {
    // Cerca nella tabella restaurants un mapping basato su external_id o configurazione
    const { data, error } = await supabase
      .from('restaurants')
      .select('id')
      .eq('cic_sales_point_id', salesPointId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Errore nel mapping punto vendita:', error)
      return null
    }
    
    return data?.id || null
  } catch (error) {
    console.error('Errore nel mapping punto vendita:', error)
    return null
  }
}

/**
 * Mappa un prodotto CassaInCloud a un piatto BistroAI
 */
async function mapProductToDish(
  supabase: any,
  restaurantId: string,
  productId: string,
  productName: string
): Promise<string | null> {
  try {
    // Prima prova con l'external_id
    let { data, error } = await supabase
      .from('dishes')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('external_id', productId)
      .single()
    
    if (data) {
      return data.id
    }
    
    // Se non trovato per external_id, prova con il nome
    ({ data, error } = await supabase
      .from('dishes')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .ilike('name', productName)
      .single())
    
    if (error && error.code !== 'PGRST116') {
      console.error('Errore nel mapping prodotto:', error)
      return null
    }
    
    return data?.id || null
  } catch (error) {
    console.error('Errore nel mapping prodotto:', error)
    return null
  }
}

/**
 * Salva i dati di vendita in modo idempotente
 */
async function saveSalesData(
  supabase: any,
  restaurantId: string,
  bill: CassaInCloudBill
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  
  try {
    // Verifica se il conto è già stato processato
    const { data: existingBill } = await supabase
      .from('cassa_in_cloud_bills_state')
      .select('bill_id')
      .eq('bill_id', bill.id)
      .eq('restaurant_id', restaurantId)
      .single()
    
    if (existingBill) {
      console.log(`Conto ${bill.id} già processato, skip.`)
      return { success: true, errors: [] }
    }
    
    // Crea il record sales_data principale
    const { data: salesData, error: salesError } = await supabase
      .from('sales_data')
      .insert({
        restaurant_id: restaurantId,
        date: bill.closedAt.split('T')[0], // Estrae solo la data
        covers_total: 1, // Assumiamo 1 copertura per conto
        revenue_total: bill.totalAmount,
        day_of_week: new Date(bill.closedAt).getDay(),
        notes: `Importato da CassaInCloud - Conto ${bill.billNumber || bill.id}`
      })
      .select('id')
      .single()
    
    if (salesError) {
        console.error('Errore nel salvataggio sales_data:', salesError)
        const errorMessage = salesError instanceof Error ? salesError.message : String(salesError)
        errors.push(`Errore sales_data: ${errorMessage}`)
        return { success: false, errors }
      }
    
    // Processa ogni item del conto
    const dishSalesData: Array<{
      restaurant_id: string
      sales_data_id: any
      dish_name: string
      quantity_sold: number
      revenue: number
      meal_period: string
    }> = []
    const processedRowIds: string[] = []
    
    for (const item of bill.items) {
      const dishId = await mapProductToDish(
        supabase,
        restaurantId,
        item.productId || item.id,
        item.name
      )
      
      if (dishId) {
        dishSalesData.push({
          restaurant_id: restaurantId,
          sales_data_id: salesData.id,
          dish_name: item.name,
          quantity_sold: item.quantity,
          revenue: item.totalPrice,
          meal_period: getMealPeriod(bill.closedAt)
        })
        processedRowIds.push(item.id)
      } else {
        errors.push(`Prodotto non mappato: ${item.name} (ID: ${item.productId || item.id})`)
      }
    }
    
    // Salva i dati di vendita dei piatti
    if (dishSalesData.length > 0) {
      const { error: dishSalesError } = await supabase
        .from('dish_sales_data')
        .insert(dishSalesData)
      
      if (dishSalesError) {
        console.error('Errore nel salvataggio dish_sales_data:', dishSalesError)
        const errorMessage = dishSalesError instanceof Error ? dishSalesError.message : String(dishSalesError)
        errors.push(`Errore dish_sales_data: ${errorMessage}`)
      }
    }
    
    // Marca il conto come processato
    await supabase
      .from('cassa_in_cloud_bills_state')
      .insert({
        bill_id: bill.id,
        restaurant_id: restaurantId,
        last_updated_at: new Date().toISOString(),
        processed_row_ids: processedRowIds
      })
    
    return { success: true, errors }
    
  } catch (error) {
    console.error('Errore nel salvataggio dati vendita:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, errors: [`Errore generale: ${errorMessage}`] }
  }
}

/**
 * Determina il periodo del pasto basato sull'orario
 */
function getMealPeriod(timestamp: string): string {
  const hour = new Date(timestamp).getHours()
  
  if (hour >= 6 && hour < 15) {
    return 'lunch'
  } else if (hour >= 15 && hour < 23) {
    return 'dinner'
  } else {
    return 'other'
  }
}

/**
 * Trigger per ricalcoli asincroni (placeholder)
 */
async function triggerRecalculations(
  supabase: any,
  restaurantId: string
): Promise<void> {
  try {
    // Qui potresti implementare:
    // 1. Aggiornamento Sales Mix %
    // 2. Ricalcolo classificazione Menu Engineering
    // 3. Aggiornamento KPI aggregati
    
    console.log(`Trigger ricalcoli per ristorante ${restaurantId}`)
    
    // Per ora, loggiamo solo l'evento
    // In futuro, potresti chiamare altre Edge Functions o job asincroni
    
  } catch (error) {
    console.error('Errore nei ricalcoli:', error)
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Solo metodo POST accettato
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Metodo non supportato' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 405 
      }
    )
  }
  
  try {
    // Leggi il payload
    const rawPayload = await req.text()
    
    // Verifica la firma HMAC
    const signature = req.headers.get('x-cn-signature')
    const operation = req.headers.get('x-cn-operation')
    const webhookSecret = Deno.env.get('CASSA_IN_CLOUD_WEBHOOK_SECRET')
    
    if (!signature || !webhookSecret) {
      console.error('Firma o secret mancanti')
      return new Response(
        JSON.stringify({ error: 'Firma non valida' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }
    
    const isValidSignature = await verifyHmacSignature(
      rawPayload,
      signature,
      webhookSecret
    )
    
    if (!isValidSignature) {
      console.error('Firma HMAC non valida')
      return new Response(
        JSON.stringify({ error: 'Firma non valida' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 403 
        }
      )
    }
    
    // Verifica il tipo di operazione
    if (!operation || !operation.includes('BILL')) {
      console.log(`Operazione non gestita: ${operation}`)
      return new Response(
        JSON.stringify({ message: 'Operazione non gestita' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }
    
    // Parsa il payload JSON
    let webhookData: WebhookPayload
    try {
      webhookData = JSON.parse(rawPayload)
    } catch (parseError) {
      console.error('Errore nel parsing JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Payload JSON non valido' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }
    
    // Crea client Supabase con service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Mappa il punto vendita al ristorante
    const restaurantId = await mapSalesPointToRestaurant(
      supabase,
      webhookData.bill.salesPointId
    )
    
    if (!restaurantId) {
      console.error(`Punto vendita non mappato: ${webhookData.bill.salesPointId}`)
      return new Response(
        JSON.stringify({ error: 'Punto vendita non riconosciuto' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }
    
    // Salva i dati di vendita
    const result = await saveSalesData(supabase, restaurantId, webhookData.bill)
    
    if (!result.success) {
      console.error('Errori nel salvataggio:', result.errors)
      return new Response(
        JSON.stringify({ 
          error: 'Errore nel processamento', 
          details: result.errors 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }
    
    // Trigger ricalcoli asincroni
    await triggerRecalculations(supabase, restaurantId)
    
    // Log successo
    console.log(`Webhook processato con successo per conto ${webhookData.bill.id}`)
    
    // Risposta di successo
    return new Response(
      JSON.stringify({ 
        success: true, 
        billId: webhookData.bill.id,
        warnings: result.errors.length > 0 ? result.errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Errore generale nel webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Errore interno del server' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})