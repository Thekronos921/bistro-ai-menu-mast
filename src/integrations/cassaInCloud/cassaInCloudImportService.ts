import {
  CassaInCloudCategory,
  CassaInCloudCustomer,
  CassaInCloudProduct,
  CassaInCloudSettings,
} from './cassaInCloudTypes';
import {
  getCategories,
  getCustomers,
  getProducts,
} from './cassaInCloudService';
import { Database } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';

type InternalCategory = Database['public']['Tables']['categories']['Insert'];
type InternalCustomer = Database['public']['Tables']['customers']['Insert'];
type InternalProduct = Database['public']['Tables']['products']['Insert'];

const mapCategoryToInternal = (
  category: CassaInCloudCategory,
  restaurantId: string
): InternalCategory => ({
  id: category.id.toString(),
  restaurant_id: restaurantId,
  name: category.name,
  description: category.description || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const mapCustomerToInternal = (
  customer: CassaInCloudCustomer,
  restaurantId: string
): InternalCustomer => ({
  id: customer.id.toString(),
  restaurant_id: restaurantId,
  first_name: customer.firstName,
  last_name: customer.lastName,
  email: customer.email || null,
  phone: customer.phone || null,
  address: customer.address || null,
  city: customer.city || null,
  zip_code: customer.zipCode || null,
  country: customer.country || null,
  notes: customer.notes || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const mapProductToInternal = (
  product: CassaInCloudProduct,
  restaurantId: string,
  categoryMapping: Record<string, string>
): InternalProduct => {
  const categoryId = categoryMapping[product.idCategory.toString()];

  if (!categoryId) {
    logSkippedProduct(product, 'Categoria non trovata');
    return null;
  }

  if (product.price == null || isNaN(Number(product.price))) {
    logInvalidProduct(product, 'Prezzo non valido');
    return null;
  }

  const sellingPrice = parseFloat(product.price);

  return {
    id: product.id.toString(),
    restaurant_id: restaurantId,
    name: product.description,
    description: product.notes || null,
    category_id: categoryId,
    selling_price: sellingPrice,
    is_available: product.isAvailable === '1',
    notes_chef: product.notesChef || null,
    allergens: product.allergens || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const importCassaInCloudData = async (
  restaurantId: string,
  settings: CassaInCloudSettings,
  onProgress?: (message: string) => void
): Promise<void> => {
  if (!settings.apiUrl || !settings.apiKey) {
    throw new Error(
      'API URL e API Key sono obbligatorie nelle impostazioni di Cassa in Cloud.'
    );
  }

  if (!restaurantId) {
    throw new Error('Restaurant ID non può essere vuoto.');
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      throw new Error('Utente non autenticato.');
    }
  });

  try {
    // Import categories
    onProgress?.('Importazione categorie in corso...');
    const categories = await getCategories(settings);

    const categoryMapping: Record<string, string> = {};
    for (const category of categories) {
      const internalCategory = mapCategoryToInternal(category, restaurantId);
      await supabase.from('categories').insert(internalCategory);
      categoryMapping[category.id.toString()] = category.id.toString();
    }
    console.log(`Importate ${categories.length} categorie`);

    // Import customers
    onProgress?.('Importazione clienti in corso...');
    const customers = await getCustomers(settings);
    if (customers.length > 0) {
      const mappedCustomers = customers.map((customer) =>
        mapCustomerToInternal(customer, restaurantId)
      );
      await supabase.from('customers').insert(mappedCustomers);
      console.log(`Importati ${customers.length} clienti`);
    }

    // Import products
    onProgress?.('Importazione prodotti in corso...');
    const productsResponse = await getProducts(settings, { start: 0, limit: 100 });
    
    // Fix: Handle the API response structure correctly
    const products = Array.isArray(productsResponse) ? productsResponse : productsResponse.data || [];
    
    if (products.length > 0) {
      const mappedProducts = products.map((product: CassaInCloudProduct) => 
        mapProductToInternal(product, restaurantId, categoryMapping)
      );
      
      for (const product of mappedProducts) {
        await insertProduct(product);
      }
      console.log(`Importati ${products.length} prodotti`);
    }

    onProgress?.('Importazione completata con successo!');
  } catch (error) {
    console.error('Errore durante l\'importazione:', error);
    throw error;
  }
};

const insertProduct = async (product: InternalProduct): Promise<void> => {
  if (!product) return;

  try {
    await supabase.from('products').insert(product);
  } catch (dbError) {
    console.error(
      `Errore durante l'inserimento del prodotto ${product.name}:`,
      dbError
    );
    throw dbError;
  }
};

const logSkippedProduct = (product: CassaInCloudProduct, reason: string): void => {
  console.log(`Prodotto saltato: ${product.description || 'N/A'} - Motivo: ${reason}`);
};

const logInvalidProduct = (product: CassaInCloudProduct, reason: string): void => {
  console.log(`Prodotto non valido: ${product.description || 'N/A'} - Motivo: ${reason}`);
};
