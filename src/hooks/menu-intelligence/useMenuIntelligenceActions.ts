
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Recipe } from "@/types/recipe";

interface SimpleRecipe {
  id: string;
  name: string;
  category: string;
  is_semilavorato?: boolean;
  recipe_ingredients: {
    ingredients: {
      cost_per_unit: number;
    };
    quantity: number;
  }[];
}

export const useMenuIntelligenceActions = (
  dishes: any[],
  recipes: Recipe[],
  handleSalesImport: (data: any[]) => void,
  triggerSalesCalculation: (force: boolean) => void,
  deleteDish: (id: string) => void
) => {
  const { toast } = useToast();

  // Convert Recipe to SimpleRecipe for dialog components
  const convertToSimpleRecipe = (recipe: Recipe): SimpleRecipe => {
    return {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      is_semilavorato: recipe.is_semilavorato,
      recipe_ingredients: recipe.recipe_ingredients.map(ri => ({
        ingredients: {
          cost_per_unit: ri.ingredients.cost_per_unit
        },
        quantity: ri.quantity
      }))
    };
  };

  const handleEditRecipeFromDialog = useCallback((simpleRecipe: SimpleRecipe) => {
    const fullRecipe = recipes.find(r => r.id === simpleRecipe.id) || 
                      dishes.find(d => d.recipes?.id === simpleRecipe.id)?.recipes;
    
    if (fullRecipe) {
      const completeRecipe: Recipe = {
        ...fullRecipe,
        preparation_time: fullRecipe.preparation_time || 0,
        difficulty: fullRecipe.difficulty || 'Facile',
        portions: fullRecipe.portions || 1,
        description: fullRecipe.description || '',
        allergens: fullRecipe.allergens || '',
        calories: fullRecipe.calories || 0,
        protein: fullRecipe.protein || 0,
        carbs: fullRecipe.carbs || 0,
        fat: fullRecipe.fat || 0,
        is_semilavorato: fullRecipe.is_semilavorato || false,
        recipe_instructions: fullRecipe.recipe_instructions || []
      };
      return completeRecipe;
    }
    return null;
  }, [dishes, recipes]);

  const handleSalesImportWrapper = useCallback((importedSales: any[]) => {
    const convertedSales = importedSales.map(sale => ({
      dishName: sale.dishName,
      unitsSold: sale.unitsSold,
      saleDate: sale.saleDate,
      period: sale.period || 'imported'
    }));
    
    handleSalesImport(convertedSales);
  }, [handleSalesImport]);

  const handleCalculateFoodCost = useCallback(() => {
    triggerSalesCalculation(false);
  }, [triggerSalesCalculation]);

  const handleRecalculateFoodCost = useCallback(() => {
    triggerSalesCalculation(true);
  }, [triggerSalesCalculation]);

  const handleDeleteDish = useCallback((dishId: string, dishName: string) => {
    deleteDish(dishId);
  }, [deleteDish]);

  return {
    handleEditRecipeFromDialog,
    handleSalesImportWrapper,
    handleCalculateFoodCost,
    handleRecalculateFoodCost,
    handleDeleteDish
  };
};
