
export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit: number;
  yield_percentage: number;
  current_stock?: number;
  min_stock_threshold?: number;
  supplier?: string;
  supplier_product_code?: string;
  category?: string;
  par_level?: number;
  external_id?: string;
  last_synced_at?: string;
  notes?: string;
}

export interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  is_semilavorato?: boolean;
  ingredients: Ingredient;
}

export interface RecipeInstruction {
  id: string;
  step_number: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  preparation_time: number;
  difficulty: string;
  portions: number;
  description?: string;
  allergens?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  is_semilavorato?: boolean;
  notes_chef?: string;
  recipe_ingredients: RecipeIngredient[];
  recipe_instructions?: RecipeInstruction[];
}

export interface SimpleRecipe {
  id: string;
  name: string;
  category: string;
  is_semilavorato?: boolean;
  recipe_ingredients: {
    ingredients: {
      cost_per_unit: number;
      effective_cost_per_unit: number;
    };
    quantity: number;
  }[];
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

export interface SalesData {
  dishName: string;
  unitsSold: number;
  period: string;
}

export interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

export interface DishAnalysis {
  foodCost: number;
  foodCostPercentage: number;
  margin: number;
  status: string;
  popularity: number;
}

export interface RecipeAnalysis {
  foodCost: number;
  foodCostPercentage: number;
  margin: number;
  status: string;
  assumedPrice: number;
  popularity: number;
}
