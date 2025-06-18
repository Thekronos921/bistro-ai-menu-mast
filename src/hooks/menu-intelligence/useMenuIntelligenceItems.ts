
import { useMemo } from "react";
import type { Recipe } from "@/types/recipe";

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  external_id?: string;
  recipes?: Recipe;
}

export const useMenuIntelligenceItems = (
  dishes: Dish[], 
  recipes: Recipe[], 
  salesData: any[], 
  getDishAnalysis: (dish: Dish) => any,
  getRecipeAnalysis: (recipe: Recipe) => any,
  getMenuEngineeringCategory: (dish: Dish) => any
) => {
  // Combine dishes and recipes for filtering
  const allItems = useMemo(() => [
    ...dishes.map(dish => {
      const saleDataForDish = salesData.find(sale => 
        sale.dishExternalId === dish.external_id
      );
      
      return {
        type: 'dish' as const, 
        item: dish, 
        name: dish.name, 
        category: dish.category,
        analysis: getDishAnalysis(dish),
        menuCategory: getMenuEngineeringCategory(dish),
        unitsSold: saleDataForDish?.unitsSold ?? 0, 
        revenue: saleDataForDish?.revenue ?? 0, 
      };
    }),
    ...recipes
      .filter(recipe => !dishes.some(dish => dish.recipe_id === recipe.id))
      .map(recipe => ({ 
        type: 'recipe' as const, 
        item: recipe, 
        name: recipe.name, 
        category: recipe.category,
        analysis: getRecipeAnalysis(recipe),
        menuCategory: "puzzle" as const,
        unitsSold: 0,
        revenue: 0
      }))
  ], [dishes, recipes, salesData, getDishAnalysis, getMenuEngineeringCategory, getRecipeAnalysis]);

  return { allItems };
};
