
import React from 'react';
import { Clock, Users, Utensils, ChefHat, Play, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/types/recipe';

interface MobileRecipeCardProps {
  recipe: Recipe;
  onViewKitchenMode?: (recipe: Recipe) => void;
  onScale?: (recipe: Recipe) => void;
  className?: string;
}

const MobileRecipeCard: React.FC<MobileRecipeCardProps> = ({
  recipe,
  onViewKitchenMode,
  onScale,
  className
}) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
      case 'bassa':
        return 'bg-green-100 text-green-800';
      case 'medio':
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'difficile':
      case 'alta':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalCost = recipe.recipe_ingredients?.reduce((sum, ingredient) => {
    const cost = ingredient.ingredients?.effective_cost_per_unit || ingredient.ingredients?.cost_per_unit || 0;
    return sum + (cost * ingredient.quantity);
  }, 0) || 0;

  return (
    <Card className={cn("border-0 shadow-sm w-full max-w-full", className)}>
      <CardContent className="p-2">
        <div className="space-y-2">
          {/* Header compatto */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 truncate leading-tight">
                {recipe.name}
              </h3>
              {recipe.category && (
                <p className="text-xs text-slate-500 capitalize">
                  {recipe.category}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              {recipe.is_semilavorato && (
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  Semi
                </Badge>
              )}
              {recipe.difficulty && (
                <Badge className={cn("text-xs h-4 px-1", getDifficultyColor(recipe.difficulty))}>
                  {recipe.difficulty}
                </Badge>
              )}
            </div>
          </div>

          {/* Metriche compatte */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600">{recipe.preparation_time || 0}min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600">{recipe.portions || 1} porz</span>
            </div>
            <div className="flex items-center space-x-1">
              <Utensils className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600">€{totalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Ingredienti summary compatto */}
          {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
            <div className="text-xs text-slate-500">
              <span>{recipe.recipe_ingredients.length} ingredienti</span>
              {recipe.recipe_ingredients.slice(0, 2).map((ingredient, index) => (
                <span key={index} className="ml-1">
                  • {ingredient.ingredients?.name || 'Ingrediente'}
                </span>
              ))}
              {recipe.recipe_ingredients.length > 2 && (
                <span className="ml-1">... +{recipe.recipe_ingredients.length - 2}</span>
              )}
            </div>
          )}

          {/* Actions compatte */}
          <div className="flex space-x-1 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewKitchenMode?.(recipe)}
              className="flex-1 h-6 text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Cucina
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onScale?.(recipe)}
              className="flex-1 h-6 text-xs bg-orange-600 hover:bg-orange-700"
            >
              <Scale className="w-3 h-3 mr-1" />
              Scala
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileRecipeCard;
