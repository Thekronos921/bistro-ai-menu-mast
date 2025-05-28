import { useState, useEffect } from "react";
import { ArrowLeft, Search, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import AddDishDialog from "@/components/AddDishDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: {
    id: string;
    recipe_ingredients: Array<{
      quantity: number;
      ingredients: {
        cost_per_unit: number;
      };
    }>;
  };
}

const FoodCost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select(`
          *,
          recipes (
            id,
            recipe_ingredients (
              quantity,
              ingredients (
                cost_per_unit
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei piatti",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDishes();

    // Real-time updates
    const channel = supabase
      .channel('dishes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
        fetchDishes();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
        fetchDishes(); // Aggiorna quando cambiano i costi degli ingredienti
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateFoodCost = (dish: Dish) => {
    if (!dish.recipes?.recipe_ingredients) return 0;
    return dish.recipes.recipe_ingredients.reduce((total, ri) => {
      return total + (ri.ingredients.cost_per_unit * ri.quantity);
    }, 0);
  };

  const getDishAnalysis = (dish: Dish) => {
    const foodCost = calculateFoodCost(dish);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ottimo": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "buono": return "bg-blue-100 text-blue-800 border-blue-200";
      case "critico": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredDishes = dishes.filter(dish =>
    dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dish.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcola statistiche aggregate
  const avgFoodCostPercentage = dishes.length > 0 
    ? dishes.reduce((sum, dish) => sum + getDishAnalysis(dish).foodCostPercentage, 0) / dishes.length 
    : 0;

  const totalMargin = dishes.reduce((sum, dish) => sum + getDishAnalysis(dish).margin, 0);

  const criticalDishes = dishes.filter(dish => getDishAnalysis(dish).foodCostPercentage > 40).length;

  const targetReached = dishes.length > 0 
    ? (dishes.filter(dish => getDishAnalysis(dish).foodCostPercentage < 35).length / dishes.length) * 100 
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
            <AddDishDialog onAddDish={fetchDishes} />
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
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cerca piatti o categorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option>Tutte le categorie</option>
              <option>Antipasti</option>
              <option>Primi Piatti</option>
              <option>Secondi Piatti</option>
              <option>Dolci</option>
            </select>
            <select className="px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option>Tutti gli stati</option>
              <option>Ottimo (&lt; 30%)</option>
              <option>Buono (30-35%)</option>
              <option>Critico (&gt; 35%)</option>
            </select>
          </div>
        </div>

        {/* Dishes Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Analisi Food Cost per Piatto</h2>
              <AddDishDialog onAddDish={fetchDishes} />
            </div>
          </div>
          
          {filteredDishes.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Nessun piatto trovato</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm 
                  ? "Prova a modificare i termini di ricerca" 
                  : "Inizia aggiungendo il tuo primo piatto"
                }
              </p>
              <AddDishDialog onAddDish={fetchDishes} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Piatto</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Prezzo Vendita</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Costo Ingredienti</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Food Cost %</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Margine</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredDishes.map((dish) => {
                    const analysis = getDishAnalysis(dish);
                    return (
                      <tr key={dish.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{dish.name}</div>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FoodCost;
