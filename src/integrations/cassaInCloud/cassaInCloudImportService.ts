// Vecchio import:
// import { supabase } from '@/integrations/supabase/supabaseClient'; 

// Nuovo import corretto:
import { supabase } from '@/integrations/supabase/client'; // Assicurati che il percorso sia corretto
import {
  getCategories,
  getProducts,
  getSoldByProductReport,
  getCustomers, // Aggiunto
  getReceipts, // Aggiunto per ricevute
  getRooms, // Aggiunto per sale
  getTables // Aggiunto per tavoli
} from './cassaInCloudService';
import type {
  CassaInCloudCategory,
  GetCategoriesParams,
  GetProductsParams,
  CassaInCloudProduct,
  GetSoldByProductParams,
  GetSoldByProductApiResponse,
  CassaInCloudCustomer, // Aggiunto
  GetCustomersParams, // Aggiunto
  GetReceiptsParams, // Aggiunto per ricevute
  GetReceiptsApiResponse, // Aggiunto per ricevute
  CassaInCloudReceipt, // Aggiunto per ricevute
  CassaInCloudRoom, // Aggiunto per sale
  GetRoomsParams, // Aggiunto per sale
  GetRoomsApiResponse, // Aggiunto per sale
  CassaInCloudTable, // Aggiunto per tavoli
  GetTablesParams, // Aggiunto per tavoli
  GetTablesApiResponse // Aggiunto per tavoli
} from './cassaInCloudTypes';
import { mapCassaInCloudProductToInternalProduct } from './cassaInCloudDataMapper';
import type { InternalProduct } from '@/types/internalProduct';
// Rimuovi questa importazione duplicata
// import type { GetSoldByProductParams, GetSoldByProductApiResponse } from './cassaInCloudTypes';

