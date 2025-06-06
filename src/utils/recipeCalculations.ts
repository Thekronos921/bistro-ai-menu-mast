import { convertUnit, convertCostPerUnit, areUnitsCompatible } from './unitConversion';

interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string; // Aggiungiamo l'unità specifica per questo ingrediente nella ricetta
  is_semilavorato?: boolean;
  recipe_yield_percentage?: number; // Resa specifica per questo ingrediente in questa ricetta
  ingredients: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    effective_cost_per_unit?: number;
    yield_percentage?: number;
  };
}

export const calculateTotalCost = (recipeIngredients: RecipeIngredient[]) => {
  if (!recipeIngredients) return 0;
  return recipeIngredients.reduce((total, ri) => {
    // Usa sempre effective_cost_per_unit se disponibile, altrimenti cost_per_unit
    const baseCostPerUnit = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
    
    // NUOVA LOGICA: Determina quale resa usare
    let finalCostPerUnit = baseCostPerUnit;
    
    // 1. Se c'è una resa specifica per la ricetta, usala
    if (ri.recipe_yield_percentage !== null && ri.recipe_yield_percentage !== undefined) {
      finalCostPerUnit = baseCostPerUnit / (ri.recipe_yield_percentage / 100);
    }
    // 2. Altrimenti, se l'ingrediente ha una resa e non abbiamo già effective_cost_per_unit, applicala
    else if (!ri.ingredients.effective_cost_per_unit && ri.ingredients.yield_percentage) {
      const yieldPercentage = ri.ingredients.yield_percentage ?? 100;
      finalCostPerUnit = baseCostPerUnit / (yieldPercentage / 100);
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

export const calculateCostPerPortion = (recipeIngredients: RecipeIngredient[], portions: number) => {
  const totalCost = calculateTotalCost(recipeIngredients);
  return portions > 0 ? totalCost / portions : 0;
};

export const getFoodCostIndicator = (recipe: { 
  recipe_ingredients: RecipeIngredient[];
  portions: number;
  selling_price?: number;
}) => {
  const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
  
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