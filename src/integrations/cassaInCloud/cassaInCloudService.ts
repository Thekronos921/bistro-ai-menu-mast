import { supabase } from '@/integrations/supabase/client';
import {
  AccessTokenResponse,
  StoredToken,
  CassaInCloudSalesPoint,
  GetProductsParams,
  CassaInCloudProduct,
  GetCategoriesParams,
  CassaInCloudCategory,
  GetSoldByProductParams,
  GetSoldByProductApiResponse,
  CassaInCloudCustomer,
  GetCustomersParams,
  GetCustomersApiResponse,
  GetReceiptsParams,
  GetReceiptsApiResponse,
  GetRoomsParams, // Add this import
  GetRoomsApiResponse, // Add this import
  GetTablesParams, // Add this import
  GetTablesApiResponse, // Add this import
  CassaInCloudReceipt,
  GetProductsApiResponse,
  GetCategoriesApiResponse,
  GetSalesPointsApiResponse,
  GetStockApiResponse,
  CassaInCloudStock
} from './cassaInCloudTypes';
import { mapCassaInCloudProductToInternalProduct } from './cassaInCloudDataMapper';
import type { InternalProduct } from '@/types/internalProduct';

const TOKEN_STORAGE_KEY = 'cassaInCloudToken';

/**
 * Funzione di utilità per ottenere e validare il token di accesso.
 * Se il token non esiste o è scaduto, ne richiede uno nuovo.
 * @param apiKeyOverride Chiave API opzionale per sovrascrivere quella di default.
 * @returns Il token di accesso valido.
 * @throws Error se non è possibile ottenere un token valido.
 */
async function getValidAccessToken(apiKeyOverride?: string): Promise<string> {
  const apiKey = apiKeyOverride || process.env.NEXT_PUBLIC_CASSANCLOUD_API_KEY;

  if (!apiKey) {
    throw new Error('Chiave API CassaInCloud non configurata.');
  }

  let storedToken: StoredToken | null = getStoredToken();

  if (!storedToken || isTokenExpired(storedToken)) {
    storedToken = await fetchAccessToken(apiKey);
    storeToken(storedToken);
  }

  return storedToken.token;
}

/**
 * Recupera il token di accesso dallo storage locale.
 * @returns Il token di accesso se presente, altrimenti null.
 */
function getStoredToken(): StoredToken | null {
  const tokenString = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (tokenString) {
    return JSON.parse(tokenString) as StoredToken;
  }
  return null;
}

/**
 * Verifica se il token di accesso è scaduto.
 * @param token Il token di accesso da verificare.
 * @returns True se il token è scaduto, altrimenti false.
 */
function isTokenExpired(token: StoredToken): boolean {
  return token.expiresAt <= Date.now();
}

/**
 * Richiede un nuovo token di accesso all'API di CassaInCloud.
 * @param apiKey La chiave API per l'autenticazione.
 * @returns Il nuovo token di accesso.
 * @throws Error se la richiesta fallisce.
 */
async function fetchAccessToken(apiKey: string): Promise<StoredToken> {
  const url = 'https://api.cassaincloud.it/v2/auth/token';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  const body = `grant_type=client_credentials&client_id=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante fetchAccessToken:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data: AccessTokenResponse = await response.json();
    const expiresAt = Date.now() + (data.expires_in * 1000); // Converti in millisecondi
    return {
      token: data.access_token,
      expiresAt: expiresAt
    };
  } catch (error) {
    console.error('Errore durante fetchAccessToken:', error);
    throw error;
  }
}

/**
 * Salva il token di accesso nello storage locale.
 * @param token Il token di accesso da salvare.
 */
function storeToken(token: StoredToken): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

/**
 * Recupera tutti i punti vendita da CassaInCloud
 */
export async function getSalesPoints(apiKeyOverride?: string): Promise<CassaInCloudSalesPoint[]> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  try {
    const response = await fetch('https://api.cassaincloud.it/v2/sales-points', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getSalesPoints:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data: GetSalesPointsApiResponse = await response.json();
    return data.salesPoint || [];
  } catch (error) {
    console.error('Errore durante getSalesPoints:', error);
    throw error;
  }
}

/**
 * Recupera tutte le categorie da CassaInCloud
 */
export async function getCategories(
  params: GetCategoriesParams,
  apiKeyOverride?: string
): Promise<CassaInCloudCategory[]> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  // Costruisci i parametri della query
  const queryParams = new URLSearchParams();
  if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
    params.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id));
  }
  if (params.description) {
    queryParams.append('description', params.description);
  }
  if (params.lastUpdateFrom) {
    queryParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
  }
  if (params.lastUpdateTo) {
    queryParams.append('lastUpdateTo', params.lastUpdateTo.toString());
  }
  if (params.enabledForChannels && params.enabledForChannels.length > 0) {
    params.enabledForChannels.forEach(channel => queryParams.append('enabledForChannels', channel));
  }
  if (params.itemListVisibility !== undefined) {
    queryParams.append('itemListVisibility', params.itemListVisibility.toString());
  }
  if (params.searchTerm) {
    queryParams.append('searchTerm', params.searchTerm);
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.offset) {
    queryParams.append('offset', params.offset.toString());
  }

  const url = `https://api.cassaincloud.it/v2/categories?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getCategories:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data: GetCategoriesApiResponse = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Errore durante getCategories:', error);
    throw error;
  }
}

