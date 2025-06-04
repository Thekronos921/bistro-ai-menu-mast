export interface InternalProductVariant {
  id: string; // ID della variante da CassaInCloud
  name: string; // Nome/descrizione della variante
  // Aggiungere altri campi specifici della variante se necessari (es. prezzo specifico della variante)
}

export interface InternalProduct {
  id: string; // ID univoco del prodotto (può essere lo stesso di CassaInCloud o l'ID della tabella dishes)
  name: string; // Nome principale del prodotto (da CassaInCloudProduct.description)
  descriptionLabel?: string; // Etichetta descrittiva (da CassaInCloudProduct.descriptionLabel)
  descriptionReceipt?: string; // Descrizione per scontrino (da CassaInCloudProduct.descriptionReceipt)
  price: number; // Prezzo del prodotto (da CassaInCloudProduct.prices[0].value)
  
  restaurant_category_id?: string | null; // NUOVO: ID della categoria interna (UUID dalla tabella restaurant_categories)
  external_category_id?: string; // RINOMINATO: ID della categoria da CassaInCloud (precedentemente categoryId)
  // categoryName?: string; // RIMOSSO: Nome della categoria (da CassaInCloudProduct.category.description) - si otterrà con JOIN
  
  departmentId?: string; // ID del reparto da CassaInCloud
  departmentName?: string; // Nome del reparto (da CassaInCloudProduct.department.description)
  taxRate?: number; // Aliquota IVA (da CassaInCloudProduct.department.tax.rate)

  isSoldByWeight: boolean; // Venduto a peso (da CassaInCloudProduct.soldByWeight)
  isMultivariant: boolean; // Ha varianti (da CassaInCloudProduct.multivariant)
  
  // Campi di abilitazione (potrebbero essere utili per filtri o logica di visualizzazione)
  isEnabledForRestaurant: boolean; // (da CassaInCloudProduct.enableForRisto)
  isEnabledForSale: boolean; // (da CassaInCloudProduct.enableForSale)
  isEnabledForECommerce: boolean; // (da CassaInCloudProduct.enableForECommerce)
  // ...altri campi 'enableFor...'

  variants: InternalProductVariant[]; // Array di varianti mappate
  
  cassaInCloudId: string; // ID originale da CassaInCloud (per riferimento)
  cicLastUpdate: number; // Timestamp dell'ultimo aggiornamento in CassaInCloud (da CassaInCloudProduct.lastUpdate)
  needsCicVerification?: boolean; // Nuovo campo per indicare se il prodotto necessita di verifica su CassaInCloud
  
  // Campi per l'integrazione dello Stock
  stockQuantity?: number; // Quantità attuale in magazzino
  stockUnit?: string; // Unità di misura dello stock (se disponibile e diversa dall'unità di vendita)
  lastStockUpdate?: string; // Timestamp dell'ultimo aggiornamento dello stock (ISO date string)
  warningLevel?: number; // Livello di attenzione per lo stock (da CassaInCloud Stock.warningLevel)
  manageStock?: boolean; // Indica se il prodotto è gestito a magazzino (da CassaInCloud Stock.manageStock)
  // Aggiungere qui altri campi che potrebbero servire alla tua applicazione
}

// Nuova interfaccia per i movimenti di magazzino
export interface InternalStockMovement {
  id: string; // ID del movimento da CassaInCloud (se disponibile, altrimenti generato internamente)
  productId: string; // ID del prodotto a cui si riferisce il movimento
  productVariantId?: string; // ID della variante, se applicabile
  date: string; // Timestamp del movimento (ISO date string, da CassaInCloud StockMovement.date)
  quantity: number; // Quantità movimentata (da CassaInCloud StockMovement.quantity)
  reason?: string; // Causale del movimento (da CassaInCloud StockMovement.reason)
  notes?: string; // Note aggiuntive (da CassaInCloud StockMovement.note)
  // Potremmo aggiungere altri campi se necessari, es. utente che ha effettuato il movimento, etc.
}