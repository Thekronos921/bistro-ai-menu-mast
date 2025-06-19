
import React from 'react';
import { Edit, Trash2, ExternalLink, Calendar, Package2, Plus, Minus, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StockStatusBadge, { StockStatus } from '../StockStatusBadge';
import TouchOptimizedCard from './TouchOptimizedCard';
import { cn } from '@/lib/utils';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  yield_percentage: number;
  effective_cost_per_unit: number;
  supplier: string;
  supplier_product_code: string;
  current_stock: number;
  allocated_stock: number;
  labeled_stock: number;
  min_stock_threshold: number;
  par_level: number;
  category: string;
  external_id: string;
  notes: string;
  last_synced_at: string;
  restaurant_id: string;
  batch_number: string;
  expiry_date: string;
  storage_instructions: string;
  origin_certification: string;
}

interface MobileInventoryCardProps {
  ingredient: Ingredient;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
  onQuickStockUpdate: (ingredient: Ingredient) => void;
  onScanBarcode: (ingredient: Ingredient) => void;
  getStockStatus: (currentStock: number, minThreshold: number) => StockStatus;
  getExpiryStatus: (expiryDate: string) => string | null;
}

const MobileInventoryCard: React.FC<MobileInventoryCardProps> = ({
  ingredient,
  onEdit,
  onDelete,
  onQuickStockUpdate,
  onScanBarcode,
  getStockStatus,
  getExpiryStatus
}) => {
  const stockStatus = getStockStatus(ingredient.current_stock, ingredient.min_stock_threshold);
  const expiryStatus = getExpiryStatus(ingredient.expiry_date);

  const swipeActions = {
    left: {
      icon: <Edit className="w-4 h-4" />,
      action: () => onEdit(ingredient),
      color: 'bg-blue-500'
    },
    right: {
      icon: <Trash2 className="w-4 h-4" />,
      action: () => onDelete(ingredient.id),
      color: 'bg-red-500'
    }
  };

  return (
    <TouchOptimizedCard
      className="mb-3"
      swipeActions={swipeActions}
    >
      <div className="space-y-3">
        {/* Header con nome e status */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              {ingredient.origin_certification && (
                <Badge variant="outline" className="mr-2 text-xs">
                  {ingredient.origin_certification}
                </Badge>
              )}
              <h3 className="font-semibold text-slate-800 truncate text-base">
                {ingredient.name}
              </h3>
            </div>
            {ingredient.external_id && (
              <div className="flex items-center">
                <ExternalLink className="w-3 h-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500">{ingredient.external_id}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end space-y-1 ml-2">
            <StockStatusBadge status={stockStatus} />
            {expiryStatus && expiryStatus !== 'ok' && (
              <Badge variant={expiryStatus === 'expired' ? "destructive" : "secondary"} className="text-xs">
                {expiryStatus === 'expired' ? 'Scaduto' : 'Scade presto'}
              </Badge>
            )}
          </div>
        </div>

        {/* Categoria */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {ingredient.category || 'N/A'}
          </Badge>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onQuickStockUpdate(ingredient)}
              className="h-7 px-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Stock
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onScanBarcode(ingredient)}
              className="h-7 px-2"
            >
              <QrCode className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Informazioni lotto e scadenza */}
        {(ingredient.batch_number || ingredient.expiry_date) && (
          <div className="bg-gray-50 rounded-lg p-2 space-y-1">
            {ingredient.batch_number && (
              <div className="flex items-center text-xs text-gray-600">
                <Package2 className="w-3 h-3 mr-1" />
                <span>Lotto: {ingredient.batch_number}</span>
              </div>
            )}
            {ingredient.expiry_date && (
              <div className="flex items-center text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                <span className={cn(
                  expiryStatus === 'expired' ? 'text-red-600 font-semibold' :
                  expiryStatus === 'expiring' ? 'text-orange-600 font-semibold' :
                  expiryStatus === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                )}>
                  {new Date(ingredient.expiry_date).toLocaleDateString('it-IT')}
                  {expiryStatus === 'expired' && <span className="ml-1">⚠️</span>}
                  {expiryStatus === 'expiring' && <span className="ml-1">🔔</span>}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Griglia informazioni principali */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-gray-500 block text-xs">Costo Acquisto</span>
              <span className="font-medium">€{ingredient.cost_per_unit.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Costo Effettivo</span>
              <span className="font-bold text-blue-600">€{(ingredient.effective_cost_per_unit || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500 block text-xs">Resa</span>
              <Badge variant={
                ingredient.yield_percentage < 80 ? "destructive" : 
                ingredient.yield_percentage < 90 ? "secondary" : "default"
              } className="text-xs">
                {ingredient.yield_percentage}%
              </Badge>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Unità</span>
              <span className="font-medium">{ingredient.unit}</span>
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-600 block text-xs font-medium">Scorte Totali</span>
              <span className={cn(
                "text-lg font-bold",
                ingredient.current_stock <= ingredient.min_stock_threshold && ingredient.min_stock_threshold > 0 
                  ? 'text-red-600' 
                  : 'text-slate-800'
              )}>
                {ingredient.current_stock} {ingredient.unit}
              </span>
              {ingredient.min_stock_threshold > 0 && (
                <span className="text-xs text-gray-500 block">
                  Min: {ingredient.min_stock_threshold}
                </span>
              )}
            </div>
            <div>
              <span className="text-blue-600 block text-xs font-medium">Etichettato</span>
              <span className="text-lg font-bold text-green-600">
                {ingredient.labeled_stock || 0} {ingredient.unit}
              </span>
              <span className="text-xs text-gray-500 block">
                {ingredient.current_stock > 0 
                  ? `${(((ingredient.labeled_stock || 0) / ingredient.current_stock) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Fornitore */}
        {ingredient.supplier && (
          <div className="border-t border-gray-100 pt-2">
            <div className="text-xs text-gray-500">Fornitore</div>
            <div className="text-sm text-slate-800 font-medium">{ingredient.supplier}</div>
            {ingredient.supplier_product_code && (
              <div className="text-xs text-gray-500">{ingredient.supplier_product_code}</div>
            )}
          </div>
        )}

        {/* Azioni */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(ingredient)}
            className="flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            Modifica
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(ingredient.id)}
            className="flex-1"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Elimina
          </Button>
        </div>
      </div>
    </TouchOptimizedCard>
  );
};

export default MobileInventoryCard;
