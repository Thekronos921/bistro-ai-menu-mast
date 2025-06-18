import { supabase } from "@/integrations/supabase/client";
import type { Recipe } from "@/types/recipe";
import type { Dish, CategoryInfo } from "./types";

export const fetchDishes = async (restaurantId: string): Promise<any[]> => {
  const { data: dishesData, error: dishesError } = await supabase
    .from('dishes')
    .select(`
      id,
      name,
      selling_price,
      recipe_id,
      external_id,
      category_id, 
      restaurant_category_name,
      dish_categories ( name )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (dishesError) throw dishesError;

  return (dishesData || []).map(dish => {
    let categoryName = 'Senza categoria';

    // Priorità 1: Nome da dish_categories tramite category_id
    if (dish.dish_categories && typeof dish.dish_categories === 'object' && dish.dish_categories !== null && 'name' in dish.dish_categories && dish.dish_categories.name) {
      categoryName = (dish.dish_categories as { name: string }).name;
    } 
    // Priorità 2: Nome da restaurant_category_name (legacy)
    else if (dish.restaurant_category_name) {
      categoryName = dish.restaurant_category_name;
    }

    return {
      id: dish.id,
      name: dish.name,
      selling_price: dish.selling_price,
      recipe_id: dish.recipe_id,
      external_id: dish.external_id,
      category: categoryName, // Questo è il campo usato per i filtri
      // Manteniamo category_id e restaurant_category_name se servono altrove, 
      // anche se non direttamente usati per Dish.category nei filtri.
      category_id: dish.category_id,
      legacy_category_name: dish.restaurant_category_name 
    };
  });
};

export const fetchRecipes = async (restaurantId: string): Promise<Recipe[]> => {
  const { data: recipesData, error: recipesError } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        id,
        ingredient_id,
        quantity,
        unit,
        is_semilavorato,
        recipe_yield_percentage,
        ingredients (
          id,
          name,
          unit,
          cost_per_unit,
          effective_cost_per_unit,
          current_stock,
          min_stock_threshold,
          yield_percentage
        )
      ),
      recipe_instructions (
        id,
        step_number,
        instruction
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (recipesError) throw recipesError;

  return (recipesData || []).map(recipe => ({
    ...recipe,
    recipe_ingredients: (recipe.recipe_ingredients || []).map(ri => ({
      id: ri.id,
      ingredient_id: ri.ingredient_id,
      quantity: ri.quantity,
      unit: ri.unit,
      is_semilavorato: ri.is_semilavorato,
      recipe_yield_percentage: ri.recipe_yield_percentage,
      ingredients: Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients
    }))
  }));
};
