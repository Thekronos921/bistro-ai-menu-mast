
import { Edit, Trash2, ExternalLink, Calendar, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import StockStatusBadge, { StockStatus } from "../StockStatusBadge";

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

interface IngredientsTableMobileProps {
  ingredients: Ingredient[];
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
  getStockStatus: (currentStock: number, minThreshold: number) => StockStatus;
  getExpiryStatus: (expiryDate: string) => string | null;
}

const IngredientsTableMobile = ({ 
  ingredients, 
  onEdit, 
  onDelete, 
  getStockStatus, 
  getExpiryStatus 
}: IngredientsTableMobileProps) => {
  return (
    <div className="space-y-3">
      {ingredients.map((ingredient) => {
        const stockStatus = getStockStatus(ingredient.current_stock, ingredient.min_stock_threshold);
        const expiryStatus = getExpiryStatus(ingredient.expiry_date);
        
        return (
          <Card key={ingredient.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-1">
                    {ingredient.origin_certification && (
                      <Badge variant="outline" className="mr-2 text-xs">
                        {ingredient.origin_certification}
                      </Badge>
                    )}
                    <h3 className="font-semibold text-slate-800 truncate">{ingredient.name}</h3>
                  </div>
                  {ingredient.external_id && (
                    <div className="flex items-center">
                      <ExternalLink className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500">{ingredient.external_id}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(ingredient)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(ingredient.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Category and Status */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="text-xs">
                  {ingredient.category || 'N/A'}
                </Badge>
                <div className="flex flex-col items-end space-y-1">
                  <StockStatusBadge status={stockStatus} />
                  {expiryStatus && expiryStatus !== 'ok' && (
                    <Badge variant={expiryStatus === 'expired' ? "destructive" : "secondary"} className="text-xs">
                      {expiryStatus === 'expired' ? 'Scaduto' : 'Scade presto'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Batch and Expiry */}
              {(ingredient.batch_number || ingredient.expiry_date) && (
                <div className="bg-gray-50 rounded-lg p-2 mb-3 space-y-1">
                  {ingredient.batch_number && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Package2 className="w-3 h-3 mr-1" />
                      <span>Lotto: {ingredient.batch_number}</span>
                    </div>
                  )}
                  {ingredient.expiry_date && (
                    <div className="flex items-center text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span className={
                        expiryStatus === 'expired' ? 'text-red-600 font-semibold' :
                        expiryStatus === 'expiring' ? 'text-orange-600 font-semibold' :
                        expiryStatus === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                      }>
                        {new Date(ingredient.expiry_date).toLocaleDateString('it-IT')}
                        {expiryStatus === 'expired' && <span className="ml-1">⚠️</span>}
                        {expiryStatus === 'expiring' && <span className="ml-1">🔔</span>}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Costs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">Costo Acquisto</span>
                  <span className="font-medium">€{ingredient.cost_per_unit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Resa</span>
                  <Badge variant={ingredient.yield_percentage < 80 ? "destructive" : ingredient.yield_percentage < 90 ? "secondary" : "default"} className="text-xs">
                    {ingredient.yield_percentage}%
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Costo Effettivo</span>
                  <span className="font-bold text-blue-600">€{(ingredient.effective_cost_per_unit || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Unità</span>
                  <span className="font-medium">{ingredient.unit}</span>
                </div>
              </div>

              {/* Stock Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">Scorte</span>
                  <span className={ingredient.current_stock <= ingredient.min_stock_threshold && ingredient.min_stock_threshold > 0 ? 'text-red-600 font-semibold' : 'text-slate-800 font-medium'}>
                    {ingredient.current_stock} {ingredient.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Etichettato</span>
                  <span className="font-medium">
                    {ingredient.labeled_stock || 0} {ingredient.unit}
                  </span>
                </div>
              </div>

              {/* Supplier */}
              {ingredient.supplier && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Fornitore</div>
                  <div className="text-sm text-slate-800">{ingredient.supplier}</div>
                  {ingredient.supplier_product_code && (
                    <div className="text-xs text-gray-500">{ingredient.supplier_product_code}</div>
                  )}
                </div>
              )}

              {/* Sync Status */}
              {ingredient.last_synced_at && (
                <div className="mt-2 text-xs text-green-600">
                  Sinc: {new Date(ingredient.last_synced_at).toLocaleDateString('it-IT')}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default IngredientsTableMobile;
