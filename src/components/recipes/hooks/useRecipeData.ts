
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

      console.log("Loaded recipe ingredients:", recipeIngredientsData);
      
      const mappedIngredients = (recipeIngredientsData || []).map(ri => {
        // Gestisci il caso in cui ingredients potrebbe essere un array o un oggetto
        const ingredientData = Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients;
        
        return {
          id: ri.id,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          // IMPORTANTE: usa sempre l'unità salvata nella ricetta se disponibile
          unit: ri.unit || ingredientData?.unit || '',
          is_semilavorato: ri.is_semilavorato || false,
          ingredient: ingredientData ? {
            id: ingredientData.id,
            name: ingredientData.name,
            unit: ingredientData.unit,
            cost_per_unit: ingredientData.cost_per_unit,
            effective_cost_per_unit: ingredientData.effective_cost_per_unit
          } : null
        };
      });

      console.log("Mapped ingredients with units:", mappedIngredients);
      setRecipeIngredients(mappedIngredients);
    };

    loadRecipeIngredients();
  }, [recipeId]);

  return { recipeIngredients, setRecipeIngredients };
};
