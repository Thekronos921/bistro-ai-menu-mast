import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Clock, Users, ChefHat, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRestaurant } from "@/hooks/useRestaurant";
import type { Recipe, RecipeIngredient } from '@/types/recipe';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
}

interface Semilavorato {
  id: string;
  name: string;
  cost_per_portion: number;
  portions: number;
}

interface LocalRecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  is_semilavorato?: boolean;
  ingredient: Ingredient | null;
}

interface RecipeInstruction {
  id: string;
  step_number: number;
  instruction: string;
}

interface EditRecipeDialogProps {
  recipe: Recipe;
  onClose: () => void;
  onRecipeUpdated: () => void;
}

const EditRecipeDialog = ({ recipe, onClose, onRecipeUpdated }: EditRecipeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [semilavorati, setSemilavorati] = useState<Semilavorato[]>([]);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  
  const [formData, setFormData] = useState({
    name: recipe.name,
    category: recipe.category,
    preparationTime: recipe.preparation_time,
    difficulty: recipe.difficulty,
    portions: recipe.portions,
    description: recipe.description || "",
    allergens: recipe.allergens || "",
    isSemilavorato: recipe.is_semilavorato || false,
    notesChef: recipe.notes_chef || ""
  });
  
  const [recipeIngredients, setRecipeIngredients] = useState<LocalRecipeIngredient[]>(
    recipe.recipe_ingredients.map(ri => ({
      id: ri.id,
      ingredient_id: ri.ingredient_id,
      quantity: ri.quantity,
      is_semilavorato: ri.is_semilavorato || false,
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

  const categories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni", "Semilavorati", "Salse", "Preparazioni Base"];
  const difficulties = ["Bassa", "Media", "Alta"];

  useEffect(() => {
    if (restaurantId) {
      fetchIngredientsAndSemilavorati();
    }
  }, [restaurantId]);

  const fetchIngredientsAndSemilavorati = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available for fetching ingredients");
        return;
      }

      // Fetch ingredients only for this restaurant
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name, unit, cost_per_unit, effective_cost_per_unit')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (ingredientsError) throw ingredientsError;
      setIngredients(ingredientsData || []);

      // Fetch semilavorati (recipes marked as semilavorati) only for this restaurant
      const { data: semilavoratiData, error: semilavoratiError } = await supabase
        .from('recipes')
        .select('id, name, portions')
        .eq('is_semilavorato', true)
        .eq('restaurant_id', restaurantId)
        .neq('id', recipe.id) // Exclude current recipe
        .order('name');

      if (semilavoratiError) throw semilavoratiError;
      
      // Calculate cost per portion for each semilavorato
      const semilavoratiWithCosts = await Promise.all((semilavoratiData || []).map(async (sem) => {
        const { data: recipeIngredientsData } = await supabase
          .from('recipe_ingredients')
          .select(`
            quantity,
            is_semilavorato,
            ingredients!inner(cost_per_unit, effective_cost_per_unit)
          `)
          .eq('recipe_id', sem.id);

        const totalCost = (recipeIngredientsData || []).reduce((sum, ri) => {
          const ingredients = ri.ingredients as any;
          const effectiveCost = ingredients?.effective_cost_per_unit ?? (ingredients?.cost_per_unit || 0);
          return sum + (ri.quantity * effectiveCost);
        }, 0);
        
        return {
          ...sem,
          cost_per_portion: sem.portions > 0 ? totalCost / sem.portions : 0
        };
      }));

      setSemilavorati(semilavoratiWithCosts);
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
      is_semilavorato: false,
      ingredient: null 
    }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string | number | boolean) => {
    const updated = recipeIngredients.map((ing, i) => {
      if (i === index) {
        const updatedIng = { ...ing, [field]: value };
        
        if (field === 'is_semilavorato') {
          updatedIng.ingredient_id = "";
          updatedIng.quantity = 0;
          updatedIng.ingredient = null;
        }
        
        if (field === 'ingredient_id') {
          if (updatedIng.is_semilavorato) {
            const semilavorato = semilavorati.find(s => s.id === value);
            if (semilavorato) {
              updatedIng.ingredient = {
                id: semilavorato.id,
                name: semilavorato.name,
                unit: 'porzione',
                cost_per_unit: semilavorato.cost_per_portion,
                effective_cost_per_unit: semilavorato.cost_per_portion
              };
            }
          } else {
            updatedIng.ingredient = ingredients.find(ingredient => ingredient.id === value) || null;
          }
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
        const effectiveCost = recipeIng.ingredient.effective_cost_per_unit ?? recipeIng.ingredient.cost_per_unit;
        return total + (effectiveCost * recipeIng.quantity);
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
          fat: nutritionalInfo.fat,
          is_semilavorato: formData.isSemilavorato,
          notes_chef: formData.notesChef
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
        quantity: ing.quantity,
        is_semilavorato: ing.is_semilavorato || false
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
    <TooltipProvider>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
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

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="semilavorato"
                  checked={formData.isSemilavorato}
                  onCheckedChange={(checked) => setFormData({...formData, isSemilavorato: !!checked})}
                />
                <label htmlFor="semilavorato" className="text-sm font-medium flex items-center">
                  È un semilavorato
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 ml-1 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Seleziona se questa ricetta è un componente usato in altre preparazioni e non un piatto venduto direttamente.
                    </TooltipContent>
                  </Tooltip>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Allergeni</label>
                <Input
                  value={formData.allergens}
                  onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                  placeholder="Es. Glutine, Latticini, Uova"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Note Addizionali / Consigli dello Chef</label>
                <Textarea
                  value={formData.notesChef}
                  onChange={(e) => setFormData({...formData, notesChef: e.target.value})}
                  placeholder="Consigli, varianti, note tecniche..."
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Valori Nutrizionali (per porzione)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Calorie (kcal)</label>
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
                    ? recipeIngredient.ingredient.effective_cost_per_unit ?? recipeIngredient.ingredient.cost_per_unit
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
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={recipeIngredient.is_semilavorato}
                          onCheckedChange={(checked) => updateIngredient(index, 'is_semilavorato', !!checked)}
                        />
                        <label className="text-xs">È semilavorato</label>
                      </div>
                      
                      <Select 
                        value={recipeIngredient.ingredient_id} 
                        onValueChange={(value) => updateIngredient(index, 'ingredient_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            recipeIngredient.is_semilavorato 
                              ? "Seleziona semilavorato" 
                              : "Seleziona ingrediente"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {recipeIngredient.is_semilavorato 
                            ? semilavorati.map(sem => (
                                <SelectItem key={sem.id} value={sem.id}>
                                  [S] {sem.name} (€{sem.cost_per_portion.toFixed(2)}/porzione)
                                </SelectItem>
                              ))
                            : ingredients.map(ingredient => (
                                <SelectItem key={ingredient.id} value={ingredient.id}>
                                  {ingredient.name} (€{(ingredient.effective_cost_per_unit ?? ingredient.cost_per_unit).toFixed(2)}/{ingredient.unit})
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder={
                              recipeIngredient.is_semilavorato 
                                ? "Quantità (porzioni)" 
                                : `Quantità ${recipeIngredient.ingredient?.unit ? `(${recipeIngredient.ingredient.unit})` : ''}`
                            }
                            value={recipeIngredient.quantity}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="text-right flex items-center">
                          <span className="text-sm font-medium">€{(cost * recipeIngredient.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Costo Produzione Totale:</span>
                  <span className="font-bold text-purple-600">€{calculateTotalCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Costo per Porzione:</span>
                  <span className="font-bold text-purple-600">
                    €{formData.portions > 0 ? (calculateTotalCost() / formData.portions).toFixed(2) : '0.00'}
                  </span>
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

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-slate-500">
              Costi ingredienti aggiornati al: {new Date().toLocaleString('it-IT')}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Aggiornamento..." : "Aggiorna Ricetta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default EditRecipeDialog;
