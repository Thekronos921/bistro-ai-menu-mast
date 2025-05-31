
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import LabelPreview from './LabelPreview';

interface RecipeForLabel {
  id: string;
  name: string;
  allergens: string;
  portions: number;
  preparation_time: number;
  difficulty: string;
  category: string;
  recipe_ingredients: {
    ingredient_id: string;
    quantity: number;
    ingredients: {
      name: string;
      supplier: string;
    };
  }[];
}

const RecipeLabelForm = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [recipes, setRecipes] = useState<RecipeForLabel[]>([]);
  const [preparedBy, setPreparedBy] = useState<string>('');
  const [preparationDate, setPreparationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    fetchRecipes();
    // Generate automatic batch number
    setBatchNumber(`RIC-${Date.now().toString().slice(-6)}`);
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
          portions,
          preparation_time,
          difficulty,
          category,
          recipe_ingredients (
            ingredient_id,
            quantity,
            ingredients (
              name,
              supplier
            )
          )
        `)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      // Transform the data to properly handle the joined ingredients
      const transformedData: RecipeForLabel[] = (data || []).map(recipe => {
        return {
          id: recipe.id,
          name: recipe.name,
          allergens: recipe.allergens || '',
          portions: recipe.portions,
          preparation_time: recipe.preparation_time,
          difficulty: recipe.difficulty,
          category: recipe.category,
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
    return JSON.stringify({
      type: 'recipe',
      recipeId: selectedRecipe,
      recipeName: selectedRecipeData?.name,
      preparationDate,
      preparedBy,
      batchNumber,
      category: selectedRecipeData?.category,
      portions: selectedRecipeData?.portions,
      allergens: selectedRecipeData?.allergens,
      restaurantId,
      timestamp: new Date().toISOString()
    });
  };

  const generateStorageInstructions = () => {
    const notes = [];
    if (preparedBy) notes.push(`Preparato da: ${preparedBy}`);
    if (additionalNotes) notes.push(additionalNotes);
    return notes.join(' | ');
  };

  const handleGenerateLabel = () => {
    if (!selectedRecipe) {
      toast({
        title: "Campo obbligatorio",
        description: "Seleziona una ricetta",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Etichetta generata",
      description: "L'etichetta è pronta per la stampa"
    });
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
                    {recipe.name} - {recipe.category}
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
              placeholder="RIC-123456"
            />
          </div>

          <div>
            <Label htmlFor="preparedBy">Preparato da</Label>
            <Input
              id="preparedBy"
              placeholder="Nome del cuoco..."
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="preparationDate">Data di Preparazione</Label>
            <Input
              id="preparationDate"
              type="date"
              value={preparationDate}
              onChange={(e) => setPreparationDate(e.target.value)}
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
            <Button onClick={handleGenerateLabel} className="flex-1">
              Genera Etichetta
            </Button>
            <Button onClick={handlePrint} variant="outline">
              Stampa
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <LabelPreview
            title={selectedRecipeData?.name || "Seleziona ricetta"}
            type="Ricetta"
            productionDate={preparationDate}
            expiryDate=""
            batchNumber={batchNumber}
            qrData={generateQRData()}
            storageInstructions={generateStorageInstructions()}
            allergens={selectedRecipeData?.allergens}
            portions={selectedRecipeData?.portions.toString()}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeLabelForm;
