// Importa le interfacce interne
import { InternalProduct, InternalProductVariant } from '@/types/internalProduct';

// Importa la funzione di mapping
import { mapCassaInCloudProductToInternalProduct } from './cassaInCloudDataMapper';

// Importa le interfacce dal file dei tipi
import { 
  AccessTokenResponse,
  StoredToken,
  CassaInCloudCurrency, 
  CassaInCloudSalesPoint, 
  CassaInCloudProduct,
  CassaInCloudCategory,
  CassaInCloudDepartment,
  CassaInCloudPrice,
  CassaInCloudProductVariantAPI,
  CassaInCloudStock,
  CassaInCloudSoldByProduct,
  GetProductsParams, 
  GetCategoriesParams,
  GetSoldByProductParams,
  GetSoldByProductApiResponse,
  GetCategoriesApiResponse,
  GetProductsApiResponse,
  GetStockApiResponse,
  GetSalesPointsApiResponse,
  GetCustomersParams, // Aggiunto
  GetCustomersApiResponse, // Aggiunto
  CassaInCloudCustomer, // Aggiunto
  GetReceiptsParams, // Aggiunto per ricevute
  GetReceiptsApiResponse, // Aggiunto per ricevute
} from './cassaInCloudTypes';

// Recuperiamo la chiave API e l'URL dell'API dalle variabili d'ambiente
const apiKey = import.meta.env.VITE_CASSA_IN_CLOUD_API_KEY;
const apiUrl = import.meta.env.VITE_CASSA_IN_CLOUD_API_URL || 'https://api.cassanova.com';

// Variabile per conservare il token in memoria (per non richiederlo ogni volta)
let storedAccessToken: StoredToken | null = null;
let lastUsedApiKeyForToken: string | null = null; // Traccia l'API key usata per il token corrente

// Le interfacce CassaInCloud sono ora importate da cassaInCloudTypes.ts

// Le interfacce per le risposte API sono ora importate da cassaInCloudTypes.ts

/**
 * Ottiene un token di accesso da Cassa In Cloud.
 * Se un token valido è già presente e non è scaduto, restituisce quello.
 * Altrimenti, ne richiede uno nuovo.
 * @param apiKeyOverride - Opzionale: una chiave API da usare al posto di quella nelle variabili d'ambiente.
 */
