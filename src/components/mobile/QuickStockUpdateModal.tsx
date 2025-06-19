
import React, { useState } from 'react';
import { Plus, Minus, Package, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock_threshold: number;
}

interface QuickStockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  onStockUpdated: () => void;
}

const QuickStockUpdateModal: React.FC<QuickStockUpdateModalProps> = ({
  isOpen,
  onClose,
  ingredient,
  onStockUpdated
}) => {
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  if (!ingredient) return null;

  const handleQuantityChange = (value: string) => {
    // Permette solo numeri positivi con decimali
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantity(value);
    }
  };

  const getNewStock = () => {
    const qty = parseFloat(quantity) || 0;
    return operation === 'add' 
      ? ingredient.current_stock + qty
      : Math.max(0, ingredient.current_stock - qty);
  };

  const handleUpdateStock = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Errore",
        description: "Inserisci una quantità valida",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const qty = parseFloat(quantity);
      const newStock = getNewStock();
      const quantityChange = operation === 'add' ? qty : -qty;

      // Update ingredient stock
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({ current_stock: newStock })
        .eq('id', ingredient.id);

      if (updateError) throw updateError;

      // Record movement
      await supabase
        .from('inventory_movements')
        .insert({
          restaurant_id: restaurantId,
          ingredient_id: ingredient.id,
          movement_type: operation === 'add' ? 'restocked' : 'consumed',
          quantity_change: quantityChange,
          quantity_before: ingredient.current_stock,
          quantity_after: newStock,
          notes: notes || `Aggiornamento rapido: ${operation === 'add' ? 'carico' : 'scarico'} ${qty} ${ingredient.unit}`
        });

      toast({
        title: "Stock aggiornato",
        description: `${ingredient.name}: ${ingredient.current_stock} → ${newStock} ${ingredient.unit}`
      });

      onStockUpdated();
      onClose();
      setQuantity('');
      setNotes('');
      setOperation('add');
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dello stock",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const newStock = getNewStock();
  const isLowStock = newStock <= ingredient.min_stock_threshold && ingredient.min_stock_threshold > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            Aggiorna Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ingrediente info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-slate-800 mb-1">{ingredient.name}</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Stock attuale:</span>
              <span className="font-bold">
                {ingredient.current_stock} {ingredient.unit}
              </span>
            </div>
            {ingredient.min_stock_threshold > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Soglia minima:</span>
                <span>{ingredient.min_stock_threshold} {ingredient.unit}</span>
              </div>
            )}
          </div>

          {/* Tipo operazione */}
          <div className="space-y-2">
            <Label>Tipo operazione</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={operation === 'add' ? 'default' : 'outline'}
                onClick={() => setOperation('add')}
                className="justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                Carico
              </Button>
              <Button
                variant={operation === 'remove' ? 'default' : 'outline'}
                onClick={() => setOperation('remove')}
                className="justify-start"
              >
                <Minus className="w-4 h-4 mr-2" />
                Scarico
              </Button>
            </div>
          </div>

          {/* Quantità */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantità ({ingredient.unit})
            </Label>
            <Input
              id="quantity"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="text-lg text-center"
            />
          </div>

          {/* Preview nuovo stock */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-medium">Nuovo stock:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-blue-800">
                    {newStock.toFixed(2)} {ingredient.unit}
                  </span>
                  {isLowStock && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Sotto soglia
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note (opzionale)</Label>
            <Textarea
              id="notes"
              placeholder="Aggiungi una nota per questo movimento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Azioni */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              onClick={handleUpdateStock}
              className="flex-1"
              disabled={loading || !quantity || parseFloat(quantity) <= 0}
            >
              {loading ? 'Aggiornamento...' : 'Conferma'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickStockUpdateModal;
