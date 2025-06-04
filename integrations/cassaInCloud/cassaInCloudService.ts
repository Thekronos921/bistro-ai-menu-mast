// Recuperiamo la chiave API e l'URL dell'API dalle variabili d'ambiente
const apiKey = import.meta.env.VITE_CASSA_IN_CLOUD_API_KEY;
const apiUrl = import.meta.env.VITE_CASSA_IN_CLOUD_API_URL || 'https://api.cassanova.com';

// Definiamo una struttura (interfaccia) per la risposta che ci aspettiamo dal server quando richiediamo il token
interface AccessTokenResponse {
  access_token: string;
  expires_in: number; // Durata del token in secondi
  token_type: string;
}

// Definiamo una struttura per conservare il token e quando scade
interface StoredToken {
  token: string;
  expiresAt: number; // Timestamp di quando il token scadrà
}

// Variabile per conservare il token in memoria (per non richiederlo ogni volta)
let storedAccessToken: StoredToken | null = null;
let lastUsedApiKeyForToken: string | null = null; // Traccia l'API key usata per il token corrente

// Importa le interfacce interne
import { InternalProduct, InternalProductVariant } from '@/types/internalProduct';

// Importa la funzione di mapping
import { mapCassaInCloudProductToInternalProduct } from './cassaInCloudDataMapper'; // <-- DEVE ESSERE SOLO L'IMPORT

// Interfaccia per i parametri della funzione getCategories (opzionali per il chiamante)
export interface GetCategoriesParams {
  idsSalesPoint?: string[];
  description?: string;
  lastUpdateFrom?: string | number; // Timestamp (milliseconds) or "YYYY-MM-DD"
  lastUpdateTo?: string | number;   // Timestamp (milliseconds) or "YYYY-MM-DD"
  enabledForChannels?: string[]; // ProductChannel, ma usiamo string[] per semplicità
  itemListVisibility?: boolean;
  // `start` e `limit` sono gestiti internamente per la paginazione completa
  // `sorts` può essere aggiunto se necessario
}

// Interfaccia per la risposta dell'API GetCategories
export interface GetCategoriesApiResponse {
  categories: CassaInCloudCategory[];
  totalCount: number;
}

// Interfacce CassaInCloud aggiornate per riflettere la struttura reale dei dati
// Assicurati che queste interfacce siano esportate
export interface CassaInCloudPrice { // Aggiunto export
  idSalesPoint: string;
  value: number;
}

export interface CassaInCloudDepartment { // Aggiunto export
  id: string;
  description: string;
  tax?: { 
    id: string;
    description: string;
    rate: number;
  };
}

export interface CassaInCloudCategory { // Aggiunto export
  id: string;
  description: string;
  externalId?: string;
  idSalesPoint?: string; // Long in API, string qui per coerenza con altri ID
  enableForRisto?: boolean;
  enableForSale?: boolean;
  enableForECommerce?: boolean;
  enableForMobileCommerce?: boolean;
  enableForSelfOrderMenu?: boolean;
  enableForKiosk?: boolean;
  modifiers?: any[]; // Definire meglio se necessario, per ora any
  imageUrl?: string;
  lastUpdate?: number; // Timestamp
}

export interface CassaInCloudProductVariantAPI { // Aggiunto export
  id: string;
  description: string;
  descriptionReceipt?: string; 
  // price?: number; 
}

