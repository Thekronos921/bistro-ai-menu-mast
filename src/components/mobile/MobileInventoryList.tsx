
import React, { useState } from 'react';
import { Search, Filter, ScanLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MobileInventoryCard from './MobileInventoryCard';
import QuickStockUpdateModal from './QuickStockUpdateModal';
import BarcodeScannerModal from './BarcodeScannerModal';
import { StockStatus } from '../StockStatusBadge';

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

interface MobileInventoryListProps {
  ingredients: Ingredient[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  getStockStatus: (currentStock: number, minThreshold: number) => StockStatus;
  getExpiryStatus: (expiryDate: string) => string | null;
}

const MobileInventoryList: React.FC<MobileInventoryListProps> = ({
  ingredients,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
  onRefresh,
  getStockStatus,
  getExpiryStatus
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'expired'>('all');

  const handleQuickStockUpdate = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setShowStockModal(true);
  };

  const handleScanBarcode = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setShowBarcodeModal(true);
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    // Filtro di ricerca
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro per status
    if (filterStatus === 'low') {
      const status = getStockStatus(ingredient.current_stock, ingredient.min_stock_threshold);
      return status === 'critical' || status === 'low';
    }
    
    if (filterStatus === 'expired') {
      const expiryStatus = getExpiryStatus(ingredient.expiry_date);
      return expiryStatus === 'expired' || expiryStatus === 'expiring';
    }

    return true;
  });

  const lowStockCount = ingredients.filter(ing => {
    const status = getStockStatus(ing.current_stock, ing.min_stock_threshold);
    return status === 'critical' || status === 'low';
  }).length;

  const expiredCount = ingredients.filter(ing => {
    const expiryStatus = getExpiryStatus(ing.expiry_date);
    return expiryStatus === 'expired' || expiryStatus === 'expiring';
  }).length;

  return (
    <div className="space-y-4">
      {/* Search e filtri */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Cerca ingredienti..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className="whitespace-nowrap"
          >
            Tutti ({ingredients.length})
          </Button>
          
          {lowStockCount > 0 && (
            <Button
              variant={filterStatus === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('low')}
              className="whitespace-nowrap"
            >
              Scorte basse ({lowStockCount})
            </Button>
          )}
          
          {expiredCount > 0 && (
            <Button
              variant={filterStatus === 'expired' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('expired')}
              className="whitespace-nowrap"
            >
              In scadenza ({expiredCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap ml-auto"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtri
          </Button>
        </div>

        {/* Filtri avanzati (collassabile) */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Filtri avanzati</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <ScanLine className="w-4 h-4 mr-1" />
                Con barcode
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                Senza barcode
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lista ingredienti */}
      <div className="space-y-3">
        {filteredIngredients.length > 0 ? (
          filteredIngredients.map((ingredient) => (
            <MobileInventoryCard
              key={ingredient.id}
              ingredient={ingredient}
              onEdit={onEdit}
              onDelete={onDelete}
              onQuickStockUpdate={handleQuickStockUpdate}
              onScanBarcode={handleScanBarcode}
              getStockStatus={getStockStatus}
              getExpiryStatus={getExpiryStatus}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun ingrediente trovato</p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSearchChange('')}
                className="mt-2"
              >
                Rimuovi filtri
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modali */}
      <QuickStockUpdateModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        ingredient={selectedIngredient}
        onStockUpdated={onRefresh}
      />

      <BarcodeScannerModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        ingredient={selectedIngredient}
      />
    </div>
  );
};

export default MobileInventoryList;
