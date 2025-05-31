
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';
import LabelPreview from './LabelPreview';

interface Recipe {
  id: string;
  name: string;
  is_semilavorato: boolean;
}

interface SemilavoratoLabelFormProps {
  onClose: () => void;
}

const SemilavoratoLabelForm = ({ onClose }: SemilavoratoLabelFormProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [formData, setFormData] = useState({
    recipeId: '',
    recipeName: '',
    productionDate: new Date().toISOString().split('T')[0],
    batchNumber: '',
    expiryDate: '',
    storageInstructions: '',
    quantity: '',
    unit: 'kg'
  });
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  useEffect(() => {
    fetchSemilavorati();
  }, [restaurantId]);

  const fetchSemilavorati = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, is_semilavorato')
        .eq('restaurant_id', restaurantId)
        .eq('is_semilavorato', true)
        .order('name');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching semilavorati:', error);
    }
  };

  const generateBatchNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SL${dateStr}${randomNum}`;
  };

  const calculateExpiryDate = (productionDate: string, daysToAdd: number = 3) => {
    const date = new Date(productionDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  };

  const handleRecipeSelect = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setFormData(prev => ({
        ...prev,
        recipeId,
        recipeName: recipe.name,
        batchNumber: generateBatchNumber(),
        expiryDate: calculateExpiryDate(prev.productionDate)
      }));
    }
  };

  const generateQRData = () => {
    return JSON.stringify({
      type: 'semilavorato',
      recipeId: formData.recipeId,
      recipeName: formData.recipeName,
      batchNumber: formData.batchNumber,
      productionDate: formData.productionDate,
      expiryDate: formData.expiryDate,
      restaurantId,
      timestamp: new Date().toISOString()
    });
  };

  const handlePrint = () => {
    if (!formData.recipeId || !formData.batchNumber) {
      toast({
        title: "Errore",
        description: "Seleziona una ricetta e compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    // Trigger print functionality
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Etichetta Semilavorato</h3>
        </div>
        <p className="text-blue-700 text-sm">
          Genera etichette per prodotti semilavorati con tracciabilità completa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipe">Semilavorato *</Label>
            <Select value={formData.recipeId} onValueChange={handleRecipeSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona semilavorato" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map(recipe => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productionDate">Data Preparazione *</Label>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  id="productionDate"
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      productionDate: newDate,
                      expiryDate: calculateExpiryDate(newDate)
                    }));
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expiryDate">Data Scadenza *</Label>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="batchNumber">Lotto Produzione *</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
              placeholder="Es. SL20250131001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantità</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unità</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="pz">pz</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="storageInstructions">Istruzioni Conservazione</Label>
            <Textarea
              id="storageInstructions"
              value={formData.storageInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, storageInstructions: e.target.value }))}
              placeholder="Es. Conservare in frigorifero a 4°C"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <LabelPreview
            title={formData.recipeName || "Seleziona semilavorato"}
            type="Semilavorato"
            productionDate={formData.productionDate}
            expiryDate={formData.expiryDate}
            batchNumber={formData.batchNumber}
            qrData={generateQRData()}
            storageInstructions={formData.storageInstructions}
            quantity={formData.quantity}
            unit={formData.unit}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button onClick={handlePrint} disabled={!formData.recipeId || !formData.batchNumber}>
          Stampa Etichetta
        </Button>
      </div>
    </div>
  );
};

export default SemilavoratoLabelForm;