export const getAccessToken = async (apiKeyOverride?: string): Promise<string | null> => {
  const effectiveApiKey = apiKeyOverride || apiKey;

  // Controlla se abbiamo un token, se è ancora valido E se è stato generato con la stessa API key
  if (storedAccessToken && storedAccessToken.expiresAt > Date.now() && lastUsedApiKeyForToken === effectiveApiKey) {
    console.log('Using stored Cassa In Cloud access token (same API key)');
    return storedAccessToken.token;
  }
  // Se la chiave API è cambiata, invalidiamo il token precedente
  if (lastUsedApiKeyForToken !== effectiveApiKey) {
    console.log('API key changed, invalidating previous token.');
    storedAccessToken = null;
  }

  if (!effectiveApiKey) {
    console.error('Cassa In Cloud API key is not configured. Please set VITE_CASSA_IN_CLOUD_API_KEY in your .env file or provide one.');
    return null;
  }

  const tokenUrl = `${apiUrl}/apikey/token`;

  try {
    console.log('Requesting new Cassa In Cloud access token...');
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': '*', // Come da documentazione Cassa In Cloud
      },
      body: JSON.stringify({ apiKey: effectiveApiKey }),
    });

    if (!response.ok) {
      // Se la risposta non è OK (es. errore 400, 401, 500)
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('Error fetching Cassa In Cloud access token:', response.status, response.statusText, errorData);
      throw new Error(`Failed to fetch Cassa In Cloud access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as AccessTokenResponse;
    
    // Calcoliamo quando il token scadrà (aggiungiamo un piccolo buffer di 5 minuti per sicurezza)
    const expiresInMilliseconds = (data.expires_in - 300) * 1000; // 300 secondi = 5 minuti
    storedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + expiresInMilliseconds,
    };
    lastUsedApiKeyForToken = effectiveApiKey; // Memorizza l'API key usata per questo token

    console.log('Successfully obtained new Cassa In Cloud access token.');
    return storedAccessToken.token;

  } catch (error) {
    console.error('Exception while fetching Cassa In Cloud access token:', error);
    storedAccessToken = null; // Resetta il token in caso di errore
    return null;
  }
};


/**
 * Recupera l'elenco delle categorie da Cassa In Cloud, gestendo la paginazione.
 */
export const getCategories = async (params?: GetCategoriesParams, apiKeyOverride?: string): Promise<CassaInCloudCategory[]> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get categories without an access token.');
    return [];
  }

  let allCategories: CassaInCloudCategory[] = [];
  let start = 0;
  const limit = 50; // Limite per richiesta, l'API potrebbe avere un massimo (es. 100)
  let totalCount = 0;
  let fetchedCount = 0;

  console.log('Starting to fetch all categories from Cassa In Cloud...');

  try {
    do {
      const categoriesUrl = new URL(`${apiUrl}/categories`);
      categoriesUrl.searchParams.append('start', start.toString());
      categoriesUrl.searchParams.append('limit', limit.toString());

      // Aggiungi parametri opzionali dalla funzione
      if (params?.idsSalesPoint && params.idsSalesPoint.length > 0) {
        categoriesUrl.searchParams.append('idsSalesPoint', JSON.stringify(params.idsSalesPoint.map(id => Number(id))));
      }
      if (params?.description) {
        categoriesUrl.searchParams.append('description', params.description);
      }
      if (params?.lastUpdateFrom) {
        categoriesUrl.searchParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
      }
      if (params?.lastUpdateTo) {
        categoriesUrl.searchParams.append('lastUpdateTo', params.lastUpdateTo.toString());
      }
      if (params?.enabledForChannels && params.enabledForChannels.length > 0) {
        categoriesUrl.searchParams.append('enabledForChannels', JSON.stringify(params.enabledForChannels));
      }
      if (params?.itemListVisibility !== undefined) {
        categoriesUrl.searchParams.append('itemListVisibility', params.itemListVisibility.toString());
      }

      console.log(`Fetching categories from ${categoriesUrl.toString()}...`);

      const response = await fetch(categoriesUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Version': '1.0.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching categories at start=${start}: ${response.status} - ${response.statusText}. Response body:`, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Error details (JSON):', errorJson);
        } catch (e) { /* Non era JSON */ }
        break; 
      }

      const responseData = await response.json() as GetCategoriesApiResponse;

      if (responseData && Array.isArray(responseData.categories)) {
        allCategories = allCategories.concat(responseData.categories);
        fetchedCount += responseData.categories.length;

        if (start === 0 && responseData.totalCount !== undefined) {
          totalCount = responseData.totalCount;
          console.log(`Total categories available: ${totalCount}`);
        }

        console.log(`Fetched ${responseData.categories.length} categories in this batch. Total fetched so far: ${fetchedCount}`);

        if (responseData.categories.length < limit || (totalCount > 0 && fetchedCount >= totalCount)) {
          break; 
        }
        start += limit;
      } else {
        console.error('Unexpected response structure or no categories array at start=', start, responseData);
        break;
      }
    } while ((totalCount === 0 && fetchedCount > 0 && (fetchedCount % limit === 0)) || (totalCount > 0 && fetchedCount < totalCount));

    console.log(`Finished fetching CassaInCloud categories. Total categories fetched: ${allCategories.length}`);
    return allCategories;

  } catch (error) {
    console.error('Exception while fetching categories:', error);
    return [];
  }
};

// Esempio di come potresti testare questa funzione (puoi rimuoverlo o commentarlo dopo)
// const testToken = async () => {
//   const token = await getAccessToken();
//   if (token) {
//     console.log('Access Token:', token);
//   } else {
//     console.log('Failed to get access token.');
//   }
// };
// testToken(); // Chiamata di test

/**
 * Recupera l'elenco dei prodotti da Cassa In Cloud, gestendo la paginazione per ottenere tutti i prodotti.
 */
// Rimuoviamo la vecchia implementazione di getProducts che restituiva CassaInCloudProduct[]
// export const getProducts = async (): Promise<CassaInCloudProduct[]> => { ... };

