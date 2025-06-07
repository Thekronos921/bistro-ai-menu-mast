export interface EnhancedIngredient {
  id: string;
  name: string;
  
  // Original properties that must be maintained for compatibility
  unit: string; // Manteniamo per compatibilità (sarà uguale a primary_unit)
  allocated_stock: number;
  labeled_stock: number;
  last_synced_at?: string;
  par_level?: number;
  
  // Enhanced UMP/UUS properties
  primary_unit: string; // UMP - Unità di Misura Principale (acquisto)
  usage_unit?: string; // UUS - Unità di Utilizzo Standard (ricette)
  cost_per_unit: number;
  effective_cost_per_unit: number; // Make this required to match original Ingredient type
  yield_percentage: number;
  average_pieces_per_kg?: number;
  average_weight_per_piece_g?: number;
  last_lot_conversion_update?: string;
  current_stock: number; // Make this required to match original Ingredient type
  min_stock_threshold?: number;
  restaurant_id: string;
  category?: string;
  supplier: string; // Make this required to match original Ingredient type
  supplier_product_code: string; // Make this required to match original Ingredient type
  notes?: string;
  external_id?: string;
  batch_number?: string;
  expiry_date?: string;
  storage_instructions?: string;
  origin_certification?: string;
  
  // Additional fields from original Ingredient type
  is_semilavorato?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IngredientBatch {
  id: string;
  ingredient_id: string;
  batch_number: string;
  quantity_received: number;
  quantity_remaining: number;
  expiry_date: string;
  supplier_delivery_date?: string;
  storage_location?: string;
  notes?: string;
  total_pieces_count?: number; // NUOVO: Conteggio pezzi nel lotto
  calculated_weight_per_piece_g?: number; // NUOVO: Peso per pezzo calcolato
  calculated_pieces_per_kg?: number; // NUOVO: Pezzi per kg calcolati
  cost_per_piece?: number; // NUOVO: Costo per pezzo
  effective_cost_per_piece?: number; // NUOVO: Costo effettivo per pezzo post-resa
  created_at: string;
  updated_at: string;
}

// Tipo per le unità di misura supportate
export type UnitType = 'weight' | 'volume' | 'piece' | 'other';

export interface UnitDefinition {
  code: string;
  name: string;
  type: UnitType;
  baseUnit?: string; // Per conversioni (es. 'g' per 'kg')
  conversionFactor?: number; // Fattore di conversione all'unità base
}

// Definizioni unità supportate
export const SUPPORTED_UNITS: UnitDefinition[] = [
  // Peso
  { code: 'g', name: 'Grammi', type: 'weight' },
  { code: 'kg', name: 'Chilogrammi', type: 'weight', baseUnit: 'g', conversionFactor: 1000 },
  { code: 'etti', name: 'Etti', type: 'weight', baseUnit: 'g', conversionFactor: 100 },
  
  // Volume
  { code: 'ml', name: 'Millilitri', type: 'volume' },
  { code: 'l', name: 'Litri', type: 'volume', baseUnit: 'ml', conversionFactor: 1000 },
  { code: 'dl', name: 'Decilitri', type: 'volume', baseUnit: 'ml', conversionFactor: 100 },
  
  // Pezzi
  { code: 'pz', name: 'Pezzi', type: 'piece' },
  { code: 'spicchio', name: 'Spicchi', type: 'piece' },
  { code: 'foglia', name: 'Foglie', type: 'piece' },
  
  // Altri
  { code: 'porzione', name: 'Porzioni', type: 'other' },
  { code: 'cucchiaio', name: 'Cucchiai', type: 'volume', baseUnit: 'ml', conversionFactor: 15 },
  { code: 'cucchiaino', name: 'Cucchiaini', type: 'volume', baseUnit: 'ml', conversionFactor: 5 },
  { code: 'tazza', name: 'Tazze', type: 'volume', baseUnit: 'ml', conversionFactor: 250 }
];
