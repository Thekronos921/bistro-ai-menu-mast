
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

const RecipeLabelForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    recipe_id: '',
    portions: '',
    batch_number: '',
    production_date: '',
    expiry_date: '',
    storage_location_id: '',
    storage_instructions: '',
    notes: ''
  });

  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [ingredientsAvailable, setIngredientsAvailable] = useState(true);
  
  const { saveLabel, loading } = useLabels();
  const { storageLocations } = useStorageLocations();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      fetchRecipes();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (selectedRecipe && formData.portions) {
      checkIngredientAvailability();
    }
  }, [selectedRecipe, formData.portions]);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const fetchRecipeIngredients = async (recipeId: string) => {
    try {
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .select(`
          quantity,
          ingredients!inner(id, name, unit, current_stock, allocated_stock)
        `)
        .eq('recipe_id', recipeId);

      if (error) throw error;
      setRecipeIngredients(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching recipe ingredients:', error);
      return [];
    }
  };

  const handleRecipeChange = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    setSelectedRecipe(recipe);
    setFormData(prev => ({
      ...prev,
      recipe_id: recipeId,
      title: recipe ? `${recipe.name} - Preparato` : '',
      portions: recipe ? recipe.portions.toString() : ''
    }));

    if (recipe) {
      await fetchRecipeIngredients(recipeId);
    }
  };

  const checkIngredientAvailability = () => {
    const portions = parseInt(formData.portions) || 0;
    let allAvailable = true;

    for (const ri of recipeIngredients) {
      const ingredient = ri.ingredients as any;
      const neededQuantity = ri.quantity * portions;
      const availableStock = (ingredient.current_stock || 0) - (ingredient.allocated_stock || 0);
      
      if (availableStock < neededQuantity) {
        allAvailable = false;
        break;
      }
    }

    setIngredientsAvailable(allAvailable);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipe_id || !formData.portions || !ingredientsAvailable) {
      return;
    }

    try {
      await saveLabel({
        label_type: 'recipe',
        title: formData.title,
        recipe_id: formData.recipe_id,
        portions: parseInt(formData.portions),
        batch_number: formData.batch_number,
        production_date: formData.production_date || undefined,
        expiry_date: formData.expiry_date || undefined,
        storage_location_id: formData.storage_location_id || undefined,
        storage_instructions: formData.storage_instructions,
        notes: formData.notes
      });
      
      // Reset form
      setFormData({
        title: '',
        recipe_id: '',
        portions: '',
        batch_number: '',
        production_date: '',
        expiry_date: '',
        storage_location_id: '',
        storage_instructions: '',
        notes: ''
      });
      setSelectedRecipe(null);
      setRecipeIngredients([]);
    } catch (error) {
      console.error('Error saving recipe label:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etichetta Ricetta Preparata</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="recipe">Ricetta</Label>
            <Select onValueChange={handleRecipeChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona ricetta" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name} (Porzioni base: {recipe.portions})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="portions">Numero Porzioni</Label>
            <Input
              id="portions"
              type="number"
              min="1"
              value={formData.portions}
              onChange={(e) => setFormData(prev => ({ ...prev, portions: e.target.value }))}
              placeholder="Numero porzioni da preparare"
              required
            />
          </div>

          {recipeIngredients.length > 0 && formData.portions && (
            <div className={`p-4 rounded-lg ${ingredientsAvailable ? 'bg-green-50' : 'bg-red-50'}`}>
              <h4 className="font-medium mb-2">Ingredienti necessari:</h4>
              {recipeIngredients.map((ri, index) => {
                const ingredient = ri.ingredients as any;
                const neededQuantity = ri.quantity * parseInt(formData.portions);
                const availableStock = (ingredient.current_stock || 0) - (ingredient.allocated_stock || 0);
                const sufficient = availableStock >= neededQuantity;

                return (
                  <div key={index} className={`text-sm ${sufficient ? 'text-green-700' : 'text-red-700'}`}>
                    {ingredient.name}: {neededQuantity} {ingredient.unit} 
                    (disponibile: {availableStock}) {sufficient ? '✓' : '✗'}
                  </div>
                );
              })}
              {!ingredientsAvailable && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  Ingredienti insufficienti per preparare questa ricetta
                </p>
              )}
            </div>
          )}

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
              <Label htmlFor="production_date">Data Preparazione</Label>
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
            <Button 
              type="submit" 
              disabled={loading || !ingredientsAvailable} 
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Genera Etichetta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecipeLabelForm;
