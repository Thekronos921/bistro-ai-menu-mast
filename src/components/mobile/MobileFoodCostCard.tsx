
import React from 'react';
import { Edit, Trash2, Link2, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MenuEngineeringBadge, { MenuCategory } from '@/components/MenuEngineeringBadge';
import AISuggestionTooltip from '@/components/AISuggestionTooltip';
import TouchOptimizedCard from './TouchOptimizedCard';
import { cn } from '@/lib/utils';

interface MobileFoodCostCardProps {
  item: any;
  type: 'dish' | 'recipe';
  analysis: {
    foodCost: number;
    foodCostPercentage: number;
    margin: number;
    status: string;
    popularity: number;
    assumedPrice?: number;
  };
  menuCategory: MenuCategory;
  unitsSold?: number;
  revenue?: number;
  salesMixPercentage: number;
  hasRecipe: boolean;
  settings: {
    criticalThreshold: number;
    targetThreshold: number;
    targetPercentage: number;
  };
  onEditDish: (item: any) => void;
  onEditRecipe: (item: any) => void;
  onDeleteDish: (id: string, name: string) => void;
  onAssociateRecipe?: (item: any) => void;
  onCreateDishFromRecipe: (item: any) => void;
}

const MobileFoodCostCard: React.FC<MobileFoodCostCardProps> = ({
  item,
  type,
  analysis,
  menuCategory,
  unitsSold,
  salesMixPercentage,
  hasRecipe,
  settings,
  onEditDish,
  onEditRecipe,
  onDeleteDish,
  onAssociateRecipe,
  onCreateDishFromRecipe
}) => {
  const getFoodCostColor = (percentage: number) => {
    if (percentage > settings.criticalThreshold) return 'text-red-600';
    if (percentage > 30) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getTrendIcon = (salesMix: number) => {
    if (salesMix > 15) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (salesMix < 5) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return null;
  };

  return (
    <TouchOptimizedCard className="w-full">
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header compatto */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-slate-800 text-sm truncate leading-tight">
                  {item.name}
                </h3>
                <Badge 
                  variant={type === 'dish' ? 'default' : 'secondary'} 
                  className="text-xs px-1 py-0.5 h-4"
                >
                  {type === 'dish' ? 'Piatto' : 'Ricetta'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 capitalize">{item.category}</span>
                {type === 'dish' && !hasRecipe && (
                  <Badge variant="outline" className="text-xs px-1 py-0.5 h-4 bg-amber-50 text-amber-700 border-amber-200">
                    No Ricetta
                  </Badge>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {type === 'dish' ? (
                  <>
                    <DropdownMenuItem onClick={() => onEditDish(item)} className="text-xs">
                      <Edit className="w-3 h-3 mr-2" />
                      Modifica
                    </DropdownMenuItem>
                    {hasRecipe ? (
                      <DropdownMenuItem onClick={() => onEditRecipe(item.recipes)} className="text-xs">
                        <Edit className="w-3 h-3 mr-2" />
                        Ricetta
                      </DropdownMenuItem>
                    ) : (
                      onAssociateRecipe && (
                        <DropdownMenuItem onClick={() => onAssociateRecipe(item)} className="text-xs">
                          <Link2 className="w-3 h-3 mr-2" />
                          Associa
                        </DropdownMenuItem>
                      )
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDeleteDish(item.id, item.name)}
                      className="text-red-600 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Elimina
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onEditRecipe(item)} className="text-xs">
                      <Edit className="w-3 h-3 mr-2" />
                      Modifica
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCreateDishFromRecipe(item)} className="text-xs">
                      Crea Piatto
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Metriche Grid 2x2 compatto */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-500 block leading-tight">Prezzo</span>
              <span className="font-semibold text-slate-800 leading-tight">
                €{type === 'dish' ? item.selling_price : analysis.assumedPrice?.toFixed(2)}
                {type === 'recipe' && <span className="text-slate-400 ml-1">(est.)</span>}
              </span>
            </div>
            
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-500 block leading-tight">Food Cost</span>
              <span className={cn("font-bold leading-tight", getFoodCostColor(analysis.foodCostPercentage))}>
                {hasRecipe || type === 'recipe' ? `${analysis.foodCostPercentage.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-500 block leading-tight">Margine</span>
              <span className="font-semibold text-emerald-600 leading-tight">€{analysis.margin.toFixed(2)}</span>
            </div>
            
            <div className="bg-slate-50 rounded p-2">
              <span className="text-slate-500 block leading-tight">Vendite</span>
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-slate-800 leading-tight">
                  {type === 'dish' ? `${unitsSold || 0}` : 'N/A'}
                </span>
                {type === 'dish' && getTrendIcon(salesMixPercentage)}
              </div>
              {type === 'dish' && (
                <div className="text-xs text-slate-400 leading-tight">
                  {salesMixPercentage.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Badges e AI Suggestion */}
          <div className="flex items-center justify-between">
            <MenuEngineeringBadge category={menuCategory} />
            <AISuggestionTooltip 
              category={menuCategory}
              foodCostPercentage={analysis.foodCostPercentage}
              margin={analysis.margin}
              salesMix={salesMixPercentage}
              unitsSold={unitsSold}
            />
          </div>
        </div>
      </CardContent>
    </TouchOptimizedCard>
  );
};

export default MobileFoodCostCard;
