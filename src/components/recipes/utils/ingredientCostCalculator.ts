
import { convertUnit, areUnitsCompatible } from '@/utils/unitConversion';

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
  recipe_yield_percentage?: number; // Resa specifica per questo ingrediente in questa ricetta
  ingredient: Ingredient | null;
}

export const calculateTotalCost = (recipeIngredients: LocalRecipeIngredient[]) => {
  if (!recipeIngredients) return 0;
  
  return recipeIngredients.reduce((total, recipeIngredient) => {
    if (!recipeIngredient.ingredient) return total;
    
    const baseCost = recipeIngredient.ingredient.effective_cost_per_unit ?? recipeIngredient.ingredient.cost_per_unit;
    
    // Se è un semilavorato, usa direttamente il costo per porzione
    if (recipeIngredient.is_semilavorato) {
      return total + (baseCost * recipeIngredient.quantity);
    }
    
    // NUOVA LOGICA: Applica la resa specifica per ricetta se presente
    let effectiveCost = baseCost;
    
    // 1. Se c'è una resa specifica per la ricetta, usala
    if (recipeIngredient.recipe_yield_percentage !== null && recipeIngredient.recipe_yield_percentage !== undefined) {
      effectiveCost = baseCost / (recipeIngredient.recipe_yield_percentage / 100);
    }
    // 2. Altrimenti, se l'ingrediente ha una resa e non abbiamo già effective_cost_per_unit, applicala
    else if (!recipeIngredient.ingredient.effective_cost_per_unit && recipeIngredient.ingredient.yield_percentage) {
      effectiveCost = baseCost / (recipeIngredient.ingredient.yield_percentage / 100);
    }
    
    // Il costo dell'ingrediente è sempre per l'unità base dell'ingrediente
    // Se l'unità della ricetta è diversa da quella base, converti la quantità
    const recipeUnit = recipeIngredient.unit || recipeIngredient.ingredient.unit;
    const baseUnit = recipeIngredient.ingredient.unit;
    
    if (recipeUnit !== baseUnit && areUnitsCompatible(recipeUnit, baseUnit)) {
      try {
        // Converti la quantità dall'unità della ricetta all'unità base dell'ingrediente
        const quantityInBaseUnit = convertUnit(recipeIngredient.quantity, recipeUnit, baseUnit);
        console.log(`Calcolo costo totale per ${recipeIngredient.ingredient.name}:`);
        console.log(`- Quantità ricetta: ${recipeIngredient.quantity} ${recipeUnit}`);
        console.log(`- Quantità convertita: ${quantityInBaseUnit} ${baseUnit}`);
        console.log(`- Costo per ${baseUnit}: €${effectiveCost}`);
        console.log(`- Costo parziale: €${(effectiveCost * quantityInBaseUnit).toFixed(2)}`);
        
        return total + (effectiveCost * quantityInBaseUnit);
      } catch (error) {
        console.error("Errore nella conversione per calcolo costo totale:", error);
        return total + (effectiveCost * recipeIngredient.quantity);
      }
    }
    
    // Se le unità sono uguali o non compatibili, usa la quantità direttamente
    return total + (effectiveCost * recipeIngredient.quantity);
  }, 0);
};
