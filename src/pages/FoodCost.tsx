
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { TimePeriod } from "@/components/PeriodSelector";
import { FilterConfig } from "@/components/AdvancedFilters";
import { MenuCategory } from "@/components/MenuEngineeringBadge";
import EditRecipeDialog from "@/components/EditRecipeDialog";
import EditDishDialog from "@/components/EditDishDialog";
import FoodCostHeader from "@/components/FoodCostHeader";
import FoodCostKPIs from "@/components/FoodCostKPIs";
import FoodCostFilters from "@/components/FoodCostFilters";
import FoodCostTable from "@/components/FoodCostTable";
import { 
  Dish, 
  Recipe, 
  SalesData, 
  SettingsConfig 
} from "@/types/foodCost";
import {
  calculateRecipeCost,
  getDishAnalysis,
  getRecipeAnalysis,
  getMenuEngineeringCategory,
  getDishSalesData,
  getTotalSalesForPeriod
} from "@/utils/foodCostCalculations";

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
  const { restaurantId } = useRestaurant();

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
    setSalesData(prev => {
      const filtered = prev.filter(s => s.period !== selectedPeriod);
      return [...filtered, ...importedSales];
    });
    
    console.log('Sales data imported:', importedSales);
  };

  const fetchData = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      console.log("Fetching data for restaurant:", restaurantId);

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
            is_semilavorato,
            notes_chef,
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
                yield_percentage
              )
            ),
            recipe_instructions (
              id,
              step_number,
              instruction
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (dishesError) throw dishesError;

      const { data: recipesData, error: recipesError } = await supabase
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
              effective_cost_per_unit,
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
        .order('created_at', { ascending: false });

      if (recipesError) throw recipesError;

      console.log("Fetched dishes:", dishesData);
      console.log("Fetched recipes:", recipesData);

      setDishes(dishesData || []);
      setRecipes(recipesData || []);
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

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
  };

  const handleEditRecipeFromDialog = (recipe: Recipe) => {
    const completeRecipe: Recipe = {
      ...recipe,
      preparation_time: recipe.preparation_time || 0,
      difficulty: recipe.difficulty || 'Facile',
      portions: recipe.portions || 1,
      description: recipe.description || undefined,
      allergens: recipe.allergens || undefined,
      calories: recipe.calories || undefined,
      protein: recipe.protein || undefined,
      carbs: recipe.carbs || undefined,
      fat: recipe.fat || undefined,
      is_semilavorato: recipe.is_semilavorato || false,
      notes_chef: recipe.notes_chef || '',
      recipe_instructions: recipe.recipe_instructions || []
    };
    setEditingRecipe(completeRecipe);
  };

  const createDishFromRecipe = async (recipe: Recipe) => {
    try {
      if (!restaurantId) {
        toast({
          title: "Errore",
          description: "ID ristorante non trovato",
          variant: "destructive"
        });
        return;
      }

      const recipeCost = calculateRecipeCost(recipe.recipe_ingredients);
      const suggestedPrice = recipeCost * 3;

      const { error } = await supabase
        .from('dishes')
        .insert([{
          name: recipe.name,
          category: recipe.category,
          selling_price: suggestedPrice,
          recipe_id: recipe.id,
          restaurant_id: restaurantId
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Piatto "${recipe.name}" creato con prezzo suggerito €${suggestedPrice.toFixed(2)}`,
      });

      fetchData();
    } catch (error) {
      console.error("Create dish error:", error);
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
      analysis: getDishAnalysis(dish, settings, salesData, selectedPeriod),
      menuCategory: getMenuEngineeringCategory(dish, dishes, salesData, selectedPeriod, settings)
    })),
    ...recipes
      .filter(recipe => !dishes.some(dish => dish.recipe_id === recipe.id))
      .map(recipe => ({ 
        type: 'recipe' as const, 
        item: recipe, 
        name: recipe.name, 
        category: recipe.category,
        analysis: getRecipeAnalysis(recipe, settings),
        menuCategory: "puzzle" as MenuCategory
      }))
  ];

  const filteredItems = allItems.filter(({ name, category, analysis, menuCategory }) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    
    const matchesFoodCostMin = !advancedFilters.foodCostMin || analysis.foodCostPercentage >= advancedFilters.foodCostMin;
    const matchesFoodCostMax = !advancedFilters.foodCostMax || analysis.foodCostPercentage <= advancedFilters.foodCostMax;
    const matchesMarginMin = !advancedFilters.marginMin || analysis.margin >= advancedFilters.marginMin;
    const matchesMarginMax = !advancedFilters.marginMax || analysis.margin <= advancedFilters.marginMax;
    const matchesMenuCategory = !advancedFilters.menuCategory || menuCategory === advancedFilters.menuCategory;

    return matchesSearch && matchesCategory && matchesFoodCostMin && matchesFoodCostMax && 
           matchesMarginMin && matchesMarginMax && matchesMenuCategory;
  });

  // Calcola statistiche aggregate
  const allDishAnalyses = dishes.map(dish => getDishAnalysis(dish, settings, salesData, selectedPeriod));
  const avgFoodCostPercentage = allDishAnalyses.length > 0 
    ? allDishAnalyses.reduce((sum, analysis) => sum + analysis.foodCostPercentage, 0) / allDishAnalyses.length 
    : 0;

  const totalMargin = allDishAnalyses.reduce((sum, analysis, index) => {
    const dish = dishes[index];
    const dishSales = getDishSalesData(dish.name, salesData, selectedPeriod);
    const soldUnits = dishSales?.unitsSold || 0;
    return sum + (analysis.margin * soldUnits);
  }, 0);

  const criticalDishes = allDishAnalyses.filter(analysis => analysis.foodCostPercentage > settings.criticalThreshold).length;
  const targetReached = allDishAnalyses.length > 0 
    ? (allDishAnalyses.filter(analysis => analysis.foodCostPercentage < settings.targetThreshold).length / allDishAnalyses.length) * 100 
    : 0;

  const totalSales = getTotalSalesForPeriod(salesData, selectedPeriod);

  const exportToCSV = () => {
    const csvData = filteredItems.map(({ type, item, analysis, menuCategory }) => ({
      Nome: item.name,
      Tipo: type === 'dish' ? 'Piatto' : 'Ricetta',
      Categoria: item.category,
      'Popolarità %': type === 'dish' ? getSalesMixPercentage(item.name, salesData, selectedPeriod).toFixed(2) : 'N/A',
      'Unità Vendute': type === 'dish' ? (getDishSalesData(item.name, salesData, selectedPeriod)?.unitsSold || 0) : 'N/A',
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
      <FoodCostHeader
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        settings={settings}
        onSaveSettings={saveSettings}
        onAddDish={fetchData}
        onEditRecipe={handleEditRecipeFromDialog}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <FoodCostKPIs
          avgFoodCostPercentage={avgFoodCostPercentage}
          totalMargin={totalMargin}
          criticalDishes={criticalDishes}
          targetReached={targetReached}
          selectedPeriod={selectedPeriod}
          settings={settings}
        />

        <FoodCostFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          onImportSales={handleSalesImport}
          onExportCSV={exportToCSV}
          onRefresh={fetchData}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        />

        <FoodCostTable
          filteredItems={filteredItems}
          salesData={salesData}
          selectedPeriod={selectedPeriod}
          settings={settings}
          onEditDish={setEditingDish}
          onEditRecipe={handleEditRecipe}
          onCreateDishFromRecipe={createDishFromRecipe}
          totalSales={totalSales}
        />
      </main>

      {editingRecipe && (
        <EditRecipeDialog
          recipe={{
            ...editingRecipe,
            preparation_time: editingRecipe.preparation_time || 0,
            difficulty: editingRecipe.difficulty || 'Facile',
            portions: editingRecipe.portions || 1,
            description: editingRecipe.description || '',
            allergens: editingRecipe.allergens || '',
            calories: editingRecipe.calories || 0,
            protein: editingRecipe.protein || 0,
            carbs: editingRecipe.carbs || 0,
            fat: editingRecipe.fat || 0,
            is_semilavorato: editingRecipe.is_semilavorato || false,
            notes_chef: editingRecipe.notes_chef || '',
            recipe_instructions: editingRecipe.recipe_instructions || []
          }}
          onClose={() => setEditingRecipe(null)}
          onRecipeUpdated={fetchData}
        />
      )}

      {editingDish && (
        <EditDishDialog
          dish={editingDish}
          onClose={() => setEditingDish(null)}
          onDishUpdated={fetchData}
          onEditRecipe={handleEditRecipeFromDialog}
        />
      )}
    </div>
  );
};

export default FoodCost;
