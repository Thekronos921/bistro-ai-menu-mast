
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLabels } from '@/hooks/useLabels';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';

interface DefrostedLabelFormProps {
  onClose: () => void;
}

const DefrostedLabelForm = ({ onClose }: DefrostedLabelFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    ingredient_id: '',
    quantity: '',
    batch_number: '',
    production_date: '',
    expiry_date: '',
    storage_location_id: '',
    storage_instructions: '',
    notes: ''
  });

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  
  const { saveLabel, loading } = useLabels();
  const { storageLocations } = useStorageLocations();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      fetchIngredients();
    }
  }, [restaurantId]);

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleIngredientChange = (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    setSelectedIngredient(ingredient);
    setFormData(prev => ({
      ...prev,
      ingredient_id: ingredientId,
      title: ingredient ? `${ingredient.name} - Decongelato` : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ingredient_id || !formData.quantity) {
      return;
    }

    try {
      await saveLabel({
        label_type: 'defrosted',
        title: formData.title,
        ingredient_id: formData.ingredient_id,
        quantity: parseFloat(formData.quantity),
        unit: selectedIngredient?.unit,
        batch_number: formData.batch_number,
        production_date: formData.production_date || undefined,
        expiry_date: formData.expiry_date || undefined,
        storage_location_id: formData.storage_location_id || undefined,
        storage_instructions: formData.storage_instructions,
        notes: formData.notes
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving defrosted label:', error);
    }
  };

  const availableStock = selectedIngredient 
    ? (selectedIngredient.current_stock || 0) - (selectedIngredient.allocated_stock || 0)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etichetta Prodotto Decongelato</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ingredient">Ingrediente</Label>
            <Select onValueChange={handleIngredientChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona ingrediente" />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((ingredient) => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.unit}) - Disp: {(ingredient.current_stock || 0) - (ingredient.allocated_stock || 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIngredient && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>Stock totale:</strong> {selectedIngredient.current_stock || 0} {selectedIngredient.unit}
              </p>
              <p className="text-sm">
                <strong>Stock allocato:</strong> {selectedIngredient.allocated_stock || 0} {selectedIngredient.unit}
              </p>
              <p className="text-sm">
                <strong>Stock disponibile:</strong> {availableStock} {selectedIngredient.unit}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="quantity">Quantità da congelare</Label>
            <Input
              id="quantity"
              type="number"
              step="0.001"
              max={availableStock}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder={selectedIngredient ? `Max: ${availableStock}` : "Quantità"}
              required
            />
          </div>

          <div>
            <Label htmlFor="storage_location">Posizione</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, storage_location_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona frigorifero/congelatore" />
              </SelectTrigger>
              <SelectContent>
                {storageLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} ({location.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="batch_number">Numero Lotto</Label>
            <Input
              id="batch_number"
              value={formData.batch_number}
              onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
              placeholder="Numero lotto (opzionale)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="production_date">Data Produzione</Label>
              <Input
                id="production_date"
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData(prev => ({ ...prev, production_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Data Scadenza</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="storage_instructions">Istruzioni Conservazione</Label>
            <Textarea
              id="storage_instructions"
              value={formData.storage_instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, storage_instructions: e.target.value }))}
              placeholder="Temperature, condizioni particolari..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Note aggiuntive..."
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Genera Etichetta'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DefrostedLabelForm;