// Manteniamo solo questa versione di getProducts che restituisce InternalProduct[]
export const getProducts = async (
  idSalesPoint: string,
  filterParams?: GetProductsParams, // Parametro aggiunto
  apiKeyOverride?: string
): Promise<InternalProduct[]> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get products without an access token.');
    return [];
  }

  let allProducts: CassaInCloudProduct[] = []; // Nome corretto della variabile
  let start = 0;
  const limit = filterParams?.limit || 50;
  let totalCount = 0;
  let fetchedCount = 0;

  console.log('Starting to fetch all products from Cassa In Cloud...');

  try {
    do {
      // Costruiamo l'URL con i parametri di base
      const urlParams = new URLSearchParams();
      urlParams.append('start', start.toString());
      urlParams.append('limit', limit.toString());
      
      // Aggiungiamo i parametri di filtro se presenti
      if (filterParams) {
        if (filterParams.categoryId) urlParams.append('idCategory', filterParams.categoryId);
        if (filterParams.searchTerm) urlParams.append('description', filterParams.searchTerm);
        if (filterParams.idCategories && filterParams.idCategories.length > 0) {
          filterParams.idCategories.forEach(id => urlParams.append('idCategories[]', id));
        }
        if (filterParams.idDepartments && filterParams.idDepartments.length > 0) {
          filterParams.idDepartments.forEach(id => urlParams.append('idDepartments[]', id));
        }
        if (filterParams.idsSalesPoint && filterParams.idsSalesPoint.length > 0) {
          filterParams.idsSalesPoint.forEach(id => urlParams.append('idsSalesPoint[]', id));
        }
        if (filterParams.lastUpdateFrom) urlParams.append('lastUpdateFrom', filterParams.lastUpdateFrom.toString());
        if (filterParams.lastUpdateTo) urlParams.append('lastUpdateTo', filterParams.lastUpdateTo.toString());
        if (filterParams.enabledForChannels && filterParams.enabledForChannels.length > 0) {
          filterParams.enabledForChannels.forEach(channel => urlParams.append('enabledForChannels[]', channel));
        }
        if (filterParams.itemListVisibility !== undefined) urlParams.append('itemListVisibility', filterParams.itemListVisibility.toString());
      }
      
      const productsUrl = `${apiUrl}/products?${urlParams.toString()}`;
      console.log(`Fetching products from ${productsUrl}...`);

      const response = await fetch(productsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Requested-With': '*',
          'X-Version': '1.0.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching products at start=${start}: ${response.status} - ${response.statusText}. Response body:`, errorText);
        break;
      }

      const responseData = await response.json();

      if (responseData && Array.isArray(responseData.products)) {
        const currentProducts = responseData.products as CassaInCloudProduct[];
        allProducts = allProducts.concat(currentProducts);
        fetchedCount += currentProducts.length;

        if (start === 0 && responseData.totalCount !== undefined) {
          totalCount = responseData.totalCount;
          console.log(`Total products available: ${totalCount}`);
        }
        
        console.log(`Fetched ${currentProducts.length} products in this batch. Total fetched so far: ${fetchedCount}`);

        if (currentProducts.length < limit || (totalCount > 0 && fetchedCount >= totalCount)) {
          break;
        }

        start += limit;
      } else {
        console.error('Unexpected response structure or no products array at start=', start, responseData);
        break; 
      }

    } while ((totalCount === 0 && fetchedCount > 0 && (fetchedCount % limit === 0)) || (totalCount > 0 && fetchedCount < totalCount));

    console.log(`Finished fetching CassaInCloud products. Total products fetched: ${allProducts.length}`);

    // Logica di arricchimento e mappatura spostata qui DENTRO il blocco try
    // SEZIONE DI ARRICCHIMENTO STOCK COMMENTATA COME RICHIESTO
    /*
    if (allProducts.length > 0 && idSalesPoint) {
      console.log(`Enriching ${allProducts.length} products with stock information for sales point ${idSalesPoint}...`);
      const enrichedProductsPromises = allProducts.map(async (cicProduct) => {
        const internalProduct = mapCassaInCloudProductToInternalProduct(cicProduct);
        try {
          const stockInfo = await getProductStock(idSalesPoint, cicProduct.id);
          if (stockInfo) {
            internalProduct.stockQuantity = stockInfo.quantity;
            internalProduct.stockUnit = stockInfo.unit;
            internalProduct.warningLevel = stockInfo.warningLevel;
            // internalProduct.lastStockUpdate = stockInfo.lastUpdate; // Se disponibile
            // internalProduct.manageStock = stockInfo.manageStock; // Se disponibile
          }
        } catch (stockError) {
          console.error(`Error fetching stock for product ${cicProduct.id}:`, stockError);
          // Continua senza informazioni di stock per questo prodotto se c'è un errore
        }
        return internalProduct;
      });

      const internalProducts = await Promise.all(enrichedProductsPromises);
      console.log('Products enriched with stock information:', internalProducts.slice(0, 2));
      return internalProducts;

    } else */
    // Modifica: Mappiamo sempre i prodotti senza arricchimento stock se ci sono prodotti
    if (allProducts.length > 0) {
      console.warn('idSalesPoint not provided to getProducts, or no products fetched. Skipping stock enrichment.');
      // Mappa senza arricchimento stock se idSalesPoint non è fornito o non ci sono prodotti
      const internalProducts = allProducts.map(mapCassaInCloudProductToInternalProduct);
      console.log(`Successfully mapped ${internalProducts.length} products to internal format without stock enrichment.`);
      return internalProducts;
    }

    return []; // Ritorna array vuoto se non ci sono prodotti dopo i tentativi di fetch

  } catch (error) {
    console.error('Exception while fetching or processing products:', error);
    // In caso di errore catastrofico, ritorna un array vuoto o gestisci diversamente
    // Potresti voler comunque mappare i prodotti parzialmente recuperati, se `allProducts` ne contiene
    if (allProducts.length > 0) {
        console.warn('Attempting to map partially fetched products due to an error.');
        const internalProducts = allProducts.map(mapCassaInCloudProductToInternalProduct);
        return internalProducts; 
    }
    return [];
  }
}; // Questa è la chiusura corretta della funzione getProducts

