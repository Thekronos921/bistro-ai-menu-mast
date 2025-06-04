
// Unità di misura base supportate
export type BaseUnit = 
  | 'g' | 'kg' 
  | 'ml' | 'l' 
  | 'pz' | 'porzione'
  | 'cucchiaino' | 'cucchiaio' | 'tazza'
  | 'spicchio' | 'foglia';

// Fattori di conversione verso l'unità base
export const UNIT_CONVERSIONS: Record<string, { baseUnit: BaseUnit; factor: number }> = {
  // Peso
  'g': { baseUnit: 'g', factor: 1 },
  'gr': { baseUnit: 'g', factor: 1 },
  'grammi': { baseUnit: 'g', factor: 1 },
  'kg': { baseUnit: 'g', factor: 1000 },
  'chilogrammi': { baseUnit: 'g', factor: 1000 },
  'etti': { baseUnit: 'g', factor: 100 },
  'hg': { baseUnit: 'g', factor: 100 },
  
  // Volume
  'ml': { baseUnit: 'ml', factor: 1 },
  'millilitri': { baseUnit: 'ml', factor: 1 },
  'l': { baseUnit: 'ml', factor: 1000 },
  'litri': { baseUnit: 'ml', factor: 1000 },
  'dl': { baseUnit: 'ml', factor: 100 },
  'cl': { baseUnit: 'ml', factor: 10 },
  
  // Unità da cucina
  'cucchiaino': { baseUnit: 'ml', factor: 5 },
  'cucchiaini': { baseUnit: 'ml', factor: 5 },
  'tsp': { baseUnit: 'ml', factor: 5 },
  'cucchiaio': { baseUnit: 'ml', factor: 15 },
  'cucchiai': { baseUnit: 'ml', factor: 15 },
  'tbsp': { baseUnit: 'ml', factor: 15 },
  'tazza': { baseUnit: 'ml', factor: 250 },
  'tazze': { baseUnit: 'ml', factor: 250 },
  'bicchiere': { baseUnit: 'ml', factor: 200 },
  'bicchieri': { baseUnit: 'ml', factor: 200 },
  
  // Unità specifiche
  'pz': { baseUnit: 'pz', factor: 1 },
  'pezzo': { baseUnit: 'pz', factor: 1 },
  'pezzi': { baseUnit: 'pz', factor: 1 },
  'porzione': { baseUnit: 'porzione', factor: 1 },
  'porzioni': { baseUnit: 'porzione', factor: 1 },
  'spicchio': { baseUnit: 'pz', factor: 1 },
  'spicchi': { baseUnit: 'pz', factor: 1 },
  'foglia': { baseUnit: 'pz', factor: 1 },
  'foglie': { baseUnit: 'pz', factor: 1 },
  'mazzo': { baseUnit: 'pz', factor: 1 },
  'mazzi': { baseUnit: 'pz', factor: 1 }
};

// Unità compatibili per categoria
export const COMPATIBLE_UNITS: Record<BaseUnit, string[]> = {
  'g': ['g', 'gr', 'grammi', 'kg', 'chilogrammi', 'etti', 'hg'],
  'kg': ['g', 'gr', 'grammi', 'kg', 'chilogrammi', 'etti', 'hg'],
  'ml': ['ml', 'millilitri', 'l', 'litri', 'dl', 'cl', 'cucchiaino', 'cucchiaini', 'tsp', 'cucchiaio', 'cucchiai', 'tbsp', 'tazza', 'tazze', 'bicchiere', 'bicchieri'],
  'l': ['ml', 'millilitri', 'l', 'litri', 'dl', 'cl', 'cucchiaino', 'cucchiaini', 'tsp', 'cucchiaio', 'cucchiai', 'tbsp', 'tazza', 'tazze', 'bicchiere', 'bicchieri'],
  'pz': ['pz', 'pezzo', 'pezzi', 'spicchio', 'spicchi', 'foglia', 'foglie', 'mazzo', 'mazzi'],
  'porzione': ['porzione', 'porzioni'],
  'cucchiaino': ['ml', 'millilitri', 'l', 'litri', 'dl', 'cl', 'cucchiaino', 'cucchiaini', 'tsp', 'cucchiaio', 'cucchiai', 'tbsp', 'tazza', 'tazze', 'bicchiere', 'bicchieri'],
  'cucchiaio': ['ml', 'millilitri', 'l', 'litri', 'dl', 'cl', 'cucchiaino', 'cucchiaini', 'tsp', 'cucchiaio', 'cucchiai', 'tbsp', 'tazza', 'tazze', 'bicchiere', 'bicchieri'],
  'tazza': ['ml', 'millilitri', 'l', 'litri', 'dl', 'cl', 'cucchiaino', 'cucchiaini', 'tsp', 'cucchiaio', 'cucchiai', 'tbsp', 'tazza', 'tazze', 'bicchiere', 'bicchieri'],
  'spicchio': ['pz', 'pezzo', 'pezzi', 'spicchio', 'spicchi', 'foglia', 'foglie', 'mazzo', 'mazzi'],
  'foglia': ['pz', 'pezzo', 'pezzi', 'spicchio', 'spicchi', 'foglia', 'foglie', 'mazzo', 'mazzi']
};

