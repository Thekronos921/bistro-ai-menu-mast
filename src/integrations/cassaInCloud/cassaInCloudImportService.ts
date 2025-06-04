
import { supabase } from '@/integrations/supabase/client';
import {
  getCategories,
  type CassaInCloudCategory,
  type GetCategoriesParams,
  getProducts, 
  type GetProductsParams,
  type CassaInCloudProduct 
} from './cassaInCloudService';
import { mapCassaInCloudProductToInternalProduct } from './cassaInCloudDataMapper';
import type { InternalProduct } from '@/types/internalProduct';

export async function importRestaurantCategoriesFromCassaInCloud(
  restaurantIdSupabase: string,
  cassaInCloudSalesPointIds?: string[],
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error }> {
  try {
    console.log(
      `Inizio importazione categorie da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );

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
      name: category.description,
      external_id: category.id,
      description: category.description,
    }));

    // 3. Eseguire l'upsert su Supabase
    const { data, error } = await supabase
      .from('restaurant_categories')
      .upsert(categoriesToUpsert, {
        onConflict: 'external_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Errore durante l'upsert delle categorie su Supabase:", error);
      throw error;
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
  idSalesPointForPricing: string,
  filterParams?: GetProductsParams,
  apiKeyOverride?: string
): Promise<{ count: number; error?: Error; message?: string; warnings?: string[] }> {
  const warnings: string[] = [];
  try {
    console.log(
      `Inizio importazione prodotti da CassaInCloud per ristorante Supabase: ${restaurantIdSupabase}`
    );
    console.log(`Utilizzando ID punto vendita per prezzatura: ${idSalesPointForPricing}`);
    if (filterParams) {
      console.log(`Utilizzando parametri di filtro aggiuntivi:`, filterParams);
    }

    // 1. Recuperare i prodotti da CassaInCloud
    const internalProductsFromCassa: InternalProduct[] = await getProducts(idSalesPointForPricing, filterParams, apiKeyOverride); 

    if (!internalProductsFromCassa || internalProductsFromCassa.length === 0) {
      console.log('Nessun prodotto trovato e mappato da CassaInCloud con i parametri forniti.');
      return { count: 0, message: 'Nessun prodotto trovato e mappato da CassaInCloud.' };
    }

    console.log(`Recuperati e mappati ${internalProductsFromCassa.length} prodotti da CassaInCloud.`);

    // 2. Preparare i dati per Supabase dalla lista di InternalProduct
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
          console.warn(`Errore durante la ricerca della categoria per external_id ${internalProduct.external_category_id}:`, categoryError);
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
        external_id: internalProduct.cassaInCloudId,
        name: internalProduct.name,
        selling_price: internalProduct.price,
        restaurant_category_id: restaurantCategoryId,
        restaurant_category_name: restaurantCategoryName,
        cic_notes: internalProduct.descriptionLabel,
        cic_department_name: internalProduct.departmentName,
        cic_has_variants: internalProduct.isMultivariant,
        is_enabled_for_restaurant: internalProduct.isEnabledForRestaurant,
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
        cic_vat_percentage: internalProduct.taxRate,
        cic_variants_count: internalProduct.variants?.length || 0,
      };
    }));

    // 3. Eseguire l'upsert su Supabase
    const { data: upsertedData, error: upsertError } = await supabase
      .from('dishes')
      .upsert(productsToUpsert, {
        onConflict: 'restaurant_id, external_id',
        ignoreDuplicates: false,
      })
      .select('id, external_id');

    if (upsertError) {
      console.error("Errore durante l'upsert dei prodotti su Supabase:", upsertError);
      throw upsertError;
    }

    const upsertedCount = upsertedData?.length || 0;
    console.log(`Completata importazione: ${upsertedCount} prodotti processati per il ristorante ${restaurantIdSupabase}.`);

    // 4. Gestire i prodotti non più esistenti in CassaInCloud
    if (upsertedData && upsertedData.length > 0) {
      const cicProductExternalIds = new Set(internalProductsFromCassa.map(p => p.cassaInCloudId));
      
      const { data: localDishes, error: localDishesError } = await supabase
        .from('dishes')
        .select('id, external_id')
        .eq('restaurant_id', restaurantIdSupabase)
        .not('external_id', 'is', null);

      if (localDishesError) {
        console.error("Errore nel recuperare i piatti locali per la verifica:", localDishesError);
      } else if (localDishes) {
        const dishesToUpdatePayloads = [];
        for (const localDish of localDishes) {
          if (localDish.external_id && !cicProductExternalIds.has(localDish.external_id)) {
            dishesToUpdatePayloads.push({
              id: localDish.id,
              availability_status: 'to_be_verified_cic_sync'
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
            }
          }
        }
      }
    }

    return { 
      count: upsertedCount, 
      message: `${upsertedCount} prodotti importati/aggiornati. Prodotti non più presenti in CassaInCloud sono stati marcati per verifica.`,
      warnings: warnings
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
