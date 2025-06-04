
import type { Recipe } from "@/types/recipe";

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
  yield_percentage?: number;
}

export interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  is_semilavorato: boolean;
  ingredients: Ingredient;
}

export interface CategoryInfo {
  name: string;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

export interface FoodCostSalesData {
  dishName: string;
  unitsSold: number;
  saleDate: string;
  period: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