/**
 * Recupera il report dei prodotti venduti da Cassa In Cloud.
 */
export const getSoldByProductReport = async (params: GetSoldByProductParams, apiKeyOverride?: string): Promise<GetSoldByProductApiResponse | null> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  console.log('Retrieved accessToken:', accessToken); // <-- AGGIUNGI QUESTO LOG

  if (!accessToken) {
    console.error('Cannot get sold by product report without a valid access token. accessToken is null or empty.');
    return null;
  }

  const reportUrl = new URL(`${apiUrl}/reports/sold/products`);

  // Aggiungi i parametri obbligatori
  reportUrl.searchParams.append('start', params.start.toString());
  reportUrl.searchParams.append('limit', params.limit.toString());
  // Per datetimeFrom e datetimeTo, l'API si aspetta un timestamp o una stringa YYYY-MM-DD.
  // Non aggiungere virgolette extra nell'URL, poiché l'API gestisce già la formattazione
  reportUrl.searchParams.append('datetimeFrom', typeof params.datetimeFrom === 'number' 
    ? params.datetimeFrom.toString() 
    : `"${params.datetimeFrom}"`);
  reportUrl.searchParams.append('datetimeTo', typeof params.datetimeTo === 'number' 
    ? params.datetimeTo.toString() 
    : `"${params.datetimeTo}"`);

  // TEMPORANEAMENTE COMMENTATI PER DEBUG
  /*
  if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
    reportUrl.searchParams.append('idsSalesPoint', JSON.stringify(params.idsSalesPoint.map(id => Number(id))));
  }
  if (params.idProducts && params.idProducts.length > 0) {
    reportUrl.searchParams.append('idProducts', JSON.stringify(params.idProducts.map(id => String(id))));
  }
  if (params.idDepartments && params.idDepartments.length > 0) {
    reportUrl.searchParams.append('idDepartments', JSON.stringify(params.idDepartments.map(id => String(id))));
  }
  if (params.idCategories && params.idCategories.length > 0) {
    reportUrl.searchParams.append('idCategories', JSON.stringify(params.idCategories.map(id => String(id))));
  }
  */

  // TODO: Gestire 'sorts' se necessario. La sua struttura complessa (array di oggetti) 
  // potrebbe richiedere una serializzazione personalizzata o l'invio nel corpo della richiesta se l'API lo supporta per GET con corpo.
  // Per ora, lo omettiamo se inviato come query param semplice.
  // if (params.sorts && params.sorts.length > 0) {
  //   reportUrl.searchParams.append('sorts', JSON.stringify(params.sorts)); // Questo potrebbe non funzionare a seconda di come l'API si aspetta i parametri complessi
  // }

  console.log(`Fetching sold by product report from ${reportUrl.toString()}...`);

  try {
    const headers = {
      'Authorization': `Bearer ${accessToken}`, 
      'Content-Type': 'application/json',
      'X-Version': '1.0.0'
    };
    console.log('Request Headers being sent:', JSON.stringify(headers, null, 2)); // Log già presente, ma utile
    console.log('Request URL:', reportUrl.toString()); // Già presente
    
    const response = await fetch(reportUrl.toString(), {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching sold by product report: ${response.status} - ${response.statusText}. Response body:`, errorText);
      // Prova a parsare come JSON se possibile per ottenere più dettagli sull'errore
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details (JSON):', errorJson);
      } catch (e) {
        // Non era JSON, va bene così
      }
      return null;
    }

    const responseData = await response.json() as GetSoldByProductApiResponse;
    console.log('Successfully fetched sold by product report:', responseData);
    return responseData;

  } catch (error) {
    console.error('Exception while fetching sold by product report:', error);
    return null;
  }
};


// Le interfacce per i report di vendita e lo stock sono ora importate da cassaInCloudTypes.ts

// Le interfacce per i punti vendita sono ora importate da cassaInCloudTypes.ts

/**
 * Recupera i clienti da CassaInCloud.
 * @param params Parametri per la richiesta API.
 * @param apiKeyOverride API key opzionale per sovrascrivere quella di default.
 * @returns Una Promise che risolve con la lista dei clienti.
 */
export async function getCustomers(
  params: GetCustomersParams,
  apiKeyOverride?: string
): Promise<CassaInCloudCustomer[]> {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get customers without an access token.');
    return [];
  }

  let allCustomers: CassaInCloudCustomer[] = [];
  let start = params.start;
  const limit = params.limit;
  let totalCount = 0;
  let fetchedCount = 0;

  console.log('Starting to fetch all customers from Cassa In Cloud...');

  try {
    do {
      const urlParams = new URLSearchParams();
      urlParams.append('start', start.toString());
      urlParams.append('limit', limit.toString());

      // Aggiungi altri parametri opzionali dalla funzione
      if (params.sorts) urlParams.append('sorts', JSON.stringify(params.sorts));
      if (params.ids) urlParams.append('ids', JSON.stringify(params.ids));
      if (params.vatNumber) urlParams.append('vatNumber', params.vatNumber);
      if (params.fiscalCode) urlParams.append('fiscalCode', params.fiscalCode);
      if (params.name) urlParams.append('name', params.name);
      if (params.email) urlParams.append('email', params.email);
      if (params.idsOrganization) urlParams.append('idsOrganization', JSON.stringify(params.idsOrganization));
      if (params.lastUpdateFrom) urlParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
      if (params.lastUpdateTo) urlParams.append('lastUpdateTo', params.lastUpdateTo.toString());

      const customersUrl = `${apiUrl}/customers?${urlParams.toString()}`;
      console.log(`Fetching customers from ${customersUrl}...`);

      const response = await fetch(customersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Version': '1.0.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching customers at start=${start}: ${response.status} - ${response.statusText}. Response body:`, errorText);
        break;
      }

      const responseData = await response.json() as GetCustomersApiResponse;

      if (responseData && Array.isArray(responseData.customers)) {
        allCustomers = allCustomers.concat(responseData.customers);
        fetchedCount += responseData.customers.length;

        if (start === params.start && responseData.totalCount !== undefined) {
          totalCount = responseData.totalCount;
          console.log(`Total customers available: ${totalCount}`);
        }

        console.log(`Fetched ${responseData.customers.length} customers in this batch. Total fetched so far: ${fetchedCount}`);

        if (responseData.customers.length < limit || (totalCount > 0 && fetchedCount >= totalCount)) {
          break;
        }
        start += limit;
      } else {
        console.error('Unexpected response structure or no customers array at start=', start, responseData);
        break;
      }
    } while ((totalCount === 0 && fetchedCount > 0 && (fetchedCount % limit === 0)) || (totalCount > 0 && fetchedCount < totalCount));

    console.log(`Finished fetching CassaInCloud customers. Total customers fetched: ${allCustomers.length}`);
    return allCustomers;

  } catch (error) {
    console.error('Exception while fetching customers:', error);
    return [];
  }
}


