
import { supabase } from "@/integrations/supabase/client";
import type { Recipe } from "@/types/recipe";

export const createDishFromRecipe = async (recipe: Recipe, restaurantId: string): Promise<void> => {
  const recipeCost = recipe.recipe_ingredients.reduce((total, ri) => {
    const effectiveCost = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
    return total + (effectiveCost * ri.quantity);
  }, 0);
  
  const suggestedPrice = recipeCost * 3; // Margine del 66%

  const { error } = await supabase
    .from('dishes')
    .insert([{
      name: recipe.name,
      category: recipe.category,
      selling_price: suggestedPrice,
      recipe_id: recipe.id,
      restaurant_id: restaurantId
    }]);

  if (error) throw error;

  return Promise.resolve();
};

export const deleteDish = async (dishId: string, restaurantId: string): Promise<void> => {
  const { error } = await supabase
    .from('dishes')
    .delete()
    .eq('id', dishId)
    .eq('restaurant_id', restaurantId);

  if (error) throw error;
};
