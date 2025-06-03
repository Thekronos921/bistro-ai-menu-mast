
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/hooks/useRestaurant';
import { supabase } from '@/integrations/supabase/client';
import type { Recipe } from '@/types/recipe';

export const useRecipeActions = (fetchRecipes: () => void) => {
  const { toast } = useToast();
  const { getRestaurantId } = useRestaurant();

  const duplicateRecipe = async (recipe: Recipe) => {
    try {
      const currentRestaurantId = getRestaurantId();
      
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          name: `${recipe.name} (Copia)`,
          category: recipe.category,
          preparation_time: recipe.preparation_time,
          difficulty: recipe.difficulty,
          portions: recipe.portions,
          description: recipe.description,
          allergens: recipe.allergens,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          is_semilavorato: recipe.is_semilavorato,
          notes_chef: recipe.notes_chef,
          restaurant_id: currentRestaurantId
        }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
        const ingredientsData = recipe.recipe_ingredients.map(ri => ({
          recipe_id: newRecipe.id,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          is_semilavorato: ri.is_semilavorato || false
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) throw ingredientsError;
      }

      if (recipe.recipe_instructions && recipe.recipe_instructions.length > 0) {
        const instructionsData = recipe.recipe_instructions.map(inst => ({
          recipe_id: newRecipe.id,
          step_number: inst.step_number,
          instruction: inst.instruction
        }));

        const { error: instructionsError } = await supabase
          .from('recipe_instructions')
          .insert(instructionsData);

        if (instructionsError) throw instructionsError;
      }

      toast({
        title: "Successo",
        description: "Ricetta duplicata con successo"
      });

      fetchRecipes();
    } catch (error) {
      console.error("Duplicate recipe error:", error);
      toast({
        title: "Errore",
        description: "Errore durante la duplicazione della ricetta",
        variant: "destructive"
      });
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      // Prima rimuoviamo l'associazione dai piatti
      const { error: dishUpdateError } = await supabase
        .from('dishes')
        .update({ recipe_id: null })
        .eq('recipe_id', recipeId);

      if (dishUpdateError) {
        console.warn("Warning updating dishes:", dishUpdateError);
        // Continuiamo comunque, potrebbe non esserci nessun piatto associato
      }

      // Eliminiamo gli ingredienti della ricetta
      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      if (ingredientsError) throw ingredientsError;

      // Eliminiamo le istruzioni della ricetta
      const { error: instructionsError } = await supabase
        .from('recipe_instructions')
        .delete()
        .eq('recipe_id', recipeId);

      if (instructionsError) throw instructionsError;

      // Infine eliminiamo la ricetta
      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (recipeError) throw recipeError;

      toast({
        title: "Successo",
        description: "Ricetta eliminata con successo"
      });

      fetchRecipes();
    } catch (error) {
      console.error("Delete recipe error:", error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione della ricetta",
        variant: "destructive"
      });
    }
  };

  return {
    duplicateRecipe,
    deleteRecipe
  };
};