/**
 * Recupera le informazioni di stock per un prodotto specifico in un dato punto vendita.
 */
export const getProductStock = async (idSalesPoint: string, idProduct: string, idVariant?: string, apiKeyOverride?: string): Promise<CassaInCloudStock | null> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get product stock without an access token.');
    return null;
  }

  // Imposta i parametri di paginazione obbligatori
  const start = 0;
  const limit = 10; // Un limite ragionevole per recuperare lo stock di un prodotto specifico

  // Costruisci l'URL di base per lo stock con i parametri obbligatori
  let stockUrl = `${apiUrl}/stocks/${idSalesPoint}?idProduct=${idProduct}&start=${start}&limit=${limit}`;

  // Se idVariant è fornito, aggiungilo come parametro di query
  if (idVariant) {
    stockUrl += `&idProductVariant=${idVariant}`;
  }

  console.log(`Fetching stock for product ${idProduct}${idVariant ? ` (variant: ${idVariant})` : ''} at sales point ${idSalesPoint} from ${stockUrl}`);

  try {
    const response = await fetch(stockUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Requested-With': '*',
        'X-Version': '1.0.0', // Aggiunto header X-Version
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching stock for product ${idProduct}: ${response.status} - ${response.statusText}. Response:`, errorText);
      // Potrebbe essere che il prodotto non ha stock o l'endpoint è errato.
      // Restituire null in caso di errore 404 (Not Found) potrebbe essere appropriato se significa "no stock info".
      if (response.status === 404) {
        console.warn(`Stock information not found for product ${idProduct} at sales point ${idSalesPoint}. Assuming no stock or not managed.`);
        return null;
      }
      return null; // O lanciare un errore a seconda di come vuoi gestire gli errori di API
    }

    const stockData = await response.json(); // Il tipo di `stockData` dipenderà dalla risposta reale dell'API
    
    // Esempio di mappatura (DA ADATTARE ALLA RISPOSTA REALE DELL'API):
    // Se l'API restituisce direttamente l'oggetto CassaInCloudStock:
    // return stockData as CassaInCloudStock;

    // Se l'API restituisce un array dentro a 'data' (improbabile per un singolo prodotto):
    // if (stockData.data && stockData.data.length > 0) {
    //   return stockData.data[0] as CassaInCloudStock;
    // }

    // Se l'API ha una struttura diversa, adatta la mappatura qui.
    // Ad esempio, se l'oggetto stock è direttamente la risposta:
    const mappedStock: CassaInCloudStock = {
        idProduct: stockData.id_product || idProduct, // Assumendo che l'API ritorni id_product
        idSalesPoint: stockData.id_sales_point || idSalesPoint,
        idVariant: stockData.id_variant || idVariant,
        quantity: stockData.quantity_available || stockData.quantity, // Adatta i nomi dei campi
        unit: stockData.measurement_unit || stockData.unit || 'PZ', // Adatta e fornisci un default
        warningLevel: stockData.warning_level,
        lastUpdate: stockData.last_update_timestamp,
        manageStock: stockData.is_stock_managed
    };
    console.log(`Stock data received for product ${idProduct}:`, mappedStock);
    return mappedStock;

  } catch (error) {
    console.error(`Exception while fetching stock for product ${idProduct}:`, error);
    return null;
  }
};

/**
 * Recupera l'elenco dei punti vendita da Cassa In Cloud.
 * @param apiKeyOverride - Opzionale: una chiave API da usare per ottenere il token.
 */
export const getSalesPoints = async (apiKeyOverride?: string): Promise<CassaInCloudSalesPoint[]> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get sales points without an access token.');
    return [];
  }

  const salesPointsUrl = `${apiUrl}/salespoint`; // Endpoint suggerito dall'utente
  console.log(`Fetching sales points from ${salesPointsUrl}...`);

  try {
    const response = await fetch(salesPointsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Requested-With': '*',
        'X-Version': '1.0.0', // O la versione API appropriata
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching sales points: ${response.status} - ${response.statusText}. Response:`, errorText);
      return [];
    }

    const responseData = await response.json() as GetSalesPointsApiResponse;
    if (responseData && responseData.salesPoint && Array.isArray(responseData.salesPoint)) {
      return responseData.salesPoint.map(point => ({
        city: point.city,
        country: point.country,
        currency: point.currency,
        description: point.description,
        district: point.district,
        email: point.email,
        id: point.id,
        latitude: point.latitude,
        logoBig: point.logoBig,
        logoSmall: point.logoSmall,
        longitude: point.longitude,
        name: point.name,
        phoneNumber: point.phoneNumber,
        street: point.street,
        taxCode: point.taxCode,
        vatNumber: point.vatNumber,
        zipcode: point.zipcode
      }));
    }
    console.error('Unexpected response structure for sales points or salesPoint array is missing:', responseData);
    return [];
  } catch (error) {
    console.error('Exception while fetching sales points:', error);
    return [];
  }
};