/**
 * Converte una quantità da un'unità a un'altra
 */
export const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
  const normalizedFromUnit = fromUnit.toLowerCase().trim();
  const normalizedToUnit = toUnit.toLowerCase().trim();
  
  if (normalizedFromUnit === normalizedToUnit) {
    return quantity;
  }
  
  const fromConversion = UNIT_CONVERSIONS[normalizedFromUnit];
  const toConversion = UNIT_CONVERSIONS[normalizedToUnit];
  
  if (!fromConversion || !toConversion) {
    console.warn(`Conversione non supportata da ${fromUnit} a ${toUnit}`);
    return quantity;
  }
  
  // Verifica che le unità siano compatibili
  if (fromConversion.baseUnit !== toConversion.baseUnit) {
    console.warn(`Unità incompatibili: ${fromUnit} (${fromConversion.baseUnit}) vs ${toUnit} (${toConversion.baseUnit})`);
    return quantity;
  }
  
  // Converti prima all'unità base, poi all'unità target
  const baseQuantity = quantity * fromConversion.factor;
  return baseQuantity / toConversion.factor;
};

/**
 * Ottiene le unità compatibili con una data unità
 */
export const getCompatibleUnits = (unit: string): string[] => {
  const normalizedUnit = unit.toLowerCase().trim();
  const conversion = UNIT_CONVERSIONS[normalizedUnit];
  
  if (!conversion) {
    return [unit];
  }
  
  return COMPATIBLE_UNITS[conversion.baseUnit] || [unit];
};

/**
 * Verifica se due unità sono compatibili
 */
export const areUnitsCompatible = (unit1: string, unit2: string): boolean => {
  const normalizedUnit1 = unit1.toLowerCase().trim();
  const normalizedUnit2 = unit2.toLowerCase().trim();
  
  if (normalizedUnit1 === normalizedUnit2) {
    return true;
  }
  
  const conversion1 = UNIT_CONVERSIONS[normalizedUnit1];
  const conversion2 = UNIT_CONVERSIONS[normalizedUnit2];
  
  if (!conversion1 || !conversion2) {
    return false;
  }
  
  return conversion1.baseUnit === conversion2.baseUnit;
};

/**
 * Normalizza un'unità di misura
 */
export const normalizeUnit = (unit: string): string => {
  const normalized = unit.toLowerCase().trim();
  return UNIT_CONVERSIONS[normalized] ? normalized : unit;
};

/**
 * Converte il costo per unità da un'unità a un'altra
 */
export const convertCostPerUnit = (costPerUnit: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) {
    return costPerUnit;
  }
  
  // Per il costo, la conversione è inversa rispetto alla quantità
  const conversionFactor = convertUnit(1, fromUnit, toUnit);
  return conversionFactor > 0 ? costPerUnit / conversionFactor : costPerUnit;
};

/**
 * Formatta la visualizzazione di una quantità con unità
 */
export const formatQuantityWithUnit = (quantity: number, unit: string): string => {
  const decimals = quantity < 1 ? 2 : quantity < 10 ? 1 : 0;
  return `${quantity.toFixed(decimals)} ${unit}`;
};
