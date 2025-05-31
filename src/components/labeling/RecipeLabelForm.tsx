
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Calendar, AlertTriangle, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';
import LabelPreview from './LabelPreview';

interface RecipeForLabel {
  id: string;
  name: string;
  allergens: string | null;
  portions: number | null;
  preparation_time: number | null;
  difficulty: string | null;
  category: string | null;
  recipe_ingredients: Array<{
    ingredient: {
      name: string;
      supplier: string;
    };
  }>;
}

interface RecipeLabelFormProps {
  onClose: () => void;
}

const RecipeLabelForm = ({ onClose }: RecipeLabelFormProps) => {
  const [recipes, setRecipes] = useState<RecipeForLabel[]>([]);
  const [formData, setFormData] = useState({
    recipeId: '',
    recipeName: '',
    creationDate: new Date().toISOString().split('T')[0],
    batchNumber: '',
    expiryDate: '',
    storageInstructions: '',
    allergens: '',
    portions: '',
    preparationTime: '',
    difficulty: '',
    category: ''
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
          portions,
          preparation_time,
          difficulty,
          category,
          recipe_ingredients(
            ingredient:ingredients(name, supplier)
          )
        `)
        .eq('restaurant_id', restaurantId)
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
    return `RIC${dateStr}${randomNum}`;
  };

  const calculateExpiryDate = (creationDate: string, daysToAdd: number = 1) => {
    const date = new Date(creationDate);
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
        portions: recipe.portions?.toString() || '',
        preparationTime: recipe.preparation_time?.toString() || '',
        difficulty: recipe.difficulty || '',
        category: recipe.category || '',
        batchNumber: generateBatchNumber(),
        expiryDate: calculateExpiryDate(prev.creationDate)
      }));
    }
  };

  const generateQRData = () => {
    const recipe = recipes.find(r => r.id === formData.recipeId);
    const ingredients = recipe?.recipe_ingredients?.map(ri => ({
      name: ri.ingredient.name,
      supplier: ri.ingredient.supplier
    })) || [];

    return JSON.stringify({
      type: 'recipe',
      recipeId: formData.recipeId,
      recipeName: formData.recipeName,
      batchNumber: formData.batchNumber,
      creationDate: formData.creationDate,
      expiryDate: formData.expiryDate,
      allergens: formData.allergens,
      portions: formData.portions,
      preparationTime: formData.preparationTime,
      difficulty: formData.difficulty,
      category: formData.category,
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
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <BookOpen className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Etichetta Ricetta</h3>
        </div>
        <p className="text-orange-700 text-sm">
          Genera etichette per ricette con tracciabilità completa ingredienti e informazioni nutrizionali
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
                    {recipe.name} - {recipe.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creationDate">Data Creazione *</Label>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  id="creationDate"
                  type="date"
                  value={formData.creationDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      creationDate: newDate,
                      expiryDate: calculateExpiryDate(newDate)
                    }));
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expiryDate">Data Validità *</Label>
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
            <Label htmlFor="batchNumber">Codice Ricetta *</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
              placeholder="Es. RIC20250131001"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="portions">Porzioni</Label>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-400" />
                <Input
                  id="portions"
                  value={formData.portions}
                  onChange={(e) => setFormData(prev => ({ ...prev, portions: e.target.value }))}
                  placeholder="4"
                  readOnly
                />
              </div>
            </div>
            <div>
              <Label htmlFor="preparationTime">Tempo (min)</Label>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <Input
                  id="preparationTime"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: e.target.value }))}
                  placeholder="30"
                  readOnly
                />
              </div>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficoltà</Label>
              <Input
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                placeholder="Facile"
                readOnly
              />
            </div>
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
            <Label htmlFor="storageInstructions">Note Conservazione</Label>
            <Textarea
              id="storageInstructions"
              value={formData.storageInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, storageInstructions: e.target.value }))}
              placeholder="Es. Utilizzare ingredienti freschi, seguire HACCP"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <LabelPreview
            title={formData.recipeName || "Seleziona ricetta"}
            type="Ricetta"
            productionDate={formData.creationDate}
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

export default RecipeLabelForm;
