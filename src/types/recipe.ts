
export interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  is_semilavorato?: boolean;
  recipe_yield_percentage?: number; // Resa specifica per questo ingrediente in questa ricetta
  ingredients: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    effective_cost_per_unit?: number;
    current_stock?: number;
    min_stock_threshold?: number;
    yield_percentage?: number;
    allergens?: string; // Aggiunta proprietà allergens
  };
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  preparation_time: number;
  difficulty: string;
  portions: number;
  description: string;
  allergens: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  is_semilavorato?: boolean;
  notes_chef?: string;
  selling_price?: number;
  recipe_ingredients: RecipeIngredient[];
  recipe_instructions: Array<{
    id: string;
    step_number: number;
    instruction: string;
  }>;
  // Proprietà opzionali per lo scaling
  scaled_portions?: number;
  scaled_preparation_time?: number;
  scaled_ingredients?: ScaledIngredient[];
}

// Nuova interfaccia per ingredienti scalati
export interface ScaledIngredient extends RecipeIngredient {
  original_quantity: number;
  scaled_quantity: number;
}

// Interfaccia per ingredienti espansi
export interface ExpandedIngredient extends RecipeIngredient {
  depth: number;
  parent_recipe_id?: string;
  parent_recipe_name?: string;
}