export async function importRestaurantCategoriesFromCassaInCloud(
  restaurantIdSupabase: string, // ID del ristorante su Supabase
  cassaInCloudSalesPointIds?: string[], // Opzionale: array di ID dei punti vendita CassaInCloud per filtrare
  apiKeyOverride?: string, // Opzionale: per usare una API key specifica
  idSalesPointForPricing?: string, // Parametro aggiunto
  filterParams?: GetCategoriesParams // Parametro aggiunto
): Promise<{ count: number; error?: Error; message?: string }> {
  try {
    console.log(
      `Inizio importazione categorie da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );
    console.log(`Utilizzando ID punto vendita per prezzatura: ${idSalesPointForPricing}`);
    if (filterParams) {
      console.log(`Utilizzando parametri di filtro aggiuntivi:`, filterParams);
    }

    // 1. Recuperare le categorie da CassaInCloud
    const params: GetCategoriesParams = {
      ...(filterParams || {}),
      ...(cassaInCloudSalesPointIds ? { idsSalesPoint: cassaInCloudSalesPointIds } : {})
    };

    const categoriesFromCassa: CassaInCloudCategory[] = await getCategories(params, apiKeyOverride);

    if (!categoriesFromCassa || categoriesFromCassa.length === 0) {
      console.log('Nessuna categoria trovata su CassaInCloud con i parametri forniti.');
      return { count: 0, message: 'Nessuna categoria trovata su CassaInCloud con i parametri forniti.' };
    }

    console.log(`Recuperate ${categoriesFromCassa.length} categorie da CassaInCloud.`);

    // 2. Mappare i dati per Supabase
    const categoriesToUpsert = categoriesFromCassa.map((category) => ({
      restaurant_id: restaurantIdSupabase,
      name: category.description, // Utilizziamo 'description' come 'name'
      external_id: String(category.id), // Assicura che l'ID sia sempre una stringa
      description: category.description, // Puoi decidere se usare la stessa descrizione o un altro campo
      // Aggiungi altri campi se necessario, es. se CassaInCloudCategory avesse più dettagli
    }));

    // 3. Eseguire l'upsert su Supabase
    // Dato che external_id è globalmente univoco, lo usiamo come unico vincolo per onConflict.
    const { data, error } = await supabase
      .from('restaurant_categories')
      .upsert(categoriesToUpsert, {
        onConflict: 'external_id', // Modificato per riflettere l'unicità globale di external_id
        ignoreDuplicates: false,
      })
      .select(); // Aggiungiamo select() per avere i dati inseriti/aggiornati e il count

    if (error) {
      console.error("Errore durante l'upsert delle categorie su Supabase:", error);
      throw error; // Rilancia l'errore per gestirlo nel chiamante
    }

    const upsertedCount = data?.length || 0;
    const message = `Completata importazione: ${upsertedCount} categorie processate per il ristorante ${restaurantIdSupabase}.`;
    console.log(message);
    return { count: upsertedCount, message };

  } catch (error) {
    const errorMessage = 'Errore imprevisto durante l\'importazione delle categorie.';
    console.error(errorMessage, error);
    return { count: 0, error: error instanceof Error ? error : new Error(String(error)), message: `${errorMessage} ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Importa i clienti da CassaInCloud e li salva in Supabase.
 * @param restaurantIdSupabase ID del ristorante su Supabase.
 * @param filterParams Parametri di filtro opzionali per getCustomers.
 * @param apiKeyOverride API key opzionale per sovrascrivere quella di default.
 * @returns Una Promise che risolve con il conteggio dei clienti importati/aggiornati e un eventuale errore.
 */
export async function importCustomersFromCassaInCloud(
  restaurantIdSupabase: string,
  filterParams?: GetCustomersParams,
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error; message?: string; warnings?: string[] }> {
  const warnings: string[] = [];
  try {
    console.log(
      `Inizio importazione clienti da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );
    if (filterParams) {
      console.log(`Utilizzando parametri di filtro aggiuntivi:`, filterParams);
    }

    // 1. Recuperare i clienti da CassaInCloud
    // Assicurati che i parametri obbligatori 'start' e 'limit' siano forniti, 
    // o impostali a valori di default se non presenti in filterParams.
    const effectiveFilterParams: GetCustomersParams = {
      start: filterParams?.start ?? 0,
      limit: filterParams?.limit ?? 50, 
      ...filterParams,
    };

    const customersFromCassa: CassaInCloudCustomer[] = await getCustomers(
      effectiveFilterParams,
      apiKeyOverride
    );

    if (!customersFromCassa || customersFromCassa.length === 0) {
      const message = 'Nessun cliente trovato su CassaInCloud con i parametri forniti.';
      console.log(message);
      return { count: 0, message, warnings };
    }

    console.log(`Recuperati ${customersFromCassa.length} clienti da CassaInCloud.`);

    // 2. Mappare i dati per Supabase
    const customersToUpsert = customersFromCassa.map((customer) => ({
      restaurant_id: restaurantIdSupabase,
      external_id: customer.id, // L'ID di CassaInCloud diventa external_id
      name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      first_name: customer.firstName || null,
      last_name: customer.lastName || null,
      email: customer.email || null,
      phone_number: customer.phoneNumber || null,
      vat_number: customer.vatNumber || null,
      fiscal_code: customer.fiscalCode || null,
      address: customer.address || null,
      zip_code: customer.zipCode || null,
      city: customer.city || null,
      country: customer.country || null,
      // Aggiungere altri campi mappati se la tabella 'customers' li supporta
      // last_synced_at: new Date().toISOString(), // Potresti voler tracciare l'ultimo aggiornamento
    }));    

    // 3. Eseguire l'upsert su Supabase
    const { data, error } = await supabase
      .from('customers')
      .upsert(customersToUpsert, {
        onConflict: 'restaurant_id, external_id', // Conflitto su external_id per uno specifico ristorante
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Errore durante l'upsert dei clienti su Supabase:", error);
      throw error;
    }

    const upsertedCount = data?.length || 0;
    const message = `Completata importazione: ${upsertedCount} clienti processati per il ristorante ${restaurantIdSupabase}.`;
    console.log(message);
    return { count: upsertedCount, message, warnings };

  } catch (error) {
    const errorMessage = "Errore imprevisto durante l'importazione dei clienti:";
    console.error(errorMessage, error);
    warnings.push(`Errore generale: ${error instanceof Error ? error.message : String(error)}`);
    return { count: 0, error: error instanceof Error ? error : new Error(String(error)), message: `${errorMessage} ${error instanceof Error ? error.message : String(error)}`, warnings };
  }
}

export async function importRestaurantProductsFromCassaInCloud(
  restaurantIdSupabase: string,
  idSalesPointForPricing: string, // ID del punto vendita specifico per la determinazione del prezzo
  filterParams?: GetProductsParams, // Parametri di filtro opzionali per getProducts
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error; message?: string; warnings?: string[] }> { // Aggiunto warnings
  const warnings: string[] = []; // Array per collezionare avvisi
  try {
    console.log(
      `Inizio importazione prodotti da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );
    console.log(`Utilizzando ID punto vendita per prezzatura: ${idSalesPointForPricing}`);
    if (filterParams) {
      console.log(`Utilizzando parametri di filtro aggiuntivi:`, filterParams);
    }

    // 1. Recuperare i prodotti da CassaInCloud
    // Passiamo idSalesPointForPricing a getProducts, che a sua volta lo passerà al mapper.
    // filterParams viene passato per filtrare la chiamata API.
    const internalProductsFromCassa: InternalProduct[] = await getProducts(idSalesPointForPricing, filterParams, apiKeyOverride); 

    if (!internalProductsFromCassa || internalProductsFromCassa.length === 0) {
      console.log('Nessun prodotto trovato e mappato da CassaInCloud con i parametri forniti.');
      return { count: 0, message: 'Nessun prodotto trovato e mappato da CassaInCloud.' };
    }

    console.log(`Recuperati e mappati ${internalProductsFromCassa.length} prodotti da CassaInCloud.`);

    // 2. Preparare i dati per Supabase dalla lista di InternalProduct
    // e arricchire con restaurant_category_id
    const productsToUpsert = await Promise.all(internalProductsFromCassa.map(async (internalProduct) => {
      let restaurantCategoryId: string | null = null;
      let restaurantCategoryName: string | null = null;
      if (internalProduct.external_category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('restaurant_categories')
          .select('id, name')
          .eq('external_id', internalProduct.external_category_id)
          .eq('restaurant_id', restaurantIdSupabase)
          .single();

        if (categoryError && categoryError.code !== 'PGRST116') {
          warnings.push(`Errore ricerca categoria per prodotto ${internalProduct.name} (ExtCatID: ${internalProduct.external_category_id}): ${categoryError.message}`);
        } else if (categoryData) {
          restaurantCategoryId = categoryData.id;
          restaurantCategoryName = categoryData.name;
        } else {
          warnings.push(`Categoria esterna con ID ${internalProduct.external_category_id} per il prodotto '${internalProduct.name}' non trovata nel database. Il prodotto sarà importato senza categoria interna.`);
        }
      }

      return {
        restaurant_id: restaurantIdSupabase,
        external_id: String(internalProduct.cassaInCloudId), // Assicura che l'ID sia sempre una stringa
        name: internalProduct.name,
        selling_price: internalProduct.price,
        restaurant_category_id: restaurantCategoryId || null,
        restaurant_category_name: restaurantCategoryName || null,
        cic_notes: internalProduct.descriptionLabel || null,
        cic_department_name: internalProduct.departmentName || null,
        cic_has_variants: internalProduct.isMultivariant ?? false,
        is_enabled_for_restaurant: internalProduct.isEnabledForRestaurant ?? false,
        last_synced_at: (() => {
          if (internalProduct.cicLastUpdate && typeof internalProduct.cicLastUpdate === 'number' && internalProduct.cicLastUpdate > 0) {
            const date = new Date(internalProduct.cicLastUpdate);
            const isoString = date.toISOString();
            if (isNaN(date.getTime())) {
              return null;
            }
            return isoString;
          }
          return null;
        })(),
        cic_vat_percentage: internalProduct.taxRate ?? null,
        cic_variants_count: internalProduct.variants?.length || 0,
      };
    }));

    // 3. Eseguire l'upsert su Supabase
    const { data: upsertedData, error: upsertError } = await supabase
      .from('dishes')
      .upsert(productsToUpsert, {
        onConflict: 'restaurant_id, external_id', // Conflitto su external_id per uno specifico ristorante
        ignoreDuplicates: false,
      })
      .select('id, external_id');

    if (upsertError) {
      console.error("Errore durante l'upsert dei prodotti su Supabase:", upsertError);
      throw upsertError;
    }

    const upsertedCount = upsertedData?.length || 0;
    console.log(`Completata importazione: ${upsertedCount} prodotti processati per il ristorante ${restaurantIdSupabase}.`);

    // 4. Gestire i prodotti non più esistenti in CassaInCloud (marcare come "to be verified")
    if (upsertedData && upsertedData.length > 0) {
      const cicProductExternalIds = new Set(internalProductsFromCassa.map(p => p.cassaInCloudId)); // Usa cassaInCloudId da InternalProduct
      
      // Recupera tutti i piatti del ristorante che hanno un external_id
      const { data: localDishes, error: localDishesError } = await supabase
        .from('dishes')
        .select('id, external_id')
        .eq('restaurant_id', restaurantIdSupabase)
        .not('external_id', 'is', null);

      if (localDishesError) {
        console.error("Errore nel recuperare i piatti locali per la verifica:", localDishesError);
        // Non bloccare il flusso per questo, ma loggare l'errore
      } else if (localDishes) {
        const dishesToUpdatePayloads = []; // Array per i payload di aggiornamento
        for (const localDish of localDishes) {
          if (localDish.external_id && !cicProductExternalIds.has(localDish.external_id)) {
            // Questo piatto esiste localmente con un external_id ma non è più in CassaInCloud
            // Creiamo un oggetto payload per l'aggiornamento
            dishesToUpdatePayloads.push({
              id: localDish.id, // Specifichiamo l'ID per l'upsert
              availability_status: 'to_be_verified_cic_sync' // Il campo da aggiornare
            });
            warnings.push(`Piatto locale '${localDish.id}' (ExtID: ${localDish.external_id}) non trovato in CassaInCloud. Marcato come 'to_be_verified_cic_sync' in availability_status.`);
          }
        }

        if (dishesToUpdatePayloads.length > 0) {
          console.log(`Marcando ${dishesToUpdatePayloads.length} piatti locali come 'to_be_verified'.`);
          for (const payload of dishesToUpdatePayloads) {
            const { error: updateError } = await supabase
              .from('dishes')
              .update({ availability_status: payload.availability_status })
              .eq('id', payload.id);
            if (updateError) {
              console.error(`Errore nell'aggiornare il piatto locale ${payload.id} come 'to_be_verified':`, updateError);
              // Considera se vuoi accumulare questi errori o interrompere il processo
            }
          }
        }
      }
    }

    return { 
      count: upsertedCount, 
      message: `${upsertedCount} prodotti importati/aggiornati. Prodotti non più presenti in CassaInCloud sono stati marcati per verifica.`,
      warnings: warnings // Restituisce gli avvisi
    }; 

  } catch (error) {
    console.error('Errore imprevisto durante l\'importazione dei prodotti:', error);
    return { 
      count: 0, 
      error: error instanceof Error ? error : new Error(String(error)),
      message: 'Errore imprevisto durante l\'importazione dei prodotti.',
      warnings: warnings
    }; 
  }
}


/**
 * Importa i dati delle vendite da CassaInCloud
 * @param restaurantIdSupabase ID del ristorante su Supabase
 * @param params Parametri per la richiesta del report vendite
 * @param apiKeyOverride Chiave API opzionale
 */
export async function importSalesFromCassaInCloud(
  restaurantIdSupabase: string,
  params: GetSoldByProductParams,
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error; message?: string; data?: GetSoldByProductApiResponse }> {
  try {
    console.log(
      `Inizio importazione vendite da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );
    console.log(`Periodo: da ${params.datetimeFrom} a ${params.datetimeTo}`);
    
    // 1. Recuperare i dati delle vendite da CassaInCloud
    console.log(`Recupero dati vendite per ristorante ${restaurantIdSupabase} dal ${params.datetimeFrom} al ${params.datetimeTo}`);
    const salesData = await getSoldByProductReport(params, apiKeyOverride);

    if (!salesData) {
      console.warn(`Nessun dato di vendita trovato per il ristorante ${restaurantIdSupabase} nel periodo specificato.`);
      return { count: 0, message: 'Nessun dato di vendita trovato.' };
    }
    console.log(`Dati di vendita recuperati con successo da CassaInCloud: ${salesData.totalCount} prodotti venduti.`);

    // 2. Preparare i dati per il salvataggio su Supabase
    const salesRecord = {
      restaurant_id: restaurantIdSupabase,
      report_date: new Date().toISOString(), // Data della generazione del report/importazione
      period_from: typeof params.datetimeFrom === 'string' ? params.datetimeFrom : new Date(params.datetimeFrom).toISOString(),
      period_to: typeof params.datetimeTo === 'string' ? params.datetimeTo : new Date(params.datetimeTo).toISOString(),
      currency: salesData.currency?.code || null, // Usa la proprietà corretta 'code' invece di 'isoCode'
      total_count: salesData.totalCount,
      total_sold: salesData.totalSold,
      total_refund: salesData.totalRefund,
      total_quantity: salesData.totalQuantity,
      total_department_sold: salesData.totalDepartmentSold,
      total_department_refund: salesData.totalDepartmentRefund,
      total_department_quantity: salesData.totalDepartmentQuantity,
      raw_data: salesData // Salviamo l'intero oggetto di risposta per audit/future elaborazioni
    };

    console.log('Tentativo di salvataggio dei dati di vendita aggregati su Supabase:', salesRecord);
    // TODO: Considerare un UPSERT se la logica lo richiede, basato su restaurant_id e period_from/period_to o report_date
    // Per ora, si assume un insert. Se si esegue più volte per lo stesso periodo, si avranno record duplicati.
    const { error: salesInsertError } = await supabase
      .from('sales_data')
      .insert(salesRecord);

    if (salesInsertError) {
      console.error('Errore dettagliato durante il salvataggio dei dati di vendita aggregati:', salesInsertError);
      return { count: 0, error: new Error(`Errore Supabase: ${salesInsertError.message}`), message: `Impossibile salvare i dati di vendita aggregati: ${salesInsertError.message}` };
    }
    
    // 3. Salvataggio dei dettagli dei prodotti venduti
    let soldProductsCount = 0;
    if (salesData.sold && salesData.sold.length > 0) {
      console.log(`Trovati ${salesData.sold.length} dettagli di prodotti venduti da salvare.`);
      const soldProductsData = salesData.sold.map(item => ({
        restaurant_id: restaurantIdSupabase,
        // Associa questo dettaglio al record sales_data principale se necessario, ad es. tramite un ID restituito dall'insert precedente o report_date + period
        report_date: salesRecord.report_date, // Usiamo la stessa report_date del record aggregato
        product_id: item.idProduct,
        product_name: item.product?.description || 'Prodotto sconosciuto',
        id_menu_product: item.idMenuProduct, // Aggiunto dalla documentazione
        menu_product_name: item.menuProduct?.description, // Aggiunto dalla documentazione
        quantity: item.quantity,
        profit: item.profit,
        percent_total: item.percentTotal,
        is_menu_entry: item.isMenuEntry || false,
        is_composition_entry: item.isCompositionEntry || false,
        raw_data_item: item // Salva il singolo item per audit
      }));

      console.log('Tentativo di salvataggio dei dettagli dei prodotti venduti:', soldProductsData.slice(0, 2)); // Logga solo i primi due per brevità
      // TODO: Considerare UPSERT anche qui se i dettagli possono essere aggiornati
      const { error: detailsError } = await supabase
        .from('sales_product_details')
        .insert(soldProductsData);

      if (detailsError) {
        console.error('Errore dettagliato durante il salvataggio dei dettagli dei prodotti venduti:', detailsError);
        // Non bloccare l'intero processo, ma segnalare l'errore.
        // Il record sales_data aggregato è stato salvato.
        return {
          count: 0, // O il numero di record aggregati salvati (1 se successo prima)
          message: `Dati di vendita aggregati importati, ma errore nel salvare i dettagli dei prodotti: ${detailsError.message}`,
          error: new Error(`Errore Supabase dettagli: ${detailsError.message}`),
          data: salesData
        };
      }
      soldProductsCount = soldProductsData.length;
      console.log(`${soldProductsCount} dettagli di prodotti venduti salvati con successo.`);
    } else {
      console.log('Nessun dettaglio di prodotto venduto da salvare per questo periodo.');
    }

    console.log(`Importazione vendite per ristorante ${restaurantIdSupabase} completata. Record aggregato salvato. Dettagli prodotti venduti: ${soldProductsCount}. Totale vendite API: ${salesData.totalSold}`);
    return {
      count: 1 + soldProductsCount, // 1 per il record aggregato + numero dettagli
      message: `Dati di vendita importati con successo. Record aggregato e ${soldProductsCount} dettagli prodotti salvati. Totale vendite (API): ${salesData.totalSold}`,
      data: salesData
    };
    
  } catch (error) {
    console.error('Errore durante l\'importazione delle vendite:', error);
    return { count: 0, error: error as Error };
  }
}

/**
 * Importa le ricevute da CassaInCloud e le salva in Supabase.
 * @param restaurantIdSupabase ID del ristorante su Supabase.
 * @param params Parametri per la richiesta delle ricevute.
 * @param apiKeyOverride Chiave API opzionale.
 * @returns Una Promise che risolve con il conteggio delle ricevute importate/aggiornate e un eventuale errore.
 */
export async function importReceiptsFromCassaInCloud(
  restaurantIdSupabase: string,
  params: GetReceiptsParams,
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error; message?: string; warnings?: string[] }> {
  const warnings: string[] = [];
  try {
    console.log(
      `Inizio importazione ricevute da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );
    console.log(`Periodo: da ${params.datetimeFrom} a ${params.datetimeTo}`);

    // 1. Recuperare le ricevute da CassaInCloud
    const receiptsResponse = await getReceipts(params, apiKeyOverride);

    if (!receiptsResponse || !receiptsResponse.receipts || receiptsResponse.receipts.length === 0) {
      console.log('Nessuna ricevuta trovata su CassaInCloud con i parametri forniti.');
      return { count: 0, message: 'Nessuna ricevuta trovata.', warnings };
    }

    const receiptsFromCassa = receiptsResponse.receipts as CassaInCloudReceipt[];
    console.log(`Recuperate ${receiptsFromCassa.length} ricevute da CassaInCloud.`);

    // 2. Mappare i dati per Supabase
    const receiptsToUpsert = receiptsFromCassa.map((receipt) => {
      const document = receipt.document;
      return {
        restaurant_id: restaurantIdSupabase,
        external_id: receipt.id, // L'ID della ricevuta da CassaInCloud
        receipt_number: receipt.number,
        receipt_date: receipt.datetime ? new Date(receipt.datetime).toISOString() : (receipt.date ? new Date(receipt.date).toISOString() : null),
        z_number: receipt.zNumber,
        lottery_code: receipt.lotteryCode,
        document_external_id: document?.id,
        total: document?.amount,
        raw_data: receipt,
        last_synced_at: new Date().toISOString(),
      };
    });

    // 3. Eseguire l'upsert su Supabase
    // Il conflitto è gestito su 'restaurant_id' e 'external_id' per garantire l'unicità per ristorante.
    const { data, error } = await supabase
      .from('cassa_in_cloud_receipts') // Assicurati che la tabella si chiami 'cassa_in_cloud_receipts'
      .upsert(receiptsToUpsert, {
        onConflict: 'restaurant_id, external_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Errore durante l'upsert delle ricevute su Supabase:", error);
      throw error;
    }

    const upsertedCount = data?.length || 0;
    console.log(`Completata importazione: ${upsertedCount} ricevute processate per il ristorante ${restaurantIdSupabase}.`);

    // --- INIZIO MODIFICA: Import righe ricevute e operatore ---
    // 1. Upsert delle righe delle ricevute
    let allRowsToUpsert = [];
    let allOperatorsToUpsert = [];
    let receiptRowsMap = {};
    for (const receipt of receiptsFromCassa) {
      const receiptSupabase = data?.find(r => r.external_id === receipt.id);
      const receiptSupabaseId = receiptSupabase?.id;
      if (receiptSupabaseId && receipt.document && Array.isArray(receipt.document.rows)) {
        receipt.document.rows.forEach((row, idx) => {
          allRowsToUpsert.push({
            restaurant_id: restaurantIdSupabase,
            receipt_id: receiptSupabaseId,
            external_id: row.id || `${receipt.id}_${idx}`,
            description: row.description,
            quantity: row.quantity,
            price: row.price,
            vat: row.vat,
            total: row.total,
            // Campi aggiunti:
            subtotal: row.subtotal,
            refund: row.refund,
            menu: row.menu,
            composition: row.composition,
            cover_charge: row.coverCharge, // snake_case per coerenza con la tabella DB
            id_product: row.idProduct,
            id_product_variant: row.idProductVariant,
            id_category: row.idCategory,
            id_department: row.idDepartment,
            sales_type: row.salesType, // Potrebbe necessitare di serializzazione se è un oggetto complesso
            id_tax: row.idTax,
            id_sales_mode: row.idSalesMode,
            stock_movement_enabled: row.stockMovementEnabled,
            id_stock_movement: row.idStockMovement,
            id_outgoing_movement: row.idOutgoingMovement,
            row_number: row.rowNumber,
            percentage_variation: row.percentageVariation,
            variation: row.variation,
            variation_type: row.variationType, // Potrebbe necessitare di serializzazione
            row_modifier_values: row.rowModifierValues, // Probabilmente JSONB in DB
            note: row.note,
            calculated_amount: row.calculatedAmount,
            shipping_cost: row.shippingCost,
            shared_payment_reason: row.sharedPaymentReason,
            row_course_choices: row.rowCourseChoices, // Probabilmente JSONB in DB
            row_component_choices: row.rowComponentChoices, // Probabilmente JSONB in DB
            raw_data: row,
            last_synced_at: new Date().toISOString()
          });
        });
      }
      // 2. Upsert dell'operatore (operator)
      let operatorData = null;
      if (receipt.user) {
        operatorData = receipt.user;
      } else if (receipt.document && receipt.document.user) {
        operatorData = receipt.document.user;
      } else if (receipt.idUserFO) {
        operatorData = { id: receipt.idUserFO, name: receipt.userFOName || null };
      }
      if (operatorData && operatorData.id) {
        allOperatorsToUpsert.push({
          restaurant_id: restaurantIdSupabase,
          operator_id_external: operatorData.id,
          operator_name: operatorData.name || operatorData.fullName || operatorData.username || null,
          last_synced_at: new Date().toISOString()
        });
        // Collega la ricevuta all'operatore se la tabella receipts ha operator_id_external
        if (receiptSupabaseId) {
          await supabase
            .from('cassa_in_cloud_receipts')
            .update({ operator_id_external: operatorData.id })
            .eq('id', receiptSupabaseId);
        }
      }
    }
    // Upsert batch delle righe
    if (allRowsToUpsert.length > 0) {
      const { error: rowsError } = await supabase
        .from('cassa_in_cloud_receipt_rows')
        .upsert(allRowsToUpsert, {
          onConflict: 'restaurant_id, receipt_id, external_id',
          ignoreDuplicates: false
        });
      if (rowsError) {
        console.error('Errore durante l\'upsert delle righe delle ricevute:', rowsError);
        warnings.push('Errore durante l\'upsert delle righe delle ricevute: ' + rowsError.message);
      }
    }
    // Upsert batch degli operatori
    if (allOperatorsToUpsert.length > 0) {
      // Rimuovi duplicati per operator_id_external
      const uniqueOperators = Object.values(allOperatorsToUpsert.reduce((acc, op) => {
        acc[op.operator_id_external] = op;
        return acc;
      }, {}));
      const { error: operatorsError } = await supabase
        .from('cassa_in_cloud_operators')
        .upsert(uniqueOperators, {
          onConflict: 'restaurant_id, operator_id_external',
          ignoreDuplicates: false
        });
      if (operatorsError) {
        console.error('Errore durante l\'upsert degli operatori:', operatorsError);
        warnings.push('Errore durante l\'upsert degli operatori: ' + operatorsError.message);
      }
    }
    // --- FINE MODIFICA ---

    return { count: upsertedCount, message: `${upsertedCount} ricevute importate/aggiornate.`, warnings };

  } catch (error) {
    console.error("Errore imprevisto durante l'importazione delle ricevute:", error);
    warnings.push(`Errore generale: ${error instanceof Error ? error.message : String(error)}`);
    return { count: 0, error: error instanceof Error ? error : new Error(String(error)), warnings };
  }
}

/**
 * Importa le sale da CassaInCloud e le salva in Supabase.
 * @param restaurantIdSupabase ID del ristorante su Supabase.
 * @param params Parametri per la richiesta delle sale.
 * @param apiKeyOverride Chiave API opzionale.
 * @returns Una Promise che risolve con il conteggio delle sale importate/aggiornate e un eventuale errore.
 */
export async function importRoomsFromCassaInCloud(
  restaurantIdSupabase: string,
  params: GetRoomsParams,
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error; message?: string; warnings?: string[] }> {
  const warnings: string[] = [];
  try {
    console.log(
      `Inizio importazione sale da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );

    const roomsResponse = await getRooms(params, apiKeyOverride);

    if (!roomsResponse || !roomsResponse.rooms || roomsResponse.rooms.length === 0) {
      console.log('Nessuna sala trovata su CassaInCloud con i parametri forniti.');
      return { count: 0, message: 'Nessuna sala trovata.', warnings };
    }

    const roomsFromCassa = roomsResponse.rooms as CassaInCloudRoom[];
    console.log(`Recuperate ${roomsFromCassa.length} sale da CassaInCloud.`);

    const roomsToUpsert = roomsFromCassa.map((room) => ({
      restaurant_id: restaurantIdSupabase,
      external_id: room.id,
      name: room.name,
      description: room.name,
      id_sales_point: room.idSalesPoint, // Assicurati che la colonna esista in Supabase
      raw_data: room,
      last_synced_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('restaurant_rooms') // Assicurati che la tabella si chiami 'restaurant_rooms'
      .upsert(roomsToUpsert, {
        onConflict: 'restaurant_id, external_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Errore durante l'upsert delle sale su Supabase:", error);
      throw error;
    }

    const upsertedCount = data?.length || 0;
    console.log(`Completata importazione: ${upsertedCount} sale processate per il ristorante ${restaurantIdSupabase}.`);
    return { count: upsertedCount, message: `${upsertedCount} sale importate/aggiornate.`, warnings };

  } catch (error) {
    console.error("Errore imprevisto durante l'importazione delle sale:", error);
    warnings.push(`Errore generale: ${error instanceof Error ? error.message : String(error)}`);
    return { count: 0, error: error instanceof Error ? error : new Error(String(error)), warnings };
  }
}

/**
 * Importa i tavoli da CassaInCloud e li salva in Supabase.
 * @param restaurantIdSupabase ID del ristorante su Supabase.
 * @param params Parametri per la richiesta dei tavoli.
 * @param apiKeyOverride Chiave API opzionale.
 * @returns Una Promise che risolve con il conteggio dei tavoli importati/aggiornati e un eventuale errore.
 */
export async function importTablesFromCassaInCloud(
  restaurantIdSupabase: string,
  params: GetTablesParams,
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error; message?: string; warnings?: string[] }> {
  const warnings: string[] = [];
  try {
    console.log(
      `Inizio importazione tavoli da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );

    const tablesResponse = await getTables(params, apiKeyOverride);

    if (!tablesResponse || !tablesResponse.tables || tablesResponse.tables.length === 0) {
      console.log('Nessun tavolo trovato su CassaInCloud con i parametri forniti.');
      return { count: 0, message: 'Nessun tavolo trovato.', warnings };
    }

    const tablesFromCassa = tablesResponse.tables as CassaInCloudTable[];
    console.log(`Recuperati ${tablesFromCassa.length} tavoli da CassaInCloud.`);

    // Recupera gli ID interni delle sale per il mapping
    const roomExternalIds = tablesFromCassa.map(table => table.idRoom).filter(id => id !== undefined);
    let roomMap: { [externalId: string]: string } = {};
    if (roomExternalIds.length > 0) {
      const { data: roomsData, error: roomsError } = await supabase
        .from('restaurant_rooms')
        .select('id, external_id')
        .eq('restaurant_id', restaurantIdSupabase)
        .in('external_id', roomExternalIds);
      if (roomsError) {
        console.warn('Errore nel recuperare le sale per il mapping dei tavoli:', roomsError);
        warnings.push('Errore recupero sale per mapping: ' + roomsError.message);
      } else if (roomsData) {
        roomMap = roomsData.reduce((acc, room) => {
          if (room.external_id) acc[room.external_id] = room.id;
          return acc;
        }, {});
      }
    }

    const tablesToUpsert = tablesFromCassa.map((table) => {
      const internalRoomId = table.idRoom ? roomMap[table.idRoom] : null;
      if (table.idRoom && !internalRoomId) {
        warnings.push(`Tavolo '${table.name}' (ExtID: ${table.id}) fa riferimento a una sala esterna (ExtRoomID: ${table.idRoom}) non trovata o non mappata nel DB.`);
      }
      return {
        restaurant_id: restaurantIdSupabase,
        external_id: table.id,
        name: table.name,
        description: table.name,
        seats: table.seatsAvailable || table.seats,
        id_sales_point: table.idSalesPoint,
        room_id: internalRoomId,
        external_room_id: table.idRoom,
        raw_data: table,
        last_synced_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from('restaurant_tables') // Assicurati che la tabella si chiami 'restaurant_tables'
      .upsert(tablesToUpsert, {
        onConflict: 'restaurant_id, external_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Errore durante l'upsert dei tavoli su Supabase:", error);
      throw error;
    }

    const upsertedCount = data?.length || 0;
    console.log(`Completata importazione: ${upsertedCount} tavoli processati per il ristorante ${restaurantIdSupabase}.`);
    return { count: upsertedCount, message: `${upsertedCount} tavoli importati/aggiornati.`, warnings };

  } catch (error) {
    console.error("Errore imprevisto durante l'importazione dei tavoli:", error);
    warnings.push(`Errore generale: ${error instanceof Error ? error.message : String(error)}`);
    return { count: 0, error: error instanceof Error ? error : new Error(String(error)), warnings };
  }
}
