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

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface RecipeIngredient {
  ingredient_id: string;
  quantity: number;
  is_semilavorato: boolean;
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
  const { withRestaurantId } = useRestaurant();

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
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, unit, cost_per_unit')
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: checked
    }));
  };

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredient_id: '', quantity: 1, is_semilavorato: false }]);
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setRecipeIngredients(updatedIngredients);
  };

  const removeIngredient = (index: number) => {
    const updatedIngredients = recipeIngredients.filter((_, i) => i !== index);
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
    // Renumber the steps to maintain continuity
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
          Aggiungi Ricetta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuova Ricetta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
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
              <Select onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona una categoria" value={formData.category} />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="difficulty">Difficoltà</Label>
              <Select onValueChange={(value) => handleSelectChange('difficulty', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona..." value={formData.difficulty} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bassa">Bassa</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="calories">Calorie</Label>
              <Input
                type="number"
                id="calories"
                name="calories"
                value={formData.calories}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="protein">Proteine (g)</Label>
              <Input
                type="number"
                id="protein"
                name="protein"
                value={formData.protein}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="fat">Grassi (g)</Label>
              <Input
                type="number"
                id="fat"
                name="fat"
                value={formData.fat}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="carbs">Carboidrati (g)</Label>
              <Input
                type="number"
                id="carbs"
                name="carbs"
                value={formData.carbs}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="sellingPrice">Prezzo Vendita (€)</Label>
              <Input
                type="number"
                id="sellingPrice"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="isSemilavorato" className="flex items-center space-x-2">
                <span>Semilavorato</span>
                <Switch
                  id="isSemilavorato"
                  name="isSemilavorato"
                  checked={formData.isSemilavorato}
                  onCheckedChange={(checked) => setFormData(prevData => ({ ...prevData, isSemilavorato: checked }))}
                />
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="allergens">Allergeni</Label>
            <Input
              type="text"
              id="allergens"
              name="allergens"
              value={formData.allergens}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="notesChef">Note Chef</Label>
            <Textarea
              id="notesChef"
              name="notesChef"
              value={formData.notesChef}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label>Ingredienti</Label>
            {recipeIngredients.map((ingredient, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <Select onValueChange={(value) => updateIngredient(index, 'ingredient_id', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona ingrediente" value={ingredient.ingredient_id} />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map(ing => (
                      <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Quantità"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                  className="w-24"
                />
                <Label htmlFor={`isSemilavorato-${index}`} className="flex items-center space-x-2">
                  <Switch
                    id={`isSemilavorato-${index}`}
                    checked={ingredient.is_semilavorato}
                    onCheckedChange={(checked) => updateIngredient(index, 'is_semilavorato', checked)}
                  />
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeIngredient(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              Aggiungi Ingrediente
            </Button>
          </div>

          <div>
            <Label>Istruzioni</Label>
            {recipeInstructions.map((instruction, index) => (
              <div key={index} className="mb-2">
                <Label htmlFor={`instruction-${index}`}>Passo {instruction.step_number}</Label>
                <Textarea
                  id={`instruction-${index}`}
                  placeholder="Istruzione"
                  value={instruction.instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className="w-full"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeInstruction(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
              Aggiungi Istruzione
            </Button>
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <ChefHat className="mr-2 h-4 w-4 animate-spin" />}
            Aggiungi
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecipeDialog;
