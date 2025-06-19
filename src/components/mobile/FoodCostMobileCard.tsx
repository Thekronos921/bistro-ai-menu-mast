
import React from 'react';
import { MoreHorizontal, Edit, Trash2, ExternalLink, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TouchOptimizedCard from './TouchOptimizedCard';

interface FoodCostMobileCardProps {
  dish: {
    id: string;
    name: string;
    category: string;
    selling_price: number;
    recipe_cost: number;
    food_cost_percentage: number;
    margin: number;
    has_recipe: boolean;
  };
  criticalThreshold: number;
  targetThreshold: number;
  onEdit: () => void;
  onEditRecipe: () => void;
  onDelete: () => void;
  onAssociateRecipe: () => void;
  totalSales?: number;
  salesMixPercentage?: number;
}

const FoodCostMobileCard: React.FC<FoodCostMobileCardProps> = ({
  dish,
  criticalThreshold,
  targetThreshold,
  onEdit,
  onEditRecipe,
  onDelete,
  onAssociateRecipe,
  totalSales = 0,
  salesMixPercentage = 0
}) => {
  const getBadgeVariant = () => {
    if (dish.food_cost_percentage > criticalThreshold) return 'destructive';
    if (dish.food_cost_percentage > targetThreshold) return 'secondary';
    return 'default';
  };

  const getBadgeText = () => {
    if (dish.food_cost_percentage > criticalThreshold) return 'Critico';
    if (dish.food_cost_percentage > targetThreshold) return 'Attenzione';
    return 'Ottimo';
  };

  return (
    <TouchOptimizedCard className="mb-3">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              {!dish.has_recipe && (
                <ExternalLink className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-slate-800 truncate">{dish.name}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {dish.category}
              </Badge>
              <Badge variant={getBadgeVariant()} className="text-xs">
                {getBadgeText()}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="min-w-[44px] min-h-[44px] p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Modifica Piatto
              </DropdownMenuItem>
              {dish.has_recipe ? (
                <DropdownMenuItem onClick={onEditRecipe}>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Modifica Ricetta
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onAssociateRecipe}>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Associa Ricetta
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block text-xs">Prezzo Vendita</span>
            <span className="font-semibold text-emerald-600">€{dish.selling_price.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Costo Ricetta</span>
            <span className="font-semibold">€{dish.recipe_cost.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Food Cost %</span>
            <span className={`font-bold ${
              dish.food_cost_percentage > criticalThreshold ? 'text-red-600' :
              dish.food_cost_percentage > targetThreshold ? 'text-orange-600' :
              'text-emerald-600'
            }`}>
              {dish.food_cost_percentage.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Margine</span>
            <span className="font-semibold text-blue-600">€{dish.margin.toFixed(2)}</span>
          </div>
        </div>

        {/* Sales Info */}
        {totalSales > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Vendite Totali</span>
                <span className="font-medium">€{totalSales.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Sales Mix %</span>
                <span className="font-medium">{salesMixPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TouchOptimizedCard>
  );
};

export default FoodCostMobileCard;
