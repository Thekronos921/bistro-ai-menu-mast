
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Calculator } from "lucide-react";
import UnitSelector from "./UnitSelector";
import { calculateIngredientCost } from "@/utils/recipeCalculations";
import { formatQuantityWithUnit } from "@/utils/unitConversions";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
  yield_percentage?: number;
}

interface RecipeIngredientItem {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  ingredients: Ingredient;
}

interface RecipeIngredientSelectorProps {
  ingredients: Ingredient[];
  selectedIngredients: RecipeIngredientItem[];
  onIngredientsChange: (ingredients: RecipeIngredientItem[]) => void;
}

const RecipeIngredientSelector = ({
  ingredients,
  selectedIngredients,
  onIngredientsChange
}: RecipeIngredientSelectorProps) => {
  const [selectedIngredientId, setSelectedIngredientId] = useState("");

  const addIngredient = () => {
    if (!selectedIngredientId) return;
    
    const ingredient = ingredients.find(i => i.id === selectedIngredientId);
    if (!ingredient) return;

    const newIngredient: RecipeIngredientItem = {
      id: `temp-${Date.now()}`,
      ingredient_id: selectedIngredientId,
      quantity: 0,
      unit: ingredient.unit, // Inizia con l'unità base dell'ingrediente
      ingredients: ingredient
    };

    onIngredientsChange([...selectedIngredients, newIngredient]);
    setSelectedIngredientId("");
  };

  const updateIngredient = (id: string, updates: Partial<RecipeIngredientItem>) => {
    const updated = selectedIngredients.map(ing => 
      ing.id === id ? { ...ing, ...updates } : ing
    );
    onIngredientsChange(updated);
  };

  const removeIngredient = (id: string) => {
    const updated = selectedIngredients.filter(ing => ing.id !== id);
    onIngredientsChange(updated);
  };

  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, ing) => {
      return total + calculateIngredientCost(ing);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Aggiunta nuovo ingrediente */}
      <div className="flex space-x-2">
        <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Seleziona ingrediente" />
          </SelectTrigger>
          <SelectContent>
            {ingredients
              .filter(ing => !selectedIngredients.some(sel => sel.ingredient_id === ing.id))
              .map(ingredient => (
                <SelectItem key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} ({ingredient.unit})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button onClick={addIngredient} disabled={!selectedIngredientId}>
          Aggiungi
        </Button>
      </div>

      {/* Lista ingredienti selezionati */}
      <div className="space-y-3">
        {selectedIngredients.map((ingredient) => {
          const cost = calculateIngredientCost(ingredient);
          
          return (
            <div key={ingredient.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{ingredient.ingredients.name}</h4>
                  <p className="text-sm text-gray-500">
                    Unità base: {ingredient.ingredients.unit} • 
                    Costo: €{(ingredient.ingredients.effective_cost_per_unit || ingredient.ingredients.cost_per_unit).toFixed(2)}/{ingredient.ingredients.unit}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeIngredient(ingredient.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UnitSelector
                  quantity={ingredient.quantity}
                  unit={ingredient.unit || ingredient.ingredients.unit}
                  baseUnit={ingredient.ingredients.unit}
                  onQuantityChange={(quantity) => updateIngredient(ingredient.id, { quantity })}
                  onUnitChange={(unit) => updateIngredient(ingredient.id, { unit })}
                  label="Quantità necessaria"
                  showConversionInfo={true}
                />

                <div className="flex flex-col justify-end">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Costo: €{cost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Per {formatQuantityWithUnit(ingredient.quantity, ingredient.unit || ingredient.ingredients.unit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totale costi */}
      {selectedIngredients.length > 0 && (
        <div className="border-t pt-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-green-800">Costo Totale Ingredienti:</span>
              <span className="text-lg font-bold text-green-800">€{calculateTotalCost().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeIngredientSelector;
