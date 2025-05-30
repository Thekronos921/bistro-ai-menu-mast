
// Definizione delle unità di misura e delle loro conversioni
export interface UnitConversion {
  unit: string;
  label: string;
  baseUnit: string;
  conversionFactor: number;
  category: 'weight' | 'volume' | 'count' | 'custom';
}

// Configurazione delle conversioni disponibili
export const UNIT_CONVERSIONS: UnitConversion[] = [
  // Peso
  { unit: 'g', label: 'Grammi', baseUnit: 'g', conversionFactor: 1, category: 'weight' },
  { unit: 'kg', label: 'Chilogrammi', baseUnit: 'g', conversionFactor: 1000, category: 'weight' },

  // Volume
  { unit: 'ml', label: 'Millilitri', baseUnit: 'ml', conversionFactor: 1, category: 'volume' },
  { unit: 'l', label: 'Litri', baseUnit: 'ml', conversionFactor: 1000, category: 'volume' },
  { unit: 'cucchiai', label: 'Cucchiai', baseUnit: 'ml', conversionFactor: 15, category: 'volume' },
  { unit: 'cucchiaini', label: 'Cucchiaini', baseUnit: 'ml', conversionFactor: 5, category: 'volume' },
  { unit: 'tazze', label: 'Tazze', baseUnit: 'ml', conversionFactor: 240, category: 'volume' },

  // Conteggio
  { unit: 'pz', label: 'Pezzi', baseUnit: 'pz', conversionFactor: 1, category: 'count' }
];

// Ottiene la configurazione di un'unità
export const getUnitConfig = (unit: string): UnitConversion | undefined => {
  return UNIT_CONVERSIONS.find(u => u.unit === unit);
};

// Ottiene tutte le unità compatibili con una data unità
export const getCompatibleUnits = (baseUnit: string): UnitConversion[] => {
  const baseConfig = getUnitConfig(baseUnit);
  if (!baseConfig) return [{ unit: baseUnit, label: baseUnit, baseUnit: baseUnit, conversionFactor: 1, category: 'custom' }];
  
  return UNIT_CONVERSIONS.filter(u => u.baseUnit === baseConfig.baseUnit);
};

// Converte una quantità da un'unità all'altra
export const convertQuantity = (
  quantity: number, 
  fromUnit: string, 
  toUnit: string
): number => {
  const fromConfig = getUnitConfig(fromUnit);
  const toConfig = getUnitConfig(toUnit);
  
  // Se non troviamo la configurazione, assumiamo che siano la stessa unità
  if (!fromConfig || !toConfig) return quantity;
  
  // Se le unità hanno basi diverse, non possiamo convertire
  if (fromConfig.baseUnit !== toConfig.baseUnit) return quantity;
  
  // Converte alla unità base e poi all'unità target
  const baseQuantity = quantity * fromConfig.conversionFactor;
  return baseQuantity / toConfig.conversionFactor;
};

// Normalizza una quantità all'unità base dell'ingrediente
export const normalizeToBaseUnit = (
  quantity: number, 
  unit: string, 
  ingredientBaseUnit: string
): { quantity: number; unit: string } => {
  const convertedQuantity = convertQuantity(quantity, unit, ingredientBaseUnit);
  return {
    quantity: convertedQuantity,
    unit: ingredientBaseUnit
  };
};

// Formatta una quantità con la sua unità
export const formatQuantityWithUnit = (quantity: number, unit: string): string => {
  const unitConfig = getUnitConfig(unit);
  const label = unitConfig?.label || unit;
  
  // Mostra solo 2 decimali se necessario
  const formattedQuantity = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  
  return `${formattedQuantity} ${label}`;
};

// Converte e formatta per la visualizzazione
export const convertAndFormat = (
  quantity: number,
  fromUnit: string,
  toUnit: string
): string => {
  const convertedQuantity = convertQuantity(quantity, fromUnit, toUnit);
  return formatQuantityWithUnit(convertedQuantity, toUnit);
};

// Ottiene la categoria di un'unità
export const getUnitCategory = (unit: string): string => {
  const config = getUnitConfig(unit);
  return config?.category || 'custom';
};

// Verifica se due unità sono compatibili per la conversione
export const areUnitsCompatible = (unit1: string, unit2: string): boolean => {
  const config1 = getUnitConfig(unit1);
  const config2 = getUnitConfig(unit2);
  
  if (!config1 || !config2) return unit1 === unit2;
  
  return config1.baseUnit === config2.baseUnit;
};
