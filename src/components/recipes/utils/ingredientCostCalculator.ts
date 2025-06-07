
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
  recipe_yield_percentage?: number;
  ingredient: Ingredient | null;
}

interface Recipe {
  id: string;
  name: string;
  portions: number;
  calculated_total_cost?: number;
  calculated_cost_per_portion?: number;
  cost_last_calculated_at?: string;
}

export const calculateTotalCost = (recipeIngredients: LocalRecipeIngredient[], recipe?: Recipe) => {
  // Se abbiamo una ricetta con costo calcolato dal database, usalo
  if (recipe?.calculated_total_cost !== null && recipe?.calculated_total_cost !== undefined) {
    console.log(`Using database calculated total cost: €${recipe.calculated_total_cost.toFixed(2)}`);
    return recipe.calculated_total_cost;
  }

  // Altrimenti calcola localmente
  if (!recipeIngredients) return 0;
  
  return recipeIngredients.reduce((total, recipeIngredient) => {
    if (!recipeIngredient.ingredient) return total;
    
    // Per i semilavorati, usa il costo per porzione
    if (recipeIngredient.is_semilavorato) {
      const costPerPortion = recipeIngredient.ingredient.effective_cost_per_unit ?? recipeIngredient.ingredient.cost_per_unit;
      console.log(`Semilavorato ${recipeIngredient.ingredient.name}: ${recipeIngredient.quantity} porzioni × €${costPerPortion} = €${(costPerPortion * recipeIngredient.quantity).toFixed(2)}`);
      return total + (costPerPortion * recipeIngredient.quantity);
    }
    
    const baseCost = recipeIngredient.ingredient.effective_cost_per_unit ?? recipeIngredient.ingredient.cost_per_unit;
    let effectiveCost = baseCost;
    
    // Applicare resa specifica se presente
    if (recipeIngredient.recipe_yield_percentage !== null && recipeIngredient.recipe_yield_percentage !== undefined) {
      let costToUse = baseCost;
      if (recipeIngredient.ingredient.effective_cost_per_unit && recipeIngredient.ingredient.yield_percentage && recipeIngredient.ingredient.yield_percentage !== 100) {
        costToUse = recipeIngredient.ingredient.cost_per_unit;
      }
      effectiveCost = costToUse / (recipeIngredient.recipe_yield_percentage / 100);
    }
    else if (!recipeIngredient.ingredient.effective_cost_per_unit && recipeIngredient.ingredient.yield_percentage && recipeIngredient.ingredient.yield_percentage !== 100) {
      effectiveCost = baseCost / (recipeIngredient.ingredient.yield_percentage / 100);
    }
    
    // Gestione conversione unità
    const recipeUnit = recipeIngredient.unit || recipeIngredient.ingredient.unit;
    const baseUnit = recipeIngredient.ingredient.unit;
    
    if (recipeUnit !== baseUnit && areUnitsCompatible(recipeUnit, baseUnit)) {
      try {
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
    
    return total + (effectiveCost * recipeIngredient.quantity);
  }, 0);
};
