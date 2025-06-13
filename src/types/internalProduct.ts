
export interface InternalProduct {
  cassaInCloudId: string;
  name: string;
  price: number;
  external_category_id?: string;
  departmentName?: string;
  descriptionLabel?: string;
  isMultivariant?: boolean;
  isEnabledForRestaurant?: boolean;
  cicLastUpdate?: number;
  taxRate?: number;
  variants?: Array<{
    id: string;
    description: string;
    descriptionReceipt?: string;
  }>;
}
