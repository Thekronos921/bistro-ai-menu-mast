import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';

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

// Raw data type from Supabase
interface RawRecipeData {
  id: string;
  name: string;
  allergens: string | null;
  recipe_ingredients: {
    ingredient_id: string;
    quantity: number;
    ingredients: {
      name: string;
      supplier: string;
    } | {
      name: string;
      supplier: string;
    }[];
  }[];
}

const LavoratoLabelForm = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [recipes, setRecipes] = useState<LabelRecipe[]>([]);
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    fetchRecipes();
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
      const transformedData: LabelRecipe[] = (data as RawRecipeData[] || []).map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        allergens: recipe.allergens || '',
        recipe_ingredients: (recipe.recipe_ingredients || []).map(ri => {
          // Handle both array and object cases for ingredients
          const ingredientData = Array.isArray(ri.ingredients) 
            ? ri.ingredients[0] 
            : ri.ingredients;
          
          return {
            ingredient_id: ri.ingredient_id,
            quantity: ri.quantity,
            ingredients: {
              name: ingredientData?.name || '',
              supplier: ingredientData?.supplier || ''
            }
          };
        })
      }));

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

  const handleGenerateLabel = () => {
    if (!selectedRecipe || !expiryDate) {
      toast({
        title: "Campi obbligatori",
        description: "Seleziona una ricetta e inserisci la data di scadenza",
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

    window.print();
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
            <Button onClick={handleGenerateLabel} className="flex-1">
              Genera Etichetta
            </Button>
            <Button onClick={handlePrint} variant="outline">
              Stampa
            </Button>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white" data-label-preview>
          <div className="text-center space-y-2">
            <h3 className="font-bold text-lg">PRODOTTO LAVORATO</h3>
            {selectedRecipeData && (
              <>
                <p className="font-semibold">{selectedRecipeData.name}</p>
                <div className="text-sm space-y-1">
                  <p><strong>Prodotto il:</strong> {productionDate}</p>
                  <p><strong>Scade il:</strong> {expiryDate}</p>
                  {selectedRecipeData.allergens && (
                    <p><strong>Allergeni:</strong> {selectedRecipeData.allergens}</p>
                  )}
                  {additionalNotes && (
                    <p><strong>Note:</strong> {additionalNotes}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LavoratoLabelForm;
