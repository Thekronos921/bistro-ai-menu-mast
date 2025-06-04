// Vecchio import:
// import { supabase } from '@/integrations/supabase/supabaseClient'; 

// Nuovo import corretto:
import { supabase } from '@/integrations/supabase/client'; // Assicurati che il percorso sia corretto
import { mapCassaInCloudProductToInternalProduct } from './cassaInCloudDataMapper';
import type { InternalProduct } from '@/types/internalProduct';

const CASSA_IN_CLOUD_BASE_URL = 'https://api.cassaincloud.it/v1';

export interface CassaInCloudCategory {
  id: string;
  description: string;
  // Aggiungi altri campi se necessario dal response API di CassaInCloud
}

export interface GetCategoriesParams {
  idsSalesPoint?: string[]; // Array di ID dei punti vendita per filtrare
  // Aggiungi altri parametri di filtro se necessario
}

export interface CassaInCloudProduct {
  id: string;
  description: string;
  descriptionLabel?: string; // Campo opzionale per etichette/note
  departmentName?: string;
  isSoldByWeight?: boolean;
  isMultivariant?: boolean;
  isEnabledForRestaurant?: boolean;
  taxRate?: number; // Percentuale IVA
  cicLastUpdate?: number; // Timestamp di ultimo aggiornamento
  variants?: CassaInCloudVariant[]; // Array di varianti prodotto
  // Aggiungi altri campi dal response API di CassaInCloud
  salesPoints?: CassaInCloudSalesPoint[]; // Punti vendita associati con prezzi
}

export interface CassaInCloudVariant {
  id: string;
  description: string;
  price?: number;
  // Altri campi varianti
}

export interface CassaInCloudSalesPoint {
  id: string;
  name: string;
  price?: number; // Prezzo per questo punto vendita
  // Altri campi punto vendita
}

export async function getCategories(
  params?: GetCategoriesParams,
  apiKey?: string
): Promise<CassaInCloudCategory[]> {
  try {
    console.log('Chiamata API per recuperare categorie da CassaInCloud');
    console.log('Parametri:', params);

    // Usa la API key fornita o prova a recuperarla dalle impostazioni di integrazione
    let useApiKey = apiKey;
    if (!useApiKey) {
      // Recupera la API key dalle impostazioni di integrazione se non fornita
      const { data: integrationData, error: integrationError } = await supabase
        .from('integration_settings')
        .select('api_key')
        .eq('integration_type', 'cassaincloud')
        .single();

      if (integrationError) {
        console.error('Errore nel recuperare la API key di integrazione:', integrationError);
        throw new Error('API key di CassaInCloud non configurata');
      }

      useApiKey = integrationData.api_key;
    }

    if (!useApiKey) {
      throw new Error('API key di CassaInCloud non trovata');
    }

    // Costruisci i parametri di query
    const queryParams = new URLSearchParams();
    if (params?.idsSalesPoint && params.idsSalesPoint.length > 0) {
      // Se specifici punti vendita sono richiesti, aggiungili come parametri
      params.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id));
    }

    const url = `${CASSA_IN_CLOUD_BASE_URL}/categories?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${useApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Errore API CassaInCloud: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Categorie recuperate da CassaInCloud:', data);
    
    return data || [];
  } catch (error) {
    console.error('Errore nel recuperare le categorie da CassaInCloud:', error);
    throw error;
  }
}

export async function getProducts(
  idSalesPointForPricing: string,
  apiKey?: string
): Promise<InternalProduct[]> {
  try {
    console.log('Chiamata API per recuperare prodotti da CassaInCloud');
    console.log('ID punto vendita per prezzatura:', idSalesPointForPricing);

    // Usa la API key fornita o prova a recuperarla dalle impostazioni di integrazione
    let useApiKey = apiKey;
    if (!useApiKey) {
      // Recupera la API key dalle impostazioni di integrazione se non fornita
      const { data: integrationData, error: integrationError } = await supabase
        .from('integration_settings')
        .select('api_key')
        .eq('integration_type', 'cassaincloud')
        .single();

      if (integrationError) {
        console.error('Errore nel recuperare la API key di integrazione:', integrationError);
        throw new Error('API key di CassaInCloud non configurata');
      }

      useApiKey = integrationData.api_key;
    }

    if (!useApiKey) {
      throw new Error('API key di CassaInCloud non trovata');
    }

    // Costruisci l'URL per recuperare i prodotti
    const url = `${CASSA_IN_CLOUD_BASE_URL}/products`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${useApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Errore API CassaInCloud: ${response.status} ${response.statusText}`);
    }

    const data: CassaInCloudProduct[] = await response.json();
    console.log('Prodotti recuperati da CassaInCloud:', data);
    
    // Mappa i prodotti di CassaInCloud a InternalProduct usando il mapper
    const mappedProducts: InternalProduct[] = data.map(cicProduct => 
      mapCassaInCloudProductToInternalProduct(cicProduct, idSalesPointForPricing)
    );

    console.log('Prodotti mappati a InternalProduct:', mappedProducts);
    return mappedProducts;
  } catch (error) {
    console.error('Errore nel recuperare i prodotti da CassaInCloud:', error);
    throw error;
  }
}

// Esporta tutte le interfacce e funzioni necessarie
export type {
  CassaInCloudProduct,
  CassaInCloudVariant,
  CassaInCloudSalesPoint
};
