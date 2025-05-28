
import { useState, useEffect } from "react";
import { ArrowLeft, Search, ChefHat, Clock, Users, Edit, Copy, Trash2, Printer, Info } from "lucide-react";
import { Link } from "react-router-dom";
import AddRecipeDialog from "@/components/AddRecipeDialog";
import EditRecipeDialog from "@/components/EditRecipeDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StockStatusBadge, { type StockStatus } from "@/components/StockStatusBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  is_semilavorato?: boolean;
  ingredients: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    current_stock?: number;
    min_stock_threshold?: number;
  };
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
  is_semilavorato?: boolean;
  notes_chef?: string;
  selling_price?: number;
  recipe_ingredients: RecipeIngredient[];
  recipe_instructions: RecipeInstruction[];
}

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null);
  const { toast } = useToast();

  const categories = ["all", "Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni", "Semilavorati", "Salse", "Preparazioni Base"];

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_id,
            quantity,
            is_semilavorato,
            ingredients (
              id,
              name,
              unit,
              cost_per_unit,
              current_stock,
              min_stock_threshold
            )
          ),
          recipe_instructions (
            id,
            step_number,
            instruction
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const recipesWithDefaults = (data || []).map(recipe => ({
        ...recipe,
        recipe_ingredients: recipe.recipe_ingredients || [],
        recipe_instructions: recipe.recipe_instructions || []
      }));
      
      setRecipes(recipesWithDefaults);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle ricette",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
    
    const channel = supabase
      .channel('recipes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
        fetchRecipes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Bassa": return "bg-emerald-100 text-emerald-800";
      case "Media": return "bg-amber-100 text-amber-800";
      case "Alta": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalCost = (recipeIngredients: Recipe['recipe_ingredients']) => {
    if (!recipeIngredients) return 0;
    return recipeIngredients.reduce((total, ri) => {
      return total + (ri.ingredients.cost_per_unit * ri.quantity);
    }, 0);
  };

  const calculateCostPerPortion = (recipeIngredients: Recipe['recipe_ingredients'], portions: number) => {
    const totalCost = calculateTotalCost(recipeIngredients);
    return portions > 0 ? totalCost / portions : 0;
  };

  const getFoodCostIndicator = (recipe: Recipe) => {
    const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
    
    // Se la ricetta ha un prezzo di vendita, calcola FC%
    if (recipe.selling_price && recipe.selling_price > 0) {
      const foodCostPercentage = (costPerPortion / recipe.selling_price) * 100;
      
      if (foodCostPercentage <= 25) return { 
        label: "FC Ottimale", 
        color: "bg-green-100 text-green-800",
        tooltip: `FC: ${foodCostPercentage.toFixed(1)}% (Costo: €${costPerPortion.toFixed(2)} / Prezzo: €${recipe.selling_price.toFixed(2)}). Soglia 'Critico': >35%`
      };
      if (foodCostPercentage <= 35) return { 
        label: "FC Attenzione", 
        color: "bg-yellow-100 text-yellow-800",
        tooltip: `FC: ${foodCostPercentage.toFixed(1)}% (Costo: €${costPerPortion.toFixed(2)} / Prezzo: €${recipe.selling_price.toFixed(2)}). Soglia 'Critico': >35%`
      };
      return { 
        label: "FC Critico", 
        color: "bg-red-100 text-red-800",
        tooltip: `FC: ${foodCostPercentage.toFixed(1)}% (Costo: €${costPerPortion.toFixed(2)} / Prezzo: €${recipe.selling_price.toFixed(2)}). Soglia 'Critico': >35%`
      };
    }
    
    // Se è un semilavorato o non ha prezzo, usa soglie di costo assoluto
    if (costPerPortion <= 3) return { 
      label: "Costo Prod. Basso", 
      color: "bg-green-100 text-green-800",
      tooltip: `Costo Produzione/Porzione: €${costPerPortion.toFixed(2)}. Soglia 'Alto' per questa categoria: >€8.00`
    };
    if (costPerPortion <= 8) return { 
      label: "Costo Prod. Medio", 
      color: "bg-yellow-100 text-yellow-800",
      tooltip: `Costo Produzione/Porzione: €${costPerPortion.toFixed(2)}. Soglia 'Alto' per questa categoria: >€8.00`
    };
    return { 
      label: "Costo Prod. Alto", 
      color: "bg-red-100 text-red-800",
      tooltip: `Costo Produzione/Porzione: €${costPerPortion.toFixed(2)}. Soglia 'Alto' per questa categoria: >€8.00`
    };
  };

  const getIngredientStockStatus = (ingredient: Recipe['recipe_ingredients'][0]['ingredients']): StockStatus => {
    if (!ingredient.current_stock || !ingredient.min_stock_threshold) return "ok";
    
    if (ingredient.current_stock <= ingredient.min_stock_threshold * 0.5) return "critical";
    if (ingredient.current_stock <= ingredient.min_stock_threshold) return "low";
    return "ok";
  };

  const duplicateRecipe = async (recipe: Recipe) => {
    try {
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          name: `${recipe.name} (Copia)`,
          category: recipe.category,
          preparation_time: recipe.preparation_time,
          difficulty: recipe.difficulty,
          portions: recipe.portions,
          description: recipe.description,
          allergens: recipe.allergens,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          is_semilavorato: recipe.is_semilavorato,
          notes_chef: recipe.notes_chef
        }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
        const ingredientsData = recipe.recipe_ingredients.map(ri => ({
          recipe_id: newRecipe.id,
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          is_semilavorato: ri.is_semilavorato || false
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) throw ingredientsError;
      }

      if (recipe.recipe_instructions && recipe.recipe_instructions.length > 0) {
        const instructionsData = recipe.recipe_instructions.map(inst => ({
          recipe_id: newRecipe.id,
          step_number: inst.step_number,
          instruction: inst.instruction
        }));

        const { error: instructionsError } = await supabase
          .from('recipe_instructions')
          .insert(instructionsData);

        if (instructionsError) throw instructionsError;
      }

      toast({
        title: "Successo",
        description: "Ricetta duplicata con successo"
      });

      fetchRecipes();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la duplicazione della ricetta",
        variant: "destructive"
      });
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ricetta eliminata con successo"
      });

      fetchRecipes();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione della ricetta",
        variant: "destructive"
      });
    }
  };

  const printRecipe = (recipe: Recipe) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const totalCost = calculateTotalCost(recipe.recipe_ingredients);
      const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${recipe.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; border-bottom: 2px solid #333; }
              .info { background: #f5f5f5; padding: 10px; margin: 10px 0; }
              .ingredients, .instructions { margin: 20px 0; }
              .cost-highlight { background: yellow; font-weight: bold; }
              .semilavorato { color: #9333ea; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${recipe.name} ${recipe.is_semilavorato ? '[SEMILAVORATO]' : ''}</h1>
            <div class="info">
              <strong>Categoria:</strong> ${recipe.category}<br>
              <strong>Tempo preparazione:</strong> ${recipe.preparation_time} minuti<br>
              <strong>Porzioni:</strong> ${recipe.portions}<br>
              <strong>Difficoltà:</strong> ${recipe.difficulty}<br>
              <strong class="cost-highlight">Costo Produzione Totale: €${totalCost.toFixed(2)}</strong><br>
              <strong class="cost-highlight">Costo per Porzione: €${costPerPortion.toFixed(2)}</strong>
              ${recipe.allergens ? `<br><strong>Allergeni:</strong> ${recipe.allergens}` : ''}
            </div>
            
            <div class="ingredients">
              <h2>Ingredienti:</h2>
              <ul>
                ${recipe.recipe_ingredients?.map(ri => 
                  `<li${ri.is_semilavorato ? ' class="semilavorato"' : ''}>${ri.is_semilavorato ? '[S] ' : ''}${ri.ingredients.name} - ${ri.quantity}${ri.ingredients.unit} (€${(ri.ingredients.cost_per_unit * ri.quantity).toFixed(2)})</li>`
                ).join('') || ''}
              </ul>
            </div>
            
            ${recipe.recipe_instructions && recipe.recipe_instructions.length > 0 ? `
              <div class="instructions">
                <h2>Preparazione:</h2>
                <ol>
                  ${recipe.recipe_instructions
                    .sort((a, b) => a.step_number - b.step_number)
                    .map(inst => `<li>${inst.instruction}</li>`)
                    .join('')}
                </ol>
              </div>
            ` : ''}
            
            ${recipe.description ? `
              <div>
                <h2>Descrizione:</h2>
                <p>${recipe.description}</p>
              </div>
            ` : ''}
            
            ${recipe.notes_chef ? `
              <div>
                <h2>Note dello Chef:</h2>
                <p>${recipe.notes_chef}</p>
              </div>
            ` : ''}
            
            <div style="margin-top: 20px; font-size: 10px; color: #666;">
              Stampato il: ${new Date().toLocaleString('it-IT')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento ricette...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mapping Ricette</h1>
                    <p className="text-sm text-slate-500">Gestione completa ricette e calcolo costi di produzione</p>
                  </div>
                </div>
              </div>
              <AddRecipeDialog onAddRecipe={fetchRecipes} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cerca ricette..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? "bg-purple-600 text-white"
                        : "bg-stone-100 text-slate-600 hover:bg-stone-200"
                    }`}
                  >
                    {category === "all" ? "Tutte" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recipes Grid */}
          {filteredRecipes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
              <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Nessuna ricetta trovata</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || selectedCategory !== "all" 
                  ? "Prova a modificare i filtri di ricerca" 
                  : "Inizia creando la tua prima ricetta"
                }
              </p>
              <AddRecipeDialog onAddRecipe={fetchRecipes} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRecipes.map((recipe) => {
                const totalCost = calculateTotalCost(recipe.recipe_ingredients);
                const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
                const costIndicator = getFoodCostIndicator(recipe);
                
                return (
                  <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl">{recipe.name}</CardTitle>
                            {recipe.is_semilavorato && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                [S]
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{recipe.category}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                            {recipe.difficulty}
                          </span>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${costIndicator.color}`}>
                                {costIndicator.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{costIndicator.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 mt-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{recipe.preparation_time} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{recipe.portions} porzioni</span>
                        </div>
                      </div>

                      {/* Cost Information */}
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Costo Produzione Totale</p>
                            <p className="text-lg font-bold text-purple-700">€{totalCost.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Costo per Porzione</p>
                            <p className="text-lg font-bold text-purple-700">€{costPerPortion.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Ingredients */}
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Ingredienti</h4>
                        <div className="space-y-2">
                          {recipe.recipe_ingredients?.map((ri) => {
                            const stockStatus = getIngredientStockStatus(ri.ingredients);
                            return (
                              <div key={ri.id} className="flex items-center justify-between text-sm group">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-slate-700 ${ri.is_semilavorato ? 'text-purple-600 font-medium' : ''}`}>
                                    {ri.is_semilavorato ? '[S] ' : ''}{ri.ingredients.name} - {ri.quantity}{ri.ingredients.unit}
                                  </span>
                                  {stockStatus !== "ok" && !ri.is_semilavorato && (
                                    <StockStatusBadge status={stockStatus} className="scale-75" />
                                  )}
                                </div>
                                <span className="font-medium text-slate-800">
                                  €{(ri.ingredients.cost_per_unit * ri.quantity).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRecipe(recipe)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Modifica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateRecipe(recipe)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Duplica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printRecipe(recipe)}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            Stampa
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteRecipeId(recipe.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Nutritional Info */}
                      {(recipe.calories > 0 || recipe.protein > 0 || recipe.carbs > 0 || recipe.fat > 0) && (
                        <div className="pt-4 border-t border-stone-200">
                          <h4 className="font-semibold text-slate-800 mb-3">Valori Nutrizionali (per porzione)</h4>
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{recipe.calories}</p>
                              <p className="text-slate-500">Calorie</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{recipe.protein}g</p>
                              <p className="text-slate-500">Proteine</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{recipe.carbs}g</p>
                              <p className="text-slate-500">Carboidrati</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{recipe.fat}g</p>
                              <p className="text-slate-500">Grassi</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {recipe.allergens && (
                        <div className="pt-2">
                          <p className="text-xs text-orange-600">
                            <strong>Allergeni:</strong> {recipe.allergens}
                          </p>
                        </div>
                      )}

                      {recipe.notes_chef && (
                        <div className="pt-2">
                          <p className="text-xs text-slate-600">
                            <strong>Note Chef:</strong> {recipe.notes_chef}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        {/* Edit Recipe Dialog */}
        {editingRecipe && (
          <EditRecipeDialog
            recipe={editingRecipe}
            onClose={() => setEditingRecipe(null)}
            onRecipeUpdated={() => {
              fetchRecipes();
              setEditingRecipe(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteRecipeId} onOpenChange={() => setDeleteRecipeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare questa ricetta? Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteRecipeId) {
                    deleteRecipe(deleteRecipeId);
                    setDeleteRecipeId(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default Recipes;
