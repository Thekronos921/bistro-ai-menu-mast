import { useState, useEffect } from "react";
import { ArrowLeft, Search, DollarSign, TrendingUp, TrendingDown, Edit, Download, RefreshCw, Target, AlertTriangle, Settings, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddDishDialog from "@/components/AddDishDialog";
import EditRecipeDialog from "@/components/EditRecipeDialog";
import EditDishDialog from "@/components/EditDishDialog";
import SettingsDialog from "@/components/SettingsDialog";
import SalesDataImportDialog from "@/components/SalesDataImportDialog";
import KPICard from "@/components/KPICard";
import PeriodSelector, { TimePeriod } from "@/components/PeriodSelector";
import MenuEngineeringBadge, { MenuCategory } from "@/components/MenuEngineeringBadge";
import AISuggestionTooltip from "@/components/AISuggestionTooltip";
import AdvancedFilters, { FilterConfig } from "@/components/AdvancedFilters";
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
  preparation_time?: number;
  difficulty?: string;
  portions?: number;
  description?: string;
  allergens?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  is_semilavorato?: boolean;
  recipe_ingredients: RecipeIngredient[];
  recipe_instructions?: RecipeInstruction[];
}

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

interface SalesData {
  dishName: string;
  unitsSold: number;
  period: string;
}

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

