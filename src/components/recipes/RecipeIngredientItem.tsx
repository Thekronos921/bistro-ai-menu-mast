
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import UnitSelector from "@/components/UnitSelector";
import { convertUnit, areUnitsCompatible } from "@/utils/unitConversion";

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

interface RecipeIngredientItemProps {
  recipeIngredient: LocalRecipeIngredient;
  index: number;
  ingredients: Ingredient[];
  semilavorati: Semilavorato[];
  canRemove: boolean;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string | number | boolean) => void;
  onUpdateUnit: (index: number, unit: string) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
}

const RecipeIngredientItem = ({
  recipeIngredient,
  index,
  ingredients,
  semilavorati,
  canRemove,
  onRemove,
  onUpdate,
  onUpdateUnit,
  onUpdateQuantity
}: RecipeIngredientItemProps) => {
  
  const calculateIngredientCost = () => {
    if (!recipeIngredient.ingredient) return 0;
    
    const effectiveCost = recipeIngredient.ingredient.effective_cost_per_unit ?? recipeIngredient.ingredient.cost_per_unit;
    
    // Se è un semilavorato, usa direttamente il costo per porzione
    if (recipeIngredient.is_semilavorato) {
      return effectiveCost * recipeIngredient.quantity;
    }
    
    // Se l'unità della ricetta è diversa da quella base dell'ingrediente, converti
    if (recipeIngredient.unit && recipeIngredient.unit !== recipeIngredient.ingredient.unit) {
      if (areUnitsCompatible(recipeIngredient.unit, recipeIngredient.ingredient.unit)) {
        try {
          // Converti la quantità dall'unità della ricetta all'unità base dell'ingrediente
          const convertedQuantity = convertUnit(recipeIngredient.quantity, recipeIngredient.unit, recipeIngredient.ingredient.unit);
          console.log(`Convertendo ${recipeIngredient.quantity} ${recipeIngredient.unit} a ${convertedQuantity} ${recipeIngredient.ingredient.unit} per ${recipeIngredient.ingredient.name}`);
          return effectiveCost * convertedQuantity;
        } catch (error) {
          console.error("Errore nella conversione:", error);
          return effectiveCost * recipeIngredient.quantity;
        }
      } else {
        console.warn(`Unità incompatibili per ${recipeIngredient.ingredient.name}: ${recipeIngredient.unit} vs ${recipeIngredient.ingredient.unit}`);
        return effectiveCost * recipeIngredient.quantity;
      }
    }
    
    return effectiveCost * recipeIngredient.quantity;
  };

  const ingredientCost = calculateIngredientCost();

  return (
    <div className="space-y-2 p-3 border rounded-lg">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Ingrediente {index + 1}</span>
        {canRemove && (
          <Button onClick={() => onRemove(index)} size="sm" variant="outline">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          checked={recipeIngredient.is_semilavorato}
          onCheckedChange={(checked) => onUpdate(index, 'is_semilavorato', !!checked)}
        />
        <label className="text-xs">È semilavorato</label>
      </div>
      
      <Select 
        value={recipeIngredient.ingredient_id} 
        onValueChange={(value) => onUpdate(index, 'ingredient_id', value)}
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
          onUnitChange={(unit) => onUpdateUnit(index, unit)}
          onQuantityChange={(quantity) => onUpdateQuantity(index, quantity)}
        />
      )}
      
      {recipeIngredient.is_semilavorato && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            step="0.1"
            placeholder="Quantità (porzioni)"
            value={recipeIngredient.quantity}
            onChange={(e) => onUpdateQuantity(index, parseFloat(e.target.value) || 0)}
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
};

export default RecipeIngredientItem;
