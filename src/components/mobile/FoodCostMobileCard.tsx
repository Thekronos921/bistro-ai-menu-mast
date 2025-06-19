
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Percent, Edit, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TouchOptimizedCard from './TouchOptimizedCard';

interface FoodCostMobileCardProps {
  dish: {
    id: string;
    name: string;
    category: string;
    selling_price: number;
    external_id?: string;
  };
  analysis: {
    foodCost: number;
    foodCostPercentage: number;
    margin: number;
    status: string;
    popularity: number;
  };
  salesData?: {
    unitsSold: number;
    revenue: number;
    salesMixPercentage: number;
  };
  onEdit?: (dish: any) => void;
  onViewDetails?: (dishId: string) => void;
  className?: string;
}

const FoodCostMobileCard: React.FC<FoodCostMobileCardProps> = ({
  dish,
  analysis,
  salesData,
  onEdit,
  onViewDetails,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critico': return 'destructive';
      case 'buono': return 'secondary';
      case 'ottimo': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critico': return <AlertTriangle className="w-4 h-4" />;
      case 'buono': return <Target className="w-4 h-4" />;
      case 'ottimo': return <TrendingUp className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTrendIcon = () => {
    if (analysis.foodCostPercentage < 25) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (analysis.foodCostPercentage > 35) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Target className="w-4 h-4 text-yellow-600" />;
  };

  const swipeActions = {
    left: {
      icon: <Edit className="w-5 h-5" />,
      action: () => onEdit?.(dish),
      color: 'bg-blue-500'
    },
    right: {
      icon: <Eye className="w-5 h-5" />,
      action: () => onViewDetails?.(dish.id),
      color: 'bg-green-500'
    }
  };

  return (
    <TouchOptimizedCard
      swipeActions={swipeActions}
      className={className}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">
              {dish.name}
            </h3>
            <p className="text-sm text-slate-500 capitalize">
              {dish.category}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <Badge variant={getStatusColor(analysis.status)}>
              {getStatusIcon(analysis.status)}
              <span className="ml-1 capitalize">{analysis.status}</span>
            </Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Food Cost Percentage */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600">Food Cost</span>
              {getTrendIcon()}
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-bold text-slate-800">
                {analysis.foodCostPercentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              €{analysis.foodCost.toFixed(2)} costo
            </p>
          </div>

          {/* Margin */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-green-600">Margine</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-bold text-green-800">
                €{analysis.margin.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-green-600">
              €{dish.selling_price.toFixed(2)} prezzo
            </p>
          </div>

          {/* Sales Data (if available) */}
          {salesData && (
            <>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-600">Vendite</span>
                  <Percent className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-bold text-blue-800">
                    {salesData.unitsSold}
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  {salesData.salesMixPercentage.toFixed(1)}% mix
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-purple-600">Ricavi</span>
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-bold text-purple-800">
                    €{salesData.revenue.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-purple-600">
                  Totale periodo
                </p>
              </div>
            </>
          )}
        </div>

        {/* Popularity Score */}
        <div className="flex items-center justify-between py-2 border-t border-slate-200">
          <span className="text-sm text-slate-600">Popolarità</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                style={{ width: `${Math.min(100, analysis.popularity)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {analysis.popularity.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(dish)}
            className="flex-1"
          >
            Modifica
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewDetails?.(dish.id)}
            className="flex-1"
          >
            Dettagli
          </Button>
        </div>
      </div>
    </TouchOptimizedCard>
  );
};

export default FoodCostMobileCard;
