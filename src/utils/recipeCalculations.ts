
import { convertUnit, areUnitsCompatible } from './unitConversion';

interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  is_semilavorato?: boolean;
  recipe_yield_percentage?: number;
  ingredients: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    effective_cost_per_unit?: number;
    yield_percentage?: number;
  };
}

interface Recipe {
  id: string;
  name: string;
  portions: number;
  calculated_total_cost?: number;
  calculated_cost_per_portion?: number;
  cost_last_calculated_at?: string;
  recipe_ingredients: RecipeIngredient[];
}

// Funzione per ottenere il costo totale di una ricetta
// Prima prova a usare il valore calcolato dal database, altrimenti calcola localmente
export const calculateTotalCost = (recipeIngredients: RecipeIngredient[], recipe?: Recipe) => {
  // Se abbiamo una ricetta con costo calcolato recente, usalo
  if (recipe?.calculated_total_cost !== null && recipe?.calculated_total_cost !== undefined) {
    console.log(`Using database calculated cost: €${recipe.calculated_total_cost.toFixed(2)} for recipe ${recipe.name}`);
    return recipe.calculated_total_cost;
  }

  // Altrimenti calcola localmente come fallback
  console.log("Calculating cost locally as fallback");
  return calculateLocalTotalCost(recipeIngredients);
};

// Calcolo locale dei costi (manteniamo per compatibilità e feedback immediato nel frontend)
export const calculateLocalTotalCost = (recipeIngredients: RecipeIngredient[]) => {
  if (!recipeIngredients) return 0;
  
  return recipeIngredients.reduce((total, ri) => {
    // Per i semilavorati, il costo dovrebbe essere già il costo per porzione
    if (ri.is_semilavorato) {
      // Assumiamo che ingredients.effective_cost_per_unit contenga il calculated_cost_per_portion del semilavorato
      const costPerPortion = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
      return total + (costPerPortion * ri.quantity);
    }

    // Per ingredienti normali, usa la logica esistente
    const baseCostPerUnit = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
    let finalCostPerUnit = baseCostPerUnit;
    
    // Applicare resa specifica per la ricetta se presente
    if (ri.recipe_yield_percentage !== null && ri.recipe_yield_percentage !== undefined) {
      let costToUse = baseCostPerUnit;
      if (ri.ingredients.effective_cost_per_unit && ri.ingredients.yield_percentage && ri.ingredients.yield_percentage !== 100) {
        costToUse = ri.ingredients.cost_per_unit;
      }
      finalCostPerUnit = costToUse / (ri.recipe_yield_percentage / 100);
    }
    else if (!ri.ingredients.effective_cost_per_unit && ri.ingredients.yield_percentage && ri.ingredients.yield_percentage !== 100) {
      finalCostPerUnit = baseCostPerUnit / (ri.ingredients.yield_percentage / 100);
    }
    
    // Gestione conversione unità
    let adjustedQuantity = ri.quantity;
    if (ri.unit && ri.unit !== ri.ingredients.unit) {
      if (areUnitsCompatible(ri.unit, ri.ingredients.unit)) {
        adjustedQuantity = convertUnit(ri.quantity, ri.unit, ri.ingredients.unit);
        console.log(`Convertendo ${ri.quantity} ${ri.unit} a ${adjustedQuantity} ${ri.ingredients.unit} per ${ri.ingredients.name}`);
      } else {
        console.warn(`Unità incompatibili per ${ri.ingredients.name}: ${ri.unit} vs ${ri.ingredients.unit}`);
      }
    }
    
    return total + (finalCostPerUnit * adjustedQuantity);
  }, 0);
};

export const calculateCostPerPortion = (recipeIngredients: RecipeIngredient[], portions: number, recipe?: Recipe) => {
  // Se abbiamo una ricetta con costo per porzione calcolato recente, usalo
  if (recipe?.calculated_cost_per_portion !== null && recipe?.calculated_cost_per_portion !== undefined) {
    console.log(`Using database calculated cost per portion: €${recipe.calculated_cost_per_portion.toFixed(2)} for recipe ${recipe.name}`);
    return recipe.calculated_cost_per_portion;
  }

  // Altrimenti calcola localmente
  const totalCost = calculateLocalTotalCost(recipeIngredients);
  return portions > 0 ? totalCost / portions : 0;
};

export const getFoodCostIndicator = (recipe: { 
  recipe_ingredients: RecipeIngredient[];
  portions: number;
  selling_price?: number;
  calculated_cost_per_portion?: number;
  name?: string;
}) => {
  // Usa il costo calcolato dal database se disponibile
  const costPerPortion = recipe.calculated_cost_per_portion ?? 
    calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
  
  // Se la ricetta ha un prezzo di vendita, calcola FC%
  if (recipe.selling_price && recipe.selling_price > 0) {
    const foodCostPercentage = (costPerPortion / recipe.selling_price) * 100;
    
    if (foodCostPercentage <= 25) return { 
      label: "FC Ottimale", 
      color: "bg-green-100 text-green-800",
      tooltip: `FC: ${foodCostPercentage.toFixed(1)}% (Costo: €${costPerPortion.toFixed(2)} / Prezzo: €${recipe.selling_price.toFixed(2)}). Soglia 'Critico': >35%`
    };
    if (foodCostPercentage <= 35) return { 
      label: "FC Attenzione", 
      color: "bg-yellow-100 text-yellow-800",
      tooltip: `FC: ${foodCostPercentage.toFixed(1)}% (Costo: €${costPerPortion.toFixed(2)} / Prezzo: €${recipe.selling_price.toFixed(2)}). Soglia 'Critico': >35%`
    };
    return { 
      label: "FC Critico", 
      color: "bg-red-100 text-red-800",
      tooltip: `FC: ${foodCostPercentage.toFixed(1)}% (Costo: €${costPerPortion.toFixed(2)} / Prezzo: €${recipe.selling_price.toFixed(2)}). Soglia 'Critico': >35%`
    };
  }
  
  // Se è un semilavorato o non ha prezzo, usa soglie di costo assoluto
  if (costPerPortion <= 3) return { 
    label: "Costo Prod. Basso", 
    color: "bg-green-100 text-green-800",
    tooltip: `Costo Produzione/Porzione: €${costPerPortion.toFixed(2)}. Soglia 'Alto' per questa categoria: >€8.00`
  };
  if (costPerPortion <= 8) return { 
    label: "Costo Prod. Medio", 
    color: "bg-yellow-100 text-yellow-800",
    tooltip: `Costo Produzione/Porzione: €${costPerPortion.toFixed(2)}. Soglia 'Alto' per questa categoria: >€8.00`
  };
  return { 
    label: "Costo Prod. Alto", 
    color: "bg-red-100 text-red-800",
    tooltip: `Costo Produzione/Porzione: €${costPerPortion.toFixed(2)}. Soglia 'Alto' per questa categoria: >€8.00`
  };
};

// Funzione per verificare se i costi calcolati sono aggiornati
export const areCostsUpToDate = (recipe: Recipe, ingredientLastUpdated?: string): boolean => {
  if (!recipe.cost_last_calculated_at) return false;
  
  const calculatedAt = new Date(recipe.cost_last_calculated_at);
  const ingredientUpdatedAt = ingredientLastUpdated ? new Date(ingredientLastUpdated) : new Date(0);
  
  return calculatedAt >= ingredientUpdatedAt;
};
