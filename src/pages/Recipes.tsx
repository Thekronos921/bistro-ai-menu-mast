
import { useState, useEffect } from "react";
import { ArrowLeft, Search, ChefHat, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import AddRecipeDialog from "@/components/AddRecipeDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  recipe_ingredients?: Array<{
    id: string;
    quantity: number;
    ingredients: {
      id: string;
      name: string;
      unit: string;
      cost_per_unit: number;
    };
  }>;
  recipe_instructions?: Array<{
    id: string;
    step_number: number;
    instruction: string;
  }>;
}

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const categories = ["all", "Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"];

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
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

      if (error) throw error;
      setRecipes(data || []);
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
    
    // Real-time updates
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
                  <p className="text-sm text-slate-500">Gestione completa ricette e ingredienti</p>
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
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Recipe Header */}
                <div className="p-6 border-b border-stone-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">{recipe.name}</h3>
                      <p className="text-sm text-slate-500">{recipe.category}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty}
                    </span>
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
                    <div className="font-semibold text-purple-600">
                      €{calculateTotalCost(recipe.recipe_ingredients).toFixed(2)} totale
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="p-6 border-b border-stone-200">
                  <h4 className="font-semibold text-slate-800 mb-3">Ingredienti</h4>
                  <div className="space-y-2">
                    {recipe.recipe_ingredients?.map((ri) => (
                      <div key={ri.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">
                          {ri.ingredients.name} - {ri.quantity}{ri.ingredients.unit}
                        </span>
                        <span className="font-medium text-slate-800">
                          €{(ri.ingredients.cost_per_unit * ri.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                {recipe.recipe_instructions && recipe.recipe_instructions.length > 0 && (
                  <div className="p-6 border-b border-stone-200">
                    <h4 className="font-semibold text-slate-800 mb-3">Preparazione</h4>
                    <ol className="space-y-2">
                      {recipe.recipe_instructions
                        .sort((a, b) => a.step_number - b.step_number)
                        .map((instruction) => (
                        <li key={instruction.id} className="flex items-start space-x-3 text-sm text-slate-600">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {instruction.step_number}
                          </span>
                          <span>{instruction.instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Nutritional Info */}
                <div className="p-6 bg-stone-50">
                  <h4 className="font-semibold text-slate-800 mb-3">Valori Nutrizionali (per porzione)</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{recipe.calories}</p>
                      <p className="text-xs text-slate-500">Calorie</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{recipe.protein}g</p>
                      <p className="text-xs text-slate-500">Proteine</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{recipe.carbs}g</p>
                      <p className="text-xs text-slate-500">Carboidrati</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{recipe.fat}g</p>
                      <p className="text-xs text-slate-500">Grassi</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Recipes;
