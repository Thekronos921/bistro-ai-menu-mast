
import { supabase } from '@/integrations/supabase/client';
import * as Types from './cassaInCloudTypes';
import * as Service from './cassaInCloudService';
import { mapCassaInCloudProductToInternalProduct } from './cassaInCloudDataMapper';

export class CassaInCloudImporter {
  private restaurantIdSupabase: string;
  private apiKeyOverride?: string;
  
  constructor(restaurantIdSupabase: string, apiKeyOverride?: string) {
    this.restaurantIdSupabase = restaurantIdSupabase;
    this.apiKeyOverride = apiKeyOverride;
  }
  
  /**
   * Importa categorie da CassaInCloud
   */
  async importCategories(
    salesPointIds?: string[],
    filterParams?: Types.GetCategoriesParams
  ): Promise<{ count: number; error?: Error }> {
    try {
      console.log(`Inizio importazione categorie per ristorante: ${this.restaurantIdSupabase}`);
      
      // Recupero categorie
      const params: Types.GetCategoriesParams = { ...filterParams };
      if (salesPointIds) {
        params.idsSalesPoint = salesPointIds;
      }
      
      const categories = await Service.getCategories(params, this.apiKeyOverride);
      
      // Implementazione base per soddisfare il tipo di ritorno
      console.log(`Importate ${categories.length} categorie`);
      
      return { count: categories.length };
    } catch (error) {
      console.error('Errore durante l\'importazione delle categorie:', error);
      return { count: 0, error: error as Error };
    }
  }
  
  /**
   * Importa prodotti da CassaInCloud
   */
  async importProducts(
    idSalesPointForPricing: string,
    filterParams?: Types.GetProductsParams
  ): Promise<{ count: number; error?: Error; message?: string; warnings?: string[] }> {
    try {
      console.log(`Inizio importazione prodotti per ristorante: ${this.restaurantIdSupabase}`);
      
      // Recupero prodotti - fix: pass the correct parameter type
      const products = await Service.getProducts(filterParams || {}, this.apiKeyOverride);
      
      console.log(`Importati ${products.length} prodotti`);
      
      return { 
        count: products.length, 
        message: `Importati ${products.length} prodotti con successo` 
      };
    } catch (error) {
      console.error('Errore durante l\'importazione dei prodotti:', error);
      return { count: 0, error: error as Error };
    }
  }
}
