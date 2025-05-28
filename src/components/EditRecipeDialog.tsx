import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Clock, Users, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: Ingredient;
}

interface RecipeInstruction {
  id: string;
  step_number: number;
  instruction: string;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  preparation_time: number;
  difficulty: string;
  portions: number;
  description: string;
  allergens: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe_ingredients: RecipeIngredient[];
  recipe_instructions: RecipeInstruction[];
}

interface EditRecipeDialogProps {
  recipe: Recipe;
  onClose: () => void;
  onRecipeUpdated: () => void;
}

const EditRecipeDialog = ({ recipe, onClose, onRecipeUpdated }: EditRecipeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: recipe.name,
    category: recipe.category,
    preparationTime: recipe.preparation_time,
    difficulty: recipe.difficulty,
    portions: recipe.portions,
    description: recipe.description || "",
    allergens: recipe.allergens || ""
  });
  
  const [recipeIngredients, setRecipeIngredients] = useState(
    recipe.recipe_ingredients.map(ri => ({
      id: ri.id,
      ingredient_id: ri.ingredient_id,
      quantity: ri.quantity,
      ingredient: ri.ingredients
    }))
  );
  
  const [instructions, setInstructions] = useState(
    recipe.recipe_instructions
      .sort((a, b) => a.step_number - b.step_number)
      .map(inst => ({ id: inst.id, instruction: inst.instruction }))
  );
  
  const [nutritionalInfo, setNutritionalInfo] = useState({
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0
  });

  const categories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"];
  const difficulties = ["Bassa", "Media", "Alta"];

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, unit, cost_per_unit')
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel caricamento degli ingredienti",
        variant: "destructive"
      });
    }
  };

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { 
      id: crypto.randomUUID(), 
      ingredient_id: "", 
      quantity: 0, 
      ingredient: null 
    }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string | number) => {
    const updated = recipeIngredients.map((ing, i) => {
      if (i === index) {
        const updatedIng = { ...ing, [field]: value };
        if (field === 'ingredient_id') {
          updatedIng.ingredient = ingredients.find(ingredient => ingredient.id === value) || null;
        }
        return updatedIng;
      }
      return ing;
    });
    setRecipeIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, { id: crypto.randomUUID(), instruction: "" }]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = instructions.map((inst, i) => 
      i === index ? { ...inst, instruction: value } : inst
    );
    setInstructions(updated);
  };

  const calculateTotalCost = () => {
    return recipeIngredients.reduce((total, recipeIng) => {
      if (recipeIng.ingredient) {
        return total + (recipeIng.ingredient.cost_per_unit * recipeIng.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast({
        title: "Errore",
        description: "Nome e categoria sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    const validIngredients = recipeIngredients.filter(ing => ing.ingredient_id && ing.quantity > 0);
    if (validIngredients.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un ingrediente",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: formData.name,
          category: formData.category,
          preparation_time: formData.preparationTime,
          difficulty: formData.difficulty,
          portions: formData.portions,
          description: formData.description,
          allergens: formData.allergens,
          calories: nutritionalInfo.calories,
          protein: nutritionalInfo.protein,
          carbs: nutritionalInfo.carbs,
          fat: nutritionalInfo.fat
        })
        .eq('id', recipe.id);

      if (recipeError) throw recipeError;

      const { error: deleteIngredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipe.id);

      if (deleteIngredientsError) throw deleteIngredientsError;

      const ingredientsData = validIngredients.map(ing => ({
        recipe_id: recipe.id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsData);

      if (ingredientsError) throw ingredientsError;

      const { error: deleteInstructionsError } = await supabase
        .from('recipe_instructions')
        .delete()
        .eq('recipe_id', recipe.id);

      if (deleteInstructionsError) throw deleteInstructionsError;

      const validInstructions = instructions.filter(inst => inst.instruction.trim());
      if (validInstructions.length > 0) {
        const instructionsData = validInstructions.map((inst, index) => ({
          recipe_id: recipe.id,
          step_number: index + 1,
          instruction: inst.instruction
        }));

        const { error: instructionsError } = await supabase
          .from('recipe_instructions')
          .insert(instructionsData);

        if (instructionsError) throw instructionsError;
      }

      toast({
        title: "Successo",
        description: "Ricetta aggiornata con successo"
      });

      onClose();
      onRecipeUpdated();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento della ricetta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5" />
            <span>Modifica Ricetta: {recipe.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informazioni Base</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nome Ricetta</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Es. Risotto ai Porcini"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Tempo (min)
                </label>
                <Input
                  type="number"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({...formData, preparationTime: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  Porzioni
                </label>
                <Input
                  type="number"
                  value={formData.portions}
                  onChange={(e) => setFormData({...formData, portions: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Difficoltà</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(diff => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrizione</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrizione della ricetta..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Allergeni</label>
              <Input
                value={formData.allergens}
                onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                placeholder="Es. Glutine, Latticini, Uova"
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Valori Nutrizionali (per porzione)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Calorie</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.calories}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, calories: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Proteine (g)</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.protein}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, protein: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Carboidrati (g)</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.carbs}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, carbs: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Grassi (g)</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.fat}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, fat: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Ingredienti</h3>
              <Button onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recipeIngredients.map((recipeIngredient, index) => {
                const cost = recipeIngredient.ingredient 
                  ? recipeIngredient.ingredient.cost_per_unit * recipeIngredient.quantity 
                  : 0;
                
                return (
                  <div key={recipeIngredient.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ingrediente {index + 1}</span>
                      {recipeIngredients.length > 1 && (
                        <Button onClick={() => removeIngredient(index)} size="sm" variant="outline">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <Select 
                      value={recipeIngredient.ingredient_id} 
                      onValueChange={(value) => updateIngredient(index, 'ingredient_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ingredient => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} (€{ingredient.cost_per_unit.toFixed(2)}/{ingredient.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Quantità"
                          value={recipeIngredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                        {recipeIngredient.ingredient && (
                          <span className="text-xs text-slate-500">{recipeIngredient.ingredient.unit}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">€{cost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">Costo Totale:</span>
                <span className="font-bold text-purple-600">€{calculateTotalCost().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Preparazione</h3>
              <Button onClick={addInstruction} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Step
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {instructions.map((instruction, index) => (
                <div key={instruction.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {index + 1}
                      </span>
                      Step {index + 1}
                    </span>
                    {instructions.length > 1 && (
                      <Button onClick={() => removeInstruction(index)} size="sm" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Descrivi questo passaggio..."
                    value={instruction.instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Aggiornamento..." : "Aggiorna Ricetta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRecipeDialog;
