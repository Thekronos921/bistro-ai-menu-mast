
import { convertUnit, areUnitsCompatible } from '@/utils/unitConversion';
import { calculateTotalCost as unifiedCalculateTotalCost } from '@/utils/recipeCalculations';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
  yield_percentage?: number;
}

interface LocalRecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  is_semilavorato?: boolean;
  recipe_yield_percentage?: number;
  ingredient: Ingredient | null;
}

// Utilizza la funzione unificata dal modulo principale
export const calculateTotalCost = (recipeIngredients: LocalRecipeIngredient[]) => {
  return unifiedCalculateTotalCost(recipeIngredients);
};
