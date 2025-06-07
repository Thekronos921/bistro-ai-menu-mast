import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
  yield_percentage?: number; // Aggiunto questo campo
}

interface LocalRecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  is_semilavorato?: boolean;
  recipe_yield_percentage?: number;
  ingredient: Ingredient | null;
}

export const useRecipeIngredients = (recipeId: string) => {
  const [recipeIngredients, setRecipeIngredients] = useState<LocalRecipeIngredient[]>([]);

  useEffect(() => {
    const fetchRecipeIngredients = async () => {
      if (!recipeId) return;

      console.log("Loading recipe ingredients for recipe:", recipeId);
      
      try {
        const { data, error } = await supabase
          .from('recipe_ingredients')
          .select(`
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
              yield_percentage
            )
          `)
          .eq('recipe_id', recipeId);

        if (error) {
          console.error("Error fetching recipe ingredients:", error);
          return;
        }

        console.log("Loaded recipe ingredients raw data:", data);

        const mappedIngredients = data?.map(item => {
          const ingredientObj = Array.isArray(item.ingredients) ? item.ingredients[0] : item.ingredients;
          console.log(`Caricando ${ingredientObj?.name}:`);
          console.log(`- Quantità salvata: ${item.quantity}`);
          console.log(`- Unità salvata nel DB: "${item.unit}"`);
          console.log(`- Unità base ingrediente: "${ingredientObj?.unit}"`);
          console.log(`- È semilavorato: ${item.is_semilavorato}`);
          console.log(`- Resa specifica ricetta: ${item.recipe_yield_percentage}%`);
          console.log(`- Resa ingrediente: ${ingredientObj?.yield_percentage}%`);
          
          const finalUnit = item.unit || ingredientObj?.unit || 'g';
          console.log(`- Unità finale utilizzata: "${finalUnit}"`);

          return {
            id: item.id,
            ingredient_id: item.ingredient_id,
            quantity: item.quantity,
            unit: finalUnit,
            is_semilavorato: item.is_semilavorato,
            recipe_yield_percentage: item.recipe_yield_percentage,
            ingredient: ingredientObj
          };
        }) || [];

        console.log("Final mapped ingredients with units:", mappedIngredients);
        setRecipeIngredients(mappedIngredients);
      } catch (error) {
        console.error("Error in fetchRecipeIngredients:", error);
      }
    };

    fetchRecipeIngredients();
  }, [recipeId]);

  return { recipeIngredients, setRecipeIngredients };
};
