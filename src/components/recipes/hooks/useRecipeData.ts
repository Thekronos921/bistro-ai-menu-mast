
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Recipe } from '@/types/recipe';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
}

interface LocalRecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  is_semilavorato?: boolean;
  ingredient: Ingredient | null;
}

export const useRecipeIngredients = (recipeId: string) => {
  const [recipeIngredients, setRecipeIngredients] = useState<LocalRecipeIngredient[]>([]);

  useEffect(() => {
    const loadRecipeIngredients = async () => {
      console.log("Loading recipe ingredients for recipe:", recipeId);
      
      const { data: recipeIngredientsData, error } = await supabase
        .from('recipe_ingredients')
        .select(`
          id,
          ingredient_id,
          quantity,
          unit,
          is_semilavorato,
          recipe_yield_percentage,
          ingredients!inner(
            id,
            name,
            unit,
            cost_per_unit,
            effective_cost_per_unit
          )
        `)
        .eq('recipe_id', recipeId);

      if (error) {
        console.error("Error loading recipe ingredients:", error);
        return;
      }

      console.log("Loaded recipe ingredients raw data:", recipeIngredientsData);
      
      const mappedIngredients = (recipeIngredientsData || []).map(ri => {
        // Gestisci il caso in cui ingredients potrebbe essere un array o un oggetto
        const ingredientData = Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients;
        
        // IMPORTANTE: usa SEMPRE l'unità salvata nel database se disponibile
        // Se l'unità salvata è null o undefined, usa quella base dell'ingrediente
        const unitToUse = ri.unit || ingredientData?.unit || '';
        
        console.log(`Caricando ${ingredientData?.name}:`);
        console.log(`- Quantità salvata: ${ri.quantity}`);
        console.log(`- Unità salvata nel DB: "${ri.unit}"`);
        console.log(`- Unità base ingrediente: "${ingredientData?.unit}"`);
        console.log(`- Unità finale utilizzata: "${unitToUse}"`);
        
        return {
          id: ri.id,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          unit: unitToUse, // Usa SEMPRE l'unità salvata nel database
          is_semilavorato: ri.is_semilavorato || false,
          recipe_yield_percentage: ri.recipe_yield_percentage,
          ingredient: ingredientData ? {
            id: ingredientData.id,
            name: ingredientData.name,
            unit: ingredientData.unit,
            cost_per_unit: ingredientData.cost_per_unit,
            effective_cost_per_unit: ingredientData.effective_cost_per_unit
          } : null
        };
      });

      console.log("Final mapped ingredients with units:", mappedIngredients);
      setRecipeIngredients(mappedIngredients);
    };

    if (recipeId) {
      loadRecipeIngredients();
    }
  }, [recipeId]);

  return { recipeIngredients, setRecipeIngredients };
};
