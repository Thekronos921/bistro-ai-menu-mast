import axios from 'axios';
import { CassaInCloudSettings } from './cassaInCloudTypes';
import { getPreferenceValues } from '@raycast/api';
import { CassaInCloudProduct, GetProductsParams, GetProductsApiResponse, CassaInCloudReceipt, GetReceiptsParams, GetReceiptsApiResponse, GetRoomsParams, GetRoomsApiResponse, GetTablesParams, GetTablesApiResponse, CassaInCloudRoom, CassaInCloudTable } from './cassaInCloudTypes';

export class CassaInCloudService {
  private readonly baseURL = 'https://api.cassaInCloud.it/v1';
  private readonly apiKey: string;
  private readonly companyId: string;
  private readonly salesPointId: string;

  constructor() {
    const preferences = getPreferenceValues<CassaInCloudSettings>();
    this.apiKey = preferences.apiKey;
    this.companyId = preferences.companyId;
    this.salesPointId = preferences.salesPointId;

    if (!this.apiKey || !this.companyId || !this.salesPointId) {
      throw new Error('Cassa In Cloud API Key, Company ID, and Sales Point ID are required.');
    }
  }

  private async makeRequest(endpoint: string, method: 'get' | 'post' | 'put' | 'delete' = 'get', data?: any) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`CassaInCloudService: Making ${method.toUpperCase()} request to ${url}`);

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          'CIC-API-KEY': this.apiKey,
          'CIC-COMPANY-ID': this.companyId,
          'CIC-SALES-POINT-ID': this.salesPointId,
        },
      });

      console.log(`CassaInCloudService: ${method.toUpperCase()} request to ${url} successful`);
      return response;
    } catch (error: any) {
      console.error(`CassaInCloudService: ${method.toUpperCase()} request to ${url} failed`, error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async getProducts(params: GetProductsParams = {}): Promise<GetProductsApiResponse> {
    console.log('CassaInCloudService: Getting products with params', params);

    try {
      const queryParams = new URLSearchParams();
      if (params.start !== undefined) queryParams.append('start', params.start.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.ids !== undefined) {
        if (Array.isArray(params.ids)) {
          params.ids.forEach((id) => queryParams.append('ids', id));
        } else {
          queryParams.append('ids', params.ids);
        }
      }
      if (params.department_ids !== undefined) {
        if (Array.isArray(params.department_ids)) {
          params.department_ids.forEach((id) => queryParams.append('department_ids', id));
        } else {
          queryParams.append('department_ids', params.department_ids);
        }
      }
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params.price_list_ids !== undefined) {
        if (Array.isArray(params.price_list_ids)) {
          params.price_list_ids.forEach((id) => queryParams.append('price_list_ids', id));
        } else {
          queryParams.append('price_list_ids', params.price_list_ids);
        }
      }

      const response = await this.makeRequest(`/Products?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetProductsApiResponse = await response.json();
      console.log('CassaInCloudService: Got products response', data);

      return data;
    } catch (error) {
      console.error('CassaInCloudService: Error getting products:', error);
      throw error;
    }
  }

  async getProductById(productId: string): Promise<CassaInCloudProduct | null> {
    console.log(`CassaInCloudService: Getting product by ID ${productId}`);

    try {
      const response = await this.makeRequest(`/Products/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`CassaInCloudService: Product with ID ${productId} not found`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const product: CassaInCloudProduct = await response.json();
      console.log(`CassaInCloudService: Got product by ID ${productId}`, product);
      return product;
    } catch (error) {
      console.error(`CassaInCloudService: Error getting product by ID ${productId}`, error);
      throw error;
    }
  }

  async getReceipts(params: GetReceiptsParams): Promise<GetReceiptsApiResponse> {
    console.log('CassaInCloudService: Getting receipts with params', params);

    try {
      const queryParams = new URLSearchParams();
      if (params.start !== undefined) queryParams.append('start', params.start.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.ids !== undefined) {
        if (Array.isArray(params.ids)) {
          params.ids.forEach((id) => queryParams.append('ids', id));
        } else {
          queryParams.append('ids', params.ids);
        }
      }
      if (params.datetimeFrom) queryParams.append('datetimeFrom', params.datetimeFrom);
      if (params.datetimeTo) queryParams.append('datetimeTo', params.datetimeTo);
      if (params.id_user) queryParams.append('id_user', params.id_user);
      if (params.id_customer) queryParams.append('id_customer', params.id_customer);
      if (params.payment_method_ids) {
        if (Array.isArray(params.payment_method_ids)) {
          params.payment_method_ids.forEach((id) => queryParams.append('payment_method_ids', id));
        } else {
          queryParams.append('payment_method_ids', params.payment_method_ids);
        }
      }
      if (params.status) queryParams.append('status', params.status);
      if (params.cashed !== undefined) queryParams.append('cashed', params.cashed.toString());
      if (params.id_delivery_boy) queryParams.append('id_delivery_boy', params.id_delivery_boy);
      if (params.delivery_boy_name) queryParams.append('delivery_boy_name', params.delivery_boy_name);
      if (params.table_ids) {
        if (Array.isArray(params.table_ids)) {
          params.table_ids.forEach((id) => queryParams.append('table_ids', id));
        } else {
          queryParams.append('table_ids', params.table_ids);
        }
      }
      if (params.room_ids) {
        if (Array.isArray(params.room_ids)) {
          params.room_ids.forEach((id) => queryParams.append('room_ids', id));
        } else {
          queryParams.append('room_ids', params.room_ids);
        }
      }
      if (params.is_delivery !== undefined) queryParams.append('is_delivery', params.is_delivery.toString());
      if (params.delivery_address) queryParams.append('delivery_address', params.delivery_address);
      if (params.delivery_city) queryParams.append('delivery_city', params.delivery_city);
      if (params.delivery_zip_code) queryParams.append('delivery_zip_code', params.delivery_zip_code);
      if (params.delivery_country) queryParams.append('delivery_country', params.delivery_country);
      if (params.customer_name) queryParams.append('customer_name', params.customer_name);
      if (params.customer_phone) queryParams.append('customer_phone', params.customer_phone);
      if (params.customer_email) queryParams.append('customer_email', params.customer_email);
      if (params.customer_fiscal_code) queryParams.append('customer_fiscal_code', params.customer_fiscal_code);
      if (params.customer_vat_number) queryParams.append('customer_vat_number', params.customer_vat_number);
      if (params.customer_external_id) queryParams.append('customer_external_id', params.customer_external_id);
      if (params.customer_ids) {
        if (Array.isArray(params.customer_ids)) {
          params.customer_ids.forEach((id) => queryParams.append('customer_ids', id));
        } else {
          queryParams.append('customer_ids', params.customer_ids);
        }
      }
      if (params.note) queryParams.append('note', params.note);
      if (params.order_id) queryParams.append('order_id', params.order_id);
      if (params.is_order !== undefined) queryParams.append('is_order', params.is_order.toString());
      if (params.created_from) queryParams.append('created_from', params.created_from);
      if (params.created_to) queryParams.append('created_to', params.created_to);
      if (params.total_amount_from !== undefined) queryParams.append('total_amount_from', params.total_amount_from.toString());
      if (params.total_amount_to !== undefined) queryParams.append('total_amount_to', params.total_amount_to.toString());
      if (params.cash_amount_from !== undefined) queryParams.append('cash_amount_from', params.cash_amount_from.toString());
      if (params.cash_amount_to !== undefined) queryParams.append('cash_amount_to', params.cash_amount_to.toString());
      if (params.electronic_amount_from !== undefined) queryParams.append('electronic_amount_from', params.electronic_amount_from.toString());
      if (params.electronic_amount_to !== undefined) queryParams.append('electronic_amount_to', params.electronic_amount_to.toString());
      if (params.change_amount_from !== undefined) queryParams.append('change_amount_from', params.change_amount_from.toString());
      if (params.change_amount_to !== undefined) queryParams.append('change_amount_to', params.change_amount_to.toString());
      if (params.num_receipt_id) queryParams.append('num_receipt_id', params.num_receipt_id);
      if (params.delivery_fee_from !== undefined) queryParams.append('delivery_fee_from', params.delivery_fee_from.toString());
      if (params.delivery_fee_to !== undefined) queryParams.append('delivery_fee_to', params.delivery_fee_to.toString());
      if (params.customer_shipping_address) queryParams.append('customer_shipping_address', params.customer_shipping_address);
      if (params.customer_shipping_city) queryParams.append('customer_shipping_city', params.customer_shipping_city);
      if (params.customer_shipping_zip_code) queryParams.append('customer_shipping_zip_code', params.customer_shipping_zip_code);
      if (params.customer_shipping_country) queryParams.append('customer_shipping_country', params.customer_shipping_country);

      const response = await this.makeRequest(`/Receipts?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetReceiptsApiResponse = await response.json();
      console.log('CassaInCloudService: Got receipts response', data);

      return data;
    } catch (error) {
      console.error('CassaInCloudService: Error getting receipts:', error);
      throw error;
    }
  }

  async getRooms(params: GetRoomsParams = {}): Promise<GetRoomsApiResponse> {
    console.log('CassaInCloudService: Getting rooms with params', params);
    
    try {
      const queryParams = new URLSearchParams();
      if (params.start !== undefined) queryParams.append('start', params.start.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

      const response = await this.makeRequest(`/Rooms?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetRoomsApiResponse = await response.json();
      console.log('CassaInCloudService: Got rooms response', data);
      
      return data;
    } catch (error) {
      console.error('CassaInCloudService: Error getting rooms:', error);
      throw error;
    }
  }

  async getTables(params: GetTablesParams = {}): Promise<GetTablesApiResponse> {
    console.log('CassaInCloudService: Getting tables with params', params);
    
    try {
      const queryParams = new URLSearchParams();
      if (params.start !== undefined) queryParams.append('start', params.start.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.roomId) queryParams.append('roomId', params.roomId);

      const response = await this.makeRequest(`/Tables?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetTablesApiResponse = await response.json();
      console.log('CassaInCloudService: Got tables response', data);
      
      return data;
    } catch (error) {
      console.error('CassaInCloudService: Error getting tables:', error);
      throw error;
    }
  }

  async createCustomer(customerData: any): Promise<any> {
    console.log('CassaInCloudService: Creating customer', customerData);

    try {
      const response = await this.makeRequest('/Customers', 'post', customerData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('CassaInCloudService: Customer created', data);
      return data;
    } catch (error) {
      console.error('CassaInCloudService: Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, customerData: any): Promise<any> {
    console.log(`CassaInCloudService: Updating customer ${customerId}`, customerData);

    try {
      const response = await this.makeRequest(`/Customers/${customerId}`, 'put', customerData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`CassaInCloudService: Customer ${customerId} updated`, data);
      return data;
    } catch (error) {
      console.error(`CassaInCloudService: Error updating customer ${customerId}:`, error);
      throw error;
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    console.log(`CassaInCloudService: Deleting customer ${customerId}`);

    try {
      const response = await this.makeRequest(`/Customers/${customerId}`, 'delete');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`CassaInCloudService: Customer ${customerId} deleted`);
    } catch (error) {
      console.error(`CassaInCloudService: Error deleting customer ${customerId}:`, error);
      throw error;
    }
  }

  async getReceiptsInRange(
    datetimeFrom: string,
    datetimeTo: string,
    limit: number = 100,
    start: number = 0
  ): Promise<GetReceiptsApiResponse> {
    console.log(`CassaInCloudService: Getting receipts from ${datetimeFrom} to ${datetimeTo}`);
    
    try {
      const params: GetReceiptsParams = {
        datetimeFrom,
        datetimeTo,
        limit,
        start
      };

      // Ensure ids is an array before using map
      if (params.ids && typeof params.ids === 'string') {
        params.ids = [params.ids];
      }

      const queryParams = new URLSearchParams();
      queryParams.append('datetimeFrom', params.datetimeFrom);
      queryParams.append('datetimeTo', params.datetimeTo);
      queryParams.append('limit', params.limit.toString());
      queryParams.append('start', params.start.toString());
      
      if (params.ids && Array.isArray(params.ids)) {
        params.ids.forEach(id => queryParams.append('ids', id));
      }

      const response = await this.makeRequest(`/Receipts?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Ensure the response includes the start property
      const data: GetReceiptsApiResponse = {
        ...responseData,
        start: start
      };
      
      console.log('CassaInCloudService: Got receipts response', data);
      
      return data;
    } catch (error) {
      console.error('CassaInCloudService: Error getting receipts:', error);
      throw error;
    }
  }
}
