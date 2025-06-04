
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Recipe } from '@/types/recipe';
import RecipeBasicInfoForm from "@/components/recipes/RecipeBasicInfoForm";
import NutritionalInfoForm from "@/components/recipes/NutritionalInfoForm";
import RecipeIngredientsForm from "@/components/recipes/RecipeIngredientsForm";
import RecipeInstructionsForm from "@/components/recipes/RecipeInstructionsForm";
import { useRecipeIngredients } from "@/components/recipes/hooks/useRecipeData";
import { useRecipeSaving } from "@/components/recipes/hooks/useRecipeSaving";

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
  const { saveRecipe, loading } = useRecipeSaving();
  const { recipeIngredients, setRecipeIngredients } = useRecipeIngredients(recipe.id);
  
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

  const handleSubmit = async () => {
    const success = await saveRecipe(
      recipe.id,
      formData,
      nutritionalInfo,
      recipeIngredients,
      instructions
    );

    if (success) {
      onClose();
      onRecipeUpdated();
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
