
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Clock, Users, ChefHat, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface Semilavorato {
  id: string;
  name: string;
  cost_per_portion: number;
  portions: number;
}

interface RecipeIngredient {
  ingredient_id: string;
  quantity: number;
  is_semilavorato?: boolean;
  ingredient?: Ingredient;
  semilavorato?: Semilavorato;
}

interface AddRecipeDialogProps {
  onAddRecipe: () => void;
}

const AddRecipeDialog = ({ onAddRecipe }: AddRecipeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [semilavorati, setSemilavorati] = useState<Semilavorato[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    preparationTime: 0,
    difficulty: "Media",
    portions: 1,
    description: "",
    isSemilavorato: false,
    notesChef: ""
  });
  
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([
    { ingredient_id: "", quantity: 0, is_semilavorato: false }
  ]);
  
  const [instructions, setInstructions] = useState<string[]>([""]);
  
  const [nutritionalInfo, setNutritionalInfo] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const [allergens, setAllergens] = useState({
    glutine: false,
    latticini: false,
    uova: false,
    fruttaGuscio: false,
    soia: false,
    pesce: false,
    crostacei: false,
    sedano: false,
    senape: false,
    sesamo: false,
    lupini: false,
    molluschi: false,
    anidrideSolforosa: false,
    altri: ""
  });

  const categories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni", "Semilavorati", "Salse", "Preparazioni Base"];
  const difficulties = ["Bassa", "Media", "Alta"];
  const allergenLabels = {
    glutine: "Glutine",
    latticini: "Latticini", 
    uova: "Uova",
    fruttaGuscio: "Frutta a guscio",
    soia: "Soia",
    pesce: "Pesce", 
    crostacei: "Crostacei",
    sedano: "Sedano",
    senape: "Senape",
    sesamo: "Sesamo",
    lupini: "Lupini",
    molluschi: "Molluschi",
    anidrideSolforosa: "Anidride solforosa"
  };

  useEffect(() => {
    if (open) {
      fetchIngredientsAndSemilavorati();
    }
  }, [open]);

  const fetchIngredientsAndSemilavorati = async () => {
    try {
      // Fetch ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name, unit, cost_per_unit')
        .order('name');

      if (ingredientsError) throw ingredientsError;
      setIngredients(ingredientsData || []);

      // Fetch semilavorati (recipes marked as semilavorati)
      const { data: semilavoratiData, error: semilavoratiError } = await supabase
        .from('recipes')
        .select('id, name, portions')
        .eq('is_semilavorato', true)
        .order('name');

      if (semilavoratiError) throw semilavoratiError;
      
      // Calculate cost per portion for each semilavorato
      const semilavoratiWithCosts = await Promise.all((semilavoratiData || []).map(async (sem) => {
        const { data: ingredientsData } = await supabase
          .from('recipe_ingredients')
          .select(`
            quantity,
            ingredients(cost_per_unit)
          `)
          .eq('recipe_id', sem.id);

        const totalCost = (ingredientsData || []).reduce((sum, ri) => 
          sum + (ri.quantity * ri.ingredients.cost_per_unit), 0);
        
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
    setRecipeIngredients([...recipeIngredients, { ingredient_id: "", quantity: 0, is_semilavorato: false }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number | boolean) => {
    const updated = recipeIngredients.map((ing, i) => {
      if (i === index) {
        const updatedIng = { ...ing, [field]: value };
        
        if (field === 'is_semilavorato') {
          updatedIng.ingredient_id = "";
          updatedIng.quantity = 0;
        }
        
        if (field === 'ingredient_id') {
          if (updatedIng.is_semilavorato) {
            updatedIng.semilavorato = semilavorati.find(s => s.id === value);
          } else {
            updatedIng.ingredient = ingredients.find(ingredient => ingredient.id === value);
          }
        }
        
        return updatedIng;
      }
      return ing;
    });
    setRecipeIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = instructions.map((inst, i) => i === index ? value : inst);
    setInstructions(updated);
  };

  const calculateTotalCost = () => {
    return recipeIngredients.reduce((total, recipeIng) => {
      if (recipeIng.is_semilavorato && recipeIng.semilavorato) {
        return total + (recipeIng.semilavorato.cost_per_portion * recipeIng.quantity);
      } else if (!recipeIng.is_semilavorato && recipeIng.ingredient) {
        return total + (recipeIng.ingredient.cost_per_unit * recipeIng.quantity);
      }
      return total;
    }, 0);
  };

  const getSelectedAllergens = () => {
    const selectedAllergens = Object.entries(allergens)
      .filter(([key, value]) => key !== 'altri' && value)
      .map(([key]) => allergenLabels[key as keyof typeof allergenLabels]);
    
    if (allergens.altri.trim()) {
      selectedAllergens.push(allergens.altri.trim());
    }
    
    return selectedAllergens.join(', ');
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
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          name: formData.name,
          category: formData.category,
          preparation_time: formData.preparationTime,
          difficulty: formData.difficulty,
          portions: formData.portions,
          description: formData.description,
          allergens: getSelectedAllergens(),
          calories: nutritionalInfo.calories,
          protein: nutritionalInfo.protein,
          carbs: nutritionalInfo.carbs,
          fat: nutritionalInfo.fat,
          is_semilavorato: formData.isSemilavorato,
          notes_chef: formData.notesChef
        }])
        .select()
        .single();

      if (recipeError) throw recipeError;

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

      const validInstructions = instructions.filter(inst => inst.trim());
      if (validInstructions.length > 0) {
        const instructionsData = validInstructions.map((inst, index) => ({
          recipe_id: recipe.id,
          step_number: index + 1,
          instruction: inst
        }));

        const { error: instructionsError } = await supabase
          .from('recipe_instructions')
          .insert(instructionsData);

        if (instructionsError) throw instructionsError;
      }

      toast({
        title: "Successo",
        description: "Ricetta salvata con successo"
      });

      setOpen(false);
      resetForm();
      onAddRecipe();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio della ricetta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      preparationTime: 0,
      difficulty: "Media",
      portions: 1,
      description: "",
      isSemilavorato: false,
      notesChef: ""
    });
    setRecipeIngredients([{ ingredient_id: "", quantity: 0, is_semilavorato: false }]);
    setInstructions([""]);
    setNutritionalInfo({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setAllergens({
      glutine: false,
      latticini: false,
      uova: false,
      fruttaGuscio: false,
      soia: false,
      pesce: false,
      crostacei: false,
      sedano: false,
      senape: false,
      sesamo: false,
      lupini: false,
      molluschi: false,
      anidrideSolforosa: false,
      altri: ""
    });
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuova Ricetta
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5" />
              <span>Aggiungi Nuova Ricetta</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonna 1: Informazioni Base */}
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
                <label className="block text-sm font-medium mb-1">Note Addizionali / Consigli dello Chef</label>
                <Textarea
                  value={formData.notesChef}
                  onChange={(e) => setFormData({...formData, notesChef: e.target.value})}
                  placeholder="Consigli, varianti, note tecniche..."
                  rows={2}
                />
              </div>

              {/* Allergeni */}
              <div className="space-y-3">
                <h4 className="font-medium">Allergeni</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(allergenLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox 
                        id={key}
                        checked={allergens[key as keyof typeof allergens] as boolean}
                        onCheckedChange={(checked) => setAllergens({...allergens, [key]: !!checked})}
                      />
                      <label htmlFor={key} className="text-xs">{label}</label>
                    </div>
                  ))}
                </div>
                <div>
                  <Input
                    placeholder="Altri allergeni specifici"
                    value={allergens.altri}
                    onChange={(e) => setAllergens({...allergens, altri: e.target.value})}
                  />
                </div>
              </div>

              {/* Valori Nutrizionali */}
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

            {/* Colonna 2: Ingredienti */}
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
                  const cost = recipeIngredient.is_semilavorato && recipeIngredient.semilavorato
                    ? recipeIngredient.semilavorato.cost_per_portion * recipeIngredient.quantity
                    : !recipeIngredient.is_semilavorato && recipeIngredient.ingredient
                    ? recipeIngredient.ingredient.cost_per_unit * recipeIngredient.quantity
                    : 0;
                  
                  return (
                    <div key={index} className="space-y-2 p-3 border rounded-lg">
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
                                  {ingredient.name} (€{ingredient.cost_per_unit.toFixed(2)}/{ingredient.unit})
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
                          <span className="text-sm font-medium">€{cost.toFixed(2)}</span>
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

            {/* Colonna 3: Preparazione */}
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
                  <div key={index} className="space-y-2">
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
                      value={instruction}
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
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !formData.name || !formData.category}>
                {loading ? "Salvataggio..." : "Salva Ricetta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AddRecipeDialog;