// Le funzioni sono già esportate individualmente sopra

/**
 * Recupera l'elenco delle sale da Cassa In Cloud.
 * @param params Parametri per la richiesta delle sale.
 * @param apiKeyOverride Opzionale: una chiave API da usare per ottenere il token.
 */
export const getRooms = async (params: GetRoomsParams, apiKeyOverride?: string): Promise<GetRoomsApiResponse | null> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get rooms without an access token.');
    return null;
  }

  const roomsUrl = new URL(`${apiUrl}/risto/rooms`);
  roomsUrl.searchParams.append('start', params.start.toString());
  roomsUrl.searchParams.append('limit', params.limit.toString());
  // idsSalesPoint è obbligatorio per l'API delle sale
  const salesPointIds = params.idsSalesPoint && params.idsSalesPoint.length > 0 
    ? params.idsSalesPoint.map(id => Number(id))
    : [1]; // Valore di default se non specificato
  roomsUrl.searchParams.append('idsSalesPoint', JSON.stringify(salesPointIds));
  if (params.sorts && params.sorts.length > 0) {
    roomsUrl.searchParams.append('sorts', JSON.stringify(params.sorts));
  }

  console.log(`Fetching rooms from ${roomsUrl.toString()}...`);

  try {
    const response = await fetch(roomsUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Version': '1.0.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching rooms: ${response.status} - ${response.statusText}. Response body:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details (JSON):', errorJson);
      } catch (e) { /* Non era JSON */ }
      return null;
    }

    const responseData = await response.json() as GetRoomsApiResponse;
    console.log('Successfully fetched rooms:', responseData);
    return responseData;

  } catch (error) {
    console.error('Exception while fetching rooms:', error);
    return null;
  }
};

