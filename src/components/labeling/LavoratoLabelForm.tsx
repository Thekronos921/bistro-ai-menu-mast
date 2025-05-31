import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChefHat, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';
import LabelPreview from './LabelPreview';

interface LabelRecipe {
  id: string;
  name: string;
  allergens: string;
  recipe_ingredients: Array<{
    ingredients: {
      name: string;
      supplier: string;
    };
  }>;
}

interface LavoratoLabelFormProps {
  onClose: () => void;
}

const LavoratoLabelForm = ({ onClose }: LavoratoLabelFormProps) => {
  const [recipes, setRecipes] = useState<LabelRecipe[]>([]);
  const [formData, setFormData] = useState({
    recipeId: '',
    recipeName: '',
    preparationDate: new Date().toISOString().split('T')[0],
    batchNumber: '',
    expiryDate: '',
    storageInstructions: '',
    allergens: '',
    portions: ''
  });
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

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
          recipe_ingredients(
            ingredients(name, supplier)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_semilavorato', false)
        .order('name');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const generateBatchNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LAV${dateStr}${randomNum}`;
  };

  const calculateExpiryDate = (preparationDate: string, daysToAdd: number = 2) => {
    const date = new Date(preparationDate);
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
        allergens: recipe.allergens || '',
        batchNumber: generateBatchNumber(),
        expiryDate: calculateExpiryDate(prev.preparationDate)
      }));
    }
  };

  const generateQRData = () => {
    const recipe = recipes.find(r => r.id === formData.recipeId);
    const ingredients = recipe?.recipe_ingredients?.map(ri => ({
      name: ri.ingredients.name,
      supplier: ri.ingredients.supplier
    })) || [];

    return JSON.stringify({
      type: 'lavorato',
      recipeId: formData.recipeId,
      recipeName: formData.recipeName,
      batchNumber: formData.batchNumber,
      preparationDate: formData.preparationDate,
      expiryDate: formData.expiryDate,
      allergens: formData.allergens,
      ingredients,
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

    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <ChefHat className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Etichetta Lavorato</h3>
        </div>
        <p className="text-green-700 text-sm">
          Genera etichette per preparazioni finite con ingredienti e allergeni
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipe">Ricetta *</Label>
            <Select value={formData.recipeId} onValueChange={handleRecipeSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona ricetta" />
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
              <Label htmlFor="preparationDate">Data Preparazione *</Label>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  id="preparationDate"
                  type="date"
                  value={formData.preparationDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      preparationDate: newDate,
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
              placeholder="Es. LAV20250131001"
            />
          </div>

          <div>
            <Label htmlFor="portions">Porzioni</Label>
            <Input
              id="portions"
              type="number"
              value={formData.portions}
              onChange={(e) => setFormData(prev => ({ ...prev, portions: e.target.value }))}
              placeholder="Es. 4"
            />
          </div>

          <div>
            <Label htmlFor="allergens">Allergeni</Label>
            <Textarea
              id="allergens"
              value={formData.allergens}
              onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
              placeholder="Es. Glutine, Latticini, Pesce"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="storageInstructions">Modalità Conservazione</Label>
            <Textarea
              id="storageInstructions"
              value={formData.storageInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, storageInstructions: e.target.value }))}
              placeholder="Es. Conservare in frigorifero e consumare entro 2 giorni"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <LabelPreview
            title={formData.recipeName || "Seleziona ricetta"}
            type="Lavorato"
            productionDate={formData.preparationDate}
            expiryDate={formData.expiryDate}
            batchNumber={formData.batchNumber}
            qrData={generateQRData()}
            storageInstructions={formData.storageInstructions}
            allergens={formData.allergens}
            portions={formData.portions}
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

export default LavoratoLabelForm;
