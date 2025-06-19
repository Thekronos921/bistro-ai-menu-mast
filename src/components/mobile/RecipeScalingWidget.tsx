
import React, { useState } from 'react';
import { Plus, Minus, Calculator, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { scaleRecipe } from '@/utils/nestedRecipeCalculations';
import { calculateTotalCost } from '@/utils/recipeCalculations';
import type { Recipe } from '@/types/recipe';

interface RecipeScalingWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  onScaledRecipe?: (scaledRecipe: Recipe) => void;
}

const RecipeScalingWidget: React.FC<RecipeScalingWidgetProps> = ({
  isOpen,
  onClose,
  recipe,
  onScaledRecipe
}) => {
  const [targetPortions, setTargetPortions] = useState<number>(recipe?.portions || 1);
  const [scaledRecipe, setScaledRecipe] = useState<Recipe | null>(null);

  if (!recipe) return null;

  React.useEffect(() => {
    if (recipe) {
      setTargetPortions(recipe.portions);
      setScaledRecipe(null);
    }
  }, [recipe]);

  const handlePortionChange = (increment: number) => {
    const newPortions = Math.max(1, targetPortions + increment);
    setTargetPortions(newPortions);
  };

  const handleScale = () => {
    if (targetPortions <= 0) return;

    try {
      const scaled = scaleRecipe(recipe, targetPortions);
      setScaledRecipe(scaled);
      if (onScaledRecipe) {
        onScaledRecipe(scaled);
      }
    } catch (error) {
      console.error('Errore durante lo scaling della ricetta:', error);
    }
  };

  const originalCost = recipe.recipe_ingredients ? calculateTotalCost(recipe.recipe_ingredients) : 0;
  const scaledCost = scaledRecipe && scaledRecipe.recipe_ingredients ? calculateTotalCost(scaledRecipe.recipe_ingredients) : 0;
  const scalingFactor = targetPortions / recipe.portions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg mx-4 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Scala Ricetta: {recipe.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipe Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Ricetta Originale</span>
              <Badge variant="outline">
                {recipe.portions} porzioni
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tempo preparazione:</span>
                <p className="font-medium">{recipe.preparation_time} min</p>
              </div>
              <div>
                <span className="text-gray-500">Costo totale:</span>
                <p className="font-medium">€{originalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Portion Selector */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Porzioni Desiderate</Label>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePortionChange(-1)}
                disabled={targetPortions <= 1}
                className="h-12 w-12"
              >
                <Minus className="w-5 h-5" />
              </Button>
              
              <div className="flex-1">
                <Input
                  type="number"
                  min="1"
                  value={targetPortions}
                  onChange={(e) => setTargetPortions(parseInt(e.target.value) || 1)}
                  className="text-center text-xl font-bold h-12"
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePortionChange(1)}
                className="h-12 w-12"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-center">
              <Badge variant="secondary" className="text-sm">
                Fattore di scala: x{scalingFactor.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Calculate Button */}
          <Button onClick={handleScale} className="w-full" size="lg">
            <Calculator className="w-4 h-4 mr-2" />
            Calcola Scaling
          </Button>

          {/* Scaled Results */}
          {scaledRecipe && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Ricetta Scalata</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Porzioni:</span>
                    <p className="font-bold text-blue-800">{scaledRecipe.scaled_portions}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Tempo stimato:</span>
                    <p className="font-bold text-blue-800">{scaledRecipe.scaled_preparation_time} min</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Costo totale:</span>
                    <p className="font-bold text-blue-800">€{scaledCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Costo per porzione:</span>
                    <p className="font-bold text-blue-800">€{(scaledCost / targetPortions).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Scaled Ingredients */}
              <div className="space-y-2">
                <Label className="font-medium">Ingredienti Scalati</Label>
                <ScrollArea className="h-40 bg-gray-50 rounded-lg p-3">
                  <div className="space-y-2">
                    {scaledRecipe.scaled_ingredients?.map((ingredient) => (
                      <div key={ingredient.id} className="flex justify-between items-center text-sm">
                        <span className={`${ingredient.is_semilavorato ? 'text-purple-600 font-medium' : 'text-slate-700'}`}>
                          {ingredient.is_semilavorato ? '[S] ' : ''}{ingredient.ingredients.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 line-through">
                            {ingredient.original_quantity.toFixed(1)}
                          </span>
                          <span className="font-bold text-blue-600">
                            {ingredient.scaled_quantity.toFixed(1)} {ingredient.unit || ingredient.ingredients.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Chiudi
            </Button>
            {scaledRecipe && (
              <Button
                onClick={onClose}
                className="flex-1"
              >
                Usa Ricetta Scalata
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeScalingWidget;
