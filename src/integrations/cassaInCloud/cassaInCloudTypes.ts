/**
 * Definizioni dei tipi per l'integrazione con CassaInCloud
 * @version 1.0.0
 */

/**
 * Risposta dell'API per la richiesta di un token di accesso
 */
export interface AccessTokenResponse {
  access_token: string;
  expires_in: number; // Durata del token in secondi
  token_type: string;
}

/**
 * Struttura per conservare il token e la sua scadenza
 */
export interface StoredToken {
  token: string;
  expiresAt: number; // Timestamp di quando il token scadrà
}

/**
 * Rappresenta una valuta nel sistema CassaInCloud
 */
export interface CassaInCloudCurrency {
  id: number; // Utilizziamo number come tipo standard per gli ID numerici
  code: string; // Codice valuta (es. "EUR")
  name: string; // Nome completo (es. "Euro")
  numberOfDecimals: number; // Numero di decimali utilizzati
  symbol?: string; // Simbolo della valuta (es. "€")
}

/**
 * Parametri per la funzione getProducts
 */
export interface GetProductsParams {
  idsSalesPoint?: string[];
  description?: string;
  lastUpdateFrom?: string | number;
  lastUpdateTo?: string | number;
  enabledForChannels?: string[];
  itemListVisibility?: boolean;
  idCategories?: string[];
  idDepartments?: string[];
  categoryId?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Parametri per la funzione getCategories
 */
export interface GetCategoriesParams {
  idsSalesPoint?: string[];
  description?: string;
  lastUpdateFrom?: number;
  lastUpdateTo?: number;
  enabledForChannels?: string[];
  itemListVisibility?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Parametri per la funzione getSoldByProductReport
 */
export interface GetSoldByProductParams {
  start: number;
  limit: number;
  datetimeFrom: string | number; // Timestamp (milliseconds) or "YYYY-MM-DD"
  datetimeTo: string | number;   // Timestamp (milliseconds) or "YYYY-MM-DD"
  idsSalesPoint?: string[];     // Array di ID di punti vendita
  idProducts?: string[];
  idDepartments?: string[];
  idCategories?: string[];
  sorts?: any[]; // Definire meglio se necessario
}

/**
 * Risposta API per getSoldByProductReport
 */
export interface GetSoldByProductApiResponse {
  currency: CassaInCloudCurrency;
  totalCount: number;
  totalSold: number;
  totalRefund: number;
  totalQuantity: number;
  totalDepartmentSold: number;
  totalDepartmentRefund: number;
  totalDepartmentQuantity: number;
  sold: CassaInCloudSoldByProduct[];
  start?: number;
  limit?: number;
}

/**
 * Prodotto venduto nel report CassaInCloud
 */
export interface CassaInCloudSoldByProduct {
  isMenuEntry?: boolean;
  isCompositionEntry?: boolean;
  idProduct: string;
  idMenuProduct?: string;
  product?: CassaInCloudProduct;
  menuProduct?: CassaInCloudProduct;
  quantity: number;
  profit: number;
  percentTotal: number;
}

/**
 * Rappresenta un punto vendita nel sistema CassaInCloud
 */
export interface CassaInCloudSalesPoint {
  city: string;
  country: string;
  currency: CassaInCloudCurrency;
  description: string;
  district: string;
  email: string;
  id: number;
  latitude?: number;
  logoBig?: string;
  logoSmall?: string;
  longitude?: number;
  name: string;
  phoneNumber: string;
  street: string;
  taxCode?: string;
  vatNumber: string;
  zipcode: string;
}

/**
 * Prodotto CassaInCloud
 */
export interface CassaInCloudProduct {
  id: string;
  description: string;
  descriptionLabel?: string;
  descriptionReceipt?: string;
  idDepartment?: string;
  department?: CassaInCloudDepartment;
  idCategory?: string;
  category?: CassaInCloudCategory;
  soldByWeight: boolean;
  multivariant: boolean;
  enableForRisto: boolean;
  enableForSale: boolean;
  enableForECommerce: boolean;
  enableForMobileCommerce?: boolean;
  enableForSelfOrderMenu?: boolean;
  enableForKiosk?: boolean;
  internalId?: string;
  variants?: CassaInCloudProductVariantAPI[];
  prices: CassaInCloudPrice[];
  idSalesPoint?: string;
  lastUpdate: number;
  menu?: any;
  composition?: any;
  soldOnlyInCompositions?: boolean;
}

/**
 * Categoria CassaInCloud
 */
export interface CassaInCloudCategory {
  id: string;
  description: string;
  externalId?: string;
  idSalesPoint?: string;
  enableForRisto?: boolean;
  enableForSale?: boolean;
  enableForECommerce?: boolean;
  enableForMobileCommerce?: boolean;
  enableForSelfOrderMenu?: boolean;
  enableForKiosk?: boolean;
  modifiers?: any[];
  imageUrl?: string;
  lastUpdate?: number;
}

/**
 * Dipartimento CassaInCloud
 */
export interface CassaInCloudDepartment {
  id: string;
  description: string;
  tax?: {
    id: string;
    description: string;
    rate: number;
  };
}

/**
 * Prezzo CassaInCloud
 */
export interface CassaInCloudPrice {
  idSalesPoint: string;
  value: number;
}

/**
 * Variante prodotto CassaInCloud
 */
export interface CassaInCloudProductVariantAPI {
  id: string;
  description: string;
  descriptionReceipt?: string;
}

/**
 * Stock CassaInCloud
 */
export interface CassaInCloudStock {
  idProduct: string;
  idSalesPoint: string;
  idVariant?: string;
  quantity: number;
  unit: string;
  warningLevel?: number;
  lastUpdate?: number;
  manageStock?: boolean;
}

/**
 * Risposta API per la richiesta di categorie
 */
export interface GetCategoriesApiResponse {
  categories: CassaInCloudCategory[];
  totalCount: number;
}

/**
 * Risposta API per la richiesta di prodotti
 */
export interface GetProductsApiResponse {
  products: CassaInCloudProduct[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Risposta API per la richiesta di stock
 */
export interface GetStockApiResponse {
  data: CassaInCloudStock[];
}

/**
 * Risposta API per la richiesta di punti vendita
 */
export interface GetSalesPointsApiResponse {
  salesPoint: CassaInCloudSalesPoint[];
  totalCount: number;
}