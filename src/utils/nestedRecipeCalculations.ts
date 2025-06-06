import { Recipe, RecipeIngredient, ScaledIngredient, ExpandedIngredient } from '@/types/recipe';
import { calculateTotalCost } from './recipeCalculations';
import { convertUnit, areUnitsCompatible } from './unitConversion';
import { supabase } from '@/integrations/supabase/client';

export const expandRecipeIngredients = async (recipe: Recipe, depth: number = 0, maxDepth: number = 5): Promise<ExpandedIngredient[]> => {
  if (depth >= maxDepth) {
    console.warn(`Massima profondità di annidamento (${maxDepth}) raggiunta per la ricetta ${recipe.name}`);
    return [];
  }

  const expandedIngredients: ExpandedIngredient[] = [];

  for (const ri of recipe.recipe_ingredients) {
    const expandedIngredient: ExpandedIngredient = {
      ...ri,
      depth,
      parent_recipe_id: recipe.id,
      parent_recipe_name: recipe.name
    };

    expandedIngredients.push(expandedIngredient);

    if (ri.is_semilavorato) {
      const semilavoratoRecipe = await getSemilavoratoRecipe(ri.ingredient_id);
      if (semilavoratoRecipe) {
        const nestedIngredients = await expandRecipeIngredients(semilavoratoRecipe, depth + 1, maxDepth);
        expandedIngredients.push(...nestedIngredients);
      }
    }
  }

  return expandedIngredients;
};

export const scaleRecipe = (recipe: Recipe, targetPortions: number): Recipe => {
  const scalingFactor = targetPortions / recipe.portions;

  const scaledIngredients: ScaledIngredient[] = recipe.recipe_ingredients.map(ri => ({
    ...ri,
    original_quantity: ri.quantity,
    scaled_quantity: ri.quantity * scalingFactor,
    quantity: ri.quantity * scalingFactor
  }));

  const scaledPrepTime = Math.round(recipe.preparation_time * Math.sqrt(scalingFactor));

  return {
    ...recipe,
    scaled_portions: targetPortions,
    scaled_preparation_time: scaledPrepTime,
    scaled_ingredients: scaledIngredients,
    recipe_ingredients: scaledIngredients
  };
};

export const calculateExpandedTotalCost = (expandedIngredients: ExpandedIngredient[]): number => {
  return calculateTotalCost(expandedIngredients);
};

export const getBaseIngredients = (expandedIngredients: ExpandedIngredient[]): ExpandedIngredient[] => {
  return expandedIngredients.filter(ei => !ei.is_semilavorato);
};

export const getAllergens = (expandedIngredients: ExpandedIngredient[]): string[] => {
  const allergenSet = new Set<string>();
  
  expandedIngredients.forEach(ei => {
    if (ei.ingredients.allergens) {
      ei.ingredients.allergens.split(',').forEach(allergen => {
        allergenSet.add(allergen.trim());
      });
    }
  });

  return Array.from(allergenSet);
};

// Implementazione corretta della funzione getSemilavoratoRecipe
const getSemilavoratoRecipe = async (ingredientId: string): Promise<Recipe | null> => {
  try {
    // Prima cerchiamo se l'ingrediente è collegato a una ricetta
    const { data: ingredient, error: ingredientError } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', ingredientId)
      .single();

    if (ingredientError || !ingredient) {
      console.warn(`Ingrediente ${ingredientId} non trovato`);
      return null;
    }

    // Cerchiamo una ricetta che abbia lo stesso nome dell'ingrediente e sia marcata come semilavorato
    const { data: recipe, error: recipeError } = await supabase
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
            current_stock,
            min_stock_threshold,
            yield_percentage,
            allergens
          )
        ),
        recipe_instructions (
          id,
          step_number,
          instruction
        )
      `)
      .eq('name', ingredient.name)
      .eq('is_semilavorato', true)
      .single();

    if (recipeError || !recipe) {
      console.warn(`Ricetta semilavorato per ${ingredient.name} non trovata`);
      return null;
    }

    return recipe as Recipe;
  } catch (error) {
    console.error('Errore nel recupero della ricetta semilavorato:', error);
    return null;
  }
};