
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
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (dishesError) throw dishesError;

  return (dishesData || []).map(dish => {
    // Gestione categoria robusta
    let categoryName = 'Senza categoria';
    if (Array.isArray(dish.category) && dish.category.length > 0) {
      categoryName = dish.category[0]?.name || categoryName;
    } else if (dish.category && typeof dish.category === 'object' && 'name' in dish.category) {
      categoryName = (dish.category as { name: string }).name || categoryName;
    }

    // Gestione ricetta annidata robusta
    let recipe: Recipe | undefined = undefined;
    if (Array.isArray(dish.recipes) && dish.recipes.length > 0) {
      const r = dish.recipes[0];
      recipe = {
        id: r.id,
        name: r.name,
        category: r.category,
        preparation_time: r.preparation_time,
        difficulty: r.difficulty,
        portions: r.portions,
        description: r.description,
        allergens: r.allergens,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        selling_price: r.selling_price,
        is_semilavorato: r.is_semilavorato,
        notes_chef: r.notes_chef,
        recipe_ingredients: (r.recipe_ingredients || []).map(ri => ({
          id: ri.id,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          unit: ri.unit,
          is_semilavorato: ri.is_semilavorato,
          recipe_yield_percentage: ri.recipe_yield_percentage,
          ingredients: Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients
        })),
        recipe_instructions: r.recipe_instructions || []
      };
    }

    return {
      id: dish.id,
      name: dish.name,
      selling_price: dish.selling_price,
      recipe_id: dish.recipe_id,
      external_id: dish.external_id,
      category: categoryName,
      recipes: recipe
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
