
// Simple service functions for CassaInCloud API integration
import type {
  GetProductsParams,
  GetProductsApiResponse,
  CassaInCloudProduct,
  GetReceiptsParams,
  GetReceiptsApiResponse,
  GetRoomsParams,
  GetRoomsApiResponse,
  GetTablesParams,
  GetTablesApiResponse,
  GetCategoriesParams,
  GetCategoriesApiResponse,
  GetCustomersParams,
  GetCustomersApiResponse,
  GetSoldByProductParams,
  GetSoldByProductApiResponse
} from './cassaInCloudTypes';

// Mock API base URL - this would be configured elsewhere
const API_BASE_URL = 'https://api.cassaincloud.it/v1';

// Simple fetch wrapper
async function makeApiRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      // API key would be configured elsewhere
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getCategories(params: GetCategoriesParams = {}, apiKeyOverride?: string): Promise<GetCategoriesApiResponse> {
  console.log('Getting categories with params', params);
  
  const queryParams = new URLSearchParams();
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
  if (params.description) queryParams.append('description', params.description);
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

  const data = await makeApiRequest(`/categories?${queryParams.toString()}`);
  return data;
}

export async function getProducts(idSalesPointForPricing: string, params: GetProductsParams = {}, apiKeyOverride?: string): Promise<GetProductsApiResponse> {
  console.log('Getting products with params', params);
  
  const queryParams = new URLSearchParams();
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
  if (params.description) queryParams.append('description', params.description);
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.idCategories) {
    params.idCategories.forEach(id => queryParams.append('idCategories', id));
  }
  if (params.idDepartments) {
    params.idDepartments.forEach(id => queryParams.append('idDepartments', id));
  }

  const data = await makeApiRequest(`/products?${queryParams.toString()}`);
  return data;
}

export async function getCustomers(params: GetCustomersParams, apiKeyOverride?: string): Promise<GetCustomersApiResponse> {
  console.log('Getting customers with params', params);
  
  const queryParams = new URLSearchParams();
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());
  if (params.name) queryParams.append('name', params.name);
  if (params.email) queryParams.append('email', params.email);
  if (params.vatNumber) queryParams.append('vatNumber', params.vatNumber);
  if (params.fiscalCode) queryParams.append('fiscalCode', params.fiscalCode);

  const data = await makeApiRequest(`/customers?${queryParams.toString()}`);
  return data;
}

export async function getReceipts(params: GetReceiptsParams, apiKeyOverride?: string): Promise<GetReceiptsApiResponse> {
  console.log('Getting receipts with params', params);
  
  const queryParams = new URLSearchParams();
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());
  if (params.datetimeFrom) queryParams.append('datetimeFrom', params.datetimeFrom.toString());
  if (params.datetimeTo) queryParams.append('datetimeTo', params.datetimeTo.toString());
  if (params.idCustomer) queryParams.append('idCustomer', params.idCustomer);
  if (params.idUserFO) queryParams.append('idUserFO', params.idUserFO);

  const data = await makeApiRequest(`/receipts?${queryParams.toString()}`);
  return {
    ...data,
    receipts: data.data || [],
    start: params.start
  };
}

export async function getRooms(params: GetRoomsParams = {}, apiKeyOverride?: string): Promise<GetRoomsApiResponse> {
  console.log('Getting rooms with params', params);
  
  const queryParams = new URLSearchParams();
  if (params.start !== undefined) queryParams.append('start', params.start.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

  const data = await makeApiRequest(`/rooms?${queryParams.toString()}`);
  return {
    ...data,
    rooms: data.data || []
  };
}

export async function getTables(params: GetTablesParams = {}, apiKeyOverride?: string): Promise<GetTablesApiResponse> {
  console.log('Getting tables with params', params);
  
  const queryParams = new URLSearchParams();
  if (params.start !== undefined) queryParams.append('start', params.start.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.roomId) queryParams.append('roomId', params.roomId);

  const data = await makeApiRequest(`/tables?${queryParams.toString()}`);
  return {
    ...data,
    tables: data.data || []
  };
}

export async function getSoldByProductReport(params: GetSoldByProductParams, apiKeyOverride?: string): Promise<GetSoldByProductApiResponse> {
  console.log('Getting sales report with params', params);
  
  const queryParams = new URLSearchParams();
  queryParams.append('start', params.start.toString());
  queryParams.append('limit', params.limit.toString());
  queryParams.append('datetimeFrom', params.datetimeFrom.toString());
  queryParams.append('datetimeTo', params.datetimeTo.toString());
  if (params.idsSalesPoint) {
    params.idsSalesPoint.forEach(id => queryParams.append('idsSalesPoint', id));
  }

  const data = await makeApiRequest(`/sales-report?${queryParams.toString()}`);
  return data;
}
