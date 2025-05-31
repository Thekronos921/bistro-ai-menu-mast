import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, ChefHat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useRestaurant } from '@/hooks/useRestaurant';
import { convertUnit } from '@/utils/unitConversion';
import UnitSelector from "@/components/UnitSelector";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
}

interface RecipeIngredient {
  ingredient_id: string;
  quantity: number;
  is_semilavorato: boolean;
  unit?: string; // Aggiungo l'unità di misura specifica per questo ingrediente nella ricetta
}

interface RecipeInstruction {
  step_number: number;
  instruction: string;
}

interface AddRecipeDialogProps {
  onAddRecipe: () => void;
}

const AddRecipeDialog: React.FC<AddRecipeDialogProps> = ({ onAddRecipe }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const { toast } = useToast();
  const { withRestaurantId, restaurantId } = useRestaurant();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Antipasti',
    preparationTime: 30,
    difficulty: 'Media',
    portions: 4,
    description: '',
    allergens: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    isSemilavorato: false,
    notesChef: '',
    sellingPrice: 0
  });
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipeInstructions, setRecipeInstructions] = useState<RecipeInstruction[]>([
    { step_number: 1, instruction: '' }
  ]);

  const fetchIngredients = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available for fetching ingredients");
        return;
      }

      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, unit, cost_per_unit, effective_cost_per_unit')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchIngredients();
    }
  }, [restaurantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredient_id: '', quantity: 1, is_semilavorato: false, unit: '' }]);
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    
    // Se viene selezionato un nuovo ingrediente, imposta l'unità di misura predefinita
    if (field === 'ingredient_id') {
      const selectedIngredient = ingredients.find(ing => ing.id === value);
      if (selectedIngredient) {
        updatedIngredients[index].unit = selectedIngredient.unit;
      }
    }
    
    setRecipeIngredients(updatedIngredients);
  };

  const removeIngredient = (index: number) => {
    const updatedIngredients = recipeIngredients.filter((_, i) => i !== index);
    setRecipeIngredients(updatedIngredients);
  };

  const updateIngredientUnit = (index: number, unit: string) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index].unit = unit;
    setRecipeIngredients(updatedIngredients);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index].quantity = quantity;
    setRecipeIngredients(updatedIngredients);
  };

  const addInstruction = () => {
    const newStepNumber = recipeInstructions.length > 0 ? recipeInstructions[recipeInstructions.length - 1].step_number + 1 : 1;
    setRecipeInstructions([...recipeInstructions, { step_number: newStepNumber, instruction: '' }]);
  };

  const updateInstruction = (index: number, value: string) => {
    const updatedInstructions = [...recipeInstructions];
    updatedInstructions[index] = { ...updatedInstructions[index], instruction: value };
    setRecipeInstructions(updatedInstructions);
  };

  const removeInstruction = (index: number) => {
    const updatedInstructions = recipeInstructions.filter((_, i) => i !== index);
    const renumberedInstructions = updatedInstructions.map((instruction, idx) => ({
      ...instruction,
      step_number: idx + 1,
    }));
    setRecipeInstructions(renumberedInstructions);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Antipasti',
      preparationTime: 30,
      difficulty: 'Media',
      portions: 4,
      description: '',
      allergens: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      isSemilavorato: false,
      notesChef: '',
      sellingPrice: 0
    });
    setRecipeIngredients([]);
    setRecipeInstructions([{ step_number: 1, instruction: '' }]);
  };

  const calculateTotalCostInDialog = () => {
    return recipeIngredients.reduce((total, ri) => {
      const ingredient = ingredients.find(ing => ing.id === ri.ingredient_id);
      if (ingredient) {
        const effectiveCost = ingredient.effective_cost_per_unit ?? ingredient.cost_per_unit;
        
        // Se l'unità della ricetta è diversa da quella base, converte
        let finalQuantity = ri.quantity;
        if (ri.unit && ri.unit !== ingredient.unit) {
          finalQuantity = convertUnit(ri.quantity, ri.unit, ingredient.unit);
        }
        
        return total + (effectiveCost * finalQuantity);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const recipeData = withRestaurantId({
        name: formData.name,
        category: formData.category,
        preparation_time: formData.preparationTime,
        difficulty: formData.difficulty,
        portions: formData.portions,
        description: formData.description || null,
        allergens: formData.allergens || null,
        calories: formData.calories || null,
        protein: formData.protein || null,
        carbs: formData.carbs || null,
        fat: formData.fat || null,
        is_semilavorato: formData.isSemilavorato,
        notes_chef: formData.notesChef || null,
        selling_price: formData.sellingPrice || null
      });

      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (recipeIngredients.length > 0) {
        const ingredientsData = recipeIngredients.map(ri => ({
          recipe_id: recipe.id,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          unit: ri.unit, // Aggiungo l'unità di misura
          is_semilavorato: ri.is_semilavorato
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) throw ingredientsError;
      }

      if (recipeInstructions.length > 0) {
        const instructionsData = recipeInstructions.map(inst => ({
          recipe_id: recipe.id,
          step_number: inst.step_number,
          instruction: inst.instruction
        }));

        const { error: instructionsError } = await supabase
          .from('recipe_instructions')
          .insert(instructionsData);

        if (instructionsError) throw instructionsError;
      }

      toast({
        title: "Successo",
        description: "Ricetta aggiunta con successo"
      });

      onAddRecipe();
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding recipe:', error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta della ricetta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Nuova Ricetta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Ricetta: {formData.name || 'Nuova Ricetta'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna 1: Informazioni Base */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informazioni Base</h3>
            
            <div>
              <Label htmlFor="name">Nome Ricetta</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Antipasti">Antipasti</SelectItem>
                  <SelectItem value="Primi Piatti">Primi Piatti</SelectItem>
                  <SelectItem value="Secondi Piatti">Secondi Piatti</SelectItem>
                  <SelectItem value="Dolci">Dolci</SelectItem>
                  <SelectItem value="Contorni">Contorni</SelectItem>
                  <SelectItem value="Semilavorati">Semilavorati</SelectItem>
                  <SelectItem value="Salse">Salse</SelectItem>
                  <SelectItem value="Preparazioni Base">Preparazioni Base</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="preparationTime">Tempo (min)</Label>
                <Input
                  type="number"
                  id="preparationTime"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="portions">Porzioni</Label>
                <Input
                  type="number"
                  id="portions"
                  name="portions"
                  value={formData.portions}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficoltà</Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleSelectChange('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bassa">Bassa</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrizione della ricetta..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isSemilavorato"
                checked={formData.isSemilavorato}
                onCheckedChange={(checked) => setFormData(prevData => ({ ...prevData, isSemilavorato: checked }))}
              />
              <Label htmlFor="isSemilavorato">È un semilavorato</Label>
            </div>

            <div>
              <Label htmlFor="allergens">Allergeni</Label>
              <Input
                type="text"
                id="allergens"
                name="allergens"
                value={formData.allergens}
                onChange={handleInputChange}
                placeholder="Es. Glutine, Latticini, Uova"
              />
            </div>

            <div>
              <Label htmlFor="notesChef">Note Addizionali / Consigli dello Chef</Label>
              <Textarea
                id="notesChef"
                name="notesChef"
                value={formData.notesChef}
                onChange={handleInputChange}
                placeholder="Consigli, varianti, note tecniche..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Valori Nutrizionali (per porzione)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="calories" className="text-xs">Calorie (kcal)</Label>
                  <Input
                    type="number"
                    id="calories"
                    name="calories"
                    value={formData.calories}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="protein" className="text-xs">Proteine (g)</Label>
                  <Input
                    type="number"
                    id="protein"
                    name="protein"
                    value={formData.protein}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="carbs" className="text-xs">Carboidrati (g)</Label>
                  <Input
                    type="number"
                    id="carbs"
                    name="carbs"
                    value={formData.carbs}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="fat" className="text-xs">Grassi (g)</Label>
                  <Input
                    type="number"
                    id="fat"
                    name="fat"
                    value={formData.fat}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colonna 2: Ingredienti */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Ingredienti</h3>
              <Button type="button" onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recipeIngredients.map((ingredient, index) => {
                const selectedIngredient = ingredients.find(ing => ing.id === ingredient.ingredient_id);
                let cost = 0;
                
                if (selectedIngredient) {
                  const effectiveCost = selectedIngredient.effective_cost_per_unit ?? selectedIngredient.cost_per_unit;
                  // Converti la quantità se l'unità è diversa
                  if (ingredient.unit && ingredient.unit !== selectedIngredient.unit) {
                    // Converte la quantità dall'unità della ricetta all'unità base dell'ingrediente
                    const convertedQuantity = convertUnit(ingredient.quantity, ingredient.unit, selectedIngredient.unit);
                    cost = effectiveCost * convertedQuantity;
                  } else {
                    cost = effectiveCost * ingredient.quantity;
                  }
                }
                
                return (
                  <div key={index} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ingrediente {index + 1}</span>
                      {recipeIngredients.length > 1 && (
                        <Button type="button" onClick={() => removeIngredient(index)} size="sm" variant="outline">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Select
                        value={ingredient.ingredient_id}
                        onValueChange={(value) => updateIngredient(index, 'ingredient_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona ingrediente" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map(ing => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedIngredient && !ingredient.is_semilavorato && (
                        <UnitSelector
                          baseUnit={selectedIngredient.unit}
                          selectedUnit={ingredient.unit || selectedIngredient.unit} // Usa l'unità dell'ingrediente se definita, altrimenti quella base
                          quantity={ingredient.quantity}
                          onUnitChange={(unit) => updateIngredientUnit(index, unit)}
                          onQuantityChange={(quantity) => updateIngredientQuantity(index, quantity)}
                        />
                      )}
                      {(!selectedIngredient || ingredient.is_semilavorato) && (
                        <Input
                          type="number"
                          placeholder="Quantità"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min={0}
                          step={0.01}
                        />
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`isSemilavorato-${index}`}
                        checked={ingredient.is_semilavorato}
                        onCheckedChange={(checked) => updateIngredient(index, 'is_semilavorato', checked)}
                      />
                      <Label htmlFor={`isSemilavorato-${index}`} className="text-xs">È un semilavorato</Label>
                    </div>
                    
                    {selectedIngredient && (
                      <p className="text-xs text-gray-500">
                        Costo: €{cost.toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm">Costo Totale Ricetta</h4>
              <p className="text-lg font-semibold">€{calculateTotalCostInDialog().toFixed(2)}</p>
            </div>

            <div>
              <Label htmlFor="sellingPrice">Prezzo di Vendita (€)</Label>
              <Input
                type="number"
                id="sellingPrice"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                min={0}
                step={0.01}
              />
            </div>
          </div>

          {/* Colonna 3: Istruzioni e Azioni */} 
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Istruzioni di Preparazione</h3>
              <Button type="button" onClick={addInstruction} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recipeInstructions.map((instruction, index) => (
                <div key={index} className="space-y-1 p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`instruction-${index}`} className="text-sm font-medium">Passaggio {instruction.step_number}</Label>
                    {recipeInstructions.length > 1 && (
                      <Button type="button" onClick={() => removeInstruction(index)} size="sm" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id={`instruction-${index}`}
                    value={instruction.instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Descrivi il passaggio ${instruction.step_number}...`}
                    rows={3}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Salvataggio...' : 'Salva Ricetta'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecipeDialog;
