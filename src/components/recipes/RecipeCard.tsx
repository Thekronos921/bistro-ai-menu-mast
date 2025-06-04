
import React from 'react';
import { Clock, Users, Edit, Copy, Trash2, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import StockStatusBadge, { type StockStatus } from '@/components/StockStatusBadge';
import { calculateTotalCost, calculateCostPerPortion, getFoodCostIndicator } from '@/utils/recipeCalculations';
import type { Recipe } from '@/types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onPrint: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onEdit,
  onDuplicate,
  onDelete,
  onPrint
}) => {
  const totalCost = calculateTotalCost(recipe.recipe_ingredients);
  const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
  const costIndicator = getFoodCostIndicator(recipe);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Bassa": return "bg-emerald-100 text-emerald-800";
      case "Media": return "bg-amber-100 text-amber-800";
      case "Alta": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getIngredientStockStatus = (ingredient: Recipe['recipe_ingredients'][0]['ingredients']): StockStatus => {
    if (!ingredient.current_stock || !ingredient.min_stock_threshold) return "ok";
    
    if (ingredient.current_stock <= ingredient.min_stock_threshold * 0.5) return "critical";
    if (ingredient.current_stock <= ingredient.min_stock_threshold) return "low";
    return "ok";
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-xl">{recipe.name}</CardTitle>
              {recipe.is_semilavorato && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  [S]
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{recipe.category}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
            <Tooltip>
              <TooltipTrigger>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${costIndicator.color}`}>
                  {costIndicator.label}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{costIndicator.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 mt-4 text-sm text-slate-600">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.preparation_time} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{recipe.portions} porzioni</span>
          </div>
        </div>

        {/* Cost Information */}
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Costo Produzione Totale</p>
              <p className="text-lg font-bold text-purple-700">€{totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Costo per Porzione</p>
              <p className="text-lg font-bold text-purple-700">€{costPerPortion.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ingredients */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3">Ingredienti</h4>
          <div className="space-y-2">
            {recipe.recipe_ingredients?.map((ri) => {
              const stockStatus = getIngredientStockStatus(ri.ingredients);
              const effectiveCost = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
              return (
                <div key={ri.id} className="flex items-center justify-between text-sm group">
                  <div className="flex items-center space-x-2">
                    <span className={`text-slate-700 ${ri.is_semilavorato ? 'text-purple-600 font-medium' : ''}`}>
                      {ri.is_semilavorato ? '[S] ' : ''}{ri.ingredients.name} - {ri.quantity}{ri.ingredients.unit}
                    </span>
                    {stockStatus !== "ok" && !ri.is_semilavorato && (
                      <StockStatusBadge status={stockStatus} className="scale-75" />
                    )}
                  </div>
                  <span className="font-medium text-slate-800">
                    €{(effectiveCost * ri.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(recipe)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(recipe)}
            >
              <Copy className="w-4 h-4 mr-1" />
              Duplica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrint(recipe)}
            >
              <Printer className="w-4 h-4 mr-1" />
              Stampa
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(recipe.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Nutritional Info */}
        {(recipe.calories > 0 || recipe.protein > 0 || recipe.carbs > 0 || recipe.fat > 0) && (
          <div className="pt-4 border-t border-stone-200">
            <h4 className="font-semibold text-slate-800 mb-3">Valori Nutrizionali (per porzione)</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <p className="font-bold text-slate-800">{recipe.calories}</p>
                <p className="text-slate-500">Calorie</p>
              </div>
              <div>
                <p className="font-bold text-slate-800">{recipe.protein}g</p>
                <p className="text-slate-500">Proteine</p>
              </div>
              <div>
                <p className="font-bold text-slate-800">{recipe.carbs}g</p>
                <p className="text-slate-500">Carboidrati</p>
              </div>
              <div>
                <p className="font-bold text-slate-800">{recipe.fat}g</p>
                <p className="text-slate-500">Grassi</p>
              </div>
            </div>
          </div>
        )}

        {recipe.allergens && (
          <div className="pt-2">
            <p className="text-xs text-orange-600">
              <strong>Allergeni:</strong> {recipe.allergens}
            </p>
          </div>
        )}

        {recipe.notes_chef && (
          <div className="pt-2">
            <p className="text-xs text-slate-600">
              <strong>Note Chef:</strong> {recipe.notes_chef}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
