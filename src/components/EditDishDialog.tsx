
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit, DollarSign, Calculator, ExternalLink, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { calculateTotalCost, calculateCostPerPortion } from "@/utils/recipeCalculations";
import { Recipe as RecipeType } from "@/types/recipe";
import CategorySelect from "@/components/categories/CategorySelect";

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: RecipeType;
}

interface EditDishDialogProps {
  dish: Dish;
  onClose: () => void;
  onDishUpdated: () => void;
  onEditRecipe?: (recipe: RecipeType) => void;
}

const EditDishDialog = ({ dish, onClose, onDishUpdated, onEditRecipe }: EditDishDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<RecipeType[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeType | null>(null);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  
  const [formData, setFormData] = useState({
    name: dish.name,
    category: dish.category,
    selling_price: dish.selling_price,
    recipe_id: dish.recipe_id || "",
    description: "",
    is_active: true
  });

  useEffect(() => {
    if (restaurantId) {
      fetchRecipes();
    }
    if (dish.recipes) {
      setSelectedRecipe(dish.recipes);
    }
  }, [restaurantId]);

  const fetchRecipes = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        return;
      }

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          category,
          portions,
          preparation_time,
          difficulty,
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
      
      // Transform the data to match our Recipe type structure
      const transformedData = data?.map(recipe => ({
        ...recipe,
        recipe_ingredients: recipe.recipe_ingredients.map(ri => ({
          ...ri,
          ingredients: Array.isArray(ri.ingredients) ? ri.ingredients[0] : ri.ingredients
        }))
      })) as RecipeType[];
      
      setRecipes(transformedData || []);
      console.log("Fetched recipes for restaurant:", restaurantId, transformedData);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle ricette",
        variant: "destructive"
      });
    }
  };

  const handleRecipeChange = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    setSelectedRecipe(recipe || null);
    setFormData({...formData, recipe_id: recipeId});
  };

  const handleCategoryChange = (categoryName: string | undefined) => {
    setFormData({...formData, category: categoryName || ""});
  };

  const getFoodCostPercentage = () => {
    if (!selectedRecipe || formData.selling_price <= 0) return 0;
    const costPerPortion = calculateCostPerPortion(selectedRecipe.recipe_ingredients, selectedRecipe.portions);
    return (costPerPortion / formData.selling_price) * 100;
  };

  const getMargin = () => {
    if (!selectedRecipe) return 0;
    const costPerPortion = calculateCostPerPortion(selectedRecipe.recipe_ingredients, selectedRecipe.portions);
    return formData.selling_price - costPerPortion;
  };

  const getFoodCostAlert = () => {
    const fcPercentage = getFoodCostPercentage();
    if (fcPercentage > 40) {
      return {
        type: "critical",
        message: "Food Cost elevato - considerare ottimizzazione",
        icon: AlertTriangle,
        color: "text-red-600"
      };
    }
    if (fcPercentage <= 30) {
      return {
        type: "optimal",
        message: "Food Cost ottimale",
        icon: CheckCircle,
        color: "text-emerald-600"
      };
    }
    return {
      type: "acceptable",
      message: "Food Cost accettabile",
      icon: Zap,
      color: "text-amber-600"
    };
  };

  const handleEditRecipe = () => {
    if (selectedRecipe && onEditRecipe) {
      onEditRecipe(selectedRecipe);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || formData.selling_price <= 0) {
      toast({
        title: "Errore",
        description: "Nome, categoria e prezzo sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Trova o crea la categoria usando il nuovo sistema dish_categories
      let categoryId = null;
      
      // Prima prova a trovare la categoria esistente
      const { data: existingCategory } = await supabase
        .from('dish_categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('name', formData.category)
        .single();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Se non esiste, creala
        const { data: newCategory, error: categoryError } = await supabase
          .from('dish_categories')
          .insert({
            restaurant_id: restaurantId,
            name: formData.category,
            display_order: 0
          })
          .select('id')
          .single();

        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
      }

      const updateData: any = {
        name: formData.name,
        category_id: categoryId,
        restaurant_category_name: formData.category, // Mantieni per compatibilità
        selling_price: formData.selling_price
      };

      if (formData.recipe_id) {
        updateData.recipe_id = formData.recipe_id;
      }

      const { error } = await supabase
        .from('dishes')
        .update(updateData)
        .eq('id', dish.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Piatto aggiornato con successo"
      });

      onClose();
      onDishUpdated();
    } catch (error) {
      console.error('Error updating dish:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento del piatto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const alert = getFoodCostAlert();
  const AlertIcon = alert.icon;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>Modifica Piatto: {dish.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonna Sinistra - Informazioni Base */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Informazioni Base</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Piatto</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Es. Risotto ai Porcini"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria Piatto</label>
                {restaurantId && (
                  <CategorySelect
                    restaurantId={restaurantId}
                    value={formData.category}
                    onValueChange={handleCategoryChange}
                    placeholder="Seleziona o crea categoria"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Prezzo di Vendita (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0})}
                  placeholder="25.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ricetta Associata</label>
                <Select value={formData.recipe_id} onValueChange={handleRecipeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ricetta" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.length === 0 ? (
                      <SelectItem value="no-recipes-available" disabled>Nessuna ricetta disponibile</SelectItem>
                    ) : (
                      recipes.map(recipe => {
                        const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
                        return (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name} (€{costPerPortion.toFixed(2)})
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                {!restaurantId && (
                  <p className="text-sm text-red-500 mt-1">
                    Errore: ID ristorante non trovato
                  </p>
                )}
                {restaurantId && recipes.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Nessuna ricetta trovata per questo ristorante
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrizione Piatto (per menu cliente)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrizione per il menu cliente..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <label className="text-sm font-medium">Attivo nel Menu</label>
              </div>
            </div>
          </div>

          {/* Colonna Destra - Analisi Costi */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Analisi Costi
            </h3>

            {selectedRecipe ? (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-medium text-slate-600">Ricetta Corrente:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-slate-800">{selectedRecipe.name}</span>
                      {onEditRecipe && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditRecipe}
                          className="p-1 h-6 w-6"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Costo Ricetta:</span>
                      <span className="font-semibold text-lg">€{calculateCostPerPortion(selectedRecipe.recipe_ingredients, selectedRecipe.portions).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Food Cost %:</span>
                      <span className={`font-bold text-lg ${
                        getFoodCostPercentage() > 40 ? 'text-red-600' : 
                        getFoodCostPercentage() > 30 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {getFoodCostPercentage().toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Margine:</span>
                      <span className="font-semibold text-lg">€{getMargin().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      alert.type === 'critical' ? 'bg-red-50 border border-red-200' :
                      alert.type === 'optimal' ? 'bg-emerald-50 border border-emerald-200' :
                      'bg-amber-50 border border-amber-200'
                    }`}>
                      <AlertIcon className={`w-4 h-4 ${alert.color}`} />
                      <p className={`text-sm font-medium ${alert.color}`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>

                {onEditRecipe && (
                  <Button
                    variant="outline"
                    onClick={handleEditRecipe}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifica Ricetta Selezionata</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-slate-100 p-8 rounded-lg text-center text-slate-500">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Seleziona una ricetta per vedere l'analisi dei costi</p>
              </div>
            )}

            {dish.recipes && !selectedRecipe && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-1">Ricetta Originale:</p>
                <p className="text-sm text-blue-600">{dish.recipes.name}</p>
                <p className="text-xs text-blue-500 mt-2">
                  Costo: €{calculateCostPerPortion(dish.recipes.recipe_ingredients, dish.recipes.portions).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Aggiornamento..." : "Aggiorna Piatto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDishDialog;
