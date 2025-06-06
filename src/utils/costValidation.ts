export const validateIngredientCost = (ingredient: {
  name: string;
  cost_per_unit: number;
  yield_percentage?: number;
  effective_cost_per_unit?: number;
}) => {
  const expectedEffectiveCost = ingredient.cost_per_unit / ((ingredient.yield_percentage ?? 100) / 100);
  const actualEffectiveCost = ingredient.effective_cost_per_unit ?? ingredient.cost_per_unit;
  
  const tolerance = 0.01; // 1 centesimo di tolleranza
  const isValid = Math.abs(expectedEffectiveCost - actualEffectiveCost) < tolerance;
  
  if (!isValid) {
    console.warn(`Inconsistenza costo per ${ingredient.name}: atteso ${expectedEffectiveCost.toFixed(2)}, trovato ${actualEffectiveCost.toFixed(2)}`);
  }
  
  return { isValid, expectedEffectiveCost, actualEffectiveCost };
};

export const validateCostCalculation = (ingredient: {
  name: string;
  cost_per_unit: number;
  yield_percentage?: number;
  effective_cost_per_unit?: number;
}) => {
  const expectedEffectiveCost = ingredient.cost_per_unit / ((ingredient.yield_percentage ?? 100) / 100);
  const actualEffectiveCost = ingredient.effective_cost_per_unit ?? ingredient.cost_per_unit;
  
  const tolerance = 0.01; // 1 centesimo di tolleranza
  const isValid = Math.abs(expectedEffectiveCost - actualEffectiveCost) < tolerance;
  
  if (!isValid) {
    console.warn(`Inconsistenza costo per ${ingredient.name}: atteso ${expectedEffectiveCost.toFixed(2)}, trovato ${actualEffectiveCost.toFixed(2)}`);
  }
  
  return { isValid, expectedEffectiveCost, actualEffectiveCost };
};