/**
 * Recupera tutti i prodotti da CassaInCloud e li mappa in InternalProduct
 */
export async function getProducts(
  idSalesPointForPricing: string,
  filterParams?: GetProductsParams,
  apiKeyOverride?: string
): Promise<InternalProduct[]> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  // Costruisci i parametri della query
  const queryParams = new URLSearchParams();
  if (filterParams?.idsSalesPoint && filterParams.idsSalesPoint.length > 0) {
    filterParams.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id));
  }
  if (filterParams?.description) {
    queryParams.append('description', filterParams.description);
  }
  if (filterParams?.lastUpdateFrom) {
    queryParams.append('lastUpdateFrom', filterParams.lastUpdateFrom.toString());
  }
  if (filterParams?.lastUpdateTo) {
    queryParams.append('lastUpdateTo', filterParams.lastUpdateTo.toString());
  }
  if (filterParams?.enabledForChannels && filterParams.enabledForChannels.length > 0) {
    filterParams.enabledForChannels.forEach(channel => queryParams.append('enabledForChannels', channel));
  }
  if (filterParams?.itemListVisibility !== undefined) {
    queryParams.append('itemListVisibility', filterParams.itemListVisibility.toString());
  }
  if (filterParams?.idCategories && filterParams.idCategories.length > 0) {
    filterParams.idCategories.forEach(id => queryParams.append('idCategories', id));
  }
  if (filterParams?.idDepartments && filterParams.idDepartments.length > 0) {
    filterParams.idDepartments.forEach(id => queryParams.append('idDepartments', id));
  }
   if (filterParams?.categoryId) {
    queryParams.append('categoryId', filterParams.categoryId);
  }
  if (filterParams?.searchTerm) {
    queryParams.append('searchTerm', filterParams.searchTerm);
  }
  if (filterParams?.limit) {
    queryParams.append('limit', filterParams.limit.toString());
  }
  if (filterParams?.offset) {
    queryParams.append('offset', filterParams.offset.toString());
  }

  const url = `https://api.cassaincloud.it/v2/products?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getProducts:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data: GetProductsApiResponse = await response.json();
    if (!data.products) {
      console.warn('Nessun prodotto trovato nella risposta API:', data);
      return [];
    }

    // Mappa i prodotti CassaInCloud in InternalProduct
    const internalProducts: InternalProduct[] = data.products.map(product =>
      mapCassaInCloudProductToInternalProduct(product, idSalesPointForPricing)
    );

    return internalProducts;
  } catch (error) {
    console.error('Errore durante getProducts:', error);
    throw error;
  }
}

/**
 * Recupera il report delle vendite per prodotto da CassaInCloud
 */
export async function getSoldByProductReport(
  params: GetSoldByProductParams,
  apiKeyOverride?: string
): Promise<GetSoldByProductApiResponse> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  // Costruisci i parametri della query
  const queryParams = new URLSearchParams();
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());

  // Gestione delle date
  queryParams.append('datetimeFrom', typeof params.datetimeFrom === 'string' ? params.datetimeFrom : params.datetimeFrom.toString());
  queryParams.append('datetimeTo', typeof params.datetimeTo === 'string' ? params.datetimeTo : params.datetimeTo.toString());

  if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
    params.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id));
  }
  if (params.idProducts && params.idProducts.length > 0) {
    params.idProducts.forEach(id => queryParams.append('idProducts', id));
  }
  if (params.idDepartments && params.idDepartments.length > 0) {
    params.idDepartments.forEach(id => queryParams.append('idDepartments', id));
  }
  if (params.idCategories && params.idCategories.length > 0) {
    params.idCategories.forEach(id => queryParams.append('idCategories', id));
  }
  if (params.sorts && params.sorts.length > 0) {
    params.sorts.forEach(sort => queryParams.append('sorts', JSON.stringify(sort)));
  }

  const url = `https://api.cassaincloud.it/v2/reports/sold-by-product?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getSoldByProductReport:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data: GetSoldByProductApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Errore durante getSoldByProductReport:', error);
    throw error;
  }
}

