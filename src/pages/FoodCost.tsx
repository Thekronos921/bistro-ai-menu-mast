import { useState, useEffect } from "react";
import { ArrowLeft, Search, ChefHat, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateTotalCost, calculateCostPerPortion } from '@/utils/recipeCalculations';
import type { Recipe } from '@/types/recipe';

interface Category {
  value: string;
  label: string;
}

interface SimpleRecipe {
  id: string;
  name: string;
  category: string;
  portions: number;
  selling_price: number;
  recipe_ingredients: Array<{
    quantity: number;
    ingredients: {
      cost_per_unit: number;
      effective_cost_per_unit?: number;
    };
  }>;
}

const FoodCost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recipes, setRecipes] = useState<SimpleRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const categories: Category[] = [
    { value: "all", label: "Tutte" },
    { value: "Antipasti", label: "Antipasti" },
    { value: "Primi Piatti", label: "Primi Piatti" },
    { value: "Secondi Piatti", label: "Secondi Piatti" },
    { value: "Dolci", label: "Dolci" },
    { value: "Contorni", label: "Contorni" },
    { value: "Semilavorati", label: "Semilavorati" },
    { value: "Salse", label: "Salse" },
    { value: "Preparazioni Base", label: "Preparazioni Base" },
  ];

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          category,
          portions,
          selling_price,
          recipe_ingredients (
            quantity,
            ingredients (
              cost_per_unit,
              effective_cost_per_unit
            )
          )
        `)
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error("Error fetching recipes:", error);
        throw error;
      }

      // Trasforma i dati in SimpleRecipe
      const simpleRecipes: SimpleRecipe[] = (data || []).map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        portions: recipe.portions,
        selling_price: recipe.selling_price,
        recipe_ingredients: recipe.recipe_ingredients || [],
      }));

      setRecipes(simpleRecipes);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore nel caricamento delle ricette",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateProductionCost = (recipe: SimpleRecipe) => {
    return recipe.recipe_ingredients.reduce((total, ingredient) => {
      const effectiveCost = ingredient.ingredients.effective_cost_per_unit ?? ingredient.ingredients.cost_per_unit;
      return total + (effectiveCost * ingredient.quantity);
    }, 0);
  };

  const calculateCostPerPortionLocal = (recipe: SimpleRecipe) => {
    const totalCost = calculateProductionCost(recipe);
    return recipe.portions > 0 ? totalCost / recipe.portions : 0;
  };

  const calculateFoodCostPercentage = (recipe: SimpleRecipe) => {
    const costPerPortion = calculateCostPerPortionLocal(recipe);
    return recipe.selling_price > 0 ? (costPerPortion / recipe.selling_price) * 100 : 0;
  };

  const getFoodCostColor = (recipe: SimpleRecipe) => {
    const foodCostPercentage = calculateFoodCostPercentage(recipe);
    if (foodCostPercentage <= 25) return "bg-green-100 text-green-800";
    if (foodCostPercentage <= 35) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRecipeEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Nessun ristorante associato</p>
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
                  <h1 className="text-2xl font-bold text-slate-800">Food Cost Analysis</h1>
                  <p className="text-sm text-slate-500">Analisi dei costi di produzione e food cost</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <Input
                type="text"
                placeholder="Cerca ricette..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.value
                      ? "bg-purple-600 text-white"
                      : "bg-stone-100 text-slate-600 hover:bg-stone-200"
                  }`}
                >
                  {category.label}
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
                : "Inizia aggiungendo le tue ricette"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-xl">{recipe.name}</CardTitle>
                      </div>
                      <p className="text-sm text-slate-500">{recipe.category}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFoodCostColor(recipe)}`}>
                        FC {calculateFoodCostPercentage(recipe).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Cost Information */}
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Costo Produzione Totale</p>
                        <p className="text-lg font-bold text-purple-700">€{calculateProductionCost(recipe).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Costo per Porzione</p>
                        <p className="text-lg font-bold text-purple-700">€{calculateCostPerPortionLocal(recipe).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRecipeEdit(recipe as any)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifica
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FoodCost;
