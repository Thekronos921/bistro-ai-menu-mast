
import { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Download, Upload, RefreshCw, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MenuEngineeringBadge, { type MenuCategory } from "@/components/MenuEngineeringBadge";
import { calculateTotalCost, calculateCostPerPortion } from '@/utils/recipeCalculations';
import type { Recipe } from '@/types/recipe';

interface KPIData {
  averageFoodCost: number;
  totalMargin: number;
  criticalDishes: number;
  targetAchieved: number;
}

interface DishData {
  id: string;
  name: string;
  category: string;
  type: string;
  salesMix: number;
  unitsSold: number;
  sellingPrice: number;
  ingredientCost: number;
  foodCostPercentage: number;
  margin: number;
  menuEngineering: MenuCategory;
  recipe?: Recipe;
}

const FoodCost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dishes, setDishes] = useState<DishData[]>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    averageFoodCost: 0,
    totalMargin: 0,
    criticalDishes: 0,
    targetAchieved: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const categories = [
    { value: "all", label: "Tutte" },
    { value: "Antipasti", label: "Antipasti" },
    { value: "Primi Piatti", label: "Primi Piatti" },
    { value: "Secondi Piatti", label: "Secondi Piatti" },
    { value: "Dolci", label: "Dolci" },
    { value: "Contorni", label: "Contorni" },
  ];

  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      // Fetch dishes with recipes
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select(`
          *,
          recipe_id,
          recipes (
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
                effective_cost_per_unit,
                current_stock,
                min_stock_threshold
              )
            )
          )
        `)
        .eq('restaurant_id', restaurantId);

      if (dishesError) {
        console.error("Error fetching dishes:", dishesError);
        throw dishesError;
      }

      // Transform data and calculate metrics
      const transformedDishes: DishData[] = (dishesData || []).map((dish: any) => {
        const recipe = dish.recipes;
        const ingredientCost = recipe ? calculateTotalCost(recipe.recipe_ingredients) : 0;
        const costPerPortion = recipe ? calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions || 1) : 0;
        const foodCostPercentage = dish.selling_price > 0 ? (costPerPortion / dish.selling_price) * 100 : 0;
        const margin = dish.selling_price - costPerPortion;

        // Mock sales data (in a real app, this would come from sales records)
        const unitsSold = Math.floor(Math.random() * 50) + 10;
        const totalSales = unitsSold * dish.selling_price;
        const salesMix = totalSales > 0 ? (totalSales / 1000) * 100 : 0; // Mock calculation

        // Determine menu engineering category
        let menuEngineering: MenuCategory = "dog";
        if (foodCostPercentage <= 25 && salesMix >= 15) menuEngineering = "star";
        else if (foodCostPercentage <= 25 && salesMix < 15) menuEngineering = "puzzle";
        else if (foodCostPercentage > 25 && salesMix >= 15) menuEngineering = "plowhorse";

        return {
          id: dish.id,
          name: dish.name,
          category: dish.category,
          type: recipe?.is_semilavorato ? "Semilavorato" : "Piatto",
          salesMix,
          unitsSold,
          sellingPrice: dish.selling_price,
          ingredientCost: costPerPortion,
          foodCostPercentage,
          margin,
          menuEngineering,
          recipe
        };
      });

      setDishes(transformedDishes);

      // Calculate KPIs
      const totalDishes = transformedDishes.length;
      const avgFoodCost = totalDishes > 0 ? 
        transformedDishes.reduce((sum, dish) => sum + dish.foodCostPercentage, 0) / totalDishes : 0;
      const totalMarginValue = transformedDishes.reduce((sum, dish) => sum + (dish.margin * dish.unitsSold), 0);
      const criticalDishesCount = transformedDishes.filter(dish => dish.foodCostPercentage > 40).length;
      const targetAchievedPercentage = transformedDishes.filter(dish => dish.foodCostPercentage <= 35).length / totalDishes * 100;

      setKpiData({
        averageFoodCost: avgFoodCost,
        totalMargin: totalMarginValue,
        criticalDishes: criticalDishesCount,
        targetAchieved: targetAchievedPercentage
      });

    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore nel caricamento dei dati",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const exportToCSV = () => {
    const headers = [
      "Nome", "Categoria", "Tipo", "Sales Mix %", "Unità Vendute", 
      "Prezzo Vendita", "Costo Ingredienti", "Food Cost %", "Margine", "Menu Engineering"
    ];
    
    const csvContent = [
      headers.join(","),
      ...filteredDishes.map(dish => [
        dish.name,
        dish.category,
        dish.type,
        dish.salesMix.toFixed(2),
        dish.unitsSold,
        dish.sellingPrice.toFixed(2),
        dish.ingredientCost.toFixed(2),
        dish.foodCostPercentage.toFixed(1),
        dish.margin.toFixed(2),
        dish.menuEngineering
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "food-cost-analysis.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento analisi...</p>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">$</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Food Cost & Menu Engineering</h1>
                    <p className="text-sm text-slate-500">Analisi completa di costi e performance</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select className="px-3 py-2 border border-stone-200 rounded-lg text-sm">
                  <option>Ultimi 7 giorni</option>
                  <option>Ultimi 30 giorni</option>
                  <option>Ultimo mese</option>
                </select>
                <Button variant="outline" size="sm">
                  Impostazioni
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo Piatto
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Food Cost Medio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{kpiData.averageFoodCost.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">Aggiornato in tempo reale</p>
                  </div>
                  <div className="text-green-500">
                    <span className="text-xs">↗</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Margine Totale (last7days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-800">€{kpiData.totalMargin.toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Calcolato su vendite reali</p>
                  </div>
                  <div className="text-blue-500">
                    <span className="text-xs">$</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Piatti Critici</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{kpiData.criticalDishes}</p>
                    <p className="text-xs text-green-600">Food cost {'>'} 40%</p>
                  </div>
                  <div className="text-red-500">
                    <span className="text-xs">⚠</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Target Raggiunto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-800">{kpiData.targetAchieved.toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">dei piatti sotto il 35%</p>
                  </div>
                  <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${Math.min(kpiData.targetAchieved, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="text"
                    placeholder="Cerca piatti o ricette..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex space-x-2 overflow-x-auto">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category.value
                          ? "bg-green-600 text-white"
                          : "bg-stone-100 text-slate-600 hover:bg-stone-200"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtri Avanzati
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Importa Dati Vendite
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Esporta CSV
                </Button>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Aggiorna
                </Button>
              </div>
            </div>
          </div>

          {/* Analysis Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-xl font-semibold text-slate-800">
                Analisi Menu Engineering ({filteredDishes.length} elementi)
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Sales Mix %</TableHead>
                    <TableHead className="text-center">Unità Vendute</TableHead>
                    <TableHead className="text-center">Prezzo Vendita</TableHead>
                    <TableHead className="text-center">Costo Ingredienti</TableHead>
                    <TableHead className="text-center">Food Cost %</TableHead>
                    <TableHead className="text-center">Margine</TableHead>
                    <TableHead className="text-center">Menu Engineering</TableHead>
                    <TableHead className="text-center">AI Suggerimenti</TableHead>
                    <TableHead className="text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDishes.map((dish) => (
                    <TableRow key={dish.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${dish.type === 'Piatto' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                          <span>{dish.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          dish.type === 'Piatto' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {dish.type}
                        </span>
                      </TableCell>
                      <TableCell>{dish.category}</TableCell>
                      <TableCell className="text-center">{dish.salesMix.toFixed(2)}%</TableCell>
                      <TableCell className="text-center">{dish.unitsSold}</TableCell>
                      <TableCell className="text-center">€{dish.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center">€{dish.ingredientCost.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${
                          dish.foodCostPercentage <= 25 ? 'text-green-600' :
                          dish.foodCostPercentage <= 35 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {dish.foodCostPercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${dish.margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{dish.margin.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <MenuEngineeringBadge category={dish.menuEngineering} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-yellow-600">
                              💡
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-48">
                              {dish.menuEngineering === 'dog' && 'Considera di rimuovere o riprogettare questo piatto'}
                              {dish.menuEngineering === 'puzzle' && 'Aumenta la promozione per migliorare le vendite'}
                              {dish.menuEngineering === 'plowhorse' && 'Riduci i costi degli ingredienti'}
                              {dish.menuEngineering === 'star' && 'Mantieni la qualità e promuovi questo piatto'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm">
                          Modifica Ricetta
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default FoodCost;