const FoodCost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("last30days");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const { toast } = useToast();

  // Configurazioni utente (persistenti nel localStorage)
  const [settings, setSettings] = useState<SettingsConfig>(() => {
    const saved = localStorage.getItem('foodCostSettings');
    return saved ? JSON.parse(saved) : {
      criticalThreshold: 40,
      targetThreshold: 35,
      targetPercentage: 80
    };
  });

  const categories = ["all", "Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"];

  const saveSettings = (newSettings: SettingsConfig) => {
    setSettings(newSettings);
    localStorage.setItem('foodCostSettings', JSON.stringify(newSettings));
  };

  const handleSalesImport = (importedSales: SalesData[]) => {
    // Aggiorna i dati di vendita per il periodo selezionato
    setSalesData(prev => {
      const filtered = prev.filter(s => s.period !== selectedPeriod);
      return [...filtered, ...importedSales];
    });
    
    console.log('Sales data imported:', importedSales);
  };

  const getDishSalesData = (dishName: string) => {
    return salesData.find(s => s.dishName.toLowerCase() === dishName.toLowerCase() && s.period === selectedPeriod);
  };

  const getTotalSalesForPeriod = () => {
    return salesData
      .filter(s => s.period === selectedPeriod)
      .reduce((total, s) => total + s.unitsSold, 0);
  };

  const getSalesMixPercentage = (dishName: string) => {
    const dishSales = getDishSalesData(dishName);
    const totalSales = getTotalSalesForPeriod();
    
    if (!dishSales || totalSales === 0) return 0;
    return (dishSales.unitsSold / totalSales) * 100;
  };

  const getPopularityScore = (dishName: string) => {
    const salesMix = getSalesMixPercentage(dishName);
    // Normalizza in scala 1-100 per la visualizzazione
    return Math.min(100, Math.max(1, salesMix * 10));
  };

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

  const getMenuEngineeringCategory = (dish: Dish): MenuCategory => {
    const analysis = getDishAnalysis(dish);
    const salesMix = getSalesMixPercentage(dish.name);
    
    // Metodo BCG migliorato con dati di vendita reali
    const totalDishes = dishes.length;
    const hurdleRate = (100 / totalDishes) * 0.70; // Soglia di popolarità
    
    const avgMargin = dishes.reduce((sum, d) => {
      const dAnalysis = getDishAnalysis(d);
      return sum + dAnalysis.margin;
    }, 0) / dishes.length;

    const highPopularity = salesMix > hurdleRate;
    const highProfitability = analysis.margin > avgMargin;

    if (highPopularity && highProfitability) return "star";
    if (highPopularity && !highProfitability) return "plowhorse";
    if (!highPopularity && highProfitability) return "puzzle";
    return "dog";
  };

  const getDishAnalysis = (dish: Dish) => {
    const foodCost = dish.recipes ? calculateRecipeCost(dish.recipes.recipe_ingredients) : 0;
    const foodCostPercentage = dish.selling_price > 0 ? (foodCost / dish.selling_price) * 100 : 0;
    const margin = dish.selling_price - foodCost;
    
    let status = "ottimo";
    if (foodCostPercentage > settings.criticalThreshold) status = "critico";
    else if (foodCostPercentage > 30) status = "buono";

    const popularity = getPopularityScore(dish.name);

    return {
      foodCost,
      foodCostPercentage,
      margin,
      status,
      popularity
    };
  };

  const getRecipeAnalysis = (recipe: Recipe, assumedPrice: number = 25) => {
    const foodCost = calculateRecipeCost(recipe.recipe_ingredients);
    const foodCostPercentage = assumedPrice > 0 ? (foodCost / assumedPrice) * 100 : 0;
    const margin = assumedPrice - foodCost;
    
    let status = "ottimo";
    if (foodCostPercentage > settings.criticalThreshold) status = "critico";
    else if (foodCostPercentage > 30) status = "buono";

    return {
      foodCost,
      foodCostPercentage,
      margin,
      status,
      assumedPrice,
      popularity: Math.floor(Math.random() * 50) + 1 // Simulato per ricette
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
      category: dish.category,
      analysis: getDishAnalysis(dish),
      menuCategory: getMenuEngineeringCategory(dish)
    })),
    ...recipes
      .filter(recipe => !dishes.some(dish => dish.recipe_id === recipe.id))
      .map(recipe => ({ 
        type: 'recipe' as const, 
        item: recipe, 
        name: recipe.name, 
        category: recipe.category,
        analysis: getRecipeAnalysis(recipe),
        menuCategory: "puzzle" as MenuCategory // Le ricette non associate sono sempre puzzle
      }))
  ];

  const filteredItems = allItems.filter(({ name, category, analysis, menuCategory }) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    
    // Filtri avanzati
    const matchesFoodCostMin = !advancedFilters.foodCostMin || analysis.foodCostPercentage >= advancedFilters.foodCostMin;
    const matchesFoodCostMax = !advancedFilters.foodCostMax || analysis.foodCostPercentage <= advancedFilters.foodCostMax;
    const matchesMarginMin = !advancedFilters.marginMin || analysis.margin >= advancedFilters.marginMin;
    const matchesMarginMax = !advancedFilters.marginMax || analysis.margin <= advancedFilters.marginMax;
    const matchesMenuCategory = !advancedFilters.menuCategory || menuCategory === advancedFilters.menuCategory;

    return matchesSearch && matchesCategory && matchesFoodCostMin && matchesFoodCostMax && 
           matchesMarginMin && matchesMarginMax && matchesMenuCategory;
  });

  // Calcola statistiche aggregate
  const allDishAnalyses = dishes.map(getDishAnalysis);
  const avgFoodCostPercentage = allDishAnalyses.length > 0 
    ? allDishAnalyses.reduce((sum, analysis) => sum + analysis.foodCostPercentage, 0) / allDishAnalyses.length 
    : 0;

  const totalMargin = allDishAnalyses.reduce((sum, analysis) => {
    const dishSales = getDishSalesData(dishes.find(d => getDishAnalysis(d) === analysis)?.name || "");
    const soldUnits = dishSales?.unitsSold || 0;
    return sum + (analysis.margin * soldUnits);
  }, 0);

  const criticalDishes = allDishAnalyses.filter(analysis => analysis.foodCostPercentage > settings.criticalThreshold).length;
  const targetReached = allDishAnalyses.length > 0 
    ? (allDishAnalyses.filter(analysis => analysis.foodCostPercentage < settings.targetThreshold).length / allDishAnalyses.length) * 100 
    : 0;

  const exportToCSV = () => {
    const csvData = filteredItems.map(({ type, item, analysis, menuCategory }) => ({
      Nome: item.name,
      Tipo: type === 'dish' ? 'Piatto' : 'Ricetta',
      Categoria: item.category,
      'Popolarità %': type === 'dish' ? getSalesMixPercentage(item.name).toFixed(2) : 'N/A',
      'Unità Vendute': type === 'dish' ? (getDishSalesData(item.name)?.unitsSold || 0) : 'N/A',
      'Prezzo Vendita': type === 'dish' ? (item as Dish).selling_price : analysis.assumedPrice,
      'Costo Ingredienti': analysis.foodCost.toFixed(2),
      'Food Cost %': analysis.foodCostPercentage.toFixed(1),
      'Margine €': analysis.margin.toFixed(2),
      'Menu Engineering': menuCategory,
      'Popolarità Score': analysis.popularity
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food-cost-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
                  <h1 className="text-2xl font-bold text-slate-800">Food Cost & Menu Engineering</h1>
                  <p className="text-sm text-slate-500">Analisi completa di costi e performance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <PeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
              <SettingsDialog settings={settings} onSaveSettings={saveSettings} />
              <AddDishDialog onAddDish={fetchData} onEditRecipe={(recipe) => setEditingRecipe(recipe)} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Food Cost Medio"
            value={`${avgFoodCostPercentage.toFixed(1)}%`}
            subtitle="Aggiornato in tempo reale"
            icon={TrendingDown}
            trend={avgFoodCostPercentage < 30 ? "up" : avgFoodCostPercentage > settings.criticalThreshold ? "down" : "neutral"}
          />
          
          <KPICard
            title={`Margine Totale (${selectedPeriod})`}
            value={`€${totalMargin.toFixed(0)}`}
            subtitle="Calcolato su vendite reali"
            icon={DollarSign}
            trend="up"
          />
          
          <KPICard
            title="Piatti Critici"
            value={criticalDishes}
            subtitle={`Food cost > ${settings.criticalThreshold}%`}
            icon={AlertTriangle}
            trend={criticalDishes === 0 ? "up" : "down"}
          />
          
          <KPICard
            title="Target Raggiunto"
            value={`${targetReached.toFixed(0)}%`}
            subtitle={`dei piatti sotto il ${settings.targetThreshold}%`}
            icon={Target}
            progress={targetReached}
          />
        </div>

        {/* Search, Filters and Actions */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 relative max-w-md">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cerca piatti o ricette..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <SalesDataImportDialog onImportSales={handleSalesImport} />
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Esporta CSV
              </Button>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aggiorna
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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

          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            isOpen={showAdvancedFilters}
            onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
          />
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Analisi Menu Engineering ({filteredItems.length} elementi)
              </h2>
              {getTotalSalesForPeriod() > 0 && (
                <p className="text-sm text-slate-500">
                  Vendite totali periodo: {getTotalSalesForPeriod()} unità
                </p>
              )}
            </div>
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Nessun elemento trovato</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || selectedCategory !== "all" || Object.keys(advancedFilters).length > 0
                  ? "Prova a modificare i filtri di ricerca" 
                  : "Inizia aggiungendo ricette e piatti"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Sales Mix %</TableHead>
                    <TableHead className="text-right">Unità Vendute</TableHead>
                    <TableHead className="text-right">Prezzo Vendita</TableHead>
                    <TableHead className="text-right">Costo Ingredienti</TableHead>
                    <TableHead className="text-right">Food Cost %</TableHead>
                    <TableHead className="text-right">Margine</TableHead>
                    <TableHead className="text-center">Menu Engineering</TableHead>
                    <TableHead className="text-center">AI Suggerimenti</TableHead>
                    <TableHead className="text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(({ type, item, analysis, menuCategory }) => {
                    const dishSales = type === 'dish' ? getDishSalesData(item.name) : null;
                    const salesMix = type === 'dish' ? getSalesMixPercentage(item.name) : 0;
                    
                    return (
                      <TableRow key={`${type}-${item.id}`}>
                        <TableCell>
                          <div className="font-medium text-slate-800">{item.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            type === 'dish' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {type === 'dish' ? 'Piatto' : 'Ricetta'}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">{item.category}</TableCell>
                        <TableCell className="text-right">
                          {type === 'dish' ? (
                            <span className="font-medium">{salesMix.toFixed(2)}%</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {type === 'dish' ? (
                            <span className="font-medium">{dishSales?.unitsSold || 0}</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">
                          €{type === 'dish' ? (item as Dish).selling_price.toFixed(2) : analysis.assumedPrice.toFixed(2)}
                          {type === 'recipe' && <span className="text-slate-500 text-xs ml-1">(stimato)</span>}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">€{analysis.foodCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${
                            analysis.foodCostPercentage > settings.criticalThreshold ? 'text-red-600' : 
                            analysis.foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {analysis.foodCostPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">€{analysis.margin.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <MenuEngineeringBadge category={menuCategory} />
                        </TableCell>
                        <TableCell className="text-center">
                          <AISuggestionTooltip 
                            category={menuCategory}
                            foodCostPercentage={analysis.foodCostPercentage}
                            margin={analysis.margin}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {type === 'dish' ? (
                              <>
                                <Button
                                  onClick={() => setEditingDish(item as Dish)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {(item as Dish).recipes && (
                                  <Button
                                    onClick={() => setEditingRecipe((item as Dish).recipes!)}
                                    size="sm"
                                    variant="outline"
                                    className="ml-1"
                                  >
                                    Modifica Ricetta
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => setEditingRecipe(item as Recipe)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => createDishFromRecipe(item as Recipe)}
                                  size="sm"
                                  variant="default"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Crea Piatto
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
          onEditRecipe={(recipe) => setEditingRecipe(recipe)}
        />
      )}
    </div>
  );
};

export default FoodCost;
