
import React, { useState } from 'react';
import { Clock, Users, ChefHat, Timer, Play, Pause, RotateCcw, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { calculateTotalCost, calculateCostPerPortion } from '@/utils/recipeCalculations';
import type { Recipe } from '@/types/recipe';

interface MobileRecipeCardProps {
  recipe: Recipe;
  onViewKitchenMode: (recipe: Recipe) => void;
  onScale: (recipe: Recipe) => void;
}

const MobileRecipeCard: React.FC<MobileRecipeCardProps> = ({
  recipe,
  onViewKitchenMode,
  onScale
}) => {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const totalCost = calculateTotalCost(recipe.recipe_ingredients);
  const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Bassa": return "bg-emerald-100 text-emerald-800";
      case "Media": return "bg-amber-100 text-amber-800";
      case "Alta": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeElapsed(0);
  };

  return (
    <Card className="mb-4 shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg text-slate-800 truncate">
                {recipe.name}
              </h3>
              {recipe.is_semilavorato && (
                <Badge variant="outline" className="text-xs">
                  [S]
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">{recipe.category}</p>
          </div>
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {recipe.difficulty}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{formatTime(recipe.preparation_time)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-green-500" />
            <span>{recipe.portions} porzioni</span>
          </div>
        </div>

        {/* Cost Information */}
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-purple-600 text-xs font-medium">Costo Totale</span>
              <p className="text-lg font-bold text-purple-800">€{totalCost.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-purple-600 text-xs font-medium">Per Porzione</span>
              <p className="text-lg font-bold text-purple-800">€{costPerPortion.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Production Timer */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-700 font-medium text-sm">Timer Produzione</span>
            <div className="text-lg font-mono text-blue-800">
              {Math.floor(timeElapsed / 60).toString().padStart(2, '0')}:
              {(timeElapsed % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={timerActive ? "destructive" : "default"}
              onClick={toggleTimer}
              className="flex-1"
            >
              {timerActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {timerActive ? 'Pausa' : 'Avvia'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetTimer}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-2">
          {/* Ingredients */}
          <Collapsible open={showIngredients} onOpenChange={setShowIngredients}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Ingredienti ({recipe.recipe_ingredients?.length || 0})</span>
                <ChefHat className={cn("w-4 h-4 transition-transform", showIngredients && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                {recipe.recipe_ingredients?.map((ri) => (
                  <div key={ri.id} className="flex justify-between items-center text-sm">
                    <span className={cn(
                      "text-slate-700",
                      ri.is_semilavorato && "text-purple-600 font-medium"
                    )}>
                      {ri.is_semilavorato ? '[S] ' : ''}{ri.ingredients.name}
                    </span>
                    <span className="font-medium">
                      {ri.quantity} {ri.unit || ri.ingredients.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Instructions */}
          <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Istruzioni ({recipe.recipe_instructions?.length || 0} passi)</span>
                <Timer className={cn("w-4 h-4 transition-transform", showInstructions && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-3 bg-gray-50 rounded-lg p-3">
                {recipe.recipe_instructions
                  ?.sort((a, b) => a.step_number - b.step_number)
                  .map((instruction) => (
                    <div key={instruction.id} className="flex space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {instruction.step_number}
                      </div>
                      <p className="text-sm text-slate-700 flex-1">
                        {instruction.instruction}
                      </p>
                    </div>
                  ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onScale(recipe)}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-1" />
            Scala
          </Button>
          <Button
            size="sm"
            onClick={() => onViewKitchenMode(recipe)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Eye className="w-4 h-4 mr-1" />
            Modalità Cucina
          </Button>
        </div>

        {/* Nutritional & Chef Notes */}
        {(recipe.calories > 0 || recipe.notes_chef) && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            {recipe.calories > 0 && (
              <div className="grid grid-cols-4 gap-2 text-xs text-center">
                <div>
                  <p className="font-bold text-slate-800">{recipe.calories}</p>
                  <p className="text-slate-500">Cal</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{recipe.protein}g</p>
                  <p className="text-slate-500">Prot</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{recipe.carbs}g</p>
                  <p className="text-slate-500">Carb</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{recipe.fat}g</p>
                  <p className="text-slate-500">Grassi</p>
                </div>
              </div>
            )}
            
            {recipe.notes_chef && (
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="text-xs text-amber-800">
                  <strong>Note Chef:</strong> {recipe.notes_chef}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileRecipeCard;
