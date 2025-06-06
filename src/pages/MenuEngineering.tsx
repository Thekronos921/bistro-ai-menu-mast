
import { useState, useEffect } from "react";
import { ArrowLeft, BarChart3, Star, Zap, AlertTriangle, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";

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

interface Recipe {
  id: string;
  name: string;
  category: string;
  recipe_ingredients: RecipeIngredient[];
}

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipes?: Recipe;
}

interface DishAnalysis {
  id: string;
  name: string;
  category: string;
  popularity: number;
  profitability: number;
  weeklyOrders: number;
  profit: number;
  recommendation: string;
  color: string;
}

const MenuEngineering = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishAnalyses, setDishAnalyses] = useState<DishAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const calculateRecipeCost = (recipeIngredients: RecipeIngredient[]) => {
    if (!recipeIngredients) return 0;
    return recipeIngredients.reduce((total, ri) => {
      return total + (ri.ingredients.cost_per_unit * ri.quantity);
    }, 0);
  };

  const fetchData = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      console.log("Fetching dishes for restaurant:", restaurantId);

      const { data: dishesData, error } = await supabase
        .from('dishes')
        .select(`
          *,
          recipes (
            id,
            name,
            category,
            recipe_ingredients (
              id,
              ingredient_id,
              quantity,
              unit,
              recipe_yield_percentage,
              ingredients (
                id,
                name,
                unit,
                cost_per_unit
              )
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("Fetched dishes:", dishesData);
      setDishes(dishesData || []);

      // Calcola analisi per ogni piatto
      const analyses: DishAnalysis[] = (dishesData || []).map((dish, index) => {
        const foodCost = dish.recipes ? calculateRecipeCost(dish.recipes.recipe_ingredients) : 0;
        const margin = dish.selling_price - foodCost;
        const profitability = dish.selling_price > 0 ? (margin / dish.selling_price) * 100 : 0;
        
        // Simula popolarità e ordini settimanali basati su valori realistici
        const basePopularity = Math.max(20, 80 - (index * 10) + Math.random() * 20);
        const weeklyOrders = Math.floor((basePopularity / 100) * 50);
        
        // Determina categoria Menu Engineering
        let category = "Dogs";
        let color = "red";
        let recommendation = "Considera rimozione o completa rivisitazione";
        
        if (profitability > 60 && basePopularity > 60) {
          category = "Stars";
          color = "emerald";
          recommendation = "Mantieni posizione prominente nel menu";
        } else if (profitability <= 60 && basePopularity > 60) {
          category = "Plowhorses";
          color = "blue";
          recommendation = "Riduci costi o aumenta prezzo";
        } else if (profitability > 60 && basePopularity <= 60) {
          category = "Puzzles";
          color = "amber";
          recommendation = "Promuovi attivamente o rimuovi";
        }

        return {
          id: dish.id,
          name: dish.name,
          category,
          popularity: Math.round(basePopularity),
          profitability: Math.round(profitability),
          weeklyOrders,
          profit: margin,
          recommendation,
          color
        };
      });

      setDishAnalyses(analyses);
    } catch (error) {
      console.error("Fetch data error:", error);
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
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Stars": return <Star className="w-5 h-5" />;
      case "Plowhorses": return <Zap className="w-5 h-5" />;
      case "Puzzles": return <AlertTriangle className="w-5 h-5" />;
      case "Dogs": return <TrendingDown className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Stars": return "from-emerald-500 to-green-600";
      case "Plowhorses": return "from-blue-500 to-indigo-600";
      case "Puzzles": return "from-amber-500 to-orange-600";
      case "Dogs": return "from-red-500 to-rose-600";
      default: return "from-gray-500 to-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento analisi menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Errore: Nessun ristorante associato</p>
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Menu Engineering AI</h1>
                  <p className="text-sm text-slate-500">Analisi intelligente performance menu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {dishAnalyses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Nessun piatto trovato</h3>
            <p className="text-slate-500 mb-6">
              Aggiungi piatti con ricette per vedere l'analisi Menu Engineering
            </p>
            <Link 
              to="/food-cost" 
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Aggiungi Piatti
            </Link>
          </div>
        ) : (
          <>
            {/* Matrix Overview */}
            <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Menu Engineering Matrix</h2>
              <div className="grid grid-cols-2 gap-6">
                {/* Stars Quadrant */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-emerald-800">STARS</h3>
                      <p className="text-sm text-emerald-600">Alta Popolarità + Alta Redditività</p>
                    </div>
                  </div>
                  <p className="text-emerald-700 text-sm mb-3">Mantieni prominenti nel menu, promuovi attivamente</p>
                  <div className="space-y-2">
                    {dishAnalyses.filter(d => d.category === "Stars").map(dish => (
                      <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                        <p className="font-medium text-emerald-800">{dish.name}</p>
                        <p className="text-sm text-emerald-600">{dish.weeklyOrders} ordini/settimana</p>
                      </div>
                    ))}
                    {dishAnalyses.filter(d => d.category === "Stars").length === 0 && (
                      <p className="text-emerald-600 text-sm italic">Nessun piatto in questa categoria</p>
                    )}
                  </div>
                </div>

                {/* Plowhorses Quadrant */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-800">PLOWHORSES</h3>
                      <p className="text-sm text-blue-600">Alta Popolarità + Bassa Redditività</p>
                    </div>
                  </div>
                  <p className="text-blue-700 text-sm mb-3">Riduci costi o aumenta prezzi strategicamente</p>
                  <div className="space-y-2">
                    {dishAnalyses.filter(d => d.category === "Plowhorses").map(dish => (
                      <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                        <p className="font-medium text-blue-800">{dish.name}</p>
                        <p className="text-sm text-blue-600">{dish.weeklyOrders} ordini/settimana</p>
                      </div>
                    ))}
                    {dishAnalyses.filter(d => d.category === "Plowhorses").length === 0 && (
                      <p className="text-blue-600 text-sm italic">Nessun piatto in questa categoria</p>
                    )}
                  </div>
                </div>

                {/* Puzzles Quadrant */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-800">PUZZLES</h3>
                      <p className="text-sm text-amber-600">Bassa Popolarità + Alta Redditività</p>
                    </div>
                  </div>
                  <p className="text-amber-700 text-sm mb-3">Promuovi o riprogetta la presentazione</p>
                  <div className="space-y-2">
                    {dishAnalyses.filter(d => d.category === "Puzzles").map(dish => (
                      <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                        <p className="font-medium text-amber-800">{dish.name}</p>
                        <p className="text-sm text-amber-600">{dish.weeklyOrders} ordini/settimana</p>
                      </div>
                    ))}
                    {dishAnalyses.filter(d => d.category === "Puzzles").length === 0 && (
                      <p className="text-amber-600 text-sm italic">Nessun piatto in questa categoria</p>
                    )}
                  </div>
                </div>

                {/* Dogs Quadrant */}
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border-2 border-red-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-800">DOGS</h3>
                      <p className="text-sm text-red-600">Bassa Popolarità + Bassa Redditività</p>
                    </div>
                  </div>
                  <p className="text-red-700 text-sm mb-3">Considera rimozione o completa rivisitazione</p>
                  <div className="space-y-2">
                    {dishAnalyses.filter(d => d.category === "Dogs").map(dish => (
                      <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                        <p className="font-medium text-red-800">{dish.name}</p>
                        <p className="text-sm text-red-600">{dish.weeklyOrders} ordini/settimana</p>
                      </div>
                    ))}
                    {dishAnalyses.filter(d => d.category === "Dogs").length === 0 && (
                      <p className="text-red-600 text-sm italic">Nessun piatto in questa categoria</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200">
                <h2 className="text-lg font-semibold text-slate-800">Analisi Dettagliata Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Piatto</th>
                      <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Popolarità</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Redditività</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Ordini/Settimana</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Raccomandazione AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {dishAnalyses.map((dish) => (
                      <tr key={dish.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{dish.name}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(dish.category)} text-white text-sm font-medium`}>
                            {getCategoryIcon(dish.category)}
                            <span>{dish.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${dish.popularity}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-slate-700">{dish.popularity}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${dish.profitability}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-slate-700">{dish.profitability}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-800">{dish.weeklyOrders}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">{dish.recommendation}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4">🤖 Raccomandazioni AI Settimanali</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-800 mb-2">Azione Prioritaria</h4>
                  <p className="text-sm text-indigo-700">
                    {dishAnalyses.filter(d => d.category === "Plowhorses").length > 0
                      ? "Ottimizza i costi dei piatti \"Plowhorses\" per migliorare la redditività."
                      : dishAnalyses.filter(d => d.category === "Dogs").length > 0
                      ? "Considera di rimuovere o riprogettare i piatti \"Dogs\" per migliorare le performance."
                      : "Continua a promuovere i piatti \"Stars\" per massimizzare i profitti."}
                  </p>
                </div>
                <div className="bg-white/60 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-800 mb-2">Opportunità Marketing</h4>
                  <p className="text-sm text-indigo-700">
                    {dishAnalyses.filter(d => d.category === "Puzzles").length > 0
                      ? "Promuovi i piatti \"Puzzles\" con descrizioni accattivanti per aumentarne la popolarità."
                      : "Mantieni alta la visibilità dei piatti più performanti nel menu."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MenuEngineering;
