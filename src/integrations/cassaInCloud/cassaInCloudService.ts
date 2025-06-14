import axios from 'axios';
import { 
  CassaInCloudSettings, 
  GetProductsParams, 
  GetProductsApiResponse,
  GetCategoriesParams,
  GetCategoriesApiResponse,
  GetCustomersParams,
  GetCustomersApiResponse,
  GetReceiptsParams,
  GetReceiptsApiResponse,
  GetSoldByProductReportParams,
  GetSoldByProductReportApiResponse,
  GetRoomsParams,
  GetRoomsApiResponse,
  GetTablesParams,
  GetTablesApiResponse
} from './cassaInCloudTypes';

export const getProducts = async (
  settings: CassaInCloudSettings,
  params: GetProductsParams = {}
): Promise<GetProductsApiResponse> => {
  const headers = {
    'X-Auth-Token': settings.apiKey,
    'Content-Type': 'application/json'
  };

  const queryParams = new URLSearchParams();
  queryParams.append('start', (params.start || 0).toString());
  queryParams.append('limit', (params.limit || 100).toString());
  
  if (params.idCategory) {
    queryParams.append('idCategory', params.idCategory.toString());
  }

  try {
    const response = await axios.get<GetProductsApiResponse>(
      `${settings.apiUrl}/products?${queryParams}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei prodotti:', error);
    throw error;
  }
};

export const getCategories = async (
  settings: CassaInCloudSettings,
  params: GetCategoriesParams = {}
): Promise<GetCategoriesApiResponse> => {
  const headers = {
    'X-Auth-Token': settings.apiKey,
    'Content-Type': 'application/json'
  };

  const queryParams = new URLSearchParams();
  queryParams.append('start', (params.start || 0).toString());
  queryParams.append('limit', (params.limit || 100).toString());

  try {
    const response = await axios.get<GetCategoriesApiResponse>(
      `${settings.apiUrl}/categories?${queryParams}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero delle categorie:', error);
    throw error;
  }
};

export const getCustomers = async (
  settings: CassaInCloudSettings,
  params: GetCustomersParams = {}
): Promise<GetCustomersApiResponse> => {
  const headers = {
    'X-Auth-Token': settings.apiKey,
    'Content-Type': 'application/json'
  };

  const queryParams = new URLSearchParams();
  queryParams.append('start', (params.start || 0).toString());
  queryParams.append('limit', (params.limit || 100).toString());

  try {
    const response = await axios.get<GetCustomersApiResponse>(
      `${settings.apiUrl}/customers?${queryParams}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei clienti:', error);
    throw error;
  }
};

export const getReceipts = async (
  settings: CassaInCloudSettings,
  params: GetReceiptsParams
): Promise<GetReceiptsApiResponse> => {
  const headers = {
    'X-Auth-Token': settings.apiKey,
    'Content-Type': 'application/json'
  };

  if (!params.datetimeFrom || !params.datetimeTo) {
    throw new Error('datetimeFrom e datetimeTo sono obbligatori');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('start', (params.start || 0).toString());
  queryParams.append('limit', (params.limit || 100).toString());
  queryParams.append('datetimeFrom', params.datetimeFrom);
  queryParams.append('datetimeTo', params.datetimeTo);

  try {
    const response = await axios.get<GetReceiptsApiResponse>(
      `${settings.apiUrl}/receipts?${queryParams}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero degli scontrini:', error);
    throw error;
  }
};

export const getRooms = async (
  settings: CassaInCloudSettings,
  params: GetRoomsParams = {}
): Promise<GetRoomsApiResponse> => {
  const headers = {
    'X-Auth-Token': settings.apiKey,
    'Content-Type': 'application/json'
  };

  const queryParams = new URLSearchParams();
  queryParams.append('start', (params.start || 0).toString());
  queryParams.append('limit', (params.limit || 100).toString());
  
  if (params.idSalesPoint) {
    queryParams.append('idSalesPoint', params.idSalesPoint.toString());
  }

  try {
    const response = await axios.get<GetRoomsApiResponse>(
      `${settings.apiUrl}/rooms?${queryParams}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero delle sale:', error);
    throw error;
  }
};

export const getTables = async (
  settings: CassaInCloudSettings,
  params: GetTablesParams = {}
): Promise<GetTablesApiResponse> => {
  const headers = {
    'X-Auth-Token': settings.apiKey,
    'Content-Type': 'application/json'
  };

  const queryParams = new URLSearchParams();
  queryParams.append('start', (params.start || 0).toString());
  queryParams.append('limit', (params.limit || 100).toString());
  
  if (params.idRoom) {
    queryParams.append('idRoom', params.idRoom.toString());
  }
  
  if (params.idSalesPoint) {
    queryParams.append('idSalesPoint', params.idSalesPoint.toString());
  }

  try {
    const response = await axios.get<GetTablesApiResponse>(
      `${settings.apiUrl}/tables?${queryParams}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei tavoli:', error);
    throw error;
  }
};

export const getSoldByProductReport = async (
  settings: CassaInCloudSettings,
  params: GetSoldByProductReportParams
): Promise<GetSoldByProductReportApiResponse> => {
  const headers = {
    'X-Auth-Token': settings.apiKey,
    'Content-Type': 'application/json'
  };

  if (!params.datetimeFrom || !params.datetimeTo) {
    throw new Error('datetimeFrom e datetimeTo sono obbligatori');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('start', (params.start || 0).toString());
  queryParams.append('limit', (params.limit || 100).toString());
  queryParams.append('datetimeFrom', params.datetimeFrom);
  queryParams.append('datetimeTo', params.datetimeTo);
  
  // Fix: Handle idProducts correctly as array
  if (params.idProducts && Array.isArray(params.idProducts)) {
    params.idProducts.forEach(id => {
      queryParams.append('idProducts[]', id.toString());
    });
  }

  try {
    const response = await axios.get<GetSoldByProductReportApiResponse>(
      `${settings.apiUrl}/reports/soldByProduct?${queryParams}`,
      { headers }
    );
    
    // Fix: Return proper structure
    return {
      data: response.data.data || [],
      total: response.data.total || 0
    };
  } catch (error) {
    console.error('Errore nel recupero del report vendite per prodotto:', error);
    throw error;
  }
};

export const validateSettings = (settings: CassaInCloudSettings): boolean => {
  return !!(settings && settings.apiKey && settings.apiUrl);
};
