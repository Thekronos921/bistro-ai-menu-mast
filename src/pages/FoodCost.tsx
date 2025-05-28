import { useState, useEffect } from "react";
import { ArrowLeft, Search, DollarSign, TrendingUp, TrendingDown, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AddDishDialog from "@/components/AddDishDialog";
import EditRecipeDialog from "@/components/EditRecipeDialog";
import EditDishDialog from "@/components/EditDishDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: Ingredient;
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
  recipe_ingredients: RecipeIngredient[];
  recipe_instructions: RecipeInstruction[];
}

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

const FoodCost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const { toast } = useToast();

  const categories = ["all", "Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"];

  const fetchData = async () => {
    try {
      // Fetch dishes con ricette
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select(`
          *,
          recipes (
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
            recipe_ingredients (
              id,
              ingredient_id,
              quantity,
              ingredients (
                id,
                name,
                unit,
                cost_per_unit
              )
            ),
            recipe_instructions (
              id,
              step_number,
              instruction
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (dishesError) throw dishesError;

      // Fetch ricette standalone (non ancora associate a piatti)
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_id,
            quantity,
            ingredients (
              id,
              name,
              unit,
              cost_per_unit
            )
          ),
          recipe_instructions (
            id,
            step_number,
            instruction
          )
        `)
        .order('created_at', { ascending: false });

      if (recipesError) throw recipesError;

      setDishes(dishesData || []);
      setRecipes(recipesData || []);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei dati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time updates
    const channel = supabase
      .channel('food-cost-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipe_ingredients' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateRecipeCost = (recipeIngredients: Recipe['recipe_ingredients']) => {
    if (!recipeIngredients) return 0;
    return recipeIngredients.reduce((total, ri) => {
      return total + (ri.ingredients.cost_per_unit * ri.quantity);
    }, 0);
  };

  const getDishAnalysis = (dish: Dish) => {
    const foodCost = dish.recipes ? calculateRecipeCost(dish.recipes.recipe_ingredients) : 0;
    const foodCostPercentage = dish.selling_price > 0 ? (foodCost / dish.selling_price) * 100 : 0;
    const margin = dish.selling_price - foodCost;
    
    let status = "ottimo";
    if (foodCostPercentage > 40) status = "critico";
    else if (foodCostPercentage > 30) status = "buono";

    return {
      foodCost,
      foodCostPercentage,
      margin,
      status
    };
  };

  const getRecipeAnalysis = (recipe: Recipe, assumedPrice: number = 25) => {
    const foodCost = calculateRecipeCost(recipe.recipe_ingredients);
    const foodCostPercentage = assumedPrice > 0 ? (foodCost / assumedPrice) * 100 : 0;
    const margin = assumedPrice - foodCost;
    
    let status = "ottimo";
    if (foodCostPercentage > 40) status = "critico";
    else if (foodCostPercentage > 30) status = "buono";

    return {
      foodCost,
      foodCostPercentage,
      margin,
      status,
      assumedPrice
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ottimo": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "buono": return "bg-blue-100 text-blue-800 border-blue-200";
      case "critico": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const createDishFromRecipe = async (recipe: Recipe) => {
    try {
      const recipeCost = calculateRecipeCost(recipe.recipe_ingredients);
      const suggestedPrice = recipeCost * 3; // Margine del 66%

      const { error } = await supabase
        .from('dishes')
        .insert([{
          name: recipe.name,
          category: recipe.category,
          selling_price: suggestedPrice,
          recipe_id: recipe.id
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Piatto "${recipe.name}" creato con prezzo suggerito €${suggestedPrice.toFixed(2)}`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella creazione del piatto",
        variant: "destructive"
      });
    }
  };

  // Combina piatti e ricette per il filtro
  const allItems = [
    ...dishes.map(dish => ({ 
      type: 'dish' as const, 
      item: dish, 
      name: dish.name, 
      category: dish.category 
    })),
    ...recipes
      .filter(recipe => !dishes.some(dish => dish.recipe_id === recipe.id))
      .map(recipe => ({ 
        type: 'recipe' as const, 
        item: recipe, 
        name: recipe.name, 
        category: recipe.category 
      }))
  ];

  const filteredItems = allItems.filter(({ name, category }) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calcola statistiche aggregate
  const allDishAnalyses = dishes.map(getDishAnalysis);
  const avgFoodCostPercentage = allDishAnalyses.length > 0 
    ? allDishAnalyses.reduce((sum, analysis) => sum + analysis.foodCostPercentage, 0) / allDishAnalyses.length 
    : 0;

  const totalMargin = allDishAnalyses.reduce((sum, analysis) => sum + analysis.margin, 0);
  const criticalDishes = allDishAnalyses.filter(analysis => analysis.foodCostPercentage > 40).length;
  const targetReached = allDishAnalyses.length > 0 
    ? (allDishAnalyses.filter(analysis => analysis.foodCostPercentage < 35).length / allDishAnalyses.length) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento analisi food cost...</p>
        </div>
      </div>
    );
  }

  return (
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
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Food Cost Analysis</h1>
                  <p className="text-sm text-slate-500">Gestione costi e marginalità</p>
                </div>
              </div>
            </div>
            <AddDishDialog onAddDish={fetchData} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Food Cost Medio</h3>
            <p className="text-3xl font-bold text-slate-800">{avgFoodCostPercentage.toFixed(1)}%</p>
            <div className="flex items-center mt-2">
              <TrendingDown className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-sm text-emerald-600">Aggiornato in tempo reale</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Margine Totale</h3>
            <p className="text-3xl font-bold text-slate-800">€{totalMargin.toFixed(0)}</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-sm text-emerald-600">Calcolato live</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Piatti Critici</h3>
            <p className="text-3xl font-bold text-red-600">{criticalDishes}</p>
            <span className="text-sm text-slate-500">Food cost &gt; 40%</span>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Target Raggiunto</h3>
            <p className="text-3xl font-bold text-emerald-600">{targetReached.toFixed(0)}%</p>
            <span className="text-sm text-slate-500">dei piatti sotto il 35%</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cerca piatti o ricette..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-100 text-slate-600 hover:bg-stone-200"
                  }`}
                >
                  {category === "all" ? "Tutte" : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Analisi Food Cost - Piatti e Ricette</h2>
              <AddDishDialog onAddDish={fetchData} />
            </div>
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Nessun elemento trovato</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || selectedCategory !== "all"
                  ? "Prova a modificare i termini di ricerca" 
                  : "Inizia aggiungendo ricette e piatti"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Nome</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Tipo</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Prezzo Vendita</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Costo Ingredienti</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Food Cost %</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Margine</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredItems.map(({ type, item }) => {
                    if (type === 'dish') {
                      const dish = item as Dish;
                      const analysis = getDishAnalysis(dish);
                      return (
                        <tr key={`dish-${dish.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{dish.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Piatto
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{dish.category}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-800">€{dish.selling_price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right text-slate-600">€{analysis.foodCost.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-semibold ${analysis.foodCostPercentage > 40 ? 'text-red-600' : analysis.foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {analysis.foodCostPercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-800">€{analysis.margin.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(analysis.status)}`}>
                              {analysis.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Button
                                onClick={() => setEditingDish(dish)}
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {dish.recipes && (
                                <Button
                                  onClick={() => setEditingRecipe(dish.recipes!)}
                                  size="sm"
                                  variant="outline"
                                  className="ml-1"
                                >
                                  Modifica Ricetta
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    } else {
                      const recipe = item as Recipe;
                      const analysis = getRecipeAnalysis(recipe);
                      return (
                        <tr key={`recipe-${recipe.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{recipe.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              Ricetta
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{recipe.category}</td>
                          <td className="px-6 py-4 text-right text-slate-500 italic">
                            €{analysis.assumedPrice.toFixed(2)} (stimato)
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">€{analysis.foodCost.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-semibold ${analysis.foodCostPercentage > 40 ? 'text-red-600' : analysis.foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {analysis.foodCostPercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-800">€{analysis.margin.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(analysis.status)}`}>
                              {analysis.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Button
                                onClick={() => setEditingRecipe(recipe)}
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => createDishFromRecipe(recipe)}
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                Crea Piatto
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Recipe Dialog */}
      {editingRecipe && (
        <EditRecipeDialog
          recipe={editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onRecipeUpdated={fetchData}
        />
      )}

      {/* Edit Dish Dialog */}
      {editingDish && (
        <EditDishDialog
          dish={editingDish}
          onClose={() => setEditingDish(null)}
          onDishUpdated={fetchData}
        />
      )}
    </div>
  );
};

export default FoodCost;