/**
 * Recupera l'elenco dei tavoli da Cassa In Cloud.
 * @param params Parametri per la richiesta dei tavoli.
 * @param apiKeyOverride Opzionale: una chiave API da usare per ottenere il token.
 */
export const getTables = async (params: GetTablesParams, apiKeyOverride?: string): Promise<GetTablesApiResponse | null> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get tables without an access token.');
    return null;
  }

  const tablesUrl = new URL(`${apiUrl}/risto/tables`);
  tablesUrl.searchParams.append('start', params.start.toString());
  tablesUrl.searchParams.append('limit', params.limit.toString());
  // idsSalesPoint è obbligatorio per l'API dei tavoli
  const salesPointIds = params.idsSalesPoint && params.idsSalesPoint.length > 0 
    ? params.idsSalesPoint.map(id => Number(id))
    : [1]; // Valore di default se non specificato
  tablesUrl.searchParams.append('idsSalesPoint', JSON.stringify(salesPointIds));
  if (params.idsRoom && params.idsRoom.length > 0) {
    tablesUrl.searchParams.append('idsRoom', JSON.stringify(params.idsRoom.map(id => Number(id))));
  }
  if (params.sorts && params.sorts.length > 0) {
    tablesUrl.searchParams.append('sorts', JSON.stringify(params.sorts));
  }

  console.log(`Fetching tables from ${tablesUrl.toString()}...`);

  try {
    const response = await fetch(tablesUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Version': '1.0.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching tables: ${response.status} - ${response.statusText}. Response body:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details (JSON):', errorJson);
      } catch (e) { /* Non era JSON */ }
      return null;
    }

    const responseData = await response.json() as GetTablesApiResponse;
    console.log('Successfully fetched tables:', responseData);
    return responseData;

  } catch (error) {
    console.error('Exception while fetching tables:', error);
    return null;
  }
};

/**
 * Recupera l'elenco delle ricevute da Cassa In Cloud, gestendo la paginazione.
 * @param params Parametri per la richiesta delle ricevute.
 * @param apiKeyOverride Opzionale: una chiave API da usare per ottenere il token.
 */
