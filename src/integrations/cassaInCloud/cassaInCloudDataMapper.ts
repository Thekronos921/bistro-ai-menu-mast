
import type { CassaInCloudProduct } from './cassaInCloudTypes';
import type { InternalProduct } from '@/types/internalProduct';

export function mapCassaInCloudProductToInternalProduct(
  product: CassaInCloudProduct,
  idSalesPointForPricing: string
): InternalProduct {
  // Find the price for the specific sales point
  const priceForSalesPoint = product.prices?.find(
    price => price.idSalesPoint === idSalesPointForPricing
  );
  
  return {
    cassaInCloudId: product.id,
    name: product.description,
    price: priceForSalesPoint?.value || 0,
    external_category_id: product.idCategory,
    departmentName: product.department?.description,
    descriptionLabel: product.descriptionLabel,
    isMultivariant: product.multivariant,
    isEnabledForRestaurant: product.enableForRisto,
    cicLastUpdate: product.lastUpdate,
    taxRate: product.department?.tax?.rate,
    variants: product.variants || []
  };
}
