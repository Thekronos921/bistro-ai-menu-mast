import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  recipe_yield_percentage?: number;
  ingredient: Ingredient | null;
}

interface RecipeInstruction {
  id: string;
  instruction: string;
}

interface FormData {
  name: string;
  category: string;
  preparationTime: number;
  difficulty: string;
  portions: number;
  description: string;
  allergens: string;
  isSemilavorato: boolean;
  notesChef: string;
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const useRecipeSaving = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveRecipe = async (
    recipeId: string,
    formData: FormData,
    nutritionalInfo: NutritionalInfo,
    recipeIngredients: LocalRecipeIngredient[],
    instructions: RecipeInstruction[]
  ) => {
    if (!formData.name || !formData.category) {
      toast({
        title: "Errore",
        description: "Nome e categoria sono obbligatori",
        variant: "destructive"
      });
      return false;
    }

    const validIngredients = recipeIngredients.filter(ing => ing.ingredient_id && ing.quantity > 0);
    if (validIngredients.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un ingrediente",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log("Updating recipe with data:", formData);
      
      const { error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: formData.name,
          category: formData.category,
          preparation_time: formData.preparationTime,
          difficulty: formData.difficulty,
          portions: formData.portions,
          description: formData.description,
          allergens: formData.allergens,
          calories: nutritionalInfo.calories,
          protein: nutritionalInfo.protein,
          carbs: nutritionalInfo.carbs,
          fat: nutritionalInfo.fat,
          is_semilavorato: formData.isSemilavorato,
          notes_chef: formData.notesChef
        })
        .eq('id', recipeId);

      if (recipeError) {
        console.error("Recipe update error:", recipeError);
        throw recipeError;
      }

      console.log("Deleting old recipe ingredients");
      const { error: deleteIngredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteIngredientsError) {
        console.error("Delete ingredients error:", deleteIngredientsError);
        throw deleteIngredientsError;
      }

      console.log("Preparing ingredients data to save:");
      const ingredientsData = validIngredients.map(ing => {
        const unitToSave = ing.unit;
        
        console.log(`Salvando ingrediente ${ing.ingredient?.name}:`);
        console.log(`- Quantità: ${ing.quantity}`);
        console.log(`- Unità selezionata: "${ing.unit}"`);
        console.log(`- Unità base ingrediente: "${ing.ingredient?.unit}"`);
        console.log(`- Unità che verrà salvata: "${unitToSave}"`);
        console.log(`- È semilavorato: ${ing.is_semilavorato}`);
        console.log(`- Resa specifica ricetta: ${ing.recipe_yield_percentage}%`);
        
        const dataToSave = {
          recipe_id: recipeId,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: unitToSave,
          is_semilavorato: ing.is_semilavorato || false,
          recipe_yield_percentage: ing.recipe_yield_percentage
        };
        
        console.log("Data to save:", dataToSave);
        return dataToSave;
      });

      console.log("Final ingredients data to insert:", ingredientsData);

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsData);

      if (ingredientsError) {
        console.error("Ingredients insert error:", ingredientsError);
        throw ingredientsError;
      }

      // Dopo aver salvato gli ingredienti, ricalcolare i costi usando la funzione del database
      console.log("Triggering cost recalculation for recipe:", recipeId);
      const { error: costUpdateError } = await supabase
        .rpc('update_recipe_costs', { recipe_id_param: recipeId });

      if (costUpdateError) {
        console.error("Cost update error:", costUpdateError);
        // Non bloccare il salvataggio per errori di calcolo costi
        console.warn("Could not update costs, but recipe was saved successfully");
      } else {
        console.log("Recipe costs updated successfully");
      }

      console.log("Deleting old recipe instructions");
      const { error: deleteInstructionsError } = await supabase
        .from('recipe_instructions')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteInstructionsError) {
        console.error("Delete instructions error:", deleteInstructionsError);
        throw deleteInstructionsError;
      }

      const validInstructions = instructions.filter(inst => inst.instruction.trim());
      if (validInstructions.length > 0) {
        console.log("Inserting new recipe instructions:", validInstructions);
        const instructionsData = validInstructions.map((inst, index) => ({
          recipe_id: recipeId,
          step_number: index + 1,
          instruction: inst.instruction
        }));

        const { error: instructionsError } = await supabase
          .from('recipe_instructions')
          .insert(instructionsData);

        if (instructionsError) {
          console.error("Instructions insert error:", instructionsError);
          throw instructionsError;
        }
      }

      toast({
        title: "Successo",
        description: "Ricetta aggiornata con successo. I costi sono stati ricalcolati automaticamente."
      });

      return true;
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento della ricetta",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { saveRecipe, loading };
};
