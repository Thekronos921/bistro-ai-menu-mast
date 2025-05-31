
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Recipe, RecipeIngredient } from '@/types/recipe';
import RecipeBasicInfoForm from "@/components/recipes/RecipeBasicInfoForm";
import NutritionalInfoForm from "@/components/recipes/NutritionalInfoForm";
import RecipeIngredientsForm from "@/components/recipes/RecipeIngredientsForm";
import RecipeInstructionsForm from "@/components/recipes/RecipeInstructionsForm";

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

interface RecipeInstruction {
  id: string;
  instruction: string;
}

interface EditRecipeDialogProps {
  recipe: Recipe;
  onClose: () => void;
  onRecipeUpdated: () => void;
}

const EditRecipeDialog = ({ recipe, onClose, onRecipeUpdated }: EditRecipeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: recipe.name,
    category: recipe.category,
    preparationTime: recipe.preparation_time,
    difficulty: recipe.difficulty,
    portions: recipe.portions,
    description: recipe.description || "",
    allergens: recipe.allergens || "",
    isSemilavorato: recipe.is_semilavorato || false,
    notesChef: recipe.notes_chef || ""
  });
  
  const [recipeIngredients, setRecipeIngredients] = useState<LocalRecipeIngredient[]>([]);
  
  const [instructions, setInstructions] = useState(
    recipe.recipe_instructions
      .sort((a, b) => a.step_number - b.step_number)
      .map(inst => ({ id: inst.id, instruction: inst.instruction }))
  );
  
  const [nutritionalInfo, setNutritionalInfo] = useState({
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0
  });

  useEffect(() => {
    const loadRecipeIngredients = async () => {
      console.log("Loading recipe ingredients for recipe:", recipe.id);
      
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
        .eq('recipe_id', recipe.id);

      if (error) {
        console.error("Error loading recipe ingredients:", error);
        return;
      }

      console.log("Loaded recipe ingredients:", recipeIngredientsData);
      
      const mappedIngredients = (recipeIngredientsData || []).map(ri => ({
        id: ri.id,
        ingredient_id: ri.ingredient_id,
        quantity: ri.quantity,
        unit: ri.unit || ri.ingredients.unit,
        is_semilavorato: ri.is_semilavorato || false,
        ingredient: ri.ingredients
      }));

      setRecipeIngredients(mappedIngredients);
    };

    loadRecipeIngredients();
  }, [recipe.id]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast({
        title: "Errore",
        description: "Nome e categoria sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    const validIngredients = recipeIngredients.filter(ing => ing.ingredient_id && ing.quantity > 0);
    if (validIngredients.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un ingrediente",
        variant: "destructive"
      });
      return;
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
        .eq('id', recipe.id);

      if (recipeError) {
        console.error("Recipe update error:", recipeError);
        throw recipeError;
      }

      console.log("Deleting old recipe ingredients");
      const { error: deleteIngredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipe.id);

      if (deleteIngredientsError) {
        console.error("Delete ingredients error:", deleteIngredientsError);
        throw deleteIngredientsError;
      }

      console.log("Inserting new recipe ingredients:", validIngredients);
      const ingredientsData = validIngredients.map(ing => ({
        recipe_id: recipe.id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity,
        unit: ing.unit,
        is_semilavorato: ing.is_semilavorato || false
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsData);

      if (ingredientsError) {
        console.error("Ingredients insert error:", ingredientsError);
        throw ingredientsError;
      }

      console.log("Deleting old recipe instructions");
      const { error: deleteInstructionsError } = await supabase
        .from('recipe_instructions')
        .delete()
        .eq('recipe_id', recipe.id);

      if (deleteInstructionsError) {
        console.error("Delete instructions error:", deleteInstructionsError);
        throw deleteInstructionsError;
      }

      const validInstructions = instructions.filter(inst => inst.instruction.trim());
      if (validInstructions.length > 0) {
        console.log("Inserting new recipe instructions:", validInstructions);
        const instructionsData = validInstructions.map((inst, index) => ({
          recipe_id: recipe.id,
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
        description: "Ricetta aggiornata con successo"
      });

      onClose();
      onRecipeUpdated();
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento della ricetta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5" />
              <span>Modifica Ricetta: {recipe.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <RecipeBasicInfoForm 
                formData={formData}
                onFormDataChange={(data) => setFormData({ ...formData, ...data })}
              />
              <NutritionalInfoForm 
                nutritionalInfo={nutritionalInfo}
                onNutritionalInfoChange={(data) => setNutritionalInfo({ ...nutritionalInfo, ...data })}
              />
            </div>

            <RecipeIngredientsForm 
              recipeIngredients={recipeIngredients}
              onIngredientsChange={setRecipeIngredients}
              recipeId={recipe.id}
              portions={formData.portions}
            />

            <RecipeInstructionsForm 
              instructions={instructions}
              onInstructionsChange={setInstructions}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-slate-500">
              Costi ingredienti aggiornati al: {new Date().toLocaleString('it-IT')}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Aggiornamento..." : "Aggiorna Ricetta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default EditRecipeDialog;
