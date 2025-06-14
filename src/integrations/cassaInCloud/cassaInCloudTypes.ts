/**
 * Definizioni dei tipi per l'integrazione con CassaInCloud
 * @version 1.0.0
 */

/**
 * Receipt type for CassaInCloud integration
 */

export interface CassaInCloudReceiptRow {
  id?: string;
  description: string;
  quantity: number; // BigDecimal in API, number in TS
  price: number;    // BigDecimal in API, number in TS
  vat: number;
  total: number;    // BigDecimal in API, number in TS
  subtotal?: boolean;
  refund?: boolean;
  menu?: boolean;
  composition?: boolean;
  coverCharge?: boolean;
  idProduct?: string;
  idProductVariant?: string;
  idCategory?: string;
  idDepartment?: string;
  salesType?: any; // TODO: Definire SalesType se necessario, per ora 'any'
  idTax?: string;
  idSalesMode?: string;
  stockMovementEnabled?: boolean;
  idStockMovement?: string;
  idOutgoingMovement?: string;
  rowNumber?: number; // Integer in API
  percentageVariation?: number; // BigDecimal in API, number in TS
  variation?: number; // BigDecimal in API, number in TS
  variationType?: any; // TODO: Definire VariationType se necessario, per ora 'any'
  rowModifierValues?: any[]; // TODO: Definire RowModifierValue se necessario, per ora 'any[]'
  note?: string;
  calculatedAmount?: number; // BigDecimal in API, number in TS
  shippingCost?: boolean;
  sharedPaymentReason?: string;
  rowCourseChoices?: any[]; // TODO: Definire RowCourseChoice se necessario, per ora 'any[]'
  rowComponentChoices?: any[]; // TODO: Definire RowComponentChoice se necessario, per ora 'any[]'
}

export interface CassaInCloudReceipt {
  id: string;
  number: string;
  date: string;
  datetime?: string;
  total: number;
  zNumber?: string;
  lotteryCode?: string;
  user?: {
    id: string;
    name?: string;
    fullName?: string;
    username?: string;
  };
  idUserFO?: string;
  userFOName?: string;
  document?: {
    id: string;
    amount: number;
    rows?: Array<CassaInCloudReceiptRow>; // Modificato per usare la nuova interfaccia
    user?: {
      id: string;
      name?: string;
      fullName?: string;
      username?: string;
    };
  };
}

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
 * Parametri per la funzione getReceipts
 */
export interface GetReceiptsParams {
  start: number;
  limit: number;
  datetimeFrom?: string | number;
  datetimeTo?: string | number;
  idsSalesPoint?: string[];
  sorts?: any[];
  idCustomers?: string[];
  numbers?: string[];
  idOrganizations?: string[];
  calculatedAmount?: number;
  idDocumentNumbering?: string;
  numberFrom?: number;
  numberTo?: number;
  zNumber?: string;
  idUserFO?: string;
  idDevice?: string;
  idCustomer?: string;
  idFidelityCard?: string;
  lotteryCode?: string;
}

/**
 * Risposta API per getReceipts
 */
export interface GetReceiptsApiResponse {
  receipts: CassaInCloudReceipt[];
  totalCount: number;
  currency?: CassaInCloudCurrency;
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
 * Rappresenta un cliente nel sistema CassaInCloud
 */
export interface CassaInCloudCustomer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  vatNumber?: string;
  fiscalCode?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  idOrganization?: string;
  lastUpdate?: number; // Timestamp
  // Aggiungere altri campi rilevanti dalla documentazione se necessario
}

/**
 * Parametri per la funzione getCustomers
 */
export interface GetCustomersParams {
  start: number;
  limit: number;
  sorts?: any[]; // Definire meglio Sort se necessario
  ids?: string[];
  vatNumber?: string;
  fiscalCode?: string;
  name?: string;
  email?: string;
  idsOrganization?: string[];
  lastUpdateFrom?: number; // Timestamp
  lastUpdateTo?: number; // Timestamp
}

/**
 * Risposta API per getCustomers
 */
export interface GetCustomersApiResponse {
  customers: CassaInCloudCustomer[];
  totalCount: number;
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

/**
 * Rappresenta una sala nel sistema CassaInCloud
 */
export interface CassaInCloudRoom {
  id: string; // ID univoco della sala
  name: string; // Nome della sala
  idSalesPoint: number; // ID del punto vendita a cui appartiene la sala
  externalId?: string; // Eventuale ID esterno
  lastUpdate?: number; // Timestamp dell'ultimo aggiornamento
  // Aggiungere altri campi rilevanti dalla documentazione se necessario
}

/**
 * Parametri per la funzione getRooms
 */
export interface GetRoomsParams {
  start: number;
  limit: number;
  idsSalesPoint: number[]; 
  sorts?: any[]; // Definire meglio Sort se necessario
  ids?: string[];
  name?: string;
  lastUpdateFrom?: number; // Timestamp
  lastUpdateTo?: number; // Timestamp
}

/**
 * Risposta API per getRooms
 */
export interface GetRoomsApiResponse {
  rooms: CassaInCloudRoom[];
  totalCount: number;
}

/**
 * Rappresenta un tavolo nel sistema CassaInCloud
 */
export interface CassaInCloudTable {
  id: string; // ID univoco del tavolo
  name: string; // Nome del tavolo
  idSalesPoint: number; // ID del punto vendita a cui appartiene il tavolo
  idRoom: string; // ID della sala a cui appartiene il tavolo
  room?: CassaInCloudRoom; // Oggetto Room associato (opzionale, dipende dalla risposta API)
  externalId?: string; // Eventuale ID esterno
  seats?: number; // Numero di posti (se disponibile)
  seatsAvailable?: number; // Numero di posti disponibili (campo effettivo dall'API)
  lastUpdate?: number; // Timestamp dell'ultimo aggiornamento
  // Aggiungere altri campi rilevanti dalla documentazione se necessario
}

/**
 * Parametri per la funzione getTables
 */
export interface GetTablesParams {
  start: number;
  limit: number;
  idsSalesPoint: number[];
  sorts?: any[]; // Definire meglio Sort se necessario
  ids?: string[];
  name?: string;
  idsRoom?: string[];
  externalId?: string[];
  lastUpdateFrom?: number; // Timestamp
  lastUpdateTo?: number; // Timestamp
}

/**
 * Risposta API per getTables
 */
export interface GetTablesApiResponse {
  tables: CassaInCloudTable[];
  totalCount: number;
}
