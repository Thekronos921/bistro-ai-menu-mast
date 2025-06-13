import { InternalProduct, InternalProductVariant } from '@/types/internalProduct';
import {
  CassaInCloudProduct,
  CassaInCloudProductVariantAPI,
  // CassaInCloudPrice, // Non direttamente usata qui, ma CassaInCloudProduct la usa
  // CassaInCloudDepartment, // Non direttamente usata qui, ma CassaInCloudProduct la usa
  // CassaInCloudCategory, // Non direttamente usata qui, ma CassaInCloudProduct la usa
} from './cassaInCloudTypes'; // Modificato: importa direttamente da cassaInCloudTypes invece di cassaInCloudService

export const mapCassaInCloudProductToInternalProduct = (cicProduct: CassaInCloudProduct): InternalProduct => {
  const price = cicProduct.prices && cicProduct.prices.length > 0 ? cicProduct.prices[0].value : 0;

  const internalVariants: InternalProductVariant[] = cicProduct.variants ? cicProduct.variants.map((v: CassaInCloudProductVariantAPI) => ({
    id: v.id,
    name: v.description,
    // descriptionReceipt: v.descriptionReceipt, // Se vuoi mappare anche questo
  })) : [];

  return {
    // id: cicProduct.id, // L'ID della tabella 'dishes' verrà gestito dal servizio di importazione
    id: '', // Sarà impostato dal servizio di importazione dopo l'upsert in Supabase
    name: cicProduct.description,
    descriptionLabel: cicProduct.descriptionLabel,
    descriptionReceipt: cicProduct.descriptionReceipt,
    price: price,

    external_category_id: cicProduct.idCategory, // Aggiornato per usare external_category_id
    // categoryName: cicProduct.category?.description, // Rimosso, si otterrà con JOIN
    // restaurant_category_id sarà gestito nel servizio di importazione

    departmentId: cicProduct.idDepartment, 
    departmentName: cicProduct.department?.description,
    taxRate: cicProduct.department?.tax?.rate,

    isSoldByWeight: cicProduct.soldByWeight,
    isMultivariant: cicProduct.multivariant,

    isEnabledForRestaurant: cicProduct.enableForRisto, // Campo richiesto
    isEnabledForSale: cicProduct.enableForSale,
    isEnabledForECommerce: cicProduct.enableForECommerce,
    // isEnabledForMobileCommerce: cicProduct.enableForMobileCommerce, 
    // isEnabledForSelfOrderMenu: cicProduct.enableForSelfOrderMenu, 
    // isEnabledForKiosk: cicProduct.enableForKiosk, 
    
    variants: internalVariants,

    cassaInCloudId: cicProduct.id, // ID specifico di CassaInCloud per external_id
    cicLastUpdate: cicProduct.lastUpdate, 
  };
};