/**
 * Recupera tutti i clienti da CassaInCloud
 */
export async function getCustomers(
  params: GetCustomersParams,
  apiKeyOverride?: string
): Promise<CassaInCloudCustomer[]> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  console.log('Parametri ricevuti per getCustomers:', params);

  // Costruisci i parametri della query
  const queryParams = new URLSearchParams();
  
  // Parametri obbligatori
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());

  // Parametri opzionali
  if (params.sorts && params.sorts.length > 0) {
    params.sorts.forEach(sort => queryParams.append('sorts', JSON.stringify(sort)));
  }

  if (params.ids && params.ids.length > 0) {
    params.ids.forEach(id => queryParams.append('ids', id));
  }

  if (params.vatNumber) {
    queryParams.append('vatNumber', params.vatNumber);
  }

  if (params.fiscalCode) {
    queryParams.append('fiscalCode', params.fiscalCode);
  }

  if (params.name) {
    queryParams.append('name', params.name);
  }

  if (params.email) {
    queryParams.append('email', params.email);
  }

  if (params.idsOrganization && params.idsOrganization.length > 0) {
    params.idsOrganization.forEach(id => queryParams.append('idsOrganization', id));
  }

  if (params.lastUpdateFrom !== undefined) {
    queryParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
  }

  if (params.lastUpdateTo !== undefined) {
    queryParams.append('lastUpdateTo', params.lastUpdateTo.toString());
  }

  const url = `https://api.cassaincloud.it/v2/customers?${queryParams.toString()}`;
  console.log('URL per getCustomers:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getCustomers:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data: GetCustomersApiResponse = await response.json();
    return data.customers || [];
  } catch (error) {
    console.error('Errore durante getCustomers:', error);
    throw error;
  }
}

/**
 * Recupera le ricevute da CassaInCloud
 */
export async function getReceipts(
  params: GetReceiptsParams,
  apiKeyOverride?: string
): Promise<GetReceiptsApiResponse> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  console.log('Parametri ricevuti per getReceipts:', params);

  // Costruisci i parametri della query
  const queryParams = new URLSearchParams();
  
  // Parametri obbligatori
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());

  // Parametri opzionali per date
  if (params.datetimeFrom) {
    queryParams.append('datetimeFrom', typeof params.datetimeFrom === 'string' ? params.datetimeFrom : params.datetimeFrom.toString());
  }
  if (params.datetimeTo) {
    queryParams.append('datetimeTo', typeof params.datetimeTo === 'string' ? params.datetimeTo : params.datetimeTo.toString());
  }

  // Parametri opzionali per filtri
  if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
    params.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id));
  }

  if (params.sorts && params.sorts.length > 0) {
    params.sorts.forEach(sort => queryParams.append('sorts', JSON.stringify(sort)));
  }

  if (params.idCustomers && params.idCustomers.length > 0) {
    params.idCustomers.forEach(id => queryParams.append('idCustomers', id));
  }

  if (params.numbers && params.numbers.length > 0) {
    params.numbers.forEach(num => queryParams.append('numbers', num));
  }

  if (params.idOrganizations && params.idOrganizations.length > 0) {
    params.idOrganizations.forEach(id => queryParams.append('idOrganizations', id));
  }

  if (params.calculatedAmount !== undefined) {
    queryParams.append('calculatedAmount', params.calculatedAmount.toString());
  }

  if (params.idDocumentNumbering) {
    queryParams.append('idDocumentNumbering', params.idDocumentNumbering);
  }

  if (params.numberFrom !== undefined) {
    queryParams.append('numberFrom', params.numberFrom.toString());
  }

  if (params.numberTo !== undefined) {
    queryParams.append('numberTo', params.numberTo.toString());
  }

  if (params.zNumber) {
    queryParams.append('zNumber', params.zNumber);
  }

  if (params.idUserFO) {
    queryParams.append('idUserFO', params.idUserFO);
  }

  if (params.idDevice) {
    queryParams.append('idDevice', params.idDevice);
  }

  if (params.idCustomer) {
    queryParams.append('idCustomer', params.idCustomer);
  }

  if (params.idFidelityCard) {
    queryParams.append('idFidelityCard', params.idFidelityCard);
  }

  if (params.lotteryCode) {
    queryParams.append('lotteryCode', params.lotteryCode);
  }

  const url = `https://api.cassaincloud.it/v2/receipts?${queryParams.toString()}`;
  console.log('URL per getReceipts:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getReceipts:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Risposta ricevuta da getReceipts:', data);

    return {
      receipts: data.receipts || [],
      totalCount: data.totalCount || 0,
      currency: data.currency
    };

  } catch (error) {
    console.error('Errore durante getReceipts:', error);
    throw error;
  }
}

