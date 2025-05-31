import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Snowflake, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';
import LabelPreview from './LabelPreview';

interface Ingredient {
  id: string;
  name: string;
  supplier: string;
  batch_number: string;
}

interface DefrostedLabelFormProps {
  onClose: () => void;
}

const DefrostedLabelForm = ({ onClose }: DefrostedLabelFormProps) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [formData, setFormData] = useState({
    ingredientId: '',
    ingredientName: '',
    defrostDate: new Date().toISOString().split('T')[0],
    useByDate: '',
    originalBatch: '',
    supplier: '',
    quantity: '',
    unit: 'kg',
    storageInstructions: 'Conservare in frigorifero e utilizzare entro 24 ore'
  });
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  useEffect(() => {
    fetchIngredients();
  }, [restaurantId]);

  const fetchIngredients = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, supplier, batch_number')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const calculateUseByDate = (defrostDate: string, hoursToAdd: number = 24) => {
    const date = new Date(defrostDate);
    date.setHours(date.getHours() + hoursToAdd);
    return date.toISOString().split('T')[0];
  };

  const handleIngredientSelect = (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (ingredient) {
      setFormData(prev => ({
        ...prev,
        ingredientId,
        ingredientName: ingredient.name,
        supplier: ingredient.supplier || '',
        originalBatch: ingredient.batch_number || '',
        useByDate: calculateUseByDate(prev.defrostDate)
      }));
    }
  };

  const generateQRData = () => {
    return JSON.stringify({
      type: 'defrosted',
      ingredientId: formData.ingredientId,
      ingredientName: formData.ingredientName,
      defrostDate: formData.defrostDate,
      useByDate: formData.useByDate,
      originalBatch: formData.originalBatch,
      supplier: formData.supplier,
      restaurantId,
      timestamp: new Date().toISOString()
    });
  };

  const handlePrint = () => {
    if (!formData.ingredientId || !formData.defrostDate) {
      toast({
        title: "Errore",
        description: "Seleziona un ingrediente e compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    // Crea un nuovo stile CSS specifico per la stampa
    const printStyles = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 8cm;
          height: 6cm;
        }
        @page {
          size: 8cm 6cm;
          margin: 0;
        }
      }
    `;

    // Aggiunge gli stili alla head
    const styleSheet = document.createElement('style');
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    // Aggiunge la classe per la stampa all'anteprima
    const labelPreview = document.querySelector('[data-label-preview]');
    if (labelPreview) {
      labelPreview.classList.add('print-content');
    }

    window.print();

    // Rimuove gli stili e la classe dopo la stampa
    setTimeout(() => {
      document.head.removeChild(styleSheet);
      if (labelPreview) {
        labelPreview.classList.remove('print-content');
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-cyan-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Snowflake className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold text-cyan-800">Etichetta Prodotto Decongelato</h3>
        </div>
        <p className="text-cyan-700 text-sm">
          Genera etichette per prodotti decongelati con tracciabilità lotto originario
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="ingredient">Ingrediente *</Label>
            <Select value={formData.ingredientId} onValueChange={handleIngredientSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona ingrediente" />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map(ingredient => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} {ingredient.supplier ? `- ${ingredient.supplier}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defrostDate">Data Decongelamento *</Label>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  id="defrostDate"
                  type="date"
                  value={formData.defrostDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      defrostDate: newDate,
                      useByDate: calculateUseByDate(newDate)
                    }));
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="useByDate">Data Limite Utilizzo *</Label>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <Input
                  id="useByDate"
                  type="date"
                  value={formData.useByDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, useByDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="originalBatch">Lotto Originale</Label>
            <Input
              id="originalBatch"
              value={formData.originalBatch}
              onChange={(e) => setFormData(prev => ({ ...prev, originalBatch: e.target.value }))}
              placeholder="Lotto del prodotto originale"
            />
          </div>

          <div>
            <Label htmlFor="supplier">Fornitore</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              placeholder="Nome fornitore"
              readOnly
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
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <LabelPreview
            title={formData.ingredientName || "Seleziona ingrediente"}
            type="Decongelato"
            productionDate={formData.defrostDate}
            expiryDate={formData.useByDate}
            batchNumber={formData.originalBatch}
            qrData={generateQRData()}
            storageInstructions={formData.storageInstructions}
            quantity={formData.quantity}
            unit={formData.unit}
            supplier={formData.supplier}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button onClick={handlePrint} disabled={!formData.ingredientId || !formData.defrostDate}>
          Stampa Etichetta
        </Button>
      </div>
    </div>
  );
};

export default DefrostedLabelForm;
