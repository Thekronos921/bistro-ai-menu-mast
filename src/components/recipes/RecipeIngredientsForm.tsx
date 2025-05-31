
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import UnitSelector from "@/components/UnitSelector";
import { convertUnit } from "@/utils/unitConversion";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useToast } from "@/hooks/use-toast";

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
  unit?: string;
  is_semilavorato?: boolean;
  ingredient: Ingredient | null;
}

interface RecipeIngredientsFormProps {
  recipeIngredients: LocalRecipeIngredient[];
  onIngredientsChange: (ingredients: LocalRecipeIngredient[]) => void;
  recipeId: string;
  portions: number;
}

const RecipeIngredientsForm = ({ recipeIngredients, onIngredientsChange, recipeId, portions }: RecipeIngredientsFormProps) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [semilavorati, setSemilavorati] = useState<Semilavorato[]>([]);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      fetchIngredientsAndSemilavorati();
    }
  }, [restaurantId]);

  const fetchIngredientsAndSemilavorati = async () => {
    try {
      if (!restaurantId) return;

      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name, unit, cost_per_unit, effective_cost_per_unit')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (ingredientsError) throw ingredientsError;
      setIngredients(ingredientsData || []);

      const { data: semilavoratiData, error: semilavoratiError } = await supabase
        .from('recipes')
        .select('id, name, portions')
        .eq('is_semilavorato', true)
        .eq('restaurant_id', restaurantId)
        .neq('id', recipeId)
        .order('name');

      if (semilavoratiError) throw semilavoratiError;
      
      const semilavoratiWithCosts = await Promise.all((semilavoratiData || []).map(async (sem) => {
        const { data: recipeIngredientsData } = await supabase
          .from('recipe_ingredients')
          .select(`
            quantity,
            unit,
            is_semilavorato,
            ingredients!inner(cost_per_unit, effective_cost_per_unit)
          `)
          .eq('recipe_id', sem.id);

        const totalCost = (recipeIngredientsData || []).reduce((sum, ri) => {
          const ingredients = ri.ingredients as any;
          const effectiveCost = ingredients?.effective_cost_per_unit ?? (ingredients?.cost_per_unit || 0);
          let finalQuantity = ri.quantity;
          
          if (ri.unit && ri.unit !== ingredients?.unit) {
            finalQuantity = convertUnit(ri.quantity, ri.unit, ingredients?.unit || 'g');
          }
          
          return sum + (finalQuantity * effectiveCost);
        }, 0);
        
        return {
          ...sem,
          cost_per_portion: sem.portions > 0 ? totalCost / sem.portions : 0
        };
      }));

      setSemilavorati(semilavoratiWithCosts);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento degli ingredienti",
        variant: "destructive"
      });
    }
  };

  const addIngredient = () => {
    onIngredientsChange([...recipeIngredients, { 
      id: crypto.randomUUID(), 
      ingredient_id: "", 
      quantity: 0, 
      unit: "",
      is_semilavorato: false,
      ingredient: null 
    }]);
  };

  const removeIngredient = (index: number) => {
    onIngredientsChange(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: string | number | boolean) => {
    const updated = recipeIngredients.map((ing, i) => {
      if (i === index) {
        const updatedIng = { ...ing, [field]: value };
        
        if (field === 'is_semilavorato') {
          updatedIng.ingredient_id = "";
          updatedIng.quantity = 0;
          updatedIng.unit = "";
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
              updatedIng.unit = 'porzione';
            }
          } else {
            const ingredient = ingredients.find(ingredient => ingredient.id === value);
            if (ingredient) {
              updatedIng.ingredient = ingredient;
              updatedIng.unit = ingredient.unit;
            }
          }
        }
        
        return updatedIng;
      }
      return ing;
    });
    onIngredientsChange(updated);
  };

  const updateIngredientUnit = (index: number, unit: string) => {
    const updated = recipeIngredients.map((ing, i) => 
      i === index ? { ...ing, unit } : ing
    );
    onIngredientsChange(updated);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updated = recipeIngredients.map((ing, i) => 
      i === index ? { ...ing, quantity } : ing
    );
    onIngredientsChange(updated);
  };

  const calculateIngredientCost = (recipeIng: LocalRecipeIngredient) => {
    if (!recipeIng.ingredient) return 0;
    
    const effectiveCost = recipeIng.ingredient.effective_cost_per_unit ?? recipeIng.ingredient.cost_per_unit;
    
    // Se l'unità della ricetta è diversa da quella base dell'ingrediente, converti
    if (recipeIng.unit && recipeIng.unit !== recipeIng.ingredient.unit) {
      try {
        // Converti la quantità dall'unità della ricetta all'unità base dell'ingrediente
        const convertedQuantity = convertUnit(recipeIng.quantity, recipeIng.unit, recipeIng.ingredient.unit);
        return effectiveCost * convertedQuantity;
      } catch (error) {
        console.error("Errore nella conversione:", error);
        // Fallback: usa la quantità originale
        return effectiveCost * recipeIng.quantity;
      }
    }
    
    return effectiveCost * recipeIng.quantity;
  };

  const calculateTotalCost = () => {
    return recipeIngredients.reduce((total, recipeIng) => {
      return total + calculateIngredientCost(recipeIng);
    }, 0);
  };

  return (
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
          const ingredientCost = calculateIngredientCost(recipeIngredient);
          
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
              
              {recipeIngredient.ingredient && !recipeIngredient.is_semilavorato && (
                <UnitSelector
                  baseUnit={recipeIngredient.ingredient.unit}
                  selectedUnit={recipeIngredient.unit || recipeIngredient.ingredient.unit}
                  quantity={recipeIngredient.quantity}
                  onUnitChange={(unit) => updateIngredientUnit(index, unit)}
                  onQuantityChange={(quantity) => updateIngredientQuantity(index, quantity)}
                />
              )}
              
              {recipeIngredient.is_semilavorato && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Quantità (porzioni)"
                    value={recipeIngredient.quantity}
                    onChange={(e) => updateIngredientQuantity(index, parseFloat(e.target.value) || 0)}
                  />
                  <div className="text-right flex items-center">
                    <span className="text-sm font-medium">€{ingredientCost.toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {!recipeIngredient.is_semilavorato && recipeIngredient.ingredient && (
                <div className="text-right">
                  <span className="text-sm font-medium">€{ingredientCost.toFixed(2)}</span>
                </div>
              )}
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
            €{portions > 0 ? (calculateTotalCost() / portions).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecipeIngredientsForm;
