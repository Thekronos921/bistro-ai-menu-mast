
import { SUPPORTED_UNITS, UnitDefinition, UnitType } from '@/types/ingredient';

export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnitConversionError';
  }
}

export const getUnitDefinition = (unitCode: string): UnitDefinition | undefined => {
  return SUPPORTED_UNITS.find(u => u.code === unitCode);
};

export const getUnitsByType = (type: UnitType): UnitDefinition[] => {
  return SUPPORTED_UNITS.filter(u => u.type === type);
};

export const getCompatibleUnitsForPrimary = (primaryUnit: string): UnitDefinition[] => {
  const primaryDef = getUnitDefinition(primaryUnit);
  if (!primaryDef) return [{ code: primaryUnit, name: primaryUnit, type: 'other' }];
  
  // Restituisce unità dello stesso tipo o convertibili
  return SUPPORTED_UNITS.filter(u => {
    // Stesso tipo
    if (u.type === primaryDef.type) return true;
    
    // Conversioni speciali peso->pezzo per ingredienti con conversioni definite
    if (primaryDef.type === 'weight' && u.type === 'piece') return true;
    
    return false;
  });
};

export const canConvertBetweenUnits = (fromUnit: string, toUnit: string): boolean => {
  const fromDef = getUnitDefinition(fromUnit);
  const toDef = getUnitDefinition(toUnit);
  
  if (!fromDef || !toDef) return false;
  
  // Stesso tipo
  if (fromDef.type === toDef.type) return true;
  
  // Peso->Pezzo è possibile se abbiamo fattori di conversione
  if (fromDef.type === 'weight' && toDef.type === 'piece') return true;
  if (fromDef.type === 'piece' && toDef.type === 'weight') return true;
  
  return false;
};

export const convertQuantity = (
  quantity: number,
  fromUnit: string,
  toUnit: string,
  conversionData?: {
    averageWeightPerPieceG?: number;
    averagePiecesPerKg?: number;
  }
): number => {
  if (fromUnit === toUnit) return quantity;
  
  const fromDef = getUnitDefinition(fromUnit);
  const toDef = getUnitDefinition(toUnit);
  
  if (!fromDef || !toDef) {
    throw new UnitConversionError(`Unità non supportate: ${fromUnit} -> ${toUnit}`);
  }
  
  // Conversioni standard tra unità dello stesso tipo
  if (fromDef.type === toDef.type && fromDef.baseUnit === toDef.baseUnit) {
    const fromFactor = fromDef.conversionFactor || 1;
    const toFactor = toDef.conversionFactor || 1;
    
    return (quantity * fromFactor) / toFactor;
  }
  
  // Conversioni peso->pezzo
  if (fromDef.type === 'weight' && toDef.type === 'piece') {
    if (!conversionData?.averageWeightPerPieceG) {
      throw new UnitConversionError(`Conversione ${fromUnit} -> ${toUnit} richiede peso medio per pezzo`);
    }
    
    // Converti prima tutto in grammi
    let gramsQuantity = quantity;
    if (fromUnit === 'kg') gramsQuantity = quantity * 1000;
    else if (fromUnit === 'etti') gramsQuantity = quantity * 100;
    
    // Calcola numero di pezzi
    return gramsQuantity / conversionData.averageWeightPerPieceG;
  }
  
  // Conversioni pezzo->peso
  if (fromDef.type === 'piece' && toDef.type === 'weight') {
    if (!conversionData?.averageWeightPerPieceG) {
      throw new UnitConversionError(`Conversione ${fromUnit} -> ${toUnit} richiede peso medio per pezzo`);
    }
    
    // Calcola peso totale in grammi
    const totalGrams = quantity * conversionData.averageWeightPerPieceG;
    
    // Converti all'unità target
    if (toUnit === 'kg') return totalGrams / 1000;
    else if (toUnit === 'etti') return totalGrams / 100;
    else return totalGrams; // Assume grammi
  }
  
  throw new UnitConversionError(`Conversione non supportata: ${fromUnit} -> ${toUnit}`);
};

export const calculateEffectiveCostPerUsageUnit = (
  ingredient: {
    primary_unit: string;
    usage_unit?: string;
    cost_per_unit: number;
    effective_cost_per_unit?: number;
    yield_percentage: number;
    average_weight_per_piece_g?: number;
  }
): number => {
  // Costo effettivo per unità primaria (considerando resa)
  const effectiveCostPrimary = ingredient.effective_cost_per_unit ?? 
    (ingredient.cost_per_unit / (ingredient.yield_percentage / 100));
  
  const usageUnit = ingredient.usage_unit || ingredient.primary_unit;
  
  // Se UUS = UMP, restituisci il costo primario
  if (usageUnit === ingredient.primary_unit) {
    return effectiveCostPrimary;
  }
  
  try {
    // Calcola quanto costa 1 unità di utilizzo in termini di unità primaria
    const conversionData = {
      averageWeightPerPieceG: ingredient.average_weight_per_piece_g
    };
    
    const oneUsageUnitInPrimaryUnits = convertQuantity(
      1, 
      usageUnit, 
      ingredient.primary_unit, 
      conversionData
    );
    
    return effectiveCostPrimary * oneUsageUnitInPrimaryUnits;
  } catch (error) {
    console.warn(`Errore nel calcolo costo per unità di utilizzo:`, error);
    return effectiveCostPrimary; // Fallback
  }
};

export const formatQuantityDisplay = (
  quantity: number, 
  unit: string, 
  showUnitName: boolean = false
): string => {
  const unitDef = getUnitDefinition(unit);
  const unitDisplay = showUnitName && unitDef ? unitDef.name : unit;
  
  // Formattazione decimali basata sulla quantità
  const decimals = quantity < 1 ? 2 : quantity < 10 ? 1 : 0;
  
  return `${quantity.toFixed(decimals)} ${unitDisplay}`;
};