export interface CassaInCloudProduct { // Aggiunto export
  id: string;
  description: string;
  descriptionLabel?: string; // Aggiunto
  descriptionReceipt?: string;
  idDepartment?: string;
  department?: CassaInCloudDepartment; // Modificato in oggetto
  idCategory?: string;
  category?: CassaInCloudCategory; // Modificato in oggetto
  soldByWeight: boolean;
  multivariant: boolean;
  enableForRisto: boolean;
  enableForSale: boolean;
  enableForECommerce: boolean;
  enableForMobileCommerce?: boolean; // Aggiunto come opzionale
  enableForSelfOrderMenu?: boolean; // Aggiunto come opzionale
  enableForKiosk?: boolean; // Aggiunto come opzionale
  internalId?: string; // Aggiunto
  variants?: CassaInCloudProductVariantAPI[]; // Usa la nuova interfaccia per varianti API
  prices: CassaInCloudPrice[]; // Modificato in array di oggetti Price
  idSalesPoint?: string; // Aggiunto
  lastUpdate: number; // Aggiunto
  menu?: any; // Lasciato any per ora, da definire meglio se necessario
  composition?: any; // Lasciato any per ora
  soldOnlyInCompositions?: boolean; // Aggiunto
  // Rimuoviamo i campi duplicati o meno specifici come 'price' (ora in 'prices'), 'salable', 'idTax', 'imageUrl', 'externalId'
  // a meno che non siano effettivamente presenti e utili.
}

