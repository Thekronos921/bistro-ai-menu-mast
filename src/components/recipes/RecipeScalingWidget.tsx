import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Recipe } from '@/types/recipe';
import { scaleRecipe } from '@/utils/nestedRecipeCalculations';
import { calculateTotalCost } from '@/utils/recipeCalculations';

interface RecipeScalingWidgetProps {
  recipe: Recipe;
  onScaledRecipe: (scaledRecipe: Recipe) => void;
}

const RecipeScalingWidget: React.FC<RecipeScalingWidgetProps> = ({ recipe, onScaledRecipe }) => {
  const [targetPortions, setTargetPortions] = useState<number>(recipe.portions);
  const [scaledRecipe, setScaledRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    // Reset quando cambia la ricetta
    setTargetPortions(recipe.portions);
    setScaledRecipe(null);
  }, [recipe]);

  const handleScale = () => {
    if (targetPortions <= 0) {
      console.warn('Le porzioni target devono essere maggiori di 0');
      return;
    }

    try {
      const scaled = scaleRecipe(recipe, targetPortions);
      setScaledRecipe(scaled);
      onScaledRecipe(scaled);
    } catch (error) {
      console.error('Errore durante lo scaling della ricetta:', error);
    }
  };

  const originalCost = recipe.recipe_ingredients ? calculateTotalCost(recipe.recipe_ingredients) : 0;
  const scaledCost = scaledRecipe && scaledRecipe.recipe_ingredients ? calculateTotalCost(scaledRecipe.recipe_ingredients) : 0;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <h3 className="text-lg font-semibold">Scala Ricetta</h3>
      
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Porzioni Desiderate</label>
          <Input
            type="number"
            min="1"
            value={targetPortions}
            onChange={(e) => setTargetPortions(parseInt(e.target.value) || recipe.portions)}
          />
        </div>
        <div className="pt-6">
          <Button onClick={handleScale}>Calcola</Button>
        </div>
      </div>

      {scaledRecipe && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Ricetta Originale:</p>
              <p>{recipe.portions} porzioni</p>
              <p>Tempo: {recipe.preparation_time} min</p>
              <p>Costo: €{originalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="font-medium">Ricetta Scalata:</p>
              <p>{scaledRecipe.scaled_portions} porzioni</p>
              <p>Tempo stimato: {scaledRecipe.scaled_preparation_time} min</p>
              <p>Costo stimato: €{scaledCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-sm">Ingredienti Scalati:</p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {scaledRecipe.scaled_ingredients.map((ingredient) => (
                <div key={ingredient.id} className="text-sm flex justify-between">
                  <span>{ingredient.ingredients.name}</span>
                  <span>
                    {ingredient.scaled_quantity.toFixed(2)} {ingredient.unit || ingredient.ingredients.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeScalingWidget;