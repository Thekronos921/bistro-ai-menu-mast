import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useToast } from "@/hooks/use-toast";
import { convertUnit } from "@/utils/unitConversion";
import RecipeIngredientItem from "./RecipeIngredientItem";
import { calculateTotalCost } from "./utils/ingredientCostCalculator";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
  yield_percentage?: number;
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
  recipe_yield_percentage?: number;
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
        .select('id, name, unit, cost_per_unit, effective_cost_per_unit, yield_percentage')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (ingredientsError) throw ingredientsError;
      setIngredients(ingredientsData || []);

      // Fetch semilavorati con i costi calcolati dal database
      const { data: semilavoratiData, error: semilavoratiError } = await supabase
        .from('recipes')
        .select('id, name, portions, calculated_cost_per_portion, cost_last_calculated_at')
        .eq('is_semilavorato', true)
        .eq('restaurant_id', restaurantId)
        .neq('id', recipeId)
        .order('name');

      if (semilavoratiError) throw semilavoratiError;
      
      const semilavoratiWithCosts = (semilavoratiData || []).map(sem => ({
        ...sem,
        // Usa il costo calcolato dal database se disponibile, altrimenti calcola localmente
        cost_per_portion: sem.calculated_cost_per_portion ?? 0
      }));

      console.log("Loaded semilavorati with database costs:", semilavoratiWithCosts);
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
      recipe_yield_percentage: undefined,
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
          updatedIng.recipe_yield_percentage = undefined;
        }
        
        if (field === 'ingredient_id') {
          if (updatedIng.is_semilavorato) {
            const semilavorato = semilavorati.find(s => s.id === value);
            if (semilavorato) {
              console.log(`Selected semilavorato: ${semilavorato.name}, cost per portion: €${semilavorato.cost_per_portion}`);
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
    console.log(`Updating ingredient ${index} unit to: ${unit}`);
    const updated = recipeIngredients.map((ing, i) => 
      i === index ? { ...ing, unit } : ing
    );
    onIngredientsChange(updated);
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    console.log(`Updating ingredient ${index} quantity to: ${quantity}`);
    const updated = recipeIngredients.map((ing, i) => 
      i === index ? { ...ing, quantity } : ing
    );
    onIngredientsChange(updated);
  };

  const totalCost = calculateTotalCost(recipeIngredients);

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
        {recipeIngredients.map((recipeIngredient, index) => (
          <RecipeIngredientItem
            key={recipeIngredient.id}
            recipeIngredient={recipeIngredient}
            index={index}
            ingredients={ingredients}
            semilavorati={semilavorati}
            canRemove={recipeIngredients.length > 1}
            onRemove={removeIngredient}
            onUpdate={updateIngredient}
            onUpdateUnit={updateIngredientUnit}
            onUpdateQuantity={updateIngredientQuantity}
          />
        ))}
      </div>

      <div className="bg-slate-50 p-3 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Costo Produzione Totale:</span>
          <span className="font-bold text-purple-600">€{totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Costo per Porzione:</span>
          <span className="font-bold text-purple-600">
            €{portions > 0 ? (totalCost / portions).toFixed(2) : '0.00'}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          I costi verranno ricalcolati automaticamente al salvataggio
        </div>
      </div>
    </div>
  );
};

export default RecipeIngredientsForm;
