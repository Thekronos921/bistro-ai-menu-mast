
import { convertUnit } from "@/utils/unitConversion";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
}

interface LocalRecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  is_semilavorato?: boolean;
  ingredient: Ingredient | null;
}

export const calculateIngredientCost = (recipeIng: LocalRecipeIngredient): number => {
  if (!recipeIng.ingredient) return 0;
  
  const effectiveCost = recipeIng.ingredient.effective_cost_per_unit ?? recipeIng.ingredient.cost_per_unit;
  
  // Se l'unità della ricetta è diversa da quella base dell'ingrediente, converti
  if (recipeIng.unit && recipeIng.unit !== recipeIng.ingredient.unit) {
    try {
      // Converti la quantità dall'unità della ricetta all'unità base dell'ingrediente
      const convertedQuantity = convertUnit(recipeIng.quantity, recipeIng.unit, recipeIng.ingredient.unit);
      return effectiveCost * convertedQuantity;
    } catch (error) {
      console.error("Errore nella conversione:", error);
      // Fallback: usa la quantità originale
      return effectiveCost * recipeIng.quantity;
    }
  }
  
  return effectiveCost * recipeIng.quantity;
};

export const calculateTotalCost = (recipeIngredients: LocalRecipeIngredient[]): number => {
  return recipeIngredients.reduce((total, recipeIng) => {
    return total + calculateIngredientCost(recipeIng);
  }, 0);
};
