// Vecchio import:
// import { supabase } from '@/integrations/supabase/supabaseClient'; 

// Nuovo import corretto:
import { supabase } from '@/integrations/supabase/client'; // Assicurati che il percorso sia corretto
import {
  getCategories,
  getProducts, 
  getSoldByProductReport
} from './cassaInCloudService';
import type {
  CassaInCloudCategory,
  GetCategoriesParams,
  GetProductsParams,
  CassaInCloudProduct,
  GetSoldByProductParams, 
  GetSoldByProductApiResponse
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
): Promise<{ count: number; error?: Error }> {
  try {
    console.log(
      `Inizio importazione categorie da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );
    console.log(`Utilizzando ID punto vendita per prezzatura: ${idSalesPointForPricing}`);
    if (filterParams) {
      console.log(`Utilizzando parametri di filtro aggiuntivi:`, filterParams);
    }

    // 1. Recuperare le categorie da CassaInCloud
    const params: GetCategoriesParams = {};
    if (cassaInCloudSalesPointIds) {
      params.idsSalesPoint = cassaInCloudSalesPointIds;
    }

    const categoriesFromCassa: CassaInCloudCategory[] = await getCategories(params, apiKeyOverride);

    if (!categoriesFromCassa || categoriesFromCassa.length === 0) {
      console.log('Nessuna categoria trovata su CassaInCloud con i parametri forniti.');
      return { count: 0 };
    }

    console.log(`Recuperate ${categoriesFromCassa.length} categorie da CassaInCloud.`);

    // 2. Mappare i dati per Supabase
    const categoriesToUpsert = categoriesFromCassa.map((category) => ({
      restaurant_id: restaurantIdSupabase,
      name: category.description, // Utilizziamo 'description' come 'name'
      external_id: category.id, // L'ID di CassaInCloud diventa external_id
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
    console.log(`Completata importazione: ${upsertedCount} categorie processate per il ristorante ${restaurantIdSupabase}.`);
    return { count: upsertedCount };

  } catch (error) {
    console.error('Errore imprevisto durante l\'importazione delle categorie:', error);
    return { count: 0, error: error instanceof Error ? error : new Error(String(error)) };
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

        if (categoryError && categoryError.code !== 'PGRST116') { // PGRST116: no rows found
          console.warn(`Errore durante la ricerca della categoria per external_id ${internalProduct.external_category_id}:`, categoryError);
          warnings.push(`Errore ricerca categoria per prodotto ${internalProduct.name} (ExtCatID: ${internalProduct.external_category_id}): ${categoryError.message}`);
        } else if (categoryData) {
          restaurantCategoryId = categoryData.id;
          restaurantCategoryName = categoryData.name;
        } else {
          // Categoria non trovata, external_category_id presente ma non nel DB
          warnings.push(`Categoria esterna con ID ${internalProduct.external_category_id} per il prodotto '${internalProduct.name}' non trovata nel database. Il prodotto sarà importato senza categoria interna.`);
        }
      }

      return {
        restaurant_id: restaurantIdSupabase,
        external_id: internalProduct.cassaInCloudId, // CORRETTO: Usiamo cassaInCloudId come external_id per il prodotto
        name: internalProduct.name,
        selling_price: internalProduct.price, // CORRETTO: Usiamo price dall'InternalProduct
        restaurant_category_id: restaurantCategoryId, // ID della categoria interna o null
        restaurant_category_name: restaurantCategoryName, // Added
        cic_notes: internalProduct.descriptionLabel, // Mappato a cic_notes
        cic_department_name: internalProduct.departmentName, // CORRETTO: nome colonna db
        // tax_rate: internalProduct.taxRate, // Rimosso, già coperto da cic_vat_percentage
        // is_sold_by_weight: internalProduct.isSoldByWeight, // Rimosso, colonna non presente nello schema
        cic_has_variants: internalProduct.isMultivariant, // Mappato a cic_has_variants
        is_enabled_for_restaurant: internalProduct.isEnabledForRestaurant,
        // id_sales_point_cic: idSalesPointForPricing, // Rimosso, colonna non presente nello schema
        last_synced_at: (() => {
          if (internalProduct.cicLastUpdate && typeof internalProduct.cicLastUpdate === 'number' && internalProduct.cicLastUpdate > 0) {
            const date = new Date(internalProduct.cicLastUpdate); // Rimosso * 1000
            const isoString = date.toISOString();
            // console.log(`[DEBUG last_synced_at] cicLastUpdate: ${internalProduct.cicLastUpdate}, ISO: ${isoString}, Product Name: ${internalProduct.name}`); // Log per debug, può essere rimosso o commentato dopo la correzione
            if (isNaN(date.getTime())) {
                // console.warn(`[DEBUG last_synced_at] Invalid date generated for cicLastUpdate: ${internalProduct.cicLastUpdate}, Product Name: ${internalProduct.name}`);
                return null;
            }
            return isoString;
          }
          return null;
        })(),
        cic_vat_percentage: internalProduct.taxRate, // Assumendo che taxRate sia la percentuale IVA
        cic_variants_count: internalProduct.variants?.length || 0, // Conteggio delle varianti
        // Aggiungere qui altri campi mappati se la tabella 'dishes' li supporta
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
    const salesData = await getSoldByProductReport(params, apiKeyOverride);
    
    if (!salesData) {
      console.log('Nessun dato di vendita trovato con i parametri forniti.');
      return { count: 0, message: 'Nessun dato di vendita trovato.' };
    }
    
    // 2. Salvataggio dei dati su Supabase
    const { error } = await supabase
      .from('sales_data')
      .insert({
        restaurant_id: restaurantIdSupabase,
        report_date: new Date().toISOString(),
        period_from: typeof params.datetimeFrom === 'string' ? params.datetimeFrom : new Date(params.datetimeFrom).toISOString(),
        period_to: typeof params.datetimeTo === 'string' ? params.datetimeTo : new Date(params.datetimeTo).toISOString(),
        total_sold: salesData.totalSold,
        total_quantity: salesData.totalQuantity,
        total_refund: salesData.totalRefund,
        data: salesData // Salviamo l'intero oggetto di risposta
      });
    
    if (error) {
      console.error('Errore durante il salvataggio dei dati di vendita:', error);
      return { count: 0, error: new Error(error.message) };
    }
    
    // 3. Salvataggio dei dettagli dei prodotti venduti
    if (salesData.sold && salesData.sold.length > 0) {
      const soldProductsData = salesData.sold.map(item => ({
        restaurant_id: restaurantIdSupabase,
        report_date: new Date().toISOString(),
        product_id: item.idProduct,
        product_name: item.product?.description || 'Prodotto sconosciuto',
        quantity: item.quantity,
        profit: item.profit,
        percent_total: item.percentTotal,
        is_menu_entry: item.isMenuEntry || false,
        is_composition_entry: item.isCompositionEntry || false
      }));
      
      const { error: detailsError } = await supabase
        .from('sales_product_details')
        .insert(soldProductsData);
      
      if (detailsError) {
        console.warn('Errore durante il salvataggio dei dettagli dei prodotti venduti:', detailsError);
        return { 
          count: 1, 
          message: 'Dati di vendita importati con successo, ma si sono verificati errori nel salvataggio dei dettagli dei prodotti.',
          data: salesData 
        };
      }
    }
    
    console.log(`Importazione vendite completata con successo. Totale vendite: ${salesData.totalSold}`);
    return { 
      count: salesData.sold?.length || 0, 
      message: `Dati di vendita importati con successo. Totale vendite: ${salesData.totalSold}`,
      data: salesData 
    };
    
  } catch (error) {
    console.error('Errore durante l\'importazione delle vendite:', error);
    return { count: 0, error: error as Error };
  }
}