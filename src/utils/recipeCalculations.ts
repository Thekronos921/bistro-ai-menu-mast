import { convertUnit, convertCostPerUnit, areUnitsCompatible } from './unitConversion';

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

// Interfaccia per il formato locale usato nei dialoghi
interface LocalRecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  is_semilavorato?: boolean;
  recipe_yield_percentage?: number;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    effective_cost_per_unit?: number;
    yield_percentage?: number;
  } | null;
}

export const calculateTotalCost = (recipeIngredients: RecipeIngredient[] | LocalRecipeIngredient[]) => {
  if (!recipeIngredients) return 0;
  
  console.log('[calculateTotalCost] Received ingredients:', JSON.parse(JSON.stringify(recipeIngredients)));

  return recipeIngredients.reduce((total, ri) => {
    // Normalizza i dati per supportare entrambi i formati
    const ingredient = 'ingredients' in ri ? ri.ingredients : ri.ingredient;
    if (!ingredient) {
      console.warn('[calculateTotalCost] Skipping item, ingredient data is missing:', ri);
      return total;
    }

    // Usa sempre effective_cost_per_unit se disponibile, altrimenti cost_per_unit
    const baseCostPerUnit = ingredient.effective_cost_per_unit ?? ingredient.cost_per_unit;
    
    if (typeof baseCostPerUnit !== 'number' || isNaN(baseCostPerUnit)) {
      console.warn(`[calculateTotalCost] Invalid baseCostPerUnit for ingredient "${ingredient.name}". Skipping.`, { baseCostPerUnit });
      return total;
    }
    
    // LOGICA CORRETTA: Evita doppi calcoli della resa
    let finalCostPerUnit = baseCostPerUnit;
    
    // 1. Se c'è una resa specifica per la ricetta, usala sul costo base
    if (ri.recipe_yield_percentage !== null && ri.recipe_yield_percentage !== undefined) {
      // Se abbiamo effective_cost_per_unit, dobbiamo prima "rimuovere" la resa base
      let costToUse = baseCostPerUnit;
      if (ingredient.effective_cost_per_unit && ingredient.yield_percentage && ingredient.yield_percentage !== 100) {
        costToUse = ingredient.cost_per_unit;
      }
      finalCostPerUnit = costToUse / (ri.recipe_yield_percentage / 100);
    }
    // 2. Altrimenti, se l'ingrediente ha una resa e non abbiamo già effective_cost_per_unit, applicala
    else if (!ingredient.effective_cost_per_unit && ingredient.yield_percentage && ingredient.yield_percentage !== 100) {
      const yieldPercentage = ingredient.yield_percentage;
      finalCostPerUnit = baseCostPerUnit / (yieldPercentage / 100);
    }
    
    // Gestione conversione unità
    let adjustedQuantity = ri.quantity;
    if (ri.unit && ri.unit !== ingredient.unit) {
      if (areUnitsCompatible(ri.unit, ingredient.unit)) {
        adjustedQuantity = convertUnit(ri.quantity, ri.unit, ingredient.unit);
        console.log(`Convertendo ${ri.quantity} ${ri.unit} a ${adjustedQuantity} ${ingredient.unit} per ${ingredient.name}`);
      } else {
        console.warn(`Unità incompatibili per ${ingredient.name}: ${ri.unit} vs ${ingredient.unit}`);
      }
    }
    
    const ingredientCost = finalCostPerUnit * adjustedQuantity;
    console.log(`[calculateTotalCost] Cost for "${ingredient.name}": ${ingredientCost.toFixed(4)}`);

    return total + ingredientCost;
  }, 0);
};

export const calculateCostPerPortion = (recipeIngredients: RecipeIngredient[] | LocalRecipeIngredient[], portions: number) => {
  const totalCost = calculateTotalCost(recipeIngredients);
  return portions > 0 ? totalCost / portions : 0;
};

export const getFoodCostIndicator = (recipe: { 
  recipe_ingredients: RecipeIngredient[] | LocalRecipeIngredient[];
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
