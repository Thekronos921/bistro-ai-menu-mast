import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useLabels } from '@/hooks/useLabels';
import TrackedLabelPreview from './TrackedLabelPreview';

interface Ingredient {
  id: string;
  name: string;
  supplier: string;
  cost_per_unit: number;
  unit: string;
}

interface IngredientLabelFormProps {
  onClose: () => void;
}

const IngredientLabelForm = ({ onClose }: IngredientLabelFormProps) => {
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [storageInstructions, setStorageInstructions] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const { saveLabel } = useLabels();

  useEffect(() => {
    fetchIngredients();
    setBatchNumber(`ING-${Date.now().toString().slice(-6)}`);
  }, [restaurantId]);

  const fetchIngredients = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, supplier, cost_per_unit, unit')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento degli ingredienti",
        variant: "destructive"
      });
    }
  };

  const generateQRData = () => {
    const selectedIngredientData = ingredients.find(i => i.id === selectedIngredient);
    const labelId = crypto.randomUUID();
    
    return JSON.stringify({
      id: labelId,
      type: 'ingredient',
      ingredientId: selectedIngredient,
      ingredientName: selectedIngredientData?.name,
      productionDate,
      expiryDate,
      batchNumber,
      quantity: parseFloat(quantity),
      unit: selectedIngredientData?.unit,
      restaurantId,
      timestamp: new Date().toISOString()
    });
  };

  const handleGenerateLabel = async () => {
    if (!selectedIngredient || !expiryDate || !quantity) {
      toast({
        title: "Campi obbligatori",
        description: "Seleziona un ingrediente e inserisci data di scadenza e quantità",
        variant: "destructive"
      });
      return;
    }

    const selectedIngredientData = ingredients.find(i => i.id === selectedIngredient);
    if (!selectedIngredientData) return;

    try {
      await saveLabel({
        label_type: 'ingredient',
        title: selectedIngredientData.name,
        batch_number: batchNumber,
        production_date: productionDate,
        expiry_date: expiryDate,
        quantity: parseFloat(quantity),
        unit: selectedIngredientData.unit,
        storage_instructions: storageInstructions,
        notes: additionalNotes,
        ingredient_id: selectedIngredient,
        supplier: selectedIngredientData.supplier,
        ingredient_traceability: [{
          ingredient_id: selectedIngredient,
          name: selectedIngredientData.name,
          supplier: selectedIngredientData.supplier,
          quantity: parseFloat(quantity),
          unit: selectedIngredientData.unit
        }]
      });

      toast({
        title: "Etichetta creata",
        description: "L'etichetta è stata generata e salvata nel sistema di tracciabilità"
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving label:', error);
    }
  };

  const handlePrint = () => {
    if (!selectedIngredient) {
      toast({
        title: "Errore",
        description: "Seleziona un ingrediente prima di stampare",
        variant: "destructive"
      });
      return;
    }

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

    const styleSheet = document.createElement('style');
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    const labelPreview = document.querySelector('[data-label-preview]');
    if (labelPreview) {
      labelPreview.classList.add('print-content');
    }

    window.print();

    setTimeout(() => {
      document.head.removeChild(styleSheet);
      if (labelPreview) {
        labelPreview.classList.remove('print-content');
      }
    }, 1000);
  };

  const selectedIngredientData = ingredients.find(i => i.id === selectedIngredient);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="ingredient">Ingrediente</Label>
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un ingrediente..." />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((ingredient) => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} - {ingredient.supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="batchNumber">Numero Lotto</Label>
            <Input
              id="batchNumber"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="ING-123456"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantità</Label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Es. 2.5"
            />
          </div>

          <div>
            <Label htmlFor="productionDate">Data di Produzione</Label>
            <Input
              id="productionDate"
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Data di Scadenza</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="storageInstructions">Istruzioni di Conservazione</Label>
            <Textarea
              id="storageInstructions"
              placeholder="Es. Conservare in frigorifero a 4°C"
              value={storageInstructions}
              onChange={(e) => setStorageInstructions(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="additionalNotes">Note Aggiuntive</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Note aggiuntive..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleGenerateLabel} className="flex-1" disabled={loading}>
              Genera e Salva Etichetta
            </Button>
            <Button onClick={handlePrint} variant="outline">
              Stampa
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <TrackedLabelPreview
            title={selectedIngredientData?.name || "Seleziona ingrediente"}
            type="Ingrediente"
            productionDate={productionDate}
            expiryDate={expiryDate}
            batchNumber={batchNumber}
            qrData={generateQRData()}
            storageInstructions={storageInstructions}
            quantity={parseFloat(quantity) || undefined}
            unit={selectedIngredientData?.unit}
            supplier={selectedIngredientData?.supplier}
          />
        </div>
      </div>
    </div>
  );
};

export default IngredientLabelForm;