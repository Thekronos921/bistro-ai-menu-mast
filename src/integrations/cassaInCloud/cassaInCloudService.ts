import { 
  AccessTokenResponse, 
  StoredToken, 
  CassaInCloudReceipt,
  GetReceiptsParams,
  GetReceiptsApiResponse,
  GetSoldByProductParams,
  GetSoldByProductApiResponse,
  GetProductsParams,
  GetProductsApiResponse,
  GetCategoriesParams,
  GetCategoriesApiResponse,
  GetCustomersParams,
  GetCustomersApiResponse,
  GetSalesPointsApiResponse,
  GetRoomsParams,
  GetRoomsApiResponse,
  GetTablesParams,
  GetTablesApiResponse
} from './cassaInCloudTypes';

/**
 * Servizio per l'integrazione con CassaInCloud
 * @version 1.0.0
 */
export class CassaInCloudService {
  private clientId: string;
  private clientSecret: string;
  private apiKey: string;
  private baseUrl: string = 'https://api.cassa-in-cloud.it/v1';
  private tokenUrl: string = 'https://api.cassa-in-cloud.it/oauth/token';
  private token: StoredToken | null = null;

  /**
   * Costruttore della classe CassaInCloudService.
   * @param apiKey La chiave API per l'autenticazione.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API Key is required');
    }
    this.apiKey = apiKey;
    const apiKeyParts = apiKey.split(':');
    if (apiKeyParts.length !== 2) {
      throw new Error('Invalid API Key format. Expected clientId:clientSecret');
    }
    this.clientId = apiKeyParts[0];
    this.clientSecret = apiKeyParts[1];
  }

  /**
   * Richiede un token di accesso a CassaInCloud.
   * @returns Una promise che risolve con il token di accesso.
   * @throws Error se la richiesta fallisce.
   */
  private async fetchAccessToken(): Promise<AccessTokenResponse> {
    const requestBody = new URLSearchParams();
    requestBody.append('grant_type', 'client_credentials');
    requestBody.append('client_id', this.clientId);
    requestBody.append('client_secret', this.clientSecret);

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: requestBody.toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AccessTokenResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching access token:', error);
      throw error;
    }
  }

  /**
   * Ottiene un token di accesso valido. Se non esiste un token valido, ne richiede uno nuovo.
   * @returns Una promise che risolve con il token di accesso valido.
   * @throws Error se non è possibile ottenere un token valido.
   */
  private async getValidToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) {
      return this.token.token;
    }

    const accessTokenResponse = await this.fetchAccessToken();
    this.token = {
      token: accessTokenResponse.access_token,
      expiresAt: Date.now() + accessTokenResponse.expires_in * 1000
    };

    return this.token.token;
  }

  /**
   * Recupera un elenco di prodotti da CassaInCloud.
   * @param params Parametri per filtrare la ricerca dei prodotti.
   * @returns Una promise che risolve con la risposta dell'API.
   * @throws Error se la richiesta fallisce.
   */
  async getProducts(params: GetProductsParams): Promise<GetProductsApiResponse> {
    try {
      const token = await this.getValidToken();
      const queryParams = new URLSearchParams();

      if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
        params.idsSalesPoint.forEach(id => {
          queryParams.append('idsSalesPoint', id);
        });
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
        params.enabledForChannels.forEach(channel => {
          queryParams.append('enabledForChannels', channel);
        });
      }
      if (params.itemListVisibility !== undefined) {
        queryParams.append('itemListVisibility', params.itemListVisibility.toString());
      }
      if (params.idCategories && params.idCategories.length > 0) {
        params.idCategories.forEach(idCategory => {
          queryParams.append('idCategories', idCategory);
        });
      }
      if (params.idDepartments && params.idDepartments.length > 0) {
        params.idDepartments.forEach(idDepartment => {
          queryParams.append('idDepartments', idDepartment);
        });
      }
      if (params.categoryId) {
        queryParams.append('categoryId', params.categoryId);
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

      const response = await fetch(`${this.baseUrl}/products?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetProductsApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Recupera un elenco di categorie da CassaInCloud.
   * @param params Parametri per filtrare la ricerca delle categorie.
   * @returns Una promise che risolve con la risposta dell'API.
   * @throws Error se la richiesta fallisce.
   */
  async getCategories(params: GetCategoriesParams): Promise<GetCategoriesApiResponse> {
    try {
      const token = await this.getValidToken();
      const queryParams = new URLSearchParams();

      if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
        params.idsSalesPoint.forEach(id => {
          queryParams.append('idsSalesPoint', id);
        });
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
        params.enabledForChannels.forEach(channel => {
          queryParams.append('enabledForChannels', channel);
        });
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

      const response = await fetch(`${this.baseUrl}/categories?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetCategoriesApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Recupera un report dei prodotti venduti da CassaInCloud.
   * @param params Parametri per filtrare il report dei prodotti venduti.
   * @returns Una promise che risolve con la risposta dell'API.
   * @throws Error se la richiesta fallisce.
   */
  async getSoldByProductReport(params: GetSoldByProductParams): Promise<GetSoldByProductApiResponse> {
    try {
      const token = await this.getValidToken();
      const queryParams = new URLSearchParams();

      queryParams.append('start', params.start.toString());
      queryParams.append('limit', params.limit.toString());
      queryParams.append('datetimeFrom', params.datetimeFrom.toString());
      queryParams.append('datetimeTo', params.datetimeTo.toString());

      if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
        params.idsSalesPoint.forEach(id => {
          queryParams.append('idsSalesPoint', id);
        });
      }
      if (params.idProducts && params.idProducts.length > 0) {
        params.idProducts.forEach(id => {
          queryParams.append('idProducts', id);
        });
      }
      if (params.idDepartments && params.idDepartments.length > 0) {
        params.idDepartments.forEach(id => {
          queryParams.append('idDepartments', id);
        });
      }
      if (params.idCategories && params.idCategories.length > 0) {
        params.idCategories.forEach(id => {
          queryParams.append('idCategories', id);
        });
      }
      if (params.sorts && params.sorts.length > 0) {
        params.sorts.forEach(sort => {
          queryParams.append('sorts', JSON.stringify(sort));
        });
      }

      const response = await fetch(`${this.baseUrl}/reports/soldByProduct?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetSoldByProductApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching sold by product report:', error);
      throw error;
    }
  }

  async getRooms(params: GetRoomsParams): Promise<GetRoomsApiResponse> {
    try {
      const token = await this.getValidToken();
      const queryParams = new URLSearchParams();
      
      queryParams.append('start', params.start.toString());
      queryParams.append('limit', params.limit.toString());
      
      if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
        params.idsSalesPoint.forEach(id => {
          queryParams.append('idsSalesPoint', id.toString());
        });
      }
      
      if (params.ids && params.ids.length > 0) {
        params.ids.forEach(id => {
          queryParams.append('ids', id);
        });
      }
      
      if (params.name) {
        queryParams.append('name', params.name);
      }
      
      if (params.lastUpdateFrom) {
        queryParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
      }
      
      if (params.lastUpdateTo) {
        queryParams.append('lastUpdateTo', params.lastUpdateTo.toString());
      }

      const response = await fetch(`${this.baseUrl}/rooms?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetRoomsApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  }

  async getTables(params: GetTablesParams): Promise<GetTablesApiResponse> {
    try {
      const token = await this.getValidToken();
      const queryParams = new URLSearchParams();
      
      queryParams.append('start', params.start.toString());
      queryParams.append('limit', params.limit.toString());
      
      if (params.idsSalesPoint && params.idsSalesPoint.length > 0) {
        params.idsSalesPoint.forEach(id => {
          queryParams.append('idsSalesPoint', id.toString());
        });
      }
      
      if (params.ids && params.ids.length > 0) {
        params.ids.forEach(id => {
          queryParams.append('ids', id);
        });
      }
      
      if (params.name) {
        queryParams.append('name', params.name);
      }
      
      if (params.idsRoom && params.idsRoom.length > 0) {
        params.idsRoom.forEach(id => {
          queryParams.append('idsRoom', id);
        });
      }
      
      if (params.externalId && params.externalId.length > 0) {
        params.externalId.forEach(id => {
          queryParams.append('externalId', id);
        });
      }
      
      if (params.lastUpdateFrom) {
        queryParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
      }
      
      if (params.lastUpdateTo) {
        queryParams.append('lastUpdateTo', params.lastUpdateTo.toString());
      }

      const response = await fetch(`${this.baseUrl}/tables?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetTablesApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  }

  /**
   * Recupera un elenco di clienti da CassaInCloud.
   * @param params Parametri per filtrare la ricerca dei clienti.
   * @returns Una promise che risolve con la risposta dell'API.
   * @throws Error se la richiesta fallisce.
   */
  async getCustomers(params: GetCustomersParams): Promise<GetCustomersApiResponse> {
    try {
      const token = await this.getValidToken();
      const queryParams = new URLSearchParams();

      queryParams.append('start', params.start.toString());
      queryParams.append('limit', params.limit.toString());

      if (params.sorts && params.sorts.length > 0) {
        params.sorts.forEach(sort => {
          queryParams.append('sorts', JSON.stringify(sort));
        });
      }
      if (params.ids && params.ids.length > 0) {
        params.ids.forEach(id => {
          queryParams.append('ids', id);
        });
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
        params.idsOrganization.forEach(idOrganization => {
          queryParams.append('idsOrganization', idOrganization);
        });
      }
      if (params.lastUpdateFrom) {
        queryParams.append('lastUpdateFrom', params.lastUpdateFrom.toString());
      }
      if (params.lastUpdateTo) {
        queryParams.append('lastUpdateTo', params.lastUpdateTo.toString());
      }

      const response = await fetch(`${this.baseUrl}/customers?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetCustomersApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Recupera un elenco di punti vendita da CassaInCloud.
   * @returns Una promise che risolve con la risposta dell'API.
   * @throws Error se la richiesta fallisce.
   */
  async getSalesPoints(): Promise<GetSalesPointsApiResponse> {
    try {
      const token = await this.getValidToken();

      const response = await fetch(`${this.baseUrl}/salesPoint`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetSalesPointsApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching sales points:', error);
      throw error;
    }
  }

  async getReceipts(params: GetReceiptsParams): Promise<GetReceiptsApiResponse> {
    try {
      const token = await this.getValidToken();
      const queryParams = new URLSearchParams();

      // Parametri obbligatori
      queryParams.append('start', params.start.toString());
      queryParams.append('limit', params.limit.toString());

      // Parametri opzionali
      if (params.datetimeFrom) {
        queryParams.append('datetimeFrom', params.datetimeFrom.toString());
      }
      
      if (params.datetimeTo) {
        queryParams.append('datetimeTo', params.datetimeTo.toString());
      }
      
      if (params.idsSalesPoint && Array.isArray(params.idsSalesPoint)) {
        params.idsSalesPoint.forEach(id => {
          queryParams.append('idsSalesPoint', id);
        });
      }
      
      if (params.idCustomers && Array.isArray(params.idCustomers)) {
        params.idCustomers.forEach(id => {
          queryParams.append('idCustomers', id);
        });
      }

      const response = await fetch(`${this.baseUrl}/receipts?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetReceiptsApiResponse = await response.json();
      return {
        receipts: data.receipts || [],
        totalCount: data.totalCount || 0,
        currency: data.currency
      };
    } catch (error) {
      console.error('Error fetching receipts:', error);
      throw error;
    }
  }
}
