
import { supabase } from "@/integrations/supabase/client";
import type { Recipe } from "@/types/recipe";
import type { Dish, CategoryInfo } from "./types";

export const fetchDishes = async (restaurantId: string): Promise<Dish[]> => {
  const { data: dishesData, error: dishesError } = await supabase
    .from('dishes')
    .select(`
      id,
      name,
      selling_price,
      recipe_id,
      restaurant_id,
      external_id,
      external_category_id,
      is_enabled_for_restaurant,
      is_visible_on_ecommerce,
      is_visible_on_pos,
      availability_status,
      cic_notes,
      image_url,
      last_synced_at,
      sync_status,
      cic_price_includes_vat,
      cic_vat_percentage,
      cic_department_id,
      cic_department_name,
      cic_variants_count,
      cic_has_variants,
      created_at,
      updated_at,
      restaurant_category_id,
      category:restaurant_categories ( name ),
      recipes (
        id,
        name,
        category,
        preparation_time,
        difficulty,
        portions,
        description,
        allergens,
        calories,
        protein,
        carbs,
        fat,
        restaurant_id,
        selling_price,
        is_semilavorato,
        notes_chef,
        created_at,
        updated_at,
        recipe_ingredients (
          id,
          ingredient_id,
          quantity,
          unit,
          is_semilavorato,
          ingredients (
            id,
            name,
            unit,
            cost_per_unit,
            effective_cost_per_unit,
            yield_percentage
          )
        ),
        recipe_instructions (
          id,
          step_number,
          instruction
        )
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (dishesError) throw dishesError;

  // Transform dishes data to flatten category and handle nested recipes
  return dishesData?.map(dish => ({
    id: dish.id,
    name: dish.name,
    selling_price: dish.selling_price,
    recipe_id: dish.recipe_id,
    // Handle category data - it could be an array or a single object
    category: Array.isArray(dish.category) 
      ? (dish.category[0] as CategoryInfo)?.name || 'Senza categoria'
      : (dish.category as CategoryInfo)?.name || 'Senza categoria',
    // Transform nested recipes array to single recipe if it exists
    recipes: dish.recipes && Array.isArray(dish.recipes) && dish.recipes.length > 0 
      ? {
          id: dish.recipes[0].id,
          name: dish.recipes[0].name,
          category: dish.recipes[0].category,
          preparation_time: dish.recipes[0].preparation_time,
          difficulty: dish.recipes[0].difficulty,
          portions: dish.recipes[0].portions,
          description: dish.recipes[0].description,
          allergens: dish.recipes[0].allergens,
          calories: dish.recipes[0].calories,
          protein: dish.recipes[0].protein,
          carbs: dish.recipes[0].carbs,
          fat: dish.recipes[0].fat,
          restaurant_id: dish.recipes[0].restaurant_id,
          selling_price: dish.recipes[0].selling_price,
          is_semilavorato: dish.recipes[0].is_semilavorato,
          notes_chef: dish.recipes[0].notes_chef,
          created_at: dish.recipes[0].created_at,
          updated_at: dish.recipes[0].updated_at,
          recipe_ingredients: dish.recipes[0].recipe_ingredients || [],
          recipe_instructions: dish.recipes[0].recipe_instructions || []
        } as Recipe
      : undefined
  })) || [];
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
        ingredients (
          id,
          name,
          unit,
          cost_per_unit,
          effective_cost_per_unit,
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

  return recipesData || [];
};