/**
 * Recupera le sale da CassaInCloud
 */
export async function getRooms(
  params: GetRoomsParams,
  apiKeyOverride?: string
): Promise<GetRoomsApiResponse> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  console.log('Parametri ricevuti per getRooms:', params);

  // Costruisci i parametri della query
  const queryParams = new URLSearchParams();
  
  // Parametri obbligatori
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());

  // idsSalesPoint obbligatorio per le sale
  if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
    params.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id.toString()));
  }

  // Parametri opzionali
  if (params.sorts && params.sorts.length > 0) {
    params.sorts.forEach(sort => queryParams.append('sorts', JSON.stringify(sort)));
  }

  if (params.ids && params.ids.length > 0) {
    params.ids.forEach(id => queryParams.append('ids', id));
  }

  if (params.name) {
    queryParams.append('name', params.name);
  }

  if (params.lastUpdateFrom !== undefined) {
    queryParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
  }

  if (params.lastUpdateTo !== undefined) {
    queryParams.append('lastUpdateTo', params.lastUpdateTo.toString());
  }

  const url = `https://api.cassaincloud.it/v2/rooms?${queryParams.toString()}`;
  console.log('URL per getRooms:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getRooms:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Risposta ricevuta da getRooms:', data);

    return {
      rooms: data.rooms || [],
      totalCount: data.totalCount || 0
    };

  } catch (error) {
    console.error('Errore durante getRooms:', error);
    throw error;
  }
}

/**
 * Recupera i tavoli da CassaInCloud
 */
export async function getTables(
  params: GetTablesParams,
  apiKeyOverride?: string
): Promise<GetTablesApiResponse> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  console.log('Parametri ricevuti per getTables:', params);

  // Costruisci i parametri della query
  const queryParams = new URLSearchParams();
  
  // Parametri obbligatori
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());

  // idsSalesPoint obbligatorio per i tavoli
  if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
    params.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id.toString()));
  }

  // Parametri opzionali
  if (params.sorts && params.sorts.length > 0) {
    params.sorts.forEach(sort => queryParams.append('sorts', JSON.stringify(sort)));
  }

  if (params.ids && params.ids.length > 0) {
    params.ids.forEach(id => queryParams.append('ids', id));
  }

  if (params.name) {
    queryParams.append('name', params.name);
  }

  if (params.idsRoom && params.idsRoom.length > 0) {
    params.idsRoom.forEach(id => queryParams.append('idsRoom', id));
  }

  if (params.externalId && params.externalId.length > 0) {
    params.externalId.forEach(id => queryParams.append('externalId', id));
  }

  if (params.lastUpdateFrom !== undefined) {
    queryParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
  }

  if (params.lastUpdateTo !== undefined) {
    queryParams.append('lastUpdateTo', params.lastUpdateTo.toString());
  }

  const url = `https://api.cassaincloud.it/v2/tables?${queryParams.toString()}`;
  console.log('URL per getTables:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getTables:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Risposta ricevuta da getTables:', data);

    return {
      tables: data.tables || [],
      totalCount: data.totalCount || 0
    };

  } catch (error) {
    console.error('Errore durante getTables:', error);
    throw error;
  }
}

/**
 * Recupera lo stock prodotti da CassaInCloud
 */
export async function getStock(apiKeyOverride?: string): Promise<CassaInCloudStock[]> {
  const token = await getValidAccessToken(apiKeyOverride);
  if (!token) {
    throw new Error('Token di accesso non disponibile');
  }

  try {
    const response = await fetch('https://api.cassaincloud.it/v2/stock', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Errore HTTP ${response.status} durante getStock:`, errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }

    const data: GetStockApiResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Errore durante getStock:', error);
    throw error;
  }
}