// Interfaccia per la risposta dell'API quando si richiede un elenco di prodotti
interface GetProductsApiResponse {
  // La struttura esatta dipende dall'API di Cassa In Cloud.
  // Spesso le API restituiscono un array di oggetti sotto una chiave come 'data' o direttamente un array.
  // Ipotizziamo un array diretto per semplicità, o un oggetto con una proprietà 'items' o 'data'.
  data: CassaInCloudProduct[]; // o semplicemente CassaInCloudProduct[] se l'API restituisce un array
  total?: number; // Numero totale di prodotti, utile per la paginazione
  page?: number;
  pageSize?: number;
}

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
export const getProducts = async (idSalesPoint: string, apiKeyOverride?: string): Promise<InternalProduct[]> => { // Aggiungi idSalesPoint come parametro
  const accessToken = await getAccessToken(apiKeyOverride);
  if (!accessToken) {
    console.error('Cannot get products without an access token.');
    return [];
  }

  let allProducts: CassaInCloudProduct[] = []; // Nome corretto della variabile
  let start = 0;
  const limit = 50;
  let totalCount = 0;
  let fetchedCount = 0;

  console.log('Starting to fetch all products from Cassa In Cloud...');

  try {
    do {
      const productsUrl = `${apiUrl}/products?start=${start}&limit=${limit}`;
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
  // Se è una stringa, non dovrebbe essere ulteriormente quotata nell'URL se l'API la interpreta direttamente.
  // Se l'API si aspetta specificamente una stringa JSON per le date (es. "YYYY-MM-DD"), allora la quotatura è corretta.
  // Dalla documentazione e dall'errore, sembra che il problema sia con i parametri array, non con le date.
  // Rimuoviamo la quotatura extra per le date stringa per ora, assumendo che l'API le gestisca come stringhe dirette.
  reportUrl.searchParams.append('datetimeFrom', typeof params.datetimeFrom === 'number' ? params.datetimeFrom.toString() : params.datetimeFrom);
  reportUrl.searchParams.append('datetimeTo', typeof params.datetimeTo === 'number' ? params.datetimeTo.toString() : params.datetimeTo);

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

  const menuMode = params.menuMode !== undefined ? params.menuMode : '0';
  reportUrl.searchParams.append('menuMode', menuMode);

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


// Interfacce per lo stock

// Interfacce per i report di vendita (GetSoldByProduct)
export interface CassaInCloudCurrency {
  id: string;
  iso: string; // es. "EUR"
  symbol: string; // es. "€"
  description: string;
}

export interface CassaInCloudSoldByProduct {
  isMenuEntry?: boolean;
  isCompositionEntry?: boolean;
  idProduct: string;
  idMenuProduct?: string;
  product?: CassaInCloudProduct; // Riusiamo l'interfaccia CassaInCloudProduct esistente
  menuProduct?: CassaInCloudProduct;
  quantity: number; // BigDecimal in API, trattato come number qui
  profit: number; // BigDecimal in API, trattato come number qui
  percentTotal: number; // BigDecimal in API, trattato come number qui
}

export interface GetSoldByProductApiResponse {
  currency: CassaInCloudCurrency;
  totalCount: number;
  totalSold: number; // BigDecimal in API, trattato come number qui
  totalRefund: number; // BigDecimal in API, trattato come number qui
  totalQuantity: number; // BigDecimal in API, trattato come number qui
  totalDepartmentSold: number; // BigDecimal in API, trattato come number qui
  totalDepartmentRefund: number; // BigDecimal in API, trattato come number qui
  totalDepartmentQuantity: number; // BigDecimal in API, trattato come number qui
  sold: CassaInCloudSoldByProduct[];
  start?: number; // Aggiunto per coerenza con la richiesta
  limit?: number; // Aggiunto per coerenza con la richiesta
}

// Parametri per la funzione getSoldByProductReport
export interface GetSoldByProductParams {
  start: number;
  limit: number;
  datetimeFrom: string | number; // Timestamp (milliseconds) or "YYYY-MM-DD"
  datetimeTo: string | number;   // Timestamp (milliseconds) or "YYYY-MM-DD"
  idsSalesPoint?: string[];     // Array di ID di punti vendita (long in API, string qui)
  idProducts?: string[];
  idDepartments?: string[];
  idCategories?: string[];
  menuMode?: 'GROUPED' | 'EXPLODED_WITH_ITEMS' | 'EXPLODED_BUT_SEPARATE';
  sorts?: any[]; // Definire meglio se necessario, per ora any
}

export interface CassaInCloudStock {
  idProduct: string;
  idSalesPoint: string;
  idVariant?: string; // Opzionale se lo stock è a livello di prodotto e non di variante
  quantity: number;
  unit: string; // Es. 'PZ', 'KG', 'LT'
  warningLevel?: number;
  lastUpdate?: number; // Timestamp dell'ultimo aggiornamento stock
  manageStock?: boolean; // Indica se lo stock è gestito per questo prodotto
}

interface GetStockApiResponse {
  // La struttura esatta dipende dall'API di Cassa In Cloud per lo stock.
  // Ipotizziamo una struttura simile a quella dei prodotti.
  data: CassaInCloudStock[]; // o CassaInCloudStock se l'API restituisce un singolo oggetto per prodotto/variante
  // Oppure potrebbe essere una struttura diversa, es:
  // productId: string;
  // salesPointId: string;
  // stockDetails: { quantity: number; unit: string; ... }
}

// Interfacce per i punti vendita (aggiornate secondo la documentazione)
export interface CassaInCloudCurrency {
  id: number;
  code: string;
  name: string;
  numberOfDecimals: number;
}

export interface CassaInCloudSalesPoint {
  city: string;
  country: string;
  currency: CassaInCloudCurrency;
  description: string;
  district: string;
  email: string;
  id: number;
  latitude: number;
  logoBig: string;
  logoSmall: string;
  longitude: number;
  name: string;
  phoneNumber: string;
  street: string;
  taxCode: string;
  vatNumber: string;
  zipcode: string;
}

export interface GetSalesPointsApiResponse {
  salesPoint: CassaInCloudSalesPoint[];
  totalCount: number;
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
        zipcode: point.zipcode,
      }));
    console.error('Unexpected response structure for sales points or salesPoint array is missing:', responseData);
    throw new Error('Unexpected response structure for sales points or salesPoint array is missing');
    }
  } catch (error) {
    console.error('Exception while fetching sales points:', error);
    return [];
  }
};

// Assicurati che la funzione mapCassaInCloudProductToInternalProduct sia definita o importata correttamente
// Se è definita in questo file, dovrebbe essere qui o prima del suo utilizzo.
// Se è importata, l'import deve essere presente all'inizio del file.

// export { getAccessToken, getProducts, getProductStock, getSalesPoints }; // Opzionale se usi export individuale