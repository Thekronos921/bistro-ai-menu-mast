
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UnitSelector from "@/components/UnitSelector";
import { convertUnit, areUnitsCompatible } from "@/utils/unitConversion";

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
    
    const baseCost = recipeIngredient.ingredient.effective_cost_per_unit ?? recipeIngredient.ingredient.cost_per_unit;
    
    // Se è un semilavorato, usa direttamente il costo per porzione
    if (recipeIngredient.is_semilavorato) {
      return baseCost * recipeIngredient.quantity;
    }
    
    // LOGICA CORRETTA: Evita doppi calcoli della resa
    let effectiveCost = baseCost;
    
    // 1. Se c'è una resa specifica per la ricetta, usala sul costo base
    if (recipeIngredient.recipe_yield_percentage !== null && recipeIngredient.recipe_yield_percentage !== undefined) {
      // Se abbiamo effective_cost_per_unit, dobbiamo prima "rimuovere" la resa base
      let costToUse = baseCost;
      if (recipeIngredient.ingredient.effective_cost_per_unit && recipeIngredient.ingredient.yield_percentage && recipeIngredient.ingredient.yield_percentage !== 100) {
        costToUse = recipeIngredient.ingredient.cost_per_unit;
      }
      effectiveCost = costToUse / (recipeIngredient.recipe_yield_percentage / 100);
    }
    // 2. Altrimenti, se l'ingrediente ha una resa e non abbiamo già effective_cost_per_unit, applicala
    else if (!recipeIngredient.ingredient.effective_cost_per_unit && recipeIngredient.ingredient.yield_percentage && recipeIngredient.ingredient.yield_percentage !== 100) {
      effectiveCost = baseCost / (recipeIngredient.ingredient.yield_percentage / 100);
    }
    
    // Il costo dell'ingrediente è sempre per l'unità base dell'ingrediente
    // Se l'unità della ricetta è diversa da quella base, converti la quantità
    const recipeUnit = recipeIngredient.unit || recipeIngredient.ingredient.unit;
    const baseUnit = recipeIngredient.ingredient.unit;
    
    if (recipeUnit !== baseUnit && areUnitsCompatible(recipeUnit, baseUnit)) {
      try {
        // Converti la quantità dall'unità della ricetta all'unità base dell'ingrediente
        const quantityInBaseUnit = convertUnit(recipeIngredient.quantity, recipeUnit, baseUnit);
        console.log(`Calcolo costo per ${recipeIngredient.ingredient.name}:`);
        console.log(`- Quantità ricetta: ${recipeIngredient.quantity} ${recipeUnit}`);
        console.log(`- Quantità convertita: ${quantityInBaseUnit} ${baseUnit}`);
        console.log(`- Costo per ${baseUnit}: €${effectiveCost}`);
        console.log(`- Costo totale: €${(effectiveCost * quantityInBaseUnit).toFixed(2)}`);
        
        return effectiveCost * quantityInBaseUnit;
      } catch (error) {
        console.error("Errore nella conversione per calcolo costo:", error);
        return effectiveCost * recipeIngredient.quantity;
      }
    }
    
    // Se le unità sono uguali o non compatibili, usa la quantità direttamente
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
        <>
          <UnitSelector
            baseUnit={recipeIngredient.ingredient.unit}
            selectedUnit={recipeIngredient.unit || recipeIngredient.ingredient.unit}
            quantity={recipeIngredient.quantity}
            onUnitChange={(unit) => onUpdateUnit(index, unit)}
            onQuantityChange={(quantity) => onUpdateQuantity(index, quantity)}
          />
          
          {/* Campo per la resa specifica per ricetta */}
          <div className="flex items-center gap-2 mt-2">
            <Label className="text-xs text-gray-600 min-w-fit">Resa %:</Label>
            <Input
              type="number"
              min="1"
              max="100"
              step="0.1"
              className="w-20 h-8 text-xs"
              placeholder={recipeIngredient.ingredient?.yield_percentage?.toString() || "100"}
              value={recipeIngredient.recipe_yield_percentage || ""}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                onUpdate(index, 'recipe_yield_percentage', value);
              }}
            />
            <span className="text-xs text-gray-500">
              (base: {recipeIngredient.ingredient?.yield_percentage || 100}%)
            </span>
          </div>
        </>
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