export const getReceipts = async (params: GetReceiptsParams, apiKeyOverride?: string): Promise<GetReceiptsApiResponse | null> => {
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get receipts without an access token.');
    return null;
  }

  let allReceipts: any[] = []; // Utilizzeremo CassaInCloudReceipt[] ma l'API potrebbe restituire una struttura diversa
  let start = params.start || 0;
  const limit = params.limit || 50;
  let totalCount = 0;
  let fetchedCount = 0;

  console.log('Starting to fetch receipts from Cassa In Cloud...');

  try {
    do {
      const receiptsUrl = new URL(`${apiUrl}/documents/receipts`);
      // Aggiungi parametri obbligatori
      receiptsUrl.searchParams.append('start', start.toString());
      receiptsUrl.searchParams.append('limit', limit.toString());
      const dtFrom = new Date(params.datetimeFrom);
      const dtTo = new Date(params.datetimeTo);
      const formatDateString = (date: string | number) => {
        if (typeof date === "string") {
          if (date.startsWith('"') && date.endsWith('"')) return date;
          return '"' + date.slice(0, 10) + '"';
        }
        const d = new Date(date);
        return '"' + d.toISOString().slice(0, 10) + '"';
      };
      receiptsUrl.searchParams.append('datetimeFrom', formatDateString(params.datetimeFrom));
      receiptsUrl.searchParams.append('datetimeTo', formatDateString(params.datetimeTo));
      if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
        receiptsUrl.searchParams.append('idsSalesPoint', JSON.stringify(params.idsSalesPoint.map(id => Number(id))));
      }
      if (params.idCustomers && params.idCustomers.length > 0) {
        receiptsUrl.searchParams.append('idCustomers', JSON.stringify(params.idCustomers));
      }
      if (params.numbers && params.numbers.length > 0) {
        receiptsUrl.searchParams.append('numbers', JSON.stringify(params.numbers));
      }
      if (params.idOrganizations && params.idOrganizations.length > 0) {
        receiptsUrl.searchParams.append('idOrganizations', JSON.stringify(params.idOrganizations));
      }
      if (params.sorts && params.sorts.length > 0) {
        receiptsUrl.searchParams.append('sorts', JSON.stringify(params.sorts));
      }
      if (params.calculatedAmount !== undefined) {
        receiptsUrl.searchParams.append('calculatedAmount', params.calculatedAmount ? 'true' : 'false');
      }
      if (params.idDocumentNumbering && params.idDocumentNumbering.length > 0) {
        receiptsUrl.searchParams.append('idDocumentNumbering', JSON.stringify(params.idDocumentNumbering.map(id => Number(id))));
      }
      if (params.numberFrom !== undefined) {
        receiptsUrl.searchParams.append('numberFrom', params.numberFrom.toString());
      }
      if (params.numberTo !== undefined) {
        receiptsUrl.searchParams.append('numberTo', params.numberTo.toString());
      }
      if (params.zNumber !== undefined) {
        receiptsUrl.searchParams.append('zNumber', params.zNumber.toString());
      }
      if (params.idUserFO !== undefined) {
        receiptsUrl.searchParams.append('idUserFO', params.idUserFO.toString());
      }
      if (params.idDevice !== undefined) {
        receiptsUrl.searchParams.append('idDevice', params.idDevice.toString());
      }
      if (params.idCustomer) {
        receiptsUrl.searchParams.append('idCustomer', params.idCustomer);
      }
      if (params.idFidelityCard) {
        receiptsUrl.searchParams.append('idFidelityCard', params.idFidelityCard);
      }
      if (params.lotteryCode) {
        receiptsUrl.searchParams.append('lotteryCode', params.lotteryCode);
      }
      if (params.sorts && params.sorts.length > 0) {
        receiptsUrl.searchParams.append('sorts', JSON.stringify(params.sorts));
      }

      console.log(`Fetching receipts from ${receiptsUrl.toString()}...`);

      const response = await fetch(receiptsUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Version': '1.0.0', // O la versione API appropriata
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching receipts at start=${start}: ${response.status} - ${response.statusText}. Response body:`, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Error details (JSON):', errorJson);
        } catch (e) { /* Non era JSON */ }
        return null; // Interrompi in caso di errore
      }

      const responseData = await response.json() as GetReceiptsApiResponse;

      if (responseData && Array.isArray(responseData.receipts)) {
        allReceipts = allReceipts.concat(responseData.receipts);
        fetchedCount += responseData.receipts.length;

        if (start === 0 && responseData.totalCount !== undefined) {
          totalCount = responseData.totalCount;
          console.log(`Total receipts available: ${totalCount}`);
        }

        console.log(`Fetched ${responseData.receipts.length} receipts in this batch. Total fetched so far: ${fetchedCount}`);

        if (responseData.receipts.length < limit || (totalCount > 0 && fetchedCount >= totalCount)) {
          break;
        }
        start += limit;
      } else {
        console.error('Unexpected response structure or no receipts array at start=', start, responseData);
        break;
      }
    } while ((totalCount === 0 && fetchedCount > 0 && (fetchedCount % limit === 0)) || (totalCount > 0 && fetchedCount < totalCount));

    console.log(`Finished fetching CassaInCloud receipts. Total receipts fetched: ${allReceipts.length}`);
    return {
      currency: allReceipts.length > 0 ? (allReceipts[0] as any).document?.currency || { code: 'EUR', name: 'Euro', numberOfDecimals: 2, id: 0 } : { code: 'EUR', name: 'Euro', numberOfDecimals: 2, id: 0 }, // Estrai la valuta se disponibile o usa un default
      totalCount: totalCount || allReceipts.length,
      receipts: allReceipts, // Qui dovrebbero essere CassaInCloudReceipt[]
      start: params.start || 0,
      limit: limit
    };

  } catch (error) {
    console.error('Exception while fetching Cassa In Cloud receipts:', error);
    return null;
  }
};