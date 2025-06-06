import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import type { Recipe } from "@/types/recipe";

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
}

interface AssociateRecipeDialogProps {
  dish: Dish | null;
  onClose: () => void;
  onAssociated: () => void;
}

const AssociateRecipeDialog = ({ dish, onClose, onAssociated }: AssociateRecipeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const fetchRecipes = async () => {
    if (!restaurantId) return;

    setFetchingRecipes(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          category,
          preparation_time,
          difficulty,
          portions,
          description,
          allergens,
          calories,
          protein,
          carbs,
          fat,
          is_semilavorato,
          notes_chef,
          selling_price,
          recipe_ingredients (
            id,
            ingredient_id,
            quantity,
            unit,
            is_semilavorato,
            recipe_yield_percentage,
            ingredients (
              id,
              name,
              unit,
              cost_per_unit,
              effective_cost_per_unit,
              current_stock,
              min_stock_threshold,
              yield_percentage
            )
          ),
          recipe_instructions (
            id,
            step_number,
            instruction
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_semilavorato', false)
        .order('name');

      if (error) throw error;
      
      // Transform the data to match the Recipe interface with proper defaults
      const transformedRecipes: Recipe[] = (data || []).map(recipe => {
        // Ensure recipe_ingredients is an array and map over it safely
        const recipeIngredients = (recipe.recipe_ingredients || []).map(ri => {
          const ingredientData = Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients;
          
          // Provide default values for ingredient properties if ingredientData is null/undefined
          const defaultIngredient = {
            id: '', name: '', unit: '', cost_per_unit: 0, effective_cost_per_unit: 0,
            current_stock: 0, min_stock_threshold: 0, yield_percentage: 0
          };

          return {
            id: ri.id || '',
            ingredient_id: ri.ingredient_id || '',
            quantity: ri.quantity || 0,
            unit: ri.unit || '',
            is_semilavorato: ri.is_semilavorato || false,
            ingredients: {
              id: ingredientData?.id || defaultIngredient.id,
              name: ingredientData?.name || defaultIngredient.name,
              unit: ingredientData?.unit || defaultIngredient.unit,
              cost_per_unit: ingredientData?.cost_per_unit || defaultIngredient.cost_per_unit,
              effective_cost_per_unit: ingredientData?.effective_cost_per_unit || defaultIngredient.effective_cost_per_unit,
              current_stock: ingredientData?.current_stock || defaultIngredient.current_stock,
              min_stock_threshold: ingredientData?.min_stock_threshold || defaultIngredient.min_stock_threshold,
              yield_percentage: ingredientData?.yield_percentage || defaultIngredient.yield_percentage
            }
          };
        });

        return {
          id: recipe.id,
          name: recipe.name,
          category: recipe.category || '', // Ensure category has a default
          preparation_time: recipe.preparation_time || 0,
          difficulty: recipe.difficulty || 'Facile',
          portions: recipe.portions || 1,
          description: recipe.description || '',
          allergens: recipe.allergens || '',
          calories: recipe.calories || 0,
          protein: recipe.protein || 0,
          carbs: recipe.carbs || 0,
          fat: recipe.fat || 0,
          is_semilavorato: recipe.is_semilavorato || false,
          notes_chef: recipe.notes_chef || '',
          selling_price: recipe.selling_price || undefined,
          recipe_ingredients: recipeIngredients,
          recipe_instructions: recipe.recipe_instructions || []
        };
      });
      
      setRecipes(transformedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle ricette",
        variant: "destructive"
      });
    } finally {
      setFetchingRecipes(false);
    }
  };

  useEffect(() => {
    if (dish && restaurantId) {
      fetchRecipes();
    }
  }, [dish, restaurantId]);

  const calculateRecipeCost = (recipe: Recipe) => {
    if (!recipe.recipe_ingredients) return 0;
    return recipe.recipe_ingredients.reduce((total, ri) => {
      const effectiveCost = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
      return total + (effectiveCost * ri.quantity);
    }, 0);
  };

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
  const recipeCost = selectedRecipe ? calculateRecipeCost(selectedRecipe) : 0;
  const foodCostPercentage = dish && recipeCost > 0 ? (recipeCost / dish.selling_price) * 100 : 0;

  const handleAssociate = async () => {
    if (!dish || !selectedRecipeId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('dishes')
        .update({ recipe_id: selectedRecipeId })
        .eq('id', dish.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Ricetta "${selectedRecipe?.name}" associata al piatto "${dish.name}"`
      });

      onAssociated();
      onClose();
    } catch (error) {
      console.error('Error associating recipe:', error);
      toast({
        title: "Errore",
        description: "Errore nell'associazione della ricetta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssociation = async () => {
    if (!dish) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('dishes')
        .update({ recipe_id: null })
        .eq('id', dish.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Associazione ricetta rimossa dal piatto "${dish.name}"`
      });

      onAssociated();
      onClose();
    } catch (error) {
      console.error('Error removing recipe association:', error);
      toast({
        title: "Errore",
        description: "Errore nella rimozione dell'associazione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!dish) return null;

  return (
    <Dialog open={!!dish} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Link className="w-5 h-5" />
            <span>Gestisci Associazione Ricetta</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Piatto Selezionato</h3>
            <p className="text-slate-600">
              <span className="font-medium">{dish.name}</span> - {dish.category} - €{dish.selling_price}
            </p>
            {dish.recipe_id && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Questo piatto ha già una ricetta associata. Selezionandone una nuova, la sostituirai.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Seleziona Ricetta</label>
            <Select 
              value={selectedRecipeId} 
              onValueChange={setSelectedRecipeId}
              disabled={fetchingRecipes}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  fetchingRecipes ? "Caricamento ricette..." : 
                  recipes.length === 0 ? "Nessuna ricetta disponibile" :
                  "Seleziona una ricetta"
                } />
              </SelectTrigger>
              <SelectContent>
                {recipes.map(recipe => {
                  const cost = calculateRecipeCost(recipe);
                  return (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name} - €{cost.toFixed(2)} ({recipe.category})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedRecipe && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <h4 className="font-semibold text-slate-800">Anteprima Calcoli</h4>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Costo Ricetta:</span>
                  <p className="font-semibold">€{recipeCost.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-600">Food Cost %:</span>
                  <p className={`font-semibold ${
                    foodCostPercentage > 40 ? 'text-red-600' : 
                    foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {foodCostPercentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Margine:</span>
                  <p className="font-semibold">€{(dish.selling_price - recipeCost).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between space-x-3 pt-4 border-t border-slate-200">
            <div>
              {dish.recipe_id && (
                <Button
                  variant="outline"
                  onClick={handleRemoveAssociation}
                  disabled={loading}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Rimuovi Associazione
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Annulla
              </Button>
              <Button 
                onClick={handleAssociate} 
                disabled={loading || !selectedRecipeId}
              >
                {loading ? "Associando..." : "Associa Ricetta"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssociateRecipeDialog;