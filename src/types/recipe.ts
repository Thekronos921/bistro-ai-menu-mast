

export interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  is_semilavorato?: boolean;
  ingredients: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    effective_cost_per_unit?: number;
    current_stock?: number;
    min_stock_threshold?: number;
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
}

