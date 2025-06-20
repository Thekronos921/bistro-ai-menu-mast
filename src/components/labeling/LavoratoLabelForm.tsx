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

interface LabelRecipe {
  id: string;
  name: string;
  allergens: string;
  recipe_ingredients: {
    ingredient_id: string;
    quantity: number;
    ingredients: {
      name: string;
      supplier: string;
    };
  }[];
}

const LavoratoLabelForm = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [recipes, setRecipes] = useState<LabelRecipe[]>([]);
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const { saveLabel } = useLabels();

  useEffect(() => {
    fetchRecipes();
    setBatchNumber(`LAV-${Date.now().toString().slice(-6)}`);
  }, [restaurantId]);

  const fetchRecipes = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          allergens,
          recipe_ingredients (
            ingredient_id,
            quantity,
            ingredients (
              name,
              supplier
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_semilavorato', false);

      if (error) throw error;

      // Transform the data to properly handle the joined ingredients
      const transformedData: LabelRecipe[] = (data || []).map(recipe => {
        return {
          id: recipe.id,
          name: recipe.name,
          allergens: recipe.allergens || '',
          recipe_ingredients: (recipe.recipe_ingredients || []).map((ri: any) => {
            // Handle ingredients - can be array, object, or null
            let ingredientData = { name: '', supplier: '' };
            
            if (ri.ingredients) {
              if (Array.isArray(ri.ingredients)) {
                // If it's an array, take the first item
                ingredientData = ri.ingredients[0] || { name: '', supplier: '' };
              } else {
                // If it's an object, use it directly
                ingredientData = ri.ingredients;
              }
            }
            
            return {
              ingredient_id: ri.ingredient_id,
              quantity: ri.quantity,
              ingredients: {
                name: ingredientData.name || '',
                supplier: ingredientData.supplier || ''
              }
            };
          })
        };
      });

      setRecipes(transformedData);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle ricette",
        variant: "destructive"
      });
    }
  };

  const generateQRData = () => {
    const selectedRecipeData = recipes.find(r => r.id === selectedRecipe);
    const labelId = crypto.randomUUID();
    
    return JSON.stringify({
      id: labelId,
      type: 'lavorato',
      recipeId: selectedRecipe,
      recipeName: selectedRecipeData?.name,
      productionDate,
      expiryDate,
      batchNumber,
      quantity: parseFloat(quantity),
      allergens: selectedRecipeData?.allergens,
      restaurantId,
      timestamp: new Date().toISOString()
    });
  };

  const handleGenerateLabel = async () => {
    if (!selectedRecipe || !expiryDate || !quantity) {
      toast({
        title: "Campi obbligatori",
        description: "Seleziona una ricetta e inserisci data di scadenza e quantità",
        variant: "destructive"
      });
      return;
    }

    const selectedRecipeData = recipes.find(r => r.id === selectedRecipe);
    if (!selectedRecipeData) return;

    try {
      await saveLabel({
        label_type: 'lavorato',
        title: selectedRecipeData.name,
        batch_number: batchNumber,
        production_date: productionDate,
        expiry_date: expiryDate,
        quantity: parseFloat(quantity),
        unit: 'porzioni',
        storage_instructions: additionalNotes,
        allergens: selectedRecipeData.allergens,
        recipe_id: selectedRecipe,
        ingredient_traceability: selectedRecipeData.recipe_ingredients.map(ri => ({
          ingredient_id: ri.ingredient_id,
          name: ri.ingredients.name,
          supplier: ri.ingredients.supplier,
          quantity: ri.quantity
        }))
      });

      toast({
        title: "Etichetta creata",
        description: "L'etichetta è stata generata e salvata nel sistema di tracciabilità"
      });
    } catch (error) {
      console.error('Error saving label:', error);
    }
  };

  const handlePrint = () => {
    if (!selectedRecipe) {
      toast({
        title: "Errore",
        description: "Seleziona una ricetta prima di stampare",
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

  const selectedRecipeData = recipes.find(r => r.id === selectedRecipe);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipe">Ricetta</Label>
            <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una ricetta..." />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
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
              placeholder="LAV-123456"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantità (porzioni)</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Es. 4"
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
            title={selectedRecipeData?.name || "Seleziona ricetta"}
            type="Lavorato"
            productionDate={productionDate}
            expiryDate={expiryDate}
            batchNumber={batchNumber}
            qrData={generateQRData()}
            storageInstructions={additionalNotes}
            allergens={selectedRecipeData?.allergens}
            quantity={parseFloat(quantity) || undefined}
            unit="porzioni"
          />
        </div>
      </div>
    </div>
  );
};

export default LavoratoLabelForm